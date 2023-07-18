// simple-youtube-api does not have a type definition file,
// so here are some rough type definitions for it.

declare module 'simple-youtube-api'

declare function searchVideos(query: string, limit?: number): Promise<Video[]>

declare class Video {
  id: string
  title: string
  description: string
  duration: number
  durationSeconds: number
  uploadedAt: Date
  url: string
  thumbnails: any
  channel: Channel
  channelTitle: string
  raw: any
}

declare class Channel {
  id: string
  title: string
  url: string
  raw: any
}