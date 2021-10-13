/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import { sanitize } from 'string-sanitizer'
import { makeStyles } from '@material-ui/core/styles'
import { Button, Dialog, DialogActions, DialogContent, 
    DialogTitle, Divider, InputBase, TextField, Typography } from '@material-ui/core'
import { DeleteForever, SyncRounded, Error } from '@material-ui/icons'
import { useSnackbar } from 'notistack'
import { v4 as uuidv4 } from 'uuid'
import Fuse from 'fuse.js'
import ReactTooltip from 'react-tooltip'
import { artistsString, isInList, parseDuration, reOrderArrayElement, sleep } from '../../utils'

import { ITracks } from '../components'

import ImgNotFound from '../../resources/images/ImgNotFound'

const ipcRenderer = window.electron

// Css
const useStyles = makeStyles((theme) => ({
  playlistTitleContainer : {
    position: 'fixed',
    marginLeft: 9,
    marginTop: -95,
    color: theme.palette.primary.main,
    borderRadius: 7,
    zIndex: 10,
    transition: 'all 0.2s ease',
  },
  playlistTitle: {
    transition: 'all 0.1s ease',
    fontSize: 35,
    '@media (max-width: 1100px)' : {
      marginTop: 8,
      fontSize: 25,
    }
  },
  trackGrid : {
    display: 'flex',
    marginTop: -15,
    flexDirection: 'column',
    '@media (max-width: 1500px)' : {
      gridTemplateColumns: 'auto auto auto auto',
    },
    '@media (max-width: 1000px)' : {
      gridTemplateColumns: 'auto auto',
    }
  },
  trackCard : {
    backdropFilter: 'black',
    padding: 10,
    borderRadius: 4,
    color: theme.palette.primary.main,
    transition: 'all 0.2s ease',
    overflow: 'hidden',
    '&:hover' : {
      transition: 'all 0.1s ease',
      backgroundColor: '#9c9c9c',
      color: 'black',
      cursor: 'pointer'
    }
  },
  syncPlaylistButton : {
    position: 'fixed',
    right: 338,
    marginTop: -80,
    transform: 'scale(1.3, 1.3)',
    color: theme.palette.primary.main,
    transition: 'all 0.2s ease',
    '&:hover': {
      transition: 'all 0.1s ease',
      cursor: 'pointer',
      transform: 'scale(1.6, 1.6)',
    }
  },
  addTrackButton : {
    position: 'fixed',
    background: 'black',
    color: theme.palette.primary.main,
    fontWeight: 'bold',
    right: 30,
    marginTop: -90,
    padding: 10,
    transition: 'all 0.2s ease',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    borderRadius: 4,
    '&:hover': {
      background: '#9c9c9c',
      color: 'black',
      cursor: 'pointer',
      transition: 'all 0.1s ease'
    },
  },
  trackSearchBarOuter : {
    position: 'fixed',
    right: 130,
    marginTop: -90,
  },
  trackSearchBar : {
    borderRadius: 5,
    background: '#171717',
    color: theme.palette.secondary.main,
    padding: 6,
    paddingLeft: 10,
    fontWeight: 'bold',
  },
  thumbnail : {
    position: 'absolute',
    height: 40,
    width: 40,
    borderRadius: 3,
  },
  title : {
    marginLeft: 50,
    fontWeight: 'bold',
    fontSize: 14
  },
  creator : {
    marginLeft: 50,
    fontSize: 12,
    fontStyle: 'italic'
  },
  duration : {
    position: "absolute",
    right: 50,
    marginTop: -29,
    fontWeight: 'bold',
    fontSize: 13,
  },
  deleteTrack : {
    position: "absolute",
    right: 100,
    marginTop: -47,
    padding: 15,
    transition: 'all 0.2s ease',
    '&:hover' : {
      transition: 'all 0.1s ease',
      transform: 'scale(1.4, 1.4)',
    }
  },
  trackDivider : {
    backgroundColor: '#454545', 
    marginTop: 1, 
    marginBottom: 1
  },
  trackErrorIcon : {
    transition: 'all 0.2s ease',
    '&:hover' : {
      transition: 'all 0.1s ease',
      transform: 'scale(1.2, 1.2)',
      color: theme.palette.error.main,
      '& $errMsg' : {
        transition: 'all 0.1s ease',
        visibility: 'visible',
      }
    },
  },
  errContainer : {
    display: 'flex',
    marginBottom: 10,
  },
  actionButtonsContainer : {
    marginLeft: 25,
    display: 'flex',
  },
  actionButtons : {
    backgroundColor: '#878787',
    marginRight: 10,
    color: theme.palette.primary.main,
    textAlign: 'center',
    padding: 5, paddingRight: 10, paddingLeft: 10,
    fontSize: 13,
    fontWeight: "bold",
    borderRadius: 4,
    transition: 'all 0.2s ease',
    '&:hover': {
      background: '#6e6e6e',
      color: 'black',
      transition: 'all 0.1s ease'
    },
  },
  actionButtonsProgress : {
    backgroundColor: '#878787',
    marginRight: 10,
    color: theme.palette.primary.main,
    textAlign: 'center',
    padding: 5, paddingRight: 10, paddingLeft: 10,
    fontSize: 13,
    fontWeight: "bold",
    borderRadius: 4,
    transition: 'all 0.2s ease',
  }
}))

