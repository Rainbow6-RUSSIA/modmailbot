const moment = require("moment-timezone");
const threads = require("../data/threads");
const utils = require("../utils");
const config = require("../cfg");

const {THREAD_STATUS} = require("../data/constants");

module.exports = ({ bot, knex, config, commands }) => {
  // Check for threads that are scheduled to be suspended and suspend them
  async function applyScheduledSuspensions() {
    const threadsToBeSuspended = await threads.getThreadsThatShouldBeSuspended();
    for (const thread of threadsToBeSuspended) {
      if (thread.status === THREAD_STATUS.OPEN) {
        await thread.suspend();
        await thread.postSystemMessage(`**Тред заморожен** запланированно ${thread.scheduled_suspend_name}. Этот тред останется замороженным пока не будет выполнена команда \`!unsuspend\``);
      }
    }
  }

  async function scheduledSuspendLoop() {
    try {
      await applyScheduledSuspensions();
    } catch (e) {
      console.error(e);
    }

    setTimeout(scheduledSuspendLoop, 2000);
  }

  scheduledSuspendLoop();

  commands.addInboxThreadCommand("suspend cancel", [], async (msg, args, thread) => {
    // Cancel timed suspend
    if (thread.scheduled_suspend_at) {
      await thread.cancelScheduledSuspend();
      thread.postSystemMessage("Отмена запланированной заморозки");
    } else {
      thread.postSystemMessage("Заморозка треда не запланирована!");
    }
  });

  commands.addInboxThreadCommand("suspend", "[delay:delay]", async (msg, args, thread) => {
    if (args.delay) {
      const suspendAt = moment.utc().add(args.delay, "ms");
      await thread.scheduleSuspend(suspendAt.format("YYYY-MM-DD HH:mm:ss"), msg.author);

      thread.postSystemMessage(`Заморозка треда запланирована через ${utils.humanizeDelay(args.delay)}. Используйте \`${config.prefix}suspend cancel\` для отмены.`);

      return;
    }

    await thread.suspend();
    thread.postSystemMessage("**Тред заморожен!** Этот тред останется замороженным пока не будет выполнена команда `!unsuspend`");
  });

  commands.addInboxServerCommand("unsuspend", [], async (msg, args, thread) => {
    if (thread) {
      thread.postSystemMessage("Thread is not suspended");
      return;
    }

    thread = await threads.findSuspendedThreadByChannelId(msg.channel.id);
    if (! thread) {
      msg.channel.createMessage("Not in a thread");
      return;
    }

    const otherOpenThread = await threads.findOpenThreadByUserId(thread.user_id);
    if (otherOpenThread) {
      thread.postSystemMessage(`Невозможно разморозить тред; уже открыт другой тред с этим пользователем: <#${otherOpenThread.channel_id}>`);
      return;
    }

    await thread.unsuspend();
    thread.postSystemMessage("**Тред разморожен!**");
  });
};
