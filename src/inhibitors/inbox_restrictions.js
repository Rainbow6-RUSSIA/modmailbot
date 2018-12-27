const { Inhibitor } = require('discord-akairo');
const utils = require("../utils");

class Inbox extends Inhibitor {
    constructor() {
        super('inbox', {
            reason: 'inbox'
        });
    }

    async exec(message) {
        return ! utils.messageIsOnInboxServer(message);
    }
}

module.exports = Inbox;