/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react'
import ReactJkMusicPlayer, {
  ReactJkMusicPlayerIcon, 
  ReactJkMusicPlayerInstance
} from 'react-jinke-music-player'
import { shapeTrackArray, sleep } from '../../utils'
import { 
  PlayCircleFilledRounded, 
  PauseCircleFilledRounded, 
  SkipNextRounded, 
  SkipPreviousRounded, 
  CachedRounded, 
  PlaylistPlayRounded, 
  VolumeOffRounded, 
  VolumeUpRounded 
} from '@material-ui/icons'
import 'react-jinke-music-player/assets/index.css'
import { IPlayer } from '../components'

const ipcRenderer = window.electron

export default function Player(props: IPlayer) {
  const { playerTracks, playIndex, setPlayIndex, playerState, setPlayerState } = props

  const [audioInst, setAudioInst] = useState<ReactJkMusicPlayerInstance|null>(null)
  const [firstLoadFlag, setFirstLoadFlag] = useState(1)

  async function preventAutoPlayAndOnListChange(_plid, audList) {
    setFirstLoadFlag(firstLoadFlag+1)
    setPlayerState({...playerState, currentQueue: audList})
    await sleep(300)
    audioInst.pause()
    audioInst.volume = playerState.volume ? playerState.volume : 0.1
    audioInst.currentTime = playerState.currentTime ? playerState.currentTime : 0
    await sleep(200)
    audioInst.pause()
    if (firstLoadFlag>=2) {
      setPlayIndex(0)
      audioInst.currentTime = 0.0
      await sleep(200)
      audioInst.pause()
    }
  }

  function savePlayerState() {
    ipcRenderer.send("savePlayerState", playerState)
  }

  function saveVolumeState(v: number) {
    ipcRenderer.send("saveVolume", v)
    setPlayerState({...playerState, volume: v})
  }

  function getPlayerState() {
    ipcRenderer.send("getPlayerState")
    ipcRenderer.once("getPlayerState", function(_e, payload) {
      if (payload) {
        setPlayerState(payload)
        setPlayIndex(payload.playIndex)
      }
    })
  }

  // TODO: implement discord rich presence
  // function updatePresence() {
  //   const currentSong = playerTracks[playIndex]
  //   if(!(currentSong && audioInst)) return
  //   ipcRenderer.send("presenceUpdate", {
  //     state: "Listening to Zeek",
  //     details: `${currentSong.name} - ${currentSong.artists[0].name}`,
  //     startTimestamp: Date.now(),
  //     endTimestamp: Date.now() + ((audioInst.duration - audioInst.currentTime)/1000),
  //     largeImageKey: "zeek_icon",
  //     instance: false,
  //   })
  // }
  function stopPresence() {
    ipcRenderer.send("stopPresence")
  }

  useEffect(function() {
    setPlayerState({...playerState,  docName: "playerState", 
        currentQueue: shapeTrackArray(playerTracks)})
  }, [playerTracks])

  useEffect(function() {
    if (playerState) {
      savePlayerState()
    }
  }, [playerState])

  useEffect(function() {
    if (audioInst) {
      getPlayerState()
    }
  }, [audioInst])

  // useEffect(function() {
  //   setInterval(() => {
  //     updatePresence()
  //   }, 15e3)
  // }, [])

  
  // // media session
  // useEffect(function() {
  //   if (audioInst) {
  //     setupMediaSession()
  //   }
  // }, [playIndex, playerTracks])

  const icons: ReactJkMusicPlayerIcon = {
    play: <PlayCircleFilledRounded/>,
    pause: <PauseCircleFilledRounded/>,
    next: <SkipNextRounded/>,
    prev: <SkipPreviousRounded/>,
    volume: <VolumeUpRounded/>,
    mute: <VolumeOffRounded/>,
    reload: <CachedRounded/>,
    playLists: <PlaylistPlayRounded/>
  }

  return (
    <div>
      <ReactJkMusicPlayer 
        audioLists={playerState ? playerState.currentQueue : []}
        getAudioInstance={(inst) => {setAudioInst(inst)}}
        playIndex={playIndex}
        icon={icons}
        mode={"full"}
        defaultVolume={0.1}

        onAudioVolumeChange={saveVolumeState}
        onAudioListsChange={preventAutoPlayAndOnListChange}
        onAudioProgress={(info)=>{setPlayerState({...playerState, currentTime: info.currentTime})}}
        onPlayIndexChange={(i) =>{setPlayIndex(i);setPlayerState({...playerState, playIndex: i})}}
        onAudioPause={stopPresence}
        onAudioAbort={stopPresence}

        autoPlay={false}
        showLyric={false}
        showThemeSwitch={false}
        showDownload={false}
        showDestroy={false}
        drag={false}
        toggleMode={false}
        loadAudioErrorPlayNext={false}
        autoPlayInitLoadPlayList={false}
        clearPriorAudioLists={true}
        quietUpdate={true}
        glassBg={true}
        showMiniModeCover={true}
      />
    </div>
  )
}