const threadUtils = require('../threadUtils');
const threads = require("../data/threads");

module.exports = bot => {
  const addInboxServerCommand = (...args) => threadUtils.addInboxServerCommand(bot, ...args);

  addInboxServerCommand('suspend', async (msg, args, thread) => {
    if (! thread) return;
    await thread.suspend();
    thread.postSystemMessage(`**Тред заморожен!** Этот тред останется замороженным пока не будет выполнена команда \`!unsuspend\``);
  });

  addInboxServerCommand('unsuspend', async msg => {
    const thread = await threads.findSuspendedThreadByChannelId(msg.channel.id);
    if (! thread) return;

    const otherOpenThread = await threads.findOpenThreadByUserId(thread.user_id);
    if (otherOpenThread) {
      thread.postSystemMessage(`Невозможно разморозить тред; уже открыт другой тред с этим пользователем: <#${otherOpenThread.channel_id}>`);
      return;
    }

    await thread.unsuspend();
    thread.postSystemMessage(`**Тред разморожен!**`);
  });
};
