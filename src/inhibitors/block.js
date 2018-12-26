const { Inhibitor } = require('discord-akairo');
const blocked = require('../../data/blocked');
const autoBind = require('auto-bind');

class Blacklist extends Inhibitor {
    constructor() {
        super('blacklist', {
            reason: 'blacklist'
        });
        autoBind(this);
    }

    async exec(message) {
        return await blocked.isBlocked(message.author.id);
    }
}

module.exports = Blacklist;