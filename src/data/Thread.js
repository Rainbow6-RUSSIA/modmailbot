const moment = require('moment');

const bot = require('../bot');
const knex = require('../knex');
const utils = require('../utils');
const config = require('../config');
const attachments = require('./attachments');

const ThreadMessage = require('./ThreadMessage');

const {THREAD_MESSAGE_TYPE, THREAD_STATUS} = require('./constants');

/**
 * @property {String} id
 * @property {Number} status
 * @property {String} user_id
 * @property {String} user_name
 * @property {String} channel_id
 * @property {String} scheduled_close_at
 * @property {String} scheduled_close_id
 * @property {String} scheduled_close_name
 * @property {String} alert_id
 * @property {String} created_at
 */
class Thread {
  constructor(props) {
    utils.setDataModelProps(this, props);
  }

  async replyToUser(moderator, text, replyAttachments = [], isAnonymous = false) {
    // Username to reply with
    let modUsername, logModUsername;
    const mainRole = utils.getMainRole(moderator);

    if (isAnonymous) {
      modUsername = (mainRole ? mainRole.name : 'Администратор');
      logModUsername = `(${moderator.user.username}) ${mainRole ? mainRole.name : 'Администратор'}`;
    } else {
      const name = (config.useNicknames ? moderator.nick || moderator.user.username : moderator.user.username);
      modUsername = (mainRole ? `(${mainRole.name}) ${name}` : name);
      logModUsername = modUsername;
    }

    // Build the reply message
    let dmContent = `**${modUsername}:** ${text}`;
    let threadContent = `**${logModUsername}:** ${text}`;
    let logContent = text;

    if (config.threadTimestamps) {
      const timestamp = utils.getTimestamp();
      threadContent = `[${timestamp}] » ${threadContent}`;
    }

    // Prepare attachments, if any
    let files = [];

    if (replyAttachments.length > 0) {
      for (const attachment of replyAttachments) {
        files.push(await attachments.attachmentToFile(attachment));
        const url = await attachments.getUrl(attachment.id, attachment.filename);

        logContent += `\n\n**Приложение:** ${url}`;
      }
    }

    // Send the reply DM
    let dmMessage;
    try {
      dmMessage = await this.postToUser(dmContent, files);
    } catch (e) {
      await this.postSystemMessage(`При ответе пользователю возникла ошибка: ${e.message}`);
      return;
    }

    // Send the reply to the modmail thread
    await this.postToThreadChannel(threadContent, files);

    // Add the message to the database
    await this.addThreadMessageToDB({
      message_type: THREAD_MESSAGE_TYPE.TO_USER,
      user_id: moderator.id,
      user_name: logModUsername,
      body: logContent,
      is_anonymous: (isAnonymous ? 1 : 0),
      dm_message_id: dmMessage.id
    });

    if (this.scheduled_close_at) {
      await this.cancelScheduledClose();
      await this.postSystemMessage(`Отмена запланированного закрытия из-за нового сообщения`);
    }
  }

  async receiveUserReply(msg) {
    let content = msg.content;
    if (msg.content.trim() === '' && msg.embeds.length) {
      content = '<сообщение содержит встраиваемый контент>';
    }

    let threadContent = `**${msg.author.tag}:** ${content}`;
    let logContent = msg.content;

    if (config.threadTimestamps) {
      const timestamp = utils.getTimestamp(msg.timestamp, 'x');
      threadContent = `[${timestamp}] « ${threadContent}`;
    }

    // Prepare attachments, if any
    let attachmentFiles = [];

    for (const attachment of msg.attachments) {
      await attachments.saveAttachment(attachment);

      // Forward small attachments (<2MB) as attachments, just link to larger ones
      const formatted = '\n\n' + await utils.formatAttachment(attachment);
      logContent += formatted; // Logs always contain the link

      if (config.relaySmallAttachmentsAsAttachments && attachment.size <= 1024 * 1024 * 2) {
        const file = await attachments.attachmentToFile(attachment);
        attachmentFiles.push(file);
      } else {
        threadContent += formatted;
      }
    }

    await this.postToThreadChannel(threadContent, attachmentFiles);
    await this.addThreadMessageToDB({
      message_type: THREAD_MESSAGE_TYPE.FROM_USER,
      user_id: this.user_id,
      user_name: `${msg.author.username}#${msg.author.discriminator}`,
      body: logContent,
      is_anonymous: 0,
      dm_message_id: msg.id
    });

    if (this.scheduled_close_at) {
      await this.cancelScheduledClose();
      await this.postSystemMessage(`<@!${this.scheduled_close_id}> Тред, запланированный на закрытие получил новый ответ. Отмена.`);
    }

    if (this.alert_id) {
      await this.setAlert(null);
      await this.postSystemMessage(`<@!${this.alert_id}> Новое сообщение от ${this.user_name}`);
    }
  }

