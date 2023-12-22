import { ApplicationCommandOptionType, type Interaction, type Message } from 'discord.js'
import Logger from '#src/classes/Logger'
import Utils from '#src/classes/Utils'
import BotHandler from '#src/classes/BotHandler'
import { CommandConfig, CommandInput, SlashCommandData } from '#src/types'

// Base class for all commands to extend
export default class Command {
  // Should be overriden in child classes, is here just to not throw errors
  public config: CommandConfig = {
    command: '',
    category: 'Unknown',
    description: ''
  }

  // Method to be overriden in child classes, called when command is executed
  public run(input: CommandInput) {
    Logger.error(`Command "${this.constructor.name}" does not have a run method!`)
  }

  // Ultimately will run the command's run method, but will first turn the
  // Message or Interaction into a common CommandInput object. Also, runs
  // checks for 'onlyInBotChannels', 'onlyInSameVC', etc properties
  public execute(input: Message | Interaction): void | Promise<void> {
    const parsedInput: CommandInput = {
      // User who executed the command
      user: (() => {
        if ('author' in input) return input.author // is Message
        return input.user // is Interaction
      })(),

      // Guild command was executed in
      guild: input.guild!,

      // TextChannel command was executed in
      textChannel: input.channel as any, // Already checked is TextChannel

      // Command arguments
      args: (() => {
        if ('content' in input) { // is Message
          if (!this.config.args) return []
          // Every arg EXCEPT the last arg will always be '1 word', or null if not provided
          const content = input.content.split(' ').slice(1)
          const realArgs = this.config.args.filter(arg => arg.type !== 'Attachment')
          return realArgs.map((_, index) => {
            if (index === realArgs.length - 1) {
              return content.slice(index).join(' ') || null
            }
            return content[index] || null
          })
        }
        else { // is Interaction
          if (!input.isCommand()) return [] // Only used to typecast input into a SlashCommandInteraction
          return this.config.args?.map(arg => {
            const option = input.options.get(arg.name)
            if (!option) return null
            return option.value as string
          }) || []
        }
      })(),

      // Attached file, if any
      attachment: (() => {
        if ('attachments' in input) return input.attachments.first() || null // is Message
        else { // is Interaction
          if (!input.isCommand()) return null // Only used to typecast input into a SlashCommandInteraction
          return input.options.getAttachment('attachment') || null
        }
      })(),

      // Method to reply/send a message in the correct channel
      reply: async (payload) => {
        if ('author' in input) { // is Message
          await input.channel.send(payload)
        }
        else { // is Interaction
          if (!input.isCommand()) return // Never happens, only used to typecast input into a SlashCommandInteraction
          if (input.replied) await input.channel?.send(payload)
          else await input.reply(payload as any) // MessageReplyOptions 99% of cases will be a valid InteractionReplyOptions object
        }
      },

      // Method to delete user's message, only does something if interaction was a message
      deleteMessage: async () => {
        if (!('delete' in input)) return
        try {
          await input.delete()
        }
        catch (error: any) { // Could throw error if message was already deleted, so ignore it
          Logger.warn(`Could not delete message: ${error.message}`)
        }
      }
    }

    // If command has 'onlyInSameVC' property, check if executor is in same VC as bot
    if (this.config.onlyInSameVC) {
      const userVoiceChannel = Utils.getUserVoiceChannel(parsedInput.guild, parsedInput.user.id)
      const botVoiceChannel = BotHandler.getMusicPlayer(parsedInput.guild.id)?.voiceChannel
      if (userVoiceChannel && botVoiceChannel && userVoiceChannel.id !== botVoiceChannel.id) {
        return parsedInput.reply(':x: `You must be in the same voice channel as the bot!`')
      }
    }

    // If command has 'onlyInBotChannels' property, check if command was executed in a bot/music channel
    if (this.config.onlyInBotChannels) {
      const name = parsedInput.textChannel.name.toLowerCase()
      if (!name.includes('bot') && !name.includes('music')) {
        return parsedInput.reply(':x: `This command can only be used in bot/music channels!`')
      }
    }

    // Run the command with the ussable parsed input
    this.run(parsedInput)
  }

  // Returns an array of all aliases for the command, including the main command
  public get allAliases(): string[] {
    return [this.config.command, ...this.config.aliases || []]
  }

  // Returns the command's data in the format required by Discord to register a slash command
  public get slashCommandData(): SlashCommandData {
    return {
      name: this.config.command,
      description: this.config.description,
      options: this.config.args?.map(arg => ({
        type: (() => {
          switch (arg.type) {
            case 'String': return ApplicationCommandOptionType.String
            case 'Integer': return ApplicationCommandOptionType.Integer
            case 'Attachment': return ApplicationCommandOptionType.Attachment
            case 'Channel': return ApplicationCommandOptionType.Channel
            default: return ApplicationCommandOptionType.String
          }
        })(),
        name: arg.name,
        description: arg.description,
        required: arg.isRequired
      })) || []
    }
  }
}