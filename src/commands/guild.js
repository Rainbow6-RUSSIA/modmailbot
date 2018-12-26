const { Command } = require('discord-akairo');

class Guild extends Command {
    constructor() {
        super('ping', {
            channel: 'guild',
            editable: true,
            prefix: '',
        });
    }

    async exec(message) {

    }
}

module.exports = Guild;