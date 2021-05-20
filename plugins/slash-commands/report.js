const { CommandOptionType } = require("slash-create");
const SlashCommand = require("../utils/RegExpFixCommand");

module.exports = class HelloCommand extends SlashCommand {
  constructor(creator) {
    const genericOptions = [
      {
        type: CommandOptionType.STRING,
        name: "описание",
        description: "Подробности конфликта",
        required: true,
      },
      {
        type: CommandOptionType.STRING,
        name: "нарушитель",
        description:
          "ID нарушителя(-лей) (что это такое? - http://bit.ly/r6ruid)",
        required: true,
      },
      {
        type: CommandOptionType.STRING,
        name: "пруфы",
        description: "Видео или скриншоты, подтверждающие твои слова (ссылка)",
      },
      {
        type: CommandOptionType.STRING,
        name: "свидетели",
        description:
          "Если нет пруфов, то необходимо, чтобы нам написали не менее 2-х свидетелей. Тут укажи их ники",
      },
    ];
    const cheatOptions = [
      {
        type: CommandOptionType.STRING,
        name: "описание",
        description: "Подробности нарушения",
        required: true,
      },
      {
        type: CommandOptionType.STRING,
        name: "нарушитель",
        description:
          "ID нарушителя(-лей) (что это такое? - http://bit.ly/r6ruid)",
        required: true,
      },
      {
        type: CommandOptionType.STRING,
        name: "пруфы",
        description: "Повтор или видео, подтверждающие твои слова (ссылка)",
        required: true,
      },
    ];

    super(creator, {
      name: "жалоба",
      guildIDs: ["216649610511384576", "405027726508949524"],
      description: "Форма отправки жалобы.",
      options: [
        {
          type: CommandOptionType.SUB_COMMAND,
          name: "оскорбления",
          description: "Оскорбления",
          options: genericOptions,
        },
        {
          type: CommandOptionType.SUB_COMMAND,
          name: "мошенничество",
          description: "Читы, макросы, сейвы и т.д.",
          options: cheatOptions,
        },
        {
          type: CommandOptionType.SUB_COMMAND,
          name: "помеха",
          description: "Преследование по каналам, саундпад",
          options: genericOptions,
        },
        {
          type: CommandOptionType.SUB_COMMAND,
          name: "другое",
          description: "Другая причина",
          options: [
            {
              type: CommandOptionType.STRING,
              name: "описание",
              description: "Подробности жалобы",
              required: true,
            },
          ],
        },
      ],
    });
    this.filePath = __filename;
  }

  async run(ctx) {
    console.log(ctx.options);
    return `Hi, ${ctx.user.username}!`;
  }
};