  async getDMChannel() {
    return (await bot.users.fetch(this.user_id)).createDM();
  }

  async postToUser(text, file = null) {
    // Try to open a DM channel with the user
    const dmChannel = await this.getDMChannel();
    if (! dmChannel) {
      throw new Error('Не удается открыть ЛС с пользователем. Он, возможно, заблокировал бота или повысил настройки приватности.');
    }

    const messages = await dmChannel.send(text, {
      split: true,
      files: file,
    })
    // // Send the DM
    // const chunks = utils.chunk(text, 2000);
    // const messages = await Promise.all(chunks.map((chunk, i) => {
    //   return dmChannel.createMessage(
    //     chunk,
    //     (i === chunks.length - 1 ? file : undefined)  // Only send the file with the last message
    //   );
    // }));
    return messages[0];
  }

  async postToThreadChannel(...args) {
    try {
      if (typeof args[0] === 'string') {
        const messages = await bot.channels.get(this.channel_id).send(args[0]);
        return messages[0];
      } else {
        return await bot.channels.get(this.channel_id).send(...args);
      }
    } catch (e) {
      // Channel not found
      if (e.code === 10003) {
        console.log(`[INFO] Failed to send message to thread channel for ${this.user_name} because the channel no longer exists. Auto-closing the thread.`);
        this.close(true);
      } else {
        throw e;
      }
    }
  }

  async postSystemMessage(text, ...args) {
    const msg = await this.postToThreadChannel(text, ...args);
    await this.addThreadMessageToDB({
      message_type: THREAD_MESSAGE_TYPE.SYSTEM,
      user_id: null,
      user_name: '',
      body: typeof text === 'string' ? text : text.content,
      is_anonymous: 0,
      dm_message_id: msg.id
    });
  }

  async postNonLogMessage(...args) {
    await this.postToThreadChannel(...args);
  }

  async saveChatMessage(msg) {
    return this.addThreadMessageToDB({
      message_type: THREAD_MESSAGE_TYPE.CHAT,
      user_id: msg.author.id,
      user_name: `${msg.author.username}#${msg.author.discriminator}`,
      body: msg.content,
      is_anonymous: 0,
      dm_message_id: msg.id
    });
  }

  async saveCommandMessage(msg) {
    return this.addThreadMessageToDB({
      message_type: THREAD_MESSAGE_TYPE.COMMAND,
      user_id: msg.author.id,
      user_name: `${msg.author.username}#${msg.author.discriminator}`,
      body: msg.content,
      is_anonymous: 0,
      dm_message_id: msg.id
    });
  }

  async updateChatMessage(msg) {
    await knex('thread_messages')
      .where('thread_id', this.id)
      .where('dm_message_id', msg.id)
      .update({
        body: msg.content
      });
  }

  async deleteChatMessage(messageId) {
    await knex('thread_messages')
      .where('thread_id', this.id)
      .where('dm_message_id', messageId)
      .delete();
  }

  async addThreadMessageToDB(data) {
    await knex('thread_messages').insert({
      thread_id: this.id,
      created_at: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
      is_anonymous: 0,
      ...data
    });
  }

  async getThreadMessages() {
    const threadMessages = await knex('thread_messages')
      .where('thread_id', this.id)
      .orderBy('created_at', 'ASC')
      .orderBy('id', 'ASC')
      .select();

    return threadMessages.map(row => new ThreadMessage(row));
  }

  async close(silent = false) {
    if (! silent) {
      console.log(`Closing thread ${this.id}`);
      await this.postSystemMessage('Закрываю тред...');
    }

    // Update DB status
    await knex('threads')
      .where('id', this.id)
      .update({
        status: THREAD_STATUS.CLOSED
      });

    // Delete channel
    const channel = bot.channels.get(this.channel_id);
    if (channel) {
      console.log(`Deleting channel ${this.channel_id}`);
      await channel.delete('Тред закрыт');
    }
  }

  async scheduleClose(time, user) {
    await knex('threads')
      .where('id', this.id)
      .update({
        scheduled_close_at: time,
        scheduled_close_id: user.id,
        scheduled_close_name: user.username
      });
  }

  async cancelScheduledClose() {
    await knex('threads')
      .where('id', this.id)
      .update({
        scheduled_close_at: null,
        scheduled_close_id: null,
        scheduled_close_name: null
      });
  }

  async suspend() {
    await knex('threads')
      .where('id', this.id)
      .update({
        status: THREAD_STATUS.SUSPENDED
      });
  }

  async unsuspend() {
    await knex('threads')
      .where('id', this.id)
      .update({
        status: THREAD_STATUS.OPEN
      });
  }

  async setAlert(userId) {
    await knex('threads')
      .where('id', this.id)
      .update({
        alert_id: userId
      });
  }

  getLogUrl() {
    return utils.getSelfUrl(`logs/${this.id}`);
  }
}

module.exports = Thread;
