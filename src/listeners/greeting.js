const path = require('path');
const fs = require('fs');
const config = require('../config');
const autoBind = require('auto-bind');

const { Listener } = require('discord-akairo');

class Greeting extends Listener {
    constructor() {
        super('greeting', {
            emitter: 'client',
            event: 'guildMemberAdd'
        });
        autoBind(this);

        this.guilds = config.mainGuildId;
        this.message = config.greetingMessage;
        this.attachment = config.greetingAttachment;
    }

    async exec(member) {
      if (! config.enableGreeting) this.remove();
      if (! this.guilds.includes(member.guild.id)) return;

      const DM = await member.createDM();

      if (this.attachment) {
        const filename = path.basename(this.attachment);
        fs.readFile(this.attachment, (err, data) => {
          DM.send(this.message || '', {files: {attachment: data, name: filename}});
        });
      }
    }
}

module.exports = Greeting;