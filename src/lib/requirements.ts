// Handles startup requirement checks messages

const CHECKS = [
  'EnvironmentVariables',
  'BotLogin',
  'ApplicationIDValid',
  'RegisteredCommands',
  'FfmpegValid',
  'FfprobeValid',
  'YouTubeAPIKeyValid'
] as const

type CheckName = typeof CHECKS[number]

// true = passed, false = failed, null = not checked yet
const checks: Map<CheckName, null | true | false> = new Map()
for (const check of CHECKS) checks.set(check, null)

export function passCheck(name: CheckName, message: string) {
  console.log('[✓]'.green, message.gray)
  checks.set(name, true)
  const passed = Array.from(checks.values()).filter(check => check === true).length
  if (passed === checks.size) {
    console.log(`\n  All checks passed, bot is up and running!\n`.green)
  }
}

export function failCheck(name: CheckName, message: string) {
  console.log('[x]'.red, message.white)
  checks.set(name, false)
}