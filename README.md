# Администраторская почта для Discord
[Discord](https://discordapp.com/)-бот, позволящий пользователям через ЛС бота связываться с со всеми администраторами сервера.
Эти ЛС перенаправляются в сервер-ящик, где на каждого пользователя будет открыт собственный канал ("тред").
Администратоы смогут ответить в треде, и эти ответы будут возвращены ботом в ЛС пользователя.

Вдохновлено админской почтой Reddit'а.

## Оглавление
- [Установка](#установка)
- [Список изменений](#список-изменений)
- [Команды](#команды)
  - [В почтовом ящике - сервере](#команды-для-использования-в-почтовом-ящике)
  - [В треде](#команды-для-использования-в-треде)
- [Настройки](#настройки)
- [Плагины](#плагины)
  - [Запуск плагинов](#запуск-плагинов)
  - [Создание плагинов](#создание-плагинов)

## Установка
1. Установить Node.js 10 (LTS) или выше.
2. Склонируйте или скачайте этот репозиторий.
3. Создайте сервер в Discord, который будет использоваться в роли почтового ящика.
4. Сделайте копию `config.example.json` и назовите `config.json` (или `config.js` для использования ENV переменных). Откройте файл и заполните значения указанные в конце страницы.
5. Установите зависимости: `npm ci`
6. Добавьте бота на необходимые сервера и убедитесь, что дали ему права на сервере-ящике.
7. Запустите: `npm start`

## Список изменений
Смотри [CHANGELOG.md](CHANGELOG.md)

## Команды

### Команды для использования в почтовом ящике
- `!logs <user> <page>` Вывести предыдущие логи сообщений пользователя. Если логов много, то они будут разделены на страницы. В этом случае укажите номер страницы в качестве 2 параметра.
- `!block <user> <time>` Заблокировать пользователя в почте. Если указано время, то блокировка будет временной.
- `!unblock <user> <time>` Разблокировать пользователя в почте. Если указано время, то разблокировка будет запланирована.
- `!is_blocked <user>` Узнать, заблокирован ли пользователь и на сколько.
- `!s <shortcut> <text>` Добавить шаблон. Использование:
 - `!edit_snippet <shortcut> <text>` Редактировать шаблон (алиас `!es`)
 - `!delete_snippet <shortcut>` Удалить шаблон (алиас`!ds`)
- `!snippets` Вывести список шаблонов
- `!version` Вывести версию бота
- `!newthread <user>` Открыть новый тред с указанным пользователем

### Команды для использования в треде
- `!reply <text>` Ответить пользователю по формату "(Role) User: text" (алиас `!r`).
- `!anonreply <text>` Ответить анонимно пользователю по формату "Role: text" (алиас`!ar`).
- `!close <time>` Закрыть тред. Если указано время, то закрытие будет запланировано. Если происходит обмен сообщением, то закрытие отменяется.
- `!logs <page>` Вывести предыдущие логи сообщений пользователя. Если логов много, то они будут разделены на страницы. В этом случае укажите номер страницы в качестве параметра.
- `!block <time>` Заблокировать пользователя в почте. Если указано время, то блокировка будет временной.
- `!unblock <time>` Разблокировать пользователя в почте. Если указано время, то разблокировка будет запланирована.
- `!!shortcut` Ответить шаблоном. Замените `shortcut` названием шаблона.
- `!!!shortcut` Ответить анонимно шаблоном. Замените `shortcut` названием шаблона.
- `!move <category>` Переместить тред в другую категорию.
- `!loglink` Вывести ссылку на лог текущего треда.
- `!suspend` Заморозить тред. Тред будет отображаться как закрытый и не будет принимать сообщения до разморозки.
- `!unsuspend` Разморозить тред.
- `!id` Вывести ID пользователя.
- `!alert` Упомянуть, когда появится новое сообщение. Используйте `!alert cancel` для отмены.

## Настройки
Пример: `config.example.json`.

|Параметр|По умолчанию|Описание|
|------|-------|-----------|
|**token**|Не указано|**Обязательно!** Токен бота.|
|**logChannelId**|Не указано|**Обязательно!** Канал для постинга логов закрытых тредов и прочих уведомлений.|
|**mailGuildId**|Не указано|**Обязательно!** ID сервера-ящика.|
|**mainGuildId**|Не указано|**Обязательно!** ID главного сервера откуда будут обращаться пользователи. Используется для отображения серверных никнеймов, дат присоединения и перехвата упоминаний бота.|
|accountAgeDeniedMessage|"Your Discord account is not old enough to contact modmail."|Смотри `requiredAccountAge` далее.|
|allowMove|false|Если включено, то позволяет перенести тред в категорию каналов. Использование `!move <category>`.|
|allowUserClose|false|Если включено, то пользователи смогут самостоятельно закрывать тред в ЛС бота.|
|alwaysReplyAnon|false|Если включено `alwaysReply`, то автоматический ответ будет анонимным.|
|alwaysReply|false|Если включено, то все сообщения не начинающиеся с префикса `!` (по умолчанию) будут автоматически отправлены пользователю, даже без `!r`|
|attachmentStorage|"local"|Тип хранилища приложений.<br>**"local"** - Файлы сохраняются на машине с запущенным ботом<br>**"discord"** - Файлы сохраняются как приложения в специальном канале на сервере-ящике. Требует установленного `attachmentStorageChannelId`.|
|attachmentStorageChannelId|null|Когда используется "discord" как тип хранилища - id канала для сохранения приложений на сервере-ящике.|
|botMentionResponse|Не указано|Если указано, то бот будет отвечать этим сообщением на свое упоминание.|
|categoryAutomation|{}|Настройки автоматизации категорий тредов на сервере-ящике.|
|categoryAutomation.newThread|Не указано|Аналогично `newThreadCategoryId`. ID категории каналов куда будут помещаться открываемые треды.|
|closeMessage|Не указано|Сообщение, отправляемое пользователю при закрытии треда.|
|commandAliases|Не указано|Кастомные алиасы команд.|
|enableGreeting|false|Если включено, то новые пользователи будут получать приветственное сообщение при присоединении.|
|greetingAttachment|Не указано|Путь к изображению или другому файлу для прикрепления к приветственному сообщению.|
|greetingMessage|Не указано|Текст приветственного сообщения.|
|ignoreAccidentalThreads|false|Если включено, то бот попытается игнорировать сообщения по типу "привет", "спасибо" и т.д.|
|inboxServerPermission|Не указано|Необходимые права пользователя для использования бота на сервере-ящике.|
|timeOnServerDeniedMessage|"You haven't been a member of the server for long enough to contact modmail."|Смотри `requiredTimeOnServer` ниже|
|mentionRole|"here"|Роль, которая будет упомянута при создании нового треда или упоминании бота. Принимает "here", "everyone" или ID роли. Укажите `null` чтобы полностью отключить упоминания.|
|mentionUserInThreadHeader|false|Если включено, то обратившийся пользователь будет упомянут в шапке треда.|
|newThreadCategoryId|Не указано|**Устарело!** ID категории каналов куда будут помещаться открываемые треды.|
|pingOnBotMention|true|Если включено, то бот упомянет администраторов на сервере-ящике (смотри mentionRole выше) при упоминании бота на основном сервере.|
|plugins|Не указано|Массив плагинов для загрузки при включении бота. Смотри раздел [Плагины](#plugins).|
|port|8890|Порт веб-сервера логов и приложений.|
|prefix|"!"|Префикс команд бота.|
|relaySmallAttachmentsAsAttachments|false|Если включено, то бот будет пересылать небольшие приложения как приложения, а не как ссылку на файл приложения на веб-сервере.|
|requiredAccountAge|Не указано|Требуемый возраст аккаунта для отправки сообщений в почту (в часах). Если возраст не достигнут, то тред не будет создан, а пользователь получит сообщение, указанное в `accountAgeDeniedMessage` (если указано).|
|requiredTimeOnServer|Не указано|Требуемое время нахождения на сервере для отправки сообщений в почту (в минутах). Если время не прошло, то тред не будет создан, а пользователь получит сообщение, указанное `timeOnServerDeniedMessage` (если указано).|
|responseMessage|"Thank you for your message! Our mod team will reply to you here as soon as possible."|Ответ бота пользователю при начале нового треда.|
|rolesInThreadHeader|false|Если влючено, то в шапке треда будут показаны роли пользователя.|
|smallAttachmentLimit|2097152|Лимит приложения для пересылки приложением в байтах (по умолчанию 2MB). Смотри `relaySmallAttachmentsAsAttachments` выше.|
|snippetPrefix|"!!"|Префикс для использования шаблонов.|
|snippetPrefixAnon|"!!!"|Префикс для анонимного использования шаблонов.|
|status|"Message me for help"|Текст статуса бота.|
|syncPermissionsOnMove|false|Синхронизировать ли права доступа к каналу при перемещении с помощью !move|
|threadTimestamps|false|Если включено, то бот будет добавлять временную метку к сообщениям в треде в добавление к метке Discord. В веб-логах метка дублироваться не будет.|
|typingProxy|false|Если включено, то бот будет показывать в треде "%botname% печатает" когда, обращающийся пользователь будет набирать сообщение.|
|typingProxyReverse|false|Аналогично `typingProxy`, только в обратном направлении.|
|updateNotifications|true|Проверять ли обновления бота и уведомлять в тредах.|
|url|Не указано|URL веб-сервера для вставки ссылок на приложения и логи. По умолчанию `IP:PORT`|
|useNicknames|false|Если включено, то при обычном ответе вместо никнейма администратора будет указан никнейм на сервере-ящике.|
|storage|"pg"|Тип используемой базы данных. Смотри https://knexjs.org/#Installation|
|dbConnection|process.env.DATABASE_URL|Объект или строка соединения с базой данных. Смотри https://knexjs.org/#Installation-client|

## Плагины
Бот поддерживает загрузку внешних компонентов - плагинов.

### Запуск плагинов
Добавьте относительный путь к файлу плагина в массив `plugins` в файле настроек.
Плагин будет автоматически загружен при запуске бота.

### Создание плагинов
Создайте `.js` файл, экспортирующий функцию.
Эта функция будет выполнена при запуске бота со следующими аргументами: `(bot, knex, config, commands)`
 - `bot` - объект [Eris Client](https://abal.moe/Eris/docs/Client),
 - `knex` - объект базы данных [Knex](https://knexjs.org/#Builder),
 - `config` - объект текущей конфигурации,
 - `commands` - объект менеджера команд (смотри экспорт [src/commands.js](src/commands.js))

#### Пример
```js
module.exports = function(bot, knex, config, commands) {
  commands.addInboxThreadCommand('mycommand', [], (msg, args, thread) => {
    thread.replyToUser(msg.author, 'Reply from my custom plugin!');
  });
}
```

### Work in progress
Текущее API плагинов очень примитивно и будет расширено в будущем.
При ранних стадиях разработки API может меняться даже в минорных обновлениях. Следите за изменениями в [CHANGELOG.md](CHANGELOG.md).

Если у вас есть идеи, то вы можете предложить их на [официальном трекере (EN)](https://github.com/Dragory/modmailbot/issues)!
# Modmail for Discord
Modmail Bot is a bot for [Discord](https://discord.com/) that allows users to DM the bot to contact the server's moderators/staff
without messaging them individually or pinging them publically on the server.
These DMs get relayed to modmail *threads*, channels where staff members can reply to and talk with the user.
To the user, the entire process happens in DMs with the bot.

Inspired by Reddit's modmail system.

**⚠ Note on updating to v3.0.0:** If you're currently using a *very* old version of the bot, from before February 2018, you'll first need to update to v2.30.1 and run the bot once before updating to v3.0.0.

Always take a backup of your `db/data.sqlite` file before updating the bot.

## Getting started
* **[🛠️ Setting up the bot](docs/setup.md)**
* **[✨ Updating the bot](docs/updating.md)**
* **[🙋 Frequently Asked Questions](docs/faq.md)**
* [📝 Configuration](docs/configuration.md)
* [🤖 Commands](docs/commands.md)
* [📋 Snippets](docs/snippets.md)
* [🧩 Plugins](docs/plugins.md)
* [Release notes](CHANGELOG.md)
* [**Community Guides & Resources**](https://github.com/Dragory/modmailbot-community-resources)

## Support server
If you need help with setting up the bot or would like to discuss other things related to it, join the support server on Discord here:

👉 **[Join support server](https://discord.gg/vRuhG9R)**
