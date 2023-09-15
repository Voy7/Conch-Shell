import dotenv from 'dotenv'

// Import .env variables
dotenv.config()

// Class that holds all environment variables, singleton export
// This also serves as a place to define default values for all variables
export default new class EnvVariables {
  public readonly PROJECT_MODE: string = process.env.PROJECT_MODE || 'production'
  public readonly BOT_TOKEN: string = process.env.BOT_TOKEN || ''
  public readonly BOT_APPLICATION_ID: string = process.env.BOT_APPLICATION_ID || ''
  public readonly YOUTUBE_API_KEY: string = process.env.YOUTUBE_API_KEY || ''
  public readonly BOT_PREFIX: string = process.env.BOT_PREFIX || '_'
  public readonly NO_BOT_CHANNELS_CHECK: boolean = process.env.NO_BOT_CHANNELS_CHECK == 'true' || false
  public readonly LEAVE_TIMEOUT_IN_SECONDS: number = parseInt(process.env.LEAVE_TIMEOUT_IN_SECONDS || '1800')
  public readonly LOG_SONGS_IN_CONSOLE: boolean = process.env.LOG_SONGS_IN_CONSOLE == 'false' ? false : true
  public readonly EMBED_COLOR_1: number = parseInt(process.env.EMBED_COLOR_1 || '0x9f5cc4') // Light purple
  public readonly EMBED_COLOR_2: number = parseInt(process.env.EMBED_COLOR_2 || '0x00bfff') // Light blue
}