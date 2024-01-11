import { CommandConfig, CommandInput } from '#src/types'
import { ChannelType, VoiceChannel } from 'discord.js'

// Move everyone in the server to a specified voice channel
export const config: CommandConfig = {
  command: 'move',
  category: 'Misc',
  description: 'Move everyone in the server to a specified voice channel.',
  args: [{
    type: 'Channel',
    name: 'voicechannel',
    description: 'Channel to move everyone to.',
    isRequired: true
  }]
}

export function run(input: CommandInput) {
  // Executor must have admin permissions
  const member = input.guild.members.cache.get(input.user.id)
  if (!member?.permissions.has('Administrator')) {
    input.reply(':x: `You must have admin permissions to use this command.`')
    return
  }

  if (!input.args[0]) {
    input.reply(':x: `You must specify a voice channel name.`')
    return
  }

  let voiceChannel: VoiceChannel | null = null

  // If done through slash command, the channel ID is the first argument
  const fetchChannel = input.guild.channels.cache.get(input.args[0])
  if (fetchChannel?.type == ChannelType.GuildVoice) voiceChannel = fetchChannel
  
  // Exact ID not provided, search for channel name
  if (!voiceChannel) {
    const channelName = input.args.join(' ')
    const result = input.guild.channels.cache.find(channel => channel.type == ChannelType.GuildVoice && channel.name.toLowerCase().includes(channelName.toLowerCase()))
    if (result?.type == ChannelType.GuildVoice) voiceChannel = result
  }

  // If channel is not voice channel. send tailored error
  if (voiceChannel && voiceChannel.type !== ChannelType.GuildVoice) {
    input.reply(`:x: \`Channel "${voiceChannel.name}" is not a voice channel.\``)
    return
  }

  // If no channel found, reply with error
  if (!voiceChannel) {
    input.reply(`:x: \`Could not find voice channel "${input.args[0]}", check spelling.\``)
    return
  }

  // Move everyone in the server to the specified channel
  const membersInVC = input.guild.members.cache.filter(member => member.voice.channelId !== null)
  membersInVC.forEach(member => member.voice.setChannel(voiceChannel))
  input.reply(`:white_check_mark: \`Moved ${membersInVC.size} members to ${voiceChannel.name}.\``)
}