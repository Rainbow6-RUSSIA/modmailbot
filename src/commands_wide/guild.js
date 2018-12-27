const { Command } = require('discord-akairo');
const threads = require('../data/threads');
const utils = require('../utils');

class Guild extends Command {
  constructor() {
    super('guild', {
      channel: 'guild',
      condition: (msg) => utils.messageIsOnInboxServer(msg)
    });
  }

  async exec(msg) {
    const thread = await threads.findByChannelId(msg.channel.id);
    if (! thread) return;

    if (msg.content.startsWith(config.prefix) || msg.content.startsWith(config.snippetPrefix)) {
      // Save commands as "command messages"
      if (msg.content.startsWith(config.snippetPrefix)) return; // Ignore snippets
      thread.saveCommandMessage(msg);
    } else if (config.alwaysReply) {
      // AUTO-REPLY: If config.alwaysReply is enabled, send all chat messages in thread channels as replies
      if (! utils.isStaff(msg.member)) return; // Only staff are allowed to reply

      if (msg.attachments.length) await attachments.saveAttachmentsInMessage(msg);
      await thread.replyToUser(msg.member, msg.content.trim(), msg.attachments, config.alwaysReplyAnon || false);
      msg.delete();
    } else {
      // Otherwise just save the messages as "chat" in the logs
      thread.saveChatMessage(msg);
    }
  }
}

module.exports = Guild;
