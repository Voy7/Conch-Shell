import dotenv from 'dotenv'
import { passCheck, failCheck } from '#src/lib/requirements'

// Import .env variables
export const importedEnv = dotenv.config()

// Required environment variables
const REQUIRED_VARIABLES = [
  'BOT_TOKEN', 'BOT_APPLICATION_ID', 'YOUTUBE_API_KEY'
]

export function checkEnvVariables() {
  const missing: string[] = []
  for (const variable of REQUIRED_VARIABLES) {
    const envVariable = importedEnv.parsed![variable] as string | undefined
    if (!envVariable) missing.push(variable)
  }
  if (missing.length <= 0) {
    return passCheck('EnvironmentVariables', 'All required environment variables are present.')
  }
  failCheck('EnvironmentVariables', `Missing required environment variables: \n- ${missing.join('\n- ')}`)
}
checkEnvVariables()

// Class that holds all environment variables, singleton export
// This also serves as a place to define default values for all variables
export default new class EnvVariables {
  public readonly PROJECT_MODE: string = process.env.PROJECT_MODE || 'production'
  public readonly BOT_TOKEN: string = process.env.BOT_TOKEN || ''
  public readonly BOT_APPLICATION_ID: string = process.env.BOT_APPLICATION_ID || ''
  public readonly YOUTUBE_API_KEY: string = process.env.YOUTUBE_API_KEY || ''
  public readonly BOT_PREFIX: string = process.env.BOT_PREFIX || '_'
  public readonly FFMPEG_PATH: string | null = process.env.FFMPEG_PATH || null // null = use built-in module
  public readonly FFPROBE_PATH: string | null = process.env.FFPROBE_PATH || null // null = use built-in module
  public readonly NO_BOT_CHANNELS_CHECK: boolean = process.env.NO_BOT_CHANNELS_CHECK == 'true' || false
  public readonly LEAVE_TIMEOUT_IN_SECONDS: number = parseInt(process.env.LEAVE_TIMEOUT_IN_SECONDS || '1800')
  public readonly LOG_SONGS_IN_CONSOLE: boolean = process.env.LOG_SONGS_IN_CONSOLE == 'false' ? false : true
  public readonly DISALLOW_SILENT_MODE: boolean = process.env.DISALLOW_SILENT_MODE == 'true' || false
  public readonly EMBED_COLOR_1: number = parseInt(process.env.EMBED_COLOR_1 || '0x9f5cc4') // Light purple
  public readonly EMBED_COLOR_2: number = parseInt(process.env.EMBED_COLOR_2 || '0x00bfff') // Light blue
  public readonly POST_UPDATES_USER_ID: string = process.env.POST_UPDATES_USER_ID || ''
}