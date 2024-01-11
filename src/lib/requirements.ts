import { importedEnv } from "#src/EnvVariables"

const CHECKS = [
  'EnvironmentVariables',
  'BotLogin',
  'ApplicationIDValid',
  'RegisteredCommands',
  'FfmpegValid'
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
    console.log(`\nAll checks passed, bot is ready to go.\n`.green)
  }
}

export function failCheck(name: CheckName, message: string) {
  console.log('[x]'.red, message.white)
  checks.set(name, false)
}

// Required environment variables
const REQUIRED_VARIABLES = [
  'BOT_TOKEN', 'BOT_APPLICATION_ID', 'YOUTUBE_API_KEY'
]

// export function runChecks() {
//   failCount = 0
//   checkEnvVariables()

//   if (failCount > 0) return
//   console.log(`\nAll checks passed, bot is ready to go.\n`.green)