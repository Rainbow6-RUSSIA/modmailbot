const utils = require("../utils");
const threads = require("../data/threads");

module.exports = (bot, knex, config, commands) => {
  commands.addInboxServerCommand('newthread', '<userId:userId>', async (msg, args, thread) => {
    const user = bot.users.get(args.userId);
    if (! user) {
      utils.postSystemMessageWithFallback(msg.channel, thread, 'Пользователь не найден!');
      return;
    }

    const existingThread = await threads.findOpenThreadByUserId(user.id);
    if (existingThread) {
      utils.postSystemMessageWithFallback(msg.channel, thread, `Невозможно создать новый тред; уже открыт другой тред с этим пользователем: <#${existingThread.channel_id}>`);
      return;
    }

    const createdThread = await threads.createNewThreadForUser(user, true, true);
    createdThread.postSystemMessage(`Тред открыт ${msg.author.username}#${msg.author.discriminator}`);

    msg.channel.createMessage(`Тред открыт: <#${createdThread.channel_id}>`);
  });
};
