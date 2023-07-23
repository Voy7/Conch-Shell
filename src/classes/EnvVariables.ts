import dotenv from 'dotenv'

// Import .env variables
dotenv.config()

// Class that holds all environment variables, singleton export
// This also serves as a place to define default values for all variables
export default new class EnvVariables {
  public PROJECT_MODE: string = process.env.PROJECT_MODE || 'production'
  public BOT_TOKEN: string = process.env.BOT_TOKEN || ''
  public BOT_APPLICATION_ID: string = process.env.BOT_APPLICATION_ID || ''
  public YOUTUBE_API_KEY: string = process.env.YOUTUBE_API_KEY || ''
  public BOT_PREFIX: string = process.env.BOT_PREFIX || '_'
  public NO_BOT_CHANNELS_CHECK: boolean = process.env.NO_BOT_CHANNELS_CHECK == 'true' || false
  public EMBED_COLOR_1: number = parseInt(process.env.EMBED_COLOR_1 || '0x9f5cc4') // Light purple
  public EMBED_COLOR_2: number = parseInt(process.env.EMBED_COLOR_2 || '0x00bfff') // Light blue
}