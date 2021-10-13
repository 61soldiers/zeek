import React, { useEffect, useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'

import Sidebar from './SideBar'
import Tracks from './Tracks'
import Player from './Player';
import { ISpotifyTrack } from '../../../@types/global';

const ipcRenderer = window.electron

const useStyles = makeStyles((_theme) => ({
  sideBar : {
    position: 'fixed',
    left: 20,
    marginTop: 55,
  },
  trackList : {
    position: 'absolute',
    zIndex: 1,
    borderRadius: 7,
    marginTop: 55,
    padding: 20,
    border: '1px solid',
    borderTop: '94px solid',
    borderRight: 'none',
    borderBottom: 'none',
    right: 0,
    left: 300,
    height: '75%',
    overflowY: 'scroll',
    overflowX: 'auto',
    transition: 'all 0.2s ease',
    '@media (max-height: 950px)' : {
      transition: 'all 0.1s ease',
      height: '65%',
    },
    '@media (max-height: 650px)' : {
      transition: 'all 0.1s ease',
      height: '50%',
    }
  }
}));


export default function Home() {
  const classes = useStyles()
  
  const [tracks, setTracks] = useState<ISpotifyTrack[]>([])
  const [playerTracks, setPlayerTracks] = useState<ISpotifyTrack[]>([])
  const [toLoadPlaylist, setToLoadPlaylist] = useState<string|null>(null)
  const [playIndex, setPlayIndex] = useState<number|null>(null)
  const [playerState, setPlayerState] = useState<any>(null)
  const [schBarVal, setSchBarVal] = useState("")

  function saveCurrentPlaylist() {
    if (toLoadPlaylist !== null) {
      ipcRenderer.send("saveLastPlaylist", toLoadPlaylist)
    }
  }

  function getCurrentPlaylist() {
    ipcRenderer.send("getLastPlaylist")
    ipcRenderer.once("getLastPlaylist", function(_e, payload) {
      if (!payload.isErr) {
        if (payload.lastPlaylist) {
          setToLoadPlaylist(payload.lastPlaylist.lastPlaylist)
        }
      }
    })
  }

  useEffect(function() {
    getCurrentPlaylist()
  }, [])

  useEffect(function() {
    saveCurrentPlaylist()
    if (schBarVal.trim() === "") {
      setPlayerTracks(tracks)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toLoadPlaylist])

  return (
    <React.Fragment>

      <div className={classes.sideBar}>
        <Sidebar 
          toLoadPlaylist={toLoadPlaylist} 
          setToLoadPlaylist={setToLoadPlaylist} 
          setTracks={setTracks}
        />
      </div>
      {
          !toLoadPlaylist ? null :
          <div className={classes.trackList}>
            <Tracks 
              tracks= {tracks}
              setTracks={setTracks}
              toLoadPlaylist={toLoadPlaylist} 
              setPlayerTracks={setPlayerTracks} 
              setPlayIndex={setPlayIndex}
              schBarVal={schBarVal}
              setSchBarVal={setSchBarVal}
            />
          </div>
      }
      <div>
        <Player 
          playerTracks={playerTracks} 
          playIndex={playIndex} 
          setPlayIndex={setPlayIndex}
          playerState={playerState}
          setPlayerState={setPlayerState}
        />
      </div>

    </React.Fragment>
  )
}