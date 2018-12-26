// const Eris = require('eris');
// const Discord = require('discord.js');
const config = require('./config');
const { AkairoClient, CommandHandler, ListenerHandler,  InhibitorHandler } = require('discord-akairo');

class Bot extends AkairoClient {
  constructor() {
    super({
      prefix: config.prefix,
      blockBots: true, // ignoreBots
      blockClient: true, // ignoreSelf
    }, {
      fetchAllMembers: true, // getAllUsers
    });

    this.commandHandler = new CommandHandler(this, {
      directory: './src/commands',
    });
    this.listenerHandler = new ListenerHandler(this, {
      directory: './src/listeners',
    });
    this.inhibitorHandler = new InhibitorHandler(this, {
      directory: './src/inhibitors'
    });

    this.commandHandler.loadAll();
    this.commandHandler.useListenerHandler(this.listenerHandler);
    this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
    this.listenerHandler.loadAll();
    this.inhibitorHandler.loadAll();
  }
}

const bot = new Bot();

bot.login(config.token);

module.exports = bot;
