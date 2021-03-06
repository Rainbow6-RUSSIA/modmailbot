const moment = require("moment");
const Eris = require("eris");
const utils = require("../src/utils");
const threads = require("../src/data/threads");
const blocked = require("../src/data/blocked");
const { messageQueue } = require("../src/queue");
const {
  getLogUrl,
  getLogFile,
  getLogCustomResponse,
} = require("../src/data/logs");

const SCHEDULED_CLOSE_MODE = {
  NONE: 0,
  SILENT: 1 << 0,
  PING: 1 << 1,
};

module.exports = ({ bot, knex, config, commands }) => {
  async function sendCloseNotification(thread, body) {
    const logCustomResponse = await getLogCustomResponse(thread);
    if (logCustomResponse) {
      await utils.postLog(body);
      await utils.postLog(logCustomResponse.content, logCustomResponse.file);
      return;
    }

    const logUrl = await getLogUrl(thread);
    if (logUrl) {
      utils.postLog(
        utils.trimAll(`
          ${body}
          Логи: ${logUrl}
        `)
      );
      return;
    }

    const logFile = await getLogFile(thread);
    if (logFile) {
      utils.postLog(body, logFile);
      return;
    }

    utils.postLog(body);
  }

  // Check for threads that are scheduled to be closed and close them
  async function applyScheduledCloses() {
    const threadsToBeClosed = await threads.getThreadsThatShouldBeClosed();
    for (const thread of threadsToBeClosed) {
      const closeMode = thread.scheduled_close_silent;

      if (config.closeMessage && ! closeMode & SCHEDULED_CLOSE_MODE.SILENT) {
        const closeMessage = utils.readMultilineConfigValue(
          config.closeMessage
        );
        await thread.sendSystemMessageToUser(closeMessage).catch(() => {});
      }

      await thread.close(false, closeMode & SCHEDULED_CLOSE_MODE.SILENT);

      if (closeMode & SCHEDULED_CLOSE_MODE.PING) {
        await sendCloseNotification(
          thread,
          `Почтовый тред #${thread.thread_number} с ${thread.user_name} (${thread.user_id}) был закрыт автоматически по истечению времени <@${thread.scheduled_close_id}>`
        );
      } else {
        await sendCloseNotification(
          thread,
          `Почтовый тред #${thread.thread_number} с ${thread.user_name} (${thread.user_id}) был запланированно закрыт ${thread.scheduled_close_name}`
        );
      }
    }
  }

  async function scheduledCloseLoop() {
    try {
      await applyScheduledCloses();
    } catch (e) {
      console.error(e);
    }

    setTimeout(scheduledCloseLoop, 20000);
  }

  scheduledCloseLoop();

  // Close a thread. Closing a thread saves a log of the channel's contents and then deletes the channel.
  commands.addGlobalCommand(
    "close",
    "[opts...]",
    async (msg, args) => {
      let thread, closedBy;

      let hasCloseMessage = !! config.closeMessage;
      let closeMode = SCHEDULED_CLOSE_MODE.NONE;
      let suppressSystemMessages = false;

      if (msg.channel instanceof Eris.PrivateChannel) {
        // User is closing the thread by themselves (if enabled)
        if (! config.allowUserClose) return;
        if (await blocked.isBlocked(msg.author.id)) return;

        thread = await threads.findOpenThreadByUserId(msg.author.id);
        if (! thread) return;

        // We need to add this operation to the message queue so we don't get a race condition
        // between showing the close command in the thread and closing the thread
        await messageQueue.add(async () => {
          thread.postSystemMessage("Тред закрыт пользователем, закрываю...");
          suppressSystemMessages = true;
        });

        closedBy = "Пользователем";
      } else {
        // A staff member is closing the thread
        if (! utils.messageIsOnInboxServer(msg)) return;
        if (! utils.isStaff(msg.member)) return;

        thread = await threads.findOpenThreadByChannelId(msg.channel.id);
        if (! thread) return;

        const opts = args.opts || [];

        if (args.cancel || opts.includes("cancel") || opts.includes("c")) {
          // Cancel timed close
          if (thread.scheduled_close_at) {
            await thread.cancelScheduledClose();
            thread.postSystemMessage("Запланированное закрытие отменено");
          }

          return;
        }

        // Silent close (= no close message)
        if (args.silent || opts.includes("silent") || opts.includes("s")) {
          closeMode |= SCHEDULED_CLOSE_MODE.SILENT;
        }

        // Ping close
        if (args.ping || opts.includes("ping") || opts.includes("p")) {
          closeMode |= SCHEDULED_CLOSE_MODE.PING;
        }

        // Timed close
        const delayStringArg = opts.find((arg) =>
          utils.delayStringRegex.test(arg)
        );
        if (delayStringArg) {
          const delay = utils.convertDelayStringToMS(delayStringArg);
          if (delay === 0 || delay === null) {
            thread.postSystemMessage(
              "Неккоректный формат задержки. Пример: `1h30m`"
            );
            return;
          }

          const closeAt = moment.utc().add(delay, "ms");
          await thread.scheduleClose(
            closeAt.format("YYYY-MM-DD HH:mm:ss"),
            msg.author,
            closeMode
          );

          let responseModes = [];

          if (closeMode & SCHEDULED_CLOSE_MODE.SILENT)
            responseModes.push(" без уведомления");
          if (closeMode & SCHEDULED_CLOSE_MODE.PING)
            responseModes.push(" с пингом");

          thread.postSystemMessage(
            `Закрытие треда${responseModes.join(
              ","
            )} запланировано через ${utils.humanizeDelay(
              delay
            )}. Используйте \`${config.prefix}close cancel\` для отмены.`
          );

          return;
        }

        // Regular close
        closedBy = msg.author.username;
      }

      // Send close message (unless suppressed with a silent close)
      if (hasCloseMessage && ! closeMode & SCHEDULED_CLOSE_MODE.SILENT) {
        const closeMessage = utils.readMultilineConfigValue(
          config.closeMessage
        );
        await thread.sendSystemMessageToUser(closeMessage).catch(() => {});
      }

      await thread.close(suppressSystemMessages, closeMode);

      await sendCloseNotification(
        thread,
        `Почтовый тред #${thread.thread_number} с ${thread.user_name} (${thread.user_id}) был закрыт ${closedBy}`
      );
    },
    {
      options: [
        { name: "silent", shortcut: "s", isSwitch: true },
        { name: "ping", shortcut: "p", isSwitch: true },
        { name: "cancel", shortcut: "c", isSwitch: true },
      ],
    }
  );

  // Auto-close threads if their channel is deleted
  bot.on("channelDelete", async (channel) => {
    if (! (channel instanceof Eris.TextChannel)) return;
    if (channel.guild.id !== utils.getInboxGuild().id) return;

    const thread = await threads.findOpenThreadByChannelId(channel.id);
    if (! thread) return;

    console.log(
      `[INFO] Auto-closing thread with ${thread.user_name} because the channel was deleted`
    );
    if (config.closeMessage) {
      const closeMessage = utils.readMultilineConfigValue(config.closeMessage);
      await thread.sendSystemMessageToUser(closeMessage).catch(() => {});
    }

    await thread.close(true);

    await sendCloseNotification(
      thread,
      `Почтовый тред #${thread.thread_number} с ${thread.user_name} (${thread.user_id}) был закрыт автоматически после удаления канала`
    );
  });
};
