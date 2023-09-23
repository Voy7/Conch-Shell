import { Guild, TextChannel, VoiceChannel } from 'discord.js'
import * as voice from '@discordjs/voice'
import Logger from '#src/classes/Logger'
import EnvVariables from '#src/classes/EnvVariables'
import Playable from '#src/classes/Playable'
import Utils from '#src/classes/Utils'

// Music player handler class, 1 per guild
export default class MusicPlayer {
  public guild: Guild
  public textChannel: TextChannel
  public voiceChannel: VoiceChannel
  public queue: Playable[] = []
  public currentPlayable: Playable | null = null
  public isLoopMode: boolean = false
  
  // private player: voice.AudioPlayer
  public player: voice.AudioPlayer
  private connection: voice.VoiceConnection
  private isSkipping: boolean = false
  private leaveTimeout: NodeJS.Timeout | null = null

  constructor(guild: Guild, textChannel: TextChannel, voiceChannel: VoiceChannel) {
    this.guild = guild
    this.textChannel = textChannel
    this.voiceChannel = voiceChannel

    // Create audio player & connection
    this.player = new voice.AudioPlayer()
    this.connection = voice.joinVoiceChannel({
      guildId: this.guild.id,
      channelId: this.voiceChannel!.id,
      adapterCreator: this.guild.voiceAdapterCreator
    })
    this.connection.subscribe(this.player)

    // Listen for audio player events & errors
    this.player.on(voice.AudioPlayerStatus.Idle, () => {
      this.playNextInQueue()
    })

    this.player.on('error', error => {
      this.textChannel.send(`:x: \`An error occurred while playing audio: ${error.message}\``)
      Logger.error(error)
    })
  }

  // Add a Playable to the queue, and play it if there's nothing playing
  public addPlayable(playable: Playable) {
    if (EnvVariables.LOG_SONGS_IN_CONSOLE) {
      Logger.info(`${playable.input.user.username} in ${playable.input.guild.name} added to queue: ${playable.title} (${playable.url})`)
    }

    this.queue.push(playable)
    if (!this.currentPlayable) return this.playNextInQueue()

    // If there's already a song playing, send 'in queue' message
    if (playable.addSilent) return
    playable.input.reply({ embeds: [{
      color: EnvVariables.EMBED_COLOR_1,
      description: `:track_next: ${Utils.getParsedPosition(this.queue.length)} in queue: [${playable.title}](${playable.url})`
    }]})
    if (this.isLoopMode) playable.input.reply(':warning: `Warn: This item will not play until Loop Mode is disabled, or the current item is skipped.`')
  }

  // Method to disconnect from VC, returns true if it was connected & successful
  public disconnect(): boolean {
    try {
      this.connection.destroy()
      return true
    }
    catch (error) { return false }
  }

  // Method to pause the current song
  public pause() {
    if (this.player.state.status !== voice.AudioPlayerStatus.Playing) return
    this.player.pause()
  }

  // Method to resume the current song
  public unpause() {
    if (this.player.state.status !== voice.AudioPlayerStatus.Paused) return
    this.player.unpause()
  }

  // Method to skip to the next song in the queue
  public skip() {
    this.isSkipping = true
    this.unpause()
    this.player.stop()
  }

  // Method to seek in current song
  public seek(timeSeconds: number) {
    if (!this.currentPlayable) return
    this.currentPlayable.resource.playStream.destroy()
    this.currentPlayable.resource = this.currentPlayable.createAudioResource(timeSeconds)
    this.player.play(this.currentPlayable.resource)
  }

  // Method to actually play the next song in the queue
  // Should only be called when there's nothing playing
  private playNextInQueue() {
    const playable = this.isLoopMode && !this.isSkipping
      ? this.currentPlayable
      : this.queue.shift()

    this.currentPlayable = playable || null
    this.isSkipping = false
    
    if (this.leaveTimeout) clearTimeout(this.leaveTimeout)

    if (!playable) {
      this.isLoopMode = false
      
      this.textChannel.send(':white_check_mark: `Everything in the queue has been played.`')

      // If nothing is played for X minutes, leave the VC
      this.leaveTimeout = setTimeout(() => {
        this.disconnect()
      }, EnvVariables.LEAVE_TIMEOUT_IN_SECONDS * 1000)

      return
    }

    // In rare cases, the resource may have "ended", so check for it
    if (playable.resource.ended) {
      Logger.warn('Cannot play audio resource, it has already ended, skipping to next song...')
      playable.input.reply(':x: `An error occurred in the audio resource, please try to play it again.`')
      this.queue.shift()
      this.isLoopMode = false
      this.playNextInQueue()
      return
    }

    // Actually start to play the song
    this.player.play(playable.resource)

    // Send 'now playing' message only if Loop Mode is false
    if (this.isLoopMode) return
    playable.input.reply({ embeds: [{
      color: EnvVariables.EMBED_COLOR_2,
      description: `:musical_note: Now playing in ${this.voiceChannel!.name}: [${playable.title}](${playable.url})`
    }]})
  }
}