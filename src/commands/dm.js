const { Command } = require('discord-akairo');

class DM extends Command {
    constructor() {
        super('dm', {
            channel: 'dm',
            editable: true,
            prefix: '',
        });
    }

    async exec(message) {

    }
}

module.exports = DM;