export default function Tracks(props: ITracks) {
  const { enqueueSnackbar } = useSnackbar()
  const classes = useStyles()
  const { tracks, setTracks, toLoadPlaylist, 
    setPlayerTracks, setPlayIndex, schBarVal, setSchBarVal } = props

  // states
  const [noEffectTracks, setNoEffectTracks] = useState([])
  const [dragId, setDragId] = useState(null)
  const [syncTimeout, setSyncTimeout] = useState({isCooldown: false, time: null})
  const [fileWatcherList, setFileWatcherList] = useState<string[]>([])

  const [openAddTrack, setOpenAddTrack] = useState(false)

  async function getTracksOfCurrentPlaylist() {
    ipcRenderer.send("getSpotiTracksInPlaylist", toLoadPlaylist)
    ipcRenderer.once("getSpotiTracksInPlaylist", async function(_e, payload) {
      if(!payload.isErr) {
        setTracks(payload.payload)
        setNoEffectTracks(payload.payload)
      }
    })
  }

  // search books
  function searchTracksInList(v: string) {
    if (v.trim() === "") {
      return noEffectTracks
    }
    const fuse = new Fuse(noEffectTracks, {threshold: 0.5, keys: ['name', 'artists.name']})
    const cleaned = []
    fuse.search(v).forEach(function(x) {
      cleaned.push(x.item)
    })
    return cleaned
  }

  // drag and reorder playlist
  async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    const reOrdered = reOrderArrayElement(tracks, dragId, parseInt(e.currentTarget.id))

    let reOrderedIds = []
    reOrdered.forEach(track => {
      reOrderedIds.push(track.id)
    })
    ipcRenderer.send("updatePlaylistOrder", {title: toLoadPlaylist, trackIds: reOrderedIds})
    ipcRenderer.once("updatePlaylistOrder", async function(_e, payload) {
      if(!payload.isErr) {
        await getTracksOfCurrentPlaylist()
      } else {
        enqueueSnackbar(`Error! -> ${payload.message}`, {
          variant: 'error'
        })
      }
    })
  }

  function syncPlaylist() {
    if (syncTimeout.isCooldown) return
    ipcRenderer.send("syncPlaylist", toLoadPlaylist)
    ipcRenderer.once("syncPlaylist", async function(_e, payload) {
      if (!payload.isErr) {
        getTracksOfCurrentPlaylist()
        setSyncTimeout({isCooldown: true, time: Date.now()})
        await sleep(30 * 1000)
        setSyncTimeout({isCooldown: false, time: null})
      } else {
        enqueueSnackbar(`Error! -> ${payload.message}`, {
          variant: 'error'
        })
      }
    })
  }

  function fileWatcher() {
    ipcRenderer.send("watcherGetLibrary")
    ipcRenderer.once("watcherGetLibrary", function(_e, payload) {
      setFileWatcherList(payload)
    })
    ipcRenderer.on("watcher", function(_e, payload) {
      setFileWatcherList(payload)
    })
  }

  useEffect(function() {
    fileWatcher()
  }, [])

  useEffect(function() {
    if (schBarVal.trim() === "") {
      setPlayerTracks(tracks)
    }
  }, [tracks])

  useEffect(function() {
    setTracks(searchTracksInList(schBarVal))
  }, [schBarVal])

  useEffect(function() {
    getTracksOfCurrentPlaylist()
  }, [toLoadPlaylist])
  
  // Render
  return (
    <React.Fragment>

      <div className={classes.playlistTitleContainer}>
        <Typography className={classes.playlistTitle}> 
          {toLoadPlaylist} 
        </Typography>
      </div>
      <div className={classes.trackSearchBarOuter}>
        <InputBase
          placeholder={`Search ${toLoadPlaylist}`}
          className={classes.trackSearchBar}
          value={schBarVal}
          onChange={(e)=>{setSchBarVal(e.target.value);searchTracksInList(e.target.value)}}
        />
      </div>
      <Typography onClick={()=>{setOpenAddTrack(true)}} id="alltracks" 
        color="primary" className={classes.addTrackButton}
      >
        {"Add Track"}
      </Typography>
      <div onClick={syncPlaylist} className={classes.syncPlaylistButton}
          data-tip={syncTimeout.isCooldown ? "In cooldown" : "Sync with spotify playlist"}
      >
        <SyncRounded/>
      </div>

      <ul style={{listStyle: 'none', paddingLeft: 0}} id="mainTrackList">
        <div className={classes.trackGrid}>
          {
            tracks.map(function(data, i){
              return  <li key={i} id={data.id}>
                        <div
                          draggable={true}
                          id={i.toString()}
                          onDragStart={() => {setDragId(i)}}
                          onDragOver={(e) => {e.preventDefault()}}
                          onDrop={handleDrop}
                        >
                          <Track 
                            data={data} 
                            tracks={tracks} 
                            setPlayIndex={setPlayIndex}
                            toLoadPlaylist={toLoadPlaylist}
                            fileWatcherList={fileWatcherList}
                            getTracksOfCurrentPlaylist={getTracksOfCurrentPlaylist}
                          />
                        </div>
                      </li>
            })
          }
        </div>
      </ul>

      <AddTrack 
        open={openAddTrack} 
        setOpen={setOpenAddTrack}
        playlist={toLoadPlaylist}
        getTracksOfCurrentPlaylist={getTracksOfCurrentPlaylist} 
      />
      <ReactTooltip/>

    </React.Fragment>
  )
}

