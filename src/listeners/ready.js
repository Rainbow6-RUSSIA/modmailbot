const { Listener } = require('discord-akairo');

class Ready extends Listener {
    constructor() {
        super('ready', {
            emitter: 'client',
            event: 'ready'
        });
    }

    exec() {
        this.client.user.setActivity(config.status, {type: 'WATCHING'});
        console.log('Connected! Now listening to DMs.');
    }
}

module.exports = Ready;