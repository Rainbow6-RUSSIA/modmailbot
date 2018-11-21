const utils = require("../utils");
const threadUtils = require("../threadUtils");
const threads = require("../data/threads");

module.exports = bot => {
  const addInboxServerCommand = (...args) => threadUtils.addInboxServerCommand(bot, ...args);

  addInboxServerCommand('newthread', async (msg, args, thread) => {
    if (args.length === 0) return;

    const userId = utils.getUserMention(args[0]);
    if (! userId) return;

    const user = bot.users.get(userId);
    if (! user) {
      utils.postSystemMessageWithFallback(msg.channel, thread, 'Пользователь не найден!');
      return;
    }

    const existingThread = await threads.findOpenThreadByUserId(user.id);
    if (existingThread) {
      utils.postSystemMessageWithFallback(msg.channel, thread, `Невозможно создать новый тред; уже открыт другой тред с этим пользователем: <#${existingThread.channel_id}>`);
      return;
    }

    const createdThread = await threads.createNewThreadForUser(user, true);
    createdThread.postSystemMessage(`Тред открыт ${msg.author.username}#${msg.author.discriminator}`);

    if (thread) {
      msg.delete();
    }
  });
};
