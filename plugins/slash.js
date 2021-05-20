const { SlashCreator, GatewayServer } = require("slash-create");
const path = require("path");

module.exports = ({ bot, knex, config, commands }) => {
  const creator = new SlashCreator({
    applicationID: bot.user.id,
    token: config.token,
  });

  creator
    .registerCommandsIn(path.join(__dirname, "slash-commands"))
    .withServer(
      new GatewayServer((handler) =>
        bot.on("rawWS", (event) => {
          if (event.t === "INTERACTION_CREATE") handler(event.d);
        })
      )
    )
    .syncCommands();

  // commands.addInboxThreadCommand("alert", "[opt:string]", async (msg, args, thread) => {
  //   if (args.opt && args.opt.startsWith("c")) {
  //     await thread.removeAlert(null);
  //     await thread.postSystemMessage("Оповещение при новом сообщении отменено.");
  //   } else {
  //     await thread.addAlert(msg.author.id);
  //     await thread.postSystemMessage(`Упоминание ${msg.author.username}#${msg.author.discriminator} при появлении новых сообщений в треде.`);
  //   }
  // });
};
