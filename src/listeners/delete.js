const { Listener } = require('discord-akairo');

class Delete extends Listener {
    constructor() {
        super('delete', {
            emitter: 'client',
            event: 'messageDelete'
        });
    }

    async exec() {
        if (! msg.author) return;
        if (msg.author.bot) return;
        if (! utils.messageIsOnInboxServer(msg)) return;
        if (! utils.isStaff(msg.member)) return;

        const thread = await threads.findOpenThreadByChannelId(msg.channel.id);
        if (! thread) return;

        thread.deleteChatMessage(msg.id);
    }
}

module.exports = Delete;