module.exports = ({ bot, knex, config, commands }) => {
  commands.addInboxThreadCommand("alert", "[opt:string]", async (msg, args, thread) => {
    if (args.opt && args.opt.startsWith("c")) {
      await thread.removeAlert(null);
      await thread.postSystemMessage("Оповещение при новом сообщении отменено.");
    } else {
      await thread.addAlert(msg.author.id);
      await thread.postSystemMessage(`Упоминание ${msg.author.username}#${msg.author.discriminator} при появлении новых сообщений в треде.`);
    }
  });
};
