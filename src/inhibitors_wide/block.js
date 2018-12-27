const { Inhibitor } = require('discord-akairo');
const utils = require("../utils");
const blocked = require('../data/blocked');

class Blacklist extends Inhibitor {
    constructor() {
        super('blacklist', {
            reason: 'blacklist'
        });
    }

    async exec(message) {
        return (await blocked.isBlocked(message.author.id)) && (! utils.isStaff(message.author.id));
    }
}

module.exports = Blacklist;