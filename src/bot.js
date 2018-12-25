// const Eris = require('eris');
// const Discord = require('discord.js');
const config = require('./config');
const { AkairoClient, CommandHandler } = require('discord-akairo');

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
      commandDirectory: './commands',
    });
    this.commandHandler.loadAll();
  }
}

const bot = new Bot();

bot.login(config.token);

module.exports = bot;
