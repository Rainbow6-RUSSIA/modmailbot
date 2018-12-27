const {
  Command
} = require('discord-akairo');
const threads = require('../data/threads');
const utils = require('../utils');

class Guild extends Command {
  constructor() {
    super('guildMain', {
      channel: 'guild',
      prefix: '',
      condition: (msg) => utils.messageIsOnMainServer(msg)
    });
  }

  async exec(msg) {
    if (! msg.mentions.some(user => user.id === bot.user.id)) return;
    if (msg.author.bot) return;

    if (utils.messageIsOnInboxServer(msg)) {
      // For same server setups, check if the person who pinged modmail is staff. If so, ignore the ping.
      if (utils.isStaff(msg.member)) return;
    } else {
      // For separate server setups, check if the member is staff on the modmail server
      const inboxMember = utils.getInboxGuild().members.get(msg.author.id);
      if (inboxMember && utils.isStaff(inboxMember)) return;
    }

    let content;
    const mainGuilds = utils.getMainGuilds();
    const staffMention = (config.pingOnBotMention ? utils.getInboxMention() : '');

    if (mainGuilds.length === 1) {
      content = `${staffMention}Бот упомянут в ${msg.channel.mention} **${msg.author.username}#${msg.author.discriminator}**: "${msg.cleanContent}"`;
    } else {
      content = `${staffMention}Бот упомянут в ${msg.channel.mention} (${msg.channel.guild.name}) **${msg.author.username}#${msg.author.discriminator}**: "${msg.cleanContent}"`;
    }

    utils.getLogChannel().send(content, {
      disableEveryone: true
    });

    // Send an auto-response to the mention, if enabled
    if (config.botMentionResponse) {
      msg.channel.send(config.botMentionResponse)
    }

  }
}

module.exports = Guild;
