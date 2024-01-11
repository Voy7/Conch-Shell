import { generateDependencyReport } from '@discordjs/voice'
import { CommandConfig, CommandInput } from '#src/types'

import { path as ffprobePath } from '@ffprobe-installer/ffprobe'

// Send debug dependency report to the console
export const config: CommandConfig = {
  command: 'debug',
  category: 'Misc',
  description: 'Print debug info to the console.'
}

export function run(input: CommandInput) {
  const report = generateDependencyReport()
  console.log(report)
  console.log('Ffprobe path:', ffprobePath)
  input.reply(':computer: `Debug report sent, check the console.`')
}