import { ISpotifyTrack } from '../../@types/global'

interface ISideBar {
  toLoadPlaylist: string | null
  setToLoadPlaylist: React.Dispatch<React.SetStateAction<string|null>>
  setTracks: React.Dispatch<React.SetStateAction<ISpotifyTrack[]>>
}

interface ITracks {
  tracks: ISpotifyTrack[]
  setTracks: React.Dispatch<React.SetStateAction<ISpotifyTrack[]>>
  toLoadPlaylist: string
  setPlayerTracks: React.Dispatch<React.SetStateAction<ISpotifyTrack[]>>
  setPlayIndex: React.Dispatch<React.SetStateAction<number|null>>
  schBarVal: string
  setSchBarVal: React.Dispatch<React.SetStateAction<string>>
}

interface IPlayer {
  playerTracks: ISpotifyTrack[] 
  playIndex: number | null
  setPlayIndex: React.Dispatch<React.SetStateAction<number|null>>
  playerState: IPlayerState
  setPlayerState: React.Dispatch<React.SetStateAction<IPlayerState>>
}

interface IPlayerState {
  _id?: string
  docName: string
  playIndex: number
  currentTime?: number
  volume?: number
  currentQueue: any[]
}