function AddTrack({ open, setOpen, playlist, getTracksOfCurrentPlaylist }) {
  const { enqueueSnackbar } = useSnackbar()
  const [value, setValue] = useState("")
  // Create collection
  async function addTrack() {
    if (value.trim()==="") return
    ipcRenderer.send("addTrackToPlaylist", {url: value, playlist: playlist})
    // reply
    ipcRenderer.once("addTrackToPlaylist", async function(_e, payload) {
      if (!payload.isErr) {
        getTracksOfCurrentPlaylist()
        handleClose()
        setValue("")
      }
      else {
        enqueueSnackbar(`Error! -> ${payload.message}`, {
          variant: 'error'
        })
      }
    })
    
  }
  function handleClose () {
    setOpen(false);
  };
  return (
    <React.Fragment>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add spotify track</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Spotify track url"
            variant="filled"
            fullWidth
            value={value}
            onChange={(e)=>{setValue(e.target.value)}}
          />
        </DialogContent>
        <DialogActions style={{padding: 20}}>
          <Button 
            onClick={()=>{addTrack()}} 
            color="primary" 
            variant="contained" 
            style={{fontWeight: 'bold'}}
          >
            Add
          </Button>
          <Button 
            onClick={()=>{handleClose();setValue("")}} 
            color="primary" 
            variant="contained" 
            style={{fontWeight: 'bold'}}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      
    </React.Fragment>
  );
}



