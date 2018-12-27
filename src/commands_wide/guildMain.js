const { Command } = require('discord-akairo');
const config = require('../config');
const utils = require('../utils');

class Guild extends Command {
  constructor() {
    super('guildMain', {
      channel: 'guild',
      condition: (msg) => utils.messageIsOnMainServer(msg)
    });
  }

  async exec(msg) {
    if (! msg.mentions.has(this.client.user, {ignoreEveryone: true})) return;

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
      content = `${staffMention}, бот упомянут в <#${msg.channel.id}> **${msg.author.tag}**: "${msg.cleanContent}"`;
    } else {
      content = `${staffMention}, бот упомянут в <#${msg.channel.id}> (${msg.channel.guild.name}) **${msg.author.tag}**: "${msg.cleanContent}"`;
    }

    utils.getLogChannel().send(content);

    // Send an auto-response to the mention, if enabled
    if (config.botMentionResponse) {
      msg.channel.send(config.botMentionResponse)
    }

  }
}

module.exports = Guild;
