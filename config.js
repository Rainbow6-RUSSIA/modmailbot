module.exports = {
  "token": process.env.DISCORD_TOKEN,
  "mailGuildId": process.env.INBOX_GUILD,
  "mainGuildId": process.env.MAIN_GUILD.split(','),
  "logChannelId": process.env.LOG_CHANNEL,
  "port": process.env.PORT,
  "url": process.env.URL,

  "attachmentStorageChannelId": process.env.ATTACHMENT_STORAGE_CHANNEL,
  "categoryAutomation": {
    "newThread": process.env.CATEGORY_ID,
  },
  "ignoreAccidentalThreads": process.env.IGNORE_ACCIDENTAL === 'true',
  "mentionUserInThreadHeader": process.env.HEADER_MENTION === 'true',
  "relaySmallAttachmentsAsAttachments": process.env.RELAY_ATTACHMENTS_AS_ATTACHMENTS === 'true',
  "requiredAccountAge": parseInt(process.env.REQUIRED_ACCOUNT_AGE),
  "requiredTimeOnServer": parseInt(process.env.REQUIRED_MEMBER_AGE),
  "typingProxy": process.env.TYPING_PROXY === 'true',
  "typingProxyReverse": process.env.TYPING_PROXY_REVERSE === 'true',
  
  "accountAgeDeniedMessage": `Ваш аккаунт был создан недавно, для защиты от спама вы пока не можете отправлять сообщения.\nЕсли вы впервые на сервере, ваш вопрос наверняка решится, если вы прочитаете инструкцию по регистрации ${process.env.REGISTRATION_GUIDE}.`,
  "allowMove": true,
  "attachmentStorage": 'discord',
  "responseMessage": "Спасибо за обращение! Администрация скоро ответит. Во избежание недоразумений сообщения записываются.",
  "rolesInThreadHeader": true,
  "status": "ЛС сервера",
  "syncPermissionsOnMove": true,
  "timeOnServerDeniedMessage": `Вы только что зашли на сервер, для защиты от спама вы пока не можете отправлять сообщения.\nЕсли вы впервые на сервере, ваш вопрос наверняка решится, если вы прочитаете инструкцию по регистрации ${process.env.REGISTRATION_GUIDE}.`,
  "updateNotifications": false,
  "useNicknames": true,
  // "closeMessage": "Спасибо за обращение! Тред закрыт администратором. Для повторного обращения напишите снова."

  "knex": {
    client: "pg",
    connection: process.env.DB,
    useNullAsDefault: true,
    searchPath: ["knex", "mailbot"]
  },
}
