const threads = require('../data/threads');
const snippets = require('../data/snippets');
const config = require('../config');
const utils = require('../utils');
const threadUtils = require('../threadUtils');

module.exports = bot => {
  const addInboxServerCommand = (...args) => threadUtils.addInboxServerCommand(bot, ...args);

  /**
   * When a staff member uses a snippet (snippet prefix + trigger word), find the snippet and post it as a reply in the thread
   */
  bot.on('messageCreate', async msg => {
    if (! utils.messageIsOnInboxServer(msg)) return;
    if (! utils.isStaff(msg.member)) return;

    if (msg.author.bot) return;
    if (! msg.content) return;
    if (! msg.content.startsWith(config.snippetPrefix) && ! msg.content.startsWith(config.snippetPrefixAnon)) return;

    let snippetPrefix, isAnonymous;

    if (config.snippetPrefixAnon.length > config.snippetPrefix.length) {
      // Anonymous prefix is longer -> check it first
      if (msg.content.startsWith(config.snippetPrefixAnon)) {
        snippetPrefix = config.snippetPrefixAnon;
        isAnonymous = true;
      } else {
        snippetPrefix = config.snippetPrefix;
        isAnonymous = false;
      }
    } else {
      // Regular prefix is longer -> check it first
      if (msg.content.startsWith(config.snippetPrefix)) {
        snippetPrefix = config.snippetPrefix;
        isAnonymous = false;
      } else {
        snippetPrefix = config.snippetPrefixAnon;
        isAnonymous = true;
      }
    }

    const thread = await threads.findByChannelId(msg.channel.id);
    if (! thread) return;

    const trigger = msg.content.replace(snippetPrefix, '').toLowerCase();
    const snippet = await snippets.get(trigger);
    if (! snippet) return;

    await thread.replyToUser(msg.member, snippet.body, [], isAnonymous);
    msg.delete();
  });

  // Show or add a snippet
  addInboxServerCommand('snippet', async (msg, args, thread) => {
    const trigger = args[0];
    if (! trigger) return

    const text = args.slice(1).join(' ').trim();
    const snippet = await snippets.get(trigger);

    if (snippet) {
      if (text) {
        // If the snippet exists and we're trying to create a new one, inform the user the snippet already exists
        utils.postSystemMessageWithFallback(msg.channel, thread, `Шаблон "${trigger}" уже существует! Вы можете отредактировать или удалить его с помощью \`${config.prefix}edit_snippet\` и \`${config.prefix}delete_snippet\` соответственно.`);
      } else {
        // If the snippet exists and we're NOT trying to create a new one, show info about the existing snippet
        utils.postSystemMessageWithFallback(msg.channel, thread, `\`${config.snippetPrefix}${trigger}\` ответит:\n${snippet.body}`);
      }
    } else {
      if (text) {
        // If the snippet doesn't exist and the user wants to create it, create it
        await snippets.add(trigger, text, msg.author.id);
        utils.postSystemMessageWithFallback(msg.channel, thread, `Шаблон "${trigger}" создан!`);
      } else {
        // If the snippet doesn't exist and the user isn't trying to create it, inform them how to create it
        utils.postSystemMessageWithFallback(msg.channel, thread, `Шаблон "${trigger}" не существует! Вы можете создать его с помощью \`${config.prefix}snippet ${trigger} text\`.`);
      }
    }
  });

  bot.registerCommandAlias('s', 'snippet');

  addInboxServerCommand('delete_snippet', async (msg, args, thread) => {
    const trigger = args[0];
    if (! trigger) return;

    const snippet = await snippets.get(trigger);
    if (! snippet) {
      utils.postSystemMessageWithFallback(msg.channel, thread, `Шаблон "${trigger}" не существует!`);
      return;
    }

    await snippets.del(trigger);
    utils.postSystemMessageWithFallback(msg.channel, thread, `Шаблон "${trigger}" удален!`);
  });

  bot.registerCommandAlias('ds', 'delete_snippet');

  addInboxServerCommand('edit_snippet', async (msg, args, thread) => {
    const trigger = args[0];
    if (! trigger) return;

    const text = args.slice(1).join(' ').trim();
    if (! text) return;

    const snippet = await snippets.get(trigger);
    if (! snippet) {
      utils.postSystemMessageWithFallback(msg.channel, thread, `Шаблон "${trigger}" не существует!`);
      return;
    }

    await snippets.del(trigger);
    await snippets.add(trigger, text, msg.author.id);

    utils.postSystemMessageWithFallback(msg.channel, thread, `Шаблон "${trigger}" изменен!`);
  });

  bot.registerCommandAlias('es', 'edit_snippet');

  addInboxServerCommand('snippets', async (msg, args, thread) => {
    const allSnippets = await snippets.all();
    const triggers = allSnippets.map(s => s.trigger);
    triggers.sort();

    utils.postSystemMessageWithFallback(msg.channel, thread, `Доступные шаблоны (префикс ${config.snippetPrefix}):\n${triggers.join(', ')}`);
  });
};
