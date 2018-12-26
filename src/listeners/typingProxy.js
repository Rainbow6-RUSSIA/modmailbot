const config = require('../config');
const threads = require("../data/threads");

const { Listener } = require('discord-akairo');

class Typing extends Listener {
    constructor() {
        super('ready', {
            emitter: 'client',
            event: 'typingStart'
        });
        this.forward = config.typingProxy;
        this.backward = config.typingProxyReverse;
    }

    async exec(channel, user) {
      if (! (this.forward || this.backward)) this.remove();
      if (this.forward && channel.type === 'dm') {
        const thread = await threads.findOpenThreadByUserId(user.id);
        if (! thread) return;

        try {
          await channel.startTyping();
          setTimeout(() => {
            channel.stopTyping(true);
          }, 10000);
        } catch (e) {}
      }

      else if (this.backward && channel.type === 'text') {
        const thread = await threads.findByChannelId(channel.id);
        if (! thread) return;

        const dmChannel = await thread.getDMChannel();
        if (! dmChannel) return;

        try {
          await dmChannel.startTyping();
          setTimeout(() => {
            channel.stopTyping(true);
          }, 10000);
        } catch (e) {}
      }
    }
}

module.exports = Typing;