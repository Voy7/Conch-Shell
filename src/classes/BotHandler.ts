import { ActivityType, Client, GatewayIntentBits, Guild, TextChannel, VoiceChannel } from 'discord.js'
import EnvVariables from '#src/classes/EnvVariables'
import CommandsHandler from '#src/classes/CommandsHandler'
import MusicPlayer from '#src/classes/MusicPlayer'
import Logger from '#src/classes/Logger'

// Main bot handler class, exports singleton
export default new class BotHandler {
  public client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates
  ]})
  public commandsHandler: CommandsHandler | null = null
  // private musicPlayers: MusicPlayer[] = []
  public musicPlayers: MusicPlayer[] = []

  constructor() {
    this.client.on('ready', () => {
      Logger.info(`Bot now logged in: ${this.client.user?.tag}`)

      // Set bot's activity
      this.client.user?.setActivity({
        name: `out for ${EnvVariables.BOT_PREFIX}help`,
        type: ActivityType.Watching
      })

      // Initialize commands
      this.commandsHandler = new CommandsHandler()
    })

    // If bot leaves a VC, delete that guild's music player
    this.client.on('voiceStateUpdate', (oldState, newState) => {
      // If it's not the bot, return
      if (oldState.member?.id !== this.client.user?.id) return

      // Disconnected from VC, delete music player
      if (oldState.channel && !newState.channel) {
        this.deleteMusicPlayer(oldState.guild.id)
        Logger.debug(`Deleted music player for guild "${oldState.guild.name}"`)
      }
      // Changed/moved VC, update the music player's voice channel
      else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
        const musicPlayer = this.getMusicPlayer(oldState.guild.id)
        if (!musicPlayer) return
        musicPlayer.voiceChannel = newState.channel as VoiceChannel
        Logger.debug(`Updated music player voice channel for guild "${oldState.guild.name}"`)
      }
    })

    // Log bot in on Discord
    this.client.login(EnvVariables.BOT_TOKEN)
  }

  public createMusicPlayer(guild: Guild, textChannel: TextChannel, voiceChannel: VoiceChannel): MusicPlayer {
    const existingPlayer = this.getMusicPlayer(guild.id)
    if (existingPlayer) return existingPlayer
    const newPlayer = new MusicPlayer(guild, textChannel, voiceChannel)
    this.musicPlayers.push(newPlayer)
    return newPlayer
  }

  public getMusicPlayer(guildID: string): MusicPlayer | null {
    return this.musicPlayers.find(player => player.guild.id === guildID) ?? null
  }

  public deleteMusicPlayer(guildID: string) {
    const musicPlayer = this.getMusicPlayer(guildID)
    if (!musicPlayer) return
    // musicPlayer.prepForDelete()
    this.musicPlayers = this.musicPlayers.filter(player => player.guild.id !== guildID)
  }
}