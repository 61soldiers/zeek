import { Preview, Tracks } from "spotify-url-info";

interface ISpotifyTrack extends Tracks {
  album: ISpotifyTrackAlbum
  fileLocation: string | null
}
interface ISpotifyTrackAlbum {
  album_type: string
  artists: ISpotifyTrackArtist[]
  external_urls: string[]
  href: string
  id: string
  images: ISpotifyTrackImage[]
  name: string
  release_date: string // eg: '2020-10-09'
  release_date_precision: string
  total_tracks: number
  type: string
  uri: string
}
interface ISpotifyTrackArtist {
  external_urls: string[]
  href: string
  id: string
  name: string
  type: string
  uri: string
}
interface ISpotifyTrackImage {
  height: number
  url: string
  width: number
}


interface ISpotifyPlaylistCustom extends Preview {
  trackIds: Array<string>
}



declare global {
  namespace NodeJS {
    interface Global {
       document: Document;
       window: Window;
       navigator: Navigator;
       tracks: ICollectionInstance
    } 
  }
}

interface ShapedTrack {
  name: string
  musicSrc: string
  cover: string
  singer: string
}