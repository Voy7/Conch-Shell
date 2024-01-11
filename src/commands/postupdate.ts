import { ChannelType, MessageReaction, TextChannel, User } from 'discord.js'
import EnvVariables from '#src/EnvVariables'
import { client } from '#src/bot'
import { CommandConfig, CommandInput } from '#src/types'

// Post update announcement command (for developers)
export const config: CommandConfig = {
  command: 'postupdate',
  category: 'Misc',
  description: 'Post an update announcement in every Discord server.'
}

export async function run(input: CommandInput) {
  if (input.user.id !== EnvVariables.POST_UPDATES_USER_ID) {
    input.reply(':x: `You are not authorized to use this command.`')
    return
  }

  // For some reason, bot can't react to interaction messages, so only allow standard messages
  if (input.type === 'Interaction') {
    input.reply(`:x: \`This command can only be used as a standard text command: ${EnvVariables.BOT_PREFIX}${config.command}\``)
    return
  }

  // Grab 2nd to last message from the channel
  // .array{} is not valid
  const message = input.textChannel.messages.cache.at(-2)
  if (!message) return // Should never happen

  // Check last 20 messages in every channel in every server for a message that was sent form the bot
  // This is a decent way to find out which channel is the server's bot channel
  const channels: TextChannel[] = []
  await Promise.all(client.guilds.cache.map(async guild => {
    await Promise.all(guild.channels.cache.map(async channel => {
      if (channel.type !== ChannelType.GuildText) return
      const messages = await channel.messages.fetch({ limit: 20 })
      messages.forEach(message => {
        if (message.author.id !== client.user?.id) return
        if (channels.includes(channel)) return // If already in array, don't add
        channels.push(channel)
      })
    }))
  }))

  const channelNames = channels.map(channel => `• #${channel.name} *(${channel.guild.name})*`).join('\n')
  const confirmMessage = await input.reply(`\`\`\`${message.content}\`\`\`\n**Channels (${channels.length}):**\n${channelNames}\n\n:speech_balloon: \`Confirm by reacting with ✅\``)
  if (!confirmMessage) return // Should never happen
  confirmMessage.react('✅')

  // Wait 60 seconds for confirmation
  const filter = (reaction: MessageReaction, user: User) => reaction.emoji.name === '✅' && user.id === EnvVariables.POST_UPDATES_USER_ID
  const collector = confirmMessage.createReactionCollector({ filter, time: 60000, max: 1 })

  collector.on('collect', async () => {
    // Post update announcement in every server
    await Promise.all(channels.map(async channel => {
      await channel.send(message.content)
    }))
    input.reply(':white_check_mark: `Update announcements sent.`')
  })

  // Delete confirmation message when it expires
  collector.on('end', () => {
    confirmMessage.delete()
  })
}