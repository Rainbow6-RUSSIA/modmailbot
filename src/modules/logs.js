const threads = require("../data/threads");
const moment = require("moment");
const utils = require("../utils");
const { getLogUrl, getLogFile, getLogCustomResponse, saveLogToStorage } = require("../data/logs");
const { THREAD_STATUS } = require("../data/constants");

const LOG_LINES_PER_PAGE = 10;

module.exports = ({ bot, knex, config, commands, hooks }) => {
  const addOptQueryStringToUrl = (url, args) => {
    const params = [];
    if (args.verbose) params.push("verbose=1");
    if (args.simple) params.push("simple=1");

    if (params.length === 0) {
      return url;
    }

    const hasQueryString = url.indexOf("?") > -1;
    return url + (hasQueryString ? "&" : "?") + params.join("&");
  };

  const logsCmd = async (msg, args, thread) => {
    let userId = args.userId || (thread && thread.user_id);
    if (! userId) return;

    let userThreads = await threads.getClosedThreadsByUserId(userId);

    // Descending by date
    userThreads.sort((a, b) => {
      if (a.created_at > b.created_at) return -1;
      if (a.created_at < b.created_at) return 1;
      return 0;
    });

    // Pagination
    const totalUserThreads = userThreads.length;
    const maxPage = Math.ceil(totalUserThreads / LOG_LINES_PER_PAGE);
    const inputPage = args.page;
    const page = Math.max(Math.min(inputPage ? parseInt(inputPage, 10) : 1, maxPage), 1); // Clamp page to 1-<max page>
    const isPaginated = totalUserThreads > LOG_LINES_PER_PAGE;
    const start = (page - 1) * LOG_LINES_PER_PAGE;
    const end = page * LOG_LINES_PER_PAGE;
    userThreads = userThreads.slice((page - 1) * LOG_LINES_PER_PAGE, page * LOG_LINES_PER_PAGE);

    const threadLines = await Promise.all(userThreads.map(async thread => {
      const logUrl = await getLogUrl(thread);
      const formattedLogUrl = logUrl
        ? `<${addOptQueryStringToUrl(logUrl, args)}>`
        : `Посмотреть лог - \`${config.prefix}log ${thread.thread_number}\``
      const formattedDate = moment.utc(thread.created_at).utcOffset(3).format("Do MMM [в] HH:mm [МСК]");
      return `\`#${thread.thread_number}\` \`${formattedDate}\`: ${formattedLogUrl}`;
    }));

    let message = isPaginated
      ? `**Логи <@${userId}>** (страница **${page}/${maxPage}**, лог **${start + 1}-${end}/${totalUserThreads}**):`
      : `**Логи <@${userId}>:**`;

    message += `\n${threadLines.join("\n")}`;

    if (isPaginated) {
      message += "\nЧтобы просмотреть дальше, добавьте номер страницы в конец команды";
    }

    // Send the list of logs in chunks of 15 lines per message
    const lines = message.split("\n");
    const chunks = utils.chunk(lines, 15);

    let root = Promise.resolve();
    chunks.forEach(lines => {
      root = root.then(() => msg.channel.createMessage(lines.join("\n")));
    });
  };

  const logCmd = async (msg, args, _thread) => {
    const threadId = args.threadId || (_thread && _thread.id);
    if (! threadId) return;

    const thread = (await threads.findById(threadId)) || (await threads.findByThreadNumber(threadId));
    if (! thread) return;

    const customResponse = await getLogCustomResponse(thread);
    if (customResponse && (customResponse.content || customResponse.file)) {
      msg.channel.createMessage(customResponse.content, customResponse.file);
    }

    const logUrl = await getLogUrl(thread);
    if (logUrl) {
      msg.channel.createMessage(`Откройте следующую ссылку для просмотра лога треда #${thread.thread_number}:\n<${addOptQueryStringToUrl(logUrl, args)}>`);
      return;
    }

    const logFile = await getLogFile(thread);
    if (logFile) {
      msg.channel.createMessage(`Для просмотра лога треда скачайте следующий файл #${thread.thread_number}:`, logFile);
      return;
    }

    if (thread.status === THREAD_STATUS.OPEN) {
      msg.channel.createMessage(`Логи этого треда в настоящее время недоступны, но он открыт в <#${thread.channel_id}>`);
      return;
    }

    msg.channel.createMessage("Логи этого треда в настоящее время недоступны.");
  };

  const logCmdOptions = [
    { name: "verbose", shortcut: "v", isSwitch: true },
    { name: "simple", shortcut: "s", isSwitch: true },
  ];

  commands.addInboxServerCommand("logs", "<userId:userId> [page:number]", logsCmd, { options: logCmdOptions });
  commands.addInboxServerCommand("logs", "[page:number]", logsCmd, { options: logCmdOptions });

  commands.addInboxServerCommand("log", "[threadId:string]", logCmd, { options: logCmdOptions, aliases: ["thread"] });
  commands.addInboxServerCommand("loglink", "[threadId:string]", logCmd, { options: logCmdOptions });

  hooks.afterThreadClose(async ({ threadId }) => {
    const thread = await threads.findById(threadId);
    await saveLogToStorage(thread);
  });
};
