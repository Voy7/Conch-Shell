import { ActivityType, Client, GatewayIntentBits, Guild, TextChannel, VoiceChannel } from 'discord.js'
import EnvVariables from '#src/EnvVariables'
import Logger from '#src/Logger'
import { passCheck, failCheck } from '#src/lib/requirements'
import { registerCommands } from '#src/commands'
import { getMusicPlayer, deleteMusicPlayer } from '#src/audio/MusicPlayer'
import packageJSON from '#root/package.json' assert { type: 'json' }

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ],
  presence: {
    status: 'online',
    activities: [{
      name: `out for ${EnvVariables.BOT_PREFIX}help • v${packageJSON.version}`,
      type: ActivityType.Watching
    }]
  }
})

client.on('ready', () => {
  passCheck('BotLogin', 'Bot logged in successfully.')
  registerCommands()
})

// If bot leaves/moves VC, either delete music player or update player's voice channel
client.on('voiceStateUpdate', (oldState, newState) => {
  // If it's not the bot, return
  if (oldState.member?.id !== client.user?.id) return

  // Disconnected from VC, delete music player
  if (oldState.channel && !newState.channel) {
    deleteMusicPlayer(oldState.guild.id)
    Logger.debug(`Deleted music player for guild "${oldState.guild.name}"`)
  }
  // Changed/moved VC, update the music player's voice channel
  else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
    const musicPlayer = getMusicPlayer(oldState.guild.id)
    if (!musicPlayer) return
    musicPlayer.voiceChannel = newState.channel as VoiceChannel
    Logger.debug(`Updated music player voice channel for guild "${oldState.guild.name}"`)
  }
})

// Log bot in on Discord
async function login() {
  try { await client.login(EnvVariables.BOT_TOKEN) }
  catch (error: any) { failCheck('BotLogin', `Invalid bot token.`) }
}
login()