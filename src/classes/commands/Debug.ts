import { generateDependencyReport } from '@discordjs/voice'
import Command from '#src/classes/Command'
import { CommandConfig, CommandInput } from '#src/types'

// Debug print command
export default class Servers extends Command {
  public config: CommandConfig = {
    command: 'debug',
    category: 'Misc',
    description: 'Print debug info to the console.'
  }

  public run(input: CommandInput) {
    const report = generateDependencyReport()
    console.log(report)
    input.reply(':computer: `Debug report sent, check the console.`')
  }
}