// const Eris = require('eris');
// const Discord = require('discord.js');
const config = require('./config');
const { AkairoClient, CommandHandler, ListenerHandler,  InhibitorHandler } = require('discord-akairo');

class Bot extends AkairoClient {
  constructor() {
    super({
      ownerID: config.ownerId,
    }, {
      // fetchAllMembers: true, // getAllUsers
    });

    this.commandHandler = new CommandHandler(this, {
      directory: './src/commands',
      prefix: config.prefix,
      blockBots: true, // ignoreBots
      blockClient: true, // ignoreSelf
    });
    this.commandWideHandler = new CommandHandler(this, {
      directory: './src/commands_wide',
      prefix: '',
      blockBots: true, // ignoreBots
      blockClient: true, // ignoreSelf
    });
    this.inhibitorHandler = new InhibitorHandler(this, {
      directory: './src/inhibitors',
    });
    this.inhibitorWideHandler = new InhibitorHandler(this, {
      directory: './src/inhibitors_wide',
    });

    this.listenerHandler = new ListenerHandler(this, {
      directory: './src/listeners',
    });

    this.commandHandler.loadAll();
    this.commandWideHandler.loadAll();

    this.commandHandler.useListenerHandler(this.listenerHandler);
    this.commandWideHandler.useListenerHandler(this.listenerHandler);

    this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
    this.commandWideHandler.useInhibitorHandler(this.inhibitorWideHandler);

    this.listenerHandler.loadAll();

    this.inhibitorHandler.loadAll();
    this.inhibitorWideHandler.loadAll();
  }
}

const bot = new Bot();

bot.login(config.token);

module.exports = bot;
