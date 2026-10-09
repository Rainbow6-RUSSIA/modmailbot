const humanizeDuration = require("humanize-duration");
const moment = require("moment");
const blocked = require("../data/blocked");
const utils = require("../utils");
const {getOrFetchChannel} = require("../utils");

module.exports = ({ bot, knex, config, commands }) => {
  if (! config.allowBlock) return;
  async function removeExpiredBlocks() {
    const expiredBlocks = await blocked.getExpiredBlocks();
    const logChannel = utils.getLogChannel();
    for (const userId of expiredBlocks) {
      await blocked.unblock(userId);
      logChannel.createMessage({
        content: `Срок блокировки пользователя <@!${userId}> (\`${userId}\`) истек`,
        allowedMentions: {
          users: [userId],
        },
      });
    }
  }

  async function expiredBlockLoop() {
    try {
      await removeExpiredBlocks();
    } catch (e) {
      console.error(e);
    }

    setTimeout(expiredBlockLoop, 2000);
  }

  expiredBlockLoop();

  const blockCmd = async (msg, args, thread) => {
    const userIdToBlock = args.userId || (thread && thread.user_id);
    if (! userIdToBlock) return;

    const channel = await getOrFetchChannel(bot, msg.channel.id);

    const isBlocked = await blocked.isBlocked(userIdToBlock);
    if (isBlocked) {
      channel.createMessage("Пользователь уже заблокирован");
      return;
    }

    const expiresAt = args.blockTime
      ? moment.utc().add(args.blockTime, "ms").format("YYYY-MM-DD HH:mm:ss")
      : null;

    const user = bot.users.get(userIdToBlock);
    await blocked.block(userIdToBlock, (user ? user.username : ""), msg.author.id, expiresAt);

    if (expiresAt) {
      const humanized = humanizeDuration(args.blockTime, { largest: 2, round: true, language: "ru" });
      msg.channel.createMessage(`Пользователь <@${userIdToBlock}> (\`${userIdToBlock}\`) заблокирован на ${humanized}`);

      const timedBlockMessage = config.timedBlockMessage || config.blockMessage;
      if (timedBlockMessage) {
        const dmChannel = await user.getDMChannel();
        const formatted = timedBlockMessage
          .replace(/\{duration}/g, humanized)
          .replace(/\{timestamp}/g, moment.utc(expiresAt).format("X"));
        dmChannel.createMessage(formatted).catch(utils.noop);
      }
    } else {
      msg.channel.createMessage(`Пользователь <@${userIdToBlock}> (\`${userIdToBlock}\`) заблокирован навсегда`);

      if (config.blockMessage != null) {
        const dmChannel = await user.getDMChannel();
        dmChannel.createMessage(config.blockMessage).catch(utils.noop);
      }
    }
  };

  commands.addInboxServerCommand("block", "<userId:userId> [blockTime:delay]", blockCmd);
  commands.addInboxServerCommand("block", "[blockTime:delay]", blockCmd);

  const unblockCmd = async (msg, args, thread) => {
    const userIdToUnblock = args.userId || (thread && thread.user_id);
    if (! userIdToUnblock) return;

    const isBlocked = await blocked.isBlocked(userIdToUnblock);
    if (! isBlocked) {
      msg.channel.createMessage("Пользователь не заблокирован");
      return;
    }

    const unblockAt = args.unblockDelay
      ? moment.utc().add(args.unblockDelay, "ms").format("YYYY-MM-DD HH:mm:ss")
      : null;

    const user = bot.users.get(userIdToUnblock);
    if (unblockAt) {
      const humanized = humanizeDuration(args.unblockDelay, { largest: 2, round: true, language: "ru" });
      await blocked.updateExpiryTime(userIdToUnblock, unblockAt);
      msg.channel.createMessage(`Пользователь <@${userIdToUnblock}> (\`${userIdToUnblock}\`) будет разблокирован через ${humanized}`);

      const timedUnblockMessage = config.timedUnblockMessage || config.unblockMessage;
      if (timedUnblockMessage) {
        const dmChannel = await user.getDMChannel();
        const formatted = timedUnblockMessage
          .replace(/\{delay}/g, humanized)
          .replace(/\{timestamp}/g, moment.utc(unblockAt).format("X"))
        dmChannel.createMessage(formatted).catch(utils.noop);
      }
    } else {
      await blocked.unblock(userIdToUnblock);
      msg.channel.createMessage(`Пользователь <@${userIdToUnblock}> (${userIdToUnblock}) разблокирован`);
      
      if (config.unblockMessage) {
        const dmChannel = await user.getDMChannel();
        dmChannel.createMessage(config.unblockMessage).catch(utils.noop);
      }
    }
  };

  commands.addInboxServerCommand("unblock", "<userId:userId> [unblockDelay:delay]", unblockCmd);
  commands.addInboxServerCommand("unblock", "[unblockDelay:delay]", unblockCmd);

  commands.addInboxServerCommand("is_blocked",  "[userId:userId]",async (msg, args, thread) => {
    const userIdToCheck = args.userId || (thread && thread.user_id);
    if (! userIdToCheck) return;

    const blockStatus = await blocked.getBlockStatus(userIdToCheck);
    if (blockStatus.isBlocked) {
      if (blockStatus.expiresAt) {
        msg.channel.createMessage({
          content: `Пользователь <@!${userIdToCheck}> (\`${userIdToCheck}\`) заблокирован до ${moment.utc(blockStatus.expiresAt).format("DD.MM.YYYY HH:mm")}`,
          allowedMentions: { users: [userIdToCheck] },
        });
      } else {
        msg.channel.createMessage({
          content: `Пользователь <@!${userIdToCheck}> (\`${userIdToCheck}\`) заблокирован навсегда`,
          allowedMentions: { users: [userIdToCheck] },
        });
      }
    } else {
      msg.channel.createMessage({
        content: `Пользователь <@!${userIdToCheck}> (\`${userIdToCheck}\`) не в блокировке`,
        allowedMentions: { users: [userIdToCheck] },
      });
    }
  });

  commands.addInboxServerCommand("blocklist", "", async (msg, args, thread) => {
    const blockedUsers = await blocked.getBlockedUsers();
    if (blockedUsers.length === 0) {
      msg.channel.createMessage("Сейчас нет заблокированных пользователей.");
      return;
    }

    let reply = "Список заблокированных пользователей:\n";
    for (const user of blockedUsers) {
      const userInfo = `**<@!${user.userId}> (id \`${user.userId}\`)** — заблокировал <@${user.blockedBy}>${user.expiresAt ? `, до ${user.expiresAt} (UTC)` : ", навсегда"}`;
      reply += userInfo + "\n";
    }

    msg.channel.createMessage(reply);
  });
};
