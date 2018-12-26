const threads = require('./data/threads');
const utils = require("./utils");

async function getThread(msg) {
  if (! utils.messageIsOnInboxServer(msg)) return;
  if (! utils.isStaff(msg.member)) return;
  return await threads.findOpenThreadByChannelId(msg.channel.id);
}

// function addInboxServerCommand(bot, cmd, commandHandler, opts) {
//   bot.registerCommand(cmd, async (msg, args) => {
//     if (! utils.messageIsOnInboxServer(msg)) return;
//     if (! utils.isStaff(msg.member)) return;

//     const thread =
//     commandHandler(msg, args, thread);
//   }, opts);
// }

module.exports = {
  getThread,
};