function Track({data, tracks, setPlayIndex, toLoadPlaylist, 
    fileWatcherList, getTracksOfCurrentPlaylist}) {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar()
  const classes = useStyles()
  const { id, name, artists, duration_ms, album, external_urls } = data
  // states
  const [isFileExist, setIsFileExist] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [dlProgress, setDlProgress] = useState(0)
  const [isDlPaused, setIsDlPaused] = useState(false)
  const [pid, setPid] = useState(null)

  const [openDelTrack, setOpenDelTrack] = useState(false)

  async function onClickTrack() {
    if (!isFileExist) {
      let key = uuidv4()
      let action = (key) => <Button onClick={()=>{closeSnackbar(key)}}>OK</Button>
      enqueueSnackbar("Error reading file | cannot find track", {
        variant: 'error', 
        key: key,
        action: action(key)
      })
      return
    }
    setPlayIndex(tracks.indexOf(data))
  }

  function downloadTrack() {
    setDlProgress(0)
    setIsDownloading(true)
    ipcRenderer.send("dlTrack", external_urls.spotify)
    ipcRenderer.on(`dlTrackProgress`, function(_e, payload) {
      if (payload.progress && payload.id === id) {
        setDlProgress(Math.round(parseInt(payload.progress)))
      }
    })
    ipcRenderer.once("dlTrackPid", function(_e, payload) {
      setPid(payload.pid)
    })
    ipcRenderer.once("dlTrack", function(_e, payload) {
      if (payload.id === id) {
        if (!payload.isErr) {
          setIsDownloading(false)
          setDlProgress(0)
          setPid(null)
          getTracksOfCurrentPlaylist()
        } else {
          enqueueSnackbar(`Error! -> ${payload.message}`, {
            variant: 'error'
          })
          setIsDownloading(false)
          setDlProgress(0)
          setPid(null)
        }
      }
    })
  }
  
  function handlePause() {
    if (!isDlPaused && pid) {
      ipcRenderer.send("dlTrackPause", {pid: pid})
      ipcRenderer.once("dlTrackPause", function() {
        setIsDlPaused(true)
        setPid(null)
      })
    } else {
      setIsDlPaused(false)
      downloadTrack()
    }
  }

  function checkIfTrackExist() {
    setIsFileExist(
      isInList(`${sanitize(name)}-[id].${id}.opus`, fileWatcherList)
    )
  }

  useEffect(function() {
    checkIfTrackExist()
  }, [fileWatcherList])

  useEffect(function() {
    checkIfTrackExist()
  }, [tracks])

  // Render
  return (
    <div onClick={onClickTrack}>
      <div className={classes.trackCard}>
        
        {
          isFileExist ? 
          null : 
          <div className={classes.errContainer}>
            <Error className={classes.trackErrorIcon} />
            <div className={classes.actionButtonsContainer}>
              {/* TODO: resolve path function
              <Typography onClick={(e)=>{e.stopPropagation()}} className={classes.actionButtons}>
                Resolve path
              </Typography> */}
              {
                isDownloading ? 
                <Typography className={classes.actionButtonsProgress}>
                  {`${dlProgress}%`}
                </Typography> : null
              }
              {
                isDownloading ? null :
                <Typography 
                  onClick={(e)=>{downloadTrack();e.stopPropagation()}} 
                  className={classes.actionButtons}
                >
                  {"Download"}
                </Typography> 
              }
              {
                isDownloading ? 
                <Typography 
                  onClick={(e)=>{handlePause();e.stopPropagation()}} 
                  className={classes.actionButtons}
                >
                  {isDlPaused ? "Resume" : "Pause"}
                </Typography> : null
              }
              
            </div>
          </div>
        }

        {
          window.navigator.onLine ?
          <img className={classes.thumbnail} src={album.images[2].url} alt="" /> :
          <ImgNotFound />
        }
        
        <Typography className={classes.title}>
          {name}
        </Typography>
        <Typography className={classes.creator}>
          {artistsString(artists)}
        </Typography>
        <Typography className={classes.duration}>
          {parseDuration(duration_ms)}
        </Typography>
        <div className={classes.deleteTrack} 
            onClick={(e)=>{e.stopPropagation();setOpenDelTrack(true)}}>
          <DeleteForever/>
        </div>

      </div>
      <Divider className={classes.trackDivider} />
      <DelTrack 
        open={openDelTrack}
        setOpen={setOpenDelTrack}
        toBeDeleted={id}
        playlist={toLoadPlaylist}
        getTracksOfCurrentPlaylist={getTracksOfCurrentPlaylist}
      />
    </div>
  )
}

function DelTrack({open, setOpen, toBeDeleted, playlist, getTracksOfCurrentPlaylist}) {
  const { enqueueSnackbar } = useSnackbar()
  
  function handleClose () {
    setOpen(false);
  };
  
  async function delTrack(e) {
    e.stopPropagation()
    ipcRenderer.send("removeTrackFromPlaylist", {playlist: playlist, trackId: toBeDeleted})
    ipcRenderer.once('removeTrackFromPlaylist', async function(_event, payload) {
      if (!payload.isErr) {
        getTracksOfCurrentPlaylist()
        handleClose();
      } else {
        enqueueSnackbar(`Error! -> ${payload.message}`, {
          variant: 'error'
        })
      }
    })
  }

  return (
    <React.Fragment>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Are you sure you want to delete this track ?</DialogTitle>
        <DialogActions style={{padding: 20}}>
          <Button onClick={delTrack} color="primary" 
            variant="contained" style={{fontWeight: 'bold'}}>
            Yes
          </Button>
          <Button onClick={handleClose} color="primary" 
            variant="contained" style={{fontWeight: 'bold'}}>
            No
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}