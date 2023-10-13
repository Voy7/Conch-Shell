import { generateDependencyReport } from '@discordjs/voice'
import Command from '#src/classes/Command'
import { CommandConfig, CommandInput } from '#src/types'

import { path as ffprobePath } from '@ffprobe-installer/ffprobe'

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
    console.log('Ffprobe path:', ffprobePath)
    input.reply(':computer: `Debug report sent, check the console.`')
  }
}