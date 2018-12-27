const { Listener } = require('discord-akairo');
const threads = require('../data/threads');
const blocked = require('../data/blocked');
const utils = require('../utils');

class Update extends Listener {
  constructor() {
    super('update', {
      emitter: 'client',
      event: 'messageUpdate'
    });
  }

  async exec(oldMsg, msg) {
    if (! msg || ! msg.author) return;
    if (await blocked.isBlocked(msg.author.id)) return;

    const oldContent = oldMsg && oldMsg.content || '*Недоступно из-за перезапуска бота*';
    const newContent = msg.content;

    if (newContent.trim() === oldContent.trim()) return;

    if (msg.channel.type === 'dm') {
      const thread = await threads.findOpenThreadByUserId(msg.author.id);
      if (! thread) return;

      const editMessage = utils.disableLinkPreviews(`**Пользователь отредактировал сообщение:**\n\`до:\` ${oldContent}\n\`после:\` ${newContent}`);
      thread.postSystemMessage(editMessage);
    }

    // 2) Edit in the thread
    else if (utils.messageIsOnInboxServer(msg) && utils.isStaff(msg.member)) {
      const thread = await threads.findOpenThreadByChannelId(msg.channel.id);
      if (! thread) return;

      thread.updateChatMessage(msg);
    }
  }
}

module.exports = Update;
