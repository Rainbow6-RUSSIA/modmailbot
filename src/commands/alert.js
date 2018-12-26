const { Command } = require('discord-akairo');
const threadUtils = require('../threadUtils');

class Alert extends Command {
    constructor() {
        super('alert', {
           aliases: ['alert'],
           args: [
             {
               id: 'cancel',
               type: 'string'
             }
           ]
        });
        this.exec = this.exec.bind(this);
    }

    async exec (msg, args) {
      const thread = await threadUtils.getThread(msg);
      if (! thread) return;

      if (args.cancel && args.cancel.startsWith('c')) {
        await thread.setAlert(null);
        await thread.postSystemMessage(`Оповещение при новом сообщении отменено.`);
      } else {
        await thread.setAlert(msg.author.id);
        await thread.postSystemMessage(`Упоминание ${msg.author.tag} при появлении новых сообщений в треде.`);
      }
    }
}

module.exports = Alert;