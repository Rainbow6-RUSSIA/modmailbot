const { Command } = require('discord-akairo');
const { messageQueue } = require('../queue');
const { ACCIDENTAL_THREAD_MESSAGES } = require('../data/constants');
const config = require('../config');

class DM extends Command {
    constructor() {
        super('dm', {
            channel: 'dm',
            condition: () => true
        });
        this.ignoreAccidentalThreads = config.ignoreAccidentalThreads;
    }

    async exec(msg) {
        messageQueue.add(async () => {
            let thread = await threads.findOpenThreadByUserId(msg.author.id);

            // New thread
            if (! thread) {
              // Ignore messages that shouldn't usually open new threads, such as "ok", "thanks", etc.
              if (this.ignoreAccidentalThreads && msg.content && ACCIDENTAL_THREAD_MESSAGES.includes(msg.content.trim().toLowerCase())) return;

              thread = await threads.createNewThreadForUser(msg.author);
            }

            if (thread) await thread.receiveUserReply(msg);
          })
    }
}

module.exports = DM;