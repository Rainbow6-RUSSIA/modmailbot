const { CommandOptionType } = require("slash-create");
const SlashCommand = require("../utils/RegExpFixCommand");

module.exports = class HelloCommand extends SlashCommand {
  constructor(creator) {
    super(creator, {
      name: "вопрос",
      guildIDs: ["216649610511384576", "405027726508949524"],
      description: "Вопрос по Серверу",
      options: [
        {
          type: CommandOptionType.SUB_COMMAND,
          name: "общий",
          description: "Общий вопрос по Сервер",
          options: [
            {
              type: CommandOptionType.STRING,
              name: "описание",
              description: "Подробности жалобы",
              required: true,
            },
          ],
        },
        {
          type: CommandOptionType.SUB_COMMAND,
          name: "справка",
          description: "Важные вещи на Сервере",
          options: [
            {
              type: CommandOptionType.STRING,
              name: "тема",
              description: "Что интересует?",
              required: true,
            },
          ],
        },
        {
          type: CommandOptionType.SUB_COMMAND,
          name: "стримы",
          description: "Аккредитация в @StreamTeam 🎥",
          options: [
            {
              type: CommandOptionType.STRING,
              name: "канал",
              description: "Ссылка на канал Twitch или YouTube",
              required: true,
            },
          ],
        },
      ],
    });
  }

  async run(ctx) {
    console.log(ctx.options);
    return `Hi, ${ctx.user.username}!`;
  }
};
