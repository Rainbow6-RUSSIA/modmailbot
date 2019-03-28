module.exports = {
  "token": process.env.DISCORD_TOKEN,
  "mailGuildId": process.env.INBOX_GUILD,
  "mainGuildId": process.env.MAIN_GUILD.split(','),
  "logChannelId": process.env.LOG_CHANNEL,
  "port": process.env.PORT,
  "url": process.env.URL,

  "attachmentStorage": 'discord',
  "attachmentStorageChannelId": process.env.ATTACHMENT_STORAGE_CHANNEL,
  "relaySmallAttachmentsAsAttachments": process.env.RELAY_ATTACHMENTS_AS_ATTACHMENTS === 'true',
  "requiredAccountAge": parseInt(process.env.REQUIRED_ACCOUNT_AGE),
  "typingProxy": process.env.TYPING_PROXY === 'true',
  "typingProxyReverse": process.env.TYPING_PROXY_REVERSE === 'true',
  "useNicknames": process.env.USE_NICKNAMES === 'true',
  "allowMove": process.env.ALLOW_MOVE === 'true',
  "mentionUserInThreadHeader": process.env.HEADER_MENTION === 'true',
  "newThreadCategoryId": process.env.CATEGORY_ID,
  "syncPermissionsOnMove": true,

  "knex": {
    client: "pg",
    connection: process.env.DB,
    useNullAsDefault: true,
    searchPath: ["knex", "mailbot"]
  },

  "accountAgeDeniedMessage": "Ваш аккаунт был создан недавно, для защиты от спама вы пока не можете отправлять сообщения.",
  "status": "ЛС сервера",
  "responseMessage": "Спасибо за обращение! Администрация скоро ответит. Во избежание недоразумений сообщения записываются.",
  // "closeMessage": "Спасибо за обращение! Тред закрыт администратором. Для повторного обращения напишите снова."
}
