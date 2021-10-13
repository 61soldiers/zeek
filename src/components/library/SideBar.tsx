import React, { useEffect, useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Typography, Divider, Dialog, DialogTitle, 
  DialogContent, TextField, DialogActions, Button } from '@material-ui/core';
import LibraryAddIcon from '@material-ui/icons/LibraryAdd'
import { useSnackbar } from 'notistack';
import { ContextMenu, ContextMenuTrigger, MenuItem } from '@epydoc/react-contextmenu';
import { ISideBar } from '../components';
import { reOrderArrayElement } from '../../utils';

import '../../index.css'

const ipcRenderer = window.electron


const useStyles = makeStyles((theme) => ({
  root : {
    backgroundColor: 'black',
    color: theme.palette.primary.main,
    padding: 20,
    borderRadius: 7,
    minWidth: '170px',
    maxWidth: '170px',
    maxHeight: '70vh',
  },
  dividers : {
    postition: 'absolute',
    backgroundColor: '#454545',
  },
  cblist : {
    marginTop: 1,
    maxHeight: '55vh',
    overflowY: 'auto',
  },
  cblistItem : {
    padding: 10,
    transition: 'all 0.2s ease',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    '&:hover': {
      background: '#9c9c9c',
      color: 'black',
      cursor: 'pointer',
      transition: 'all 0.1s ease'
    },
  },
  addPlaylist : {
    marginTop: 10,
    color: 'black',
    backgroundColor: '#9c9c9c',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    '&:hover' : {
      backgroundColor: 'black',
      color: theme.palette.primary.main,
      transition: 'all 0.2s ease',
      cursor: 'pointer',
    }
  },
  addPlaylistButton : {
    '&:hover' : {
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      transform: 'scale(1.15,1.15)'
    }
  },
  libContextMenu : {
    background: '#7d7d7d',
    padding: 10,
    borderRadius: '2.5px 2.5px 2.5px 2.5px',
    zIndex: 4,
  },
  libContextMenuButtons : {
    padding: 6,
    fontFamily: 'Oxygen',
    fontWeight: 450,
    fontSize: 15,
    color: 'black',
    transition: 'all 0.2s ease',
    borderRadius: '3px',
    '&:hover' : {
      backgroundColor: 'black',
      color: theme.palette.primary.main,
      transition: 'all 0.2s ease',
      cursor: 'pointer',
    }
  },
  '@global': {
    '*::-webkit-scrollbar': {
      width: '0.4em'
    },
    '*::-webkit-scrollbar-track': {
      '-webkit-box-shadow': 'inset 0 0 6px rgba(0,0,0,0.00)'
    },
    '*::-webkit-scrollbar-thumb': {
      backgroundColor: '#9c9c9c',
      borderRadius: '2px 2px 2px 2px',
    },
  }
}));


export default function SideBar(props: ISideBar) {
  const { enqueueSnackbar } = useSnackbar()
  const { toLoadPlaylist, setToLoadPlaylist, setTracks } = props
  const classes = useStyles()
  
  const [playlists, setPlaylists] = useState([]);
  const [dgCreatePlaylists, setDgCreatePlaylists] = useState(false)
  const [dragId, setDragId] = useState(null)

  // drag and reorder library
  async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const reOrdered = reOrderArrayElement(playlists, dragId, parseInt(e.currentTarget.id))
    let reOrderedPls = []
    reOrdered.forEach(pl => {
      reOrderedPls.push(pl.title)
    })
    ipcRenderer.send("updateLibraryOrder", reOrderedPls)
    ipcRenderer.once("updateLibraryOrder", async function(_e, payload) {
      if(!payload.isErr) {
        getPlaylists()
      } else {
        enqueueSnackbar(`Error! -> ${payload.message}`, {
          variant: 'error'
        })
      }
    })
  }

  async function getPlaylists() {
    ipcRenderer.send('getPlaylists')
    ipcRenderer.once('getPlaylists', async function (_event, payload) {
      if (!payload.isErr) {
        setPlaylists(payload.payload)
      } else {
        // Error noti
      }
    })
  }
  
  useEffect(function() {
    getPlaylists()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Render
  return (

    <div className={classes.root}>
      <PlaylistsContextMenu 
        getPlaylists={getPlaylists} 
        toLoadPlaylist={toLoadPlaylist}
        setToLoadPlaylist={setToLoadPlaylist}
        setTracks={setTracks}  
      />
      <Typography variant="h3" gutterBottom> Library </Typography>
      <div className={classes.cblist}>
        <Divider className={classes.dividers} style={{marginBottom: 10}} />
        
        {
          playlists.map(function(x,i) {
            return (<div
                      draggable={true}
                      id={i.toString()}
                      onDragStart={() => {setDragId(i)}}
                      onDragOver={(e) => {e.preventDefault()}}
                      onDrop={handleDrop}
                      key={i}
                    >
                      <ContextMenuTrigger key={i} id="pl-cm">
                        <Typography
                          id={x.title}
                          color="primary" 
                          className={classes.cblistItem} 
                          onClick={()=>{setToLoadPlaylist(x.title)}}
                        >
                            {x.title}
                        </Typography>
                      </ContextMenuTrigger>
                    </div>)
          })
        }
        
      </div>

      <div className={classes.addPlaylist}>
        <Typography 
          className={classes.addPlaylistButton} 
          variant="h4" 
          onClick={()=>{setDgCreatePlaylists(true)}} >
            <LibraryAddIcon/>
        </Typography>
        <CreatePlaylistDialog 
          open={dgCreatePlaylists} 
          setOpen={setDgCreatePlaylists} 
          getPlaylists={getPlaylists} 
        />
      </div>
    </div>

  )
}

function CreatePlaylistDialog(props) {
  const { enqueueSnackbar } = useSnackbar()
  const [value, setValue] = useState("")
  const { open, setOpen, getPlaylists } = props

  async function createCollection() {
    if (value.trim()==="") return
    ipcRenderer.send('addPlaylist', value)
    ipcRenderer.once('addPlaylist', async function(_event, payload) {
      if (!payload.isErr) {getPlaylists();handleClose();setValue("")}
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
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Create playlist</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          label="Name or playlist url"
          variant="filled"
          fullWidth
          value={value}
          onChange={(e)=>{setValue(e.target.value)}}
        />
      </DialogContent>
      <DialogActions style={{padding: 20}}>
        <Button onClick={()=>{createCollection()}} color="primary" variant="contained" style={{fontWeight: 'bold'}}>
          Create
        </Button>
        <Button onClick={()=>{handleClose();setValue("")}} color="primary" variant="contained" style={{fontWeight: 'bold'}}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function PlaylistsContextMenu(props) {
  const { getPlaylists, toLoadPlaylist, setToLoadPlaylist, setTracks } = props
  const [open1, setOpen1] = useState(false)
  const [open2, setOpen2] = useState(false)
  const [toBeEdited, setToBeEdited] = useState(null)
  const classes = useStyles()
  return (
    <React.Fragment>

      <DelConfirmationDialog 
        open1={open1} 
        setOpen1={setOpen1} 
        toBeEdited={toBeEdited} 
        setToBeEdited={setToBeEdited} 
        getPlaylists={getPlaylists} 
        toLoadPlaylist={toLoadPlaylist}
        setToLoadPlaylist={setToLoadPlaylist}
        setTracks={setTracks}
      />
      <EditCollectionDialog 
        open2={open2} 
        setOpen2={setOpen2} 
        toBeEdited={toBeEdited} 
        setToBeEdited={setToBeEdited} 
        getPlaylists={getPlaylists} 
      />

      <ContextMenu className={classes.libContextMenu} id="pl-cm">
        <MenuItem 
          className={classes.libContextMenuButtons} 
          onClick={(_e, data:any)=>{setToBeEdited(data.target.id);setOpen2(true)}}>
          {"Edit"}
        </MenuItem>
        <MenuItem divider />
        <MenuItem 
          className={classes.libContextMenuButtons} 
          onClick={(_e, data:any)=>{setToBeEdited(data.target.id);setOpen1(true)}}>
          {"Delete"}
        </MenuItem>
      </ContextMenu>

    </React.Fragment>
  )
}

function DelConfirmationDialog(props) {
  const { 
    open1, setOpen1, toBeEdited, setToBeEdited, getPlaylists, 
    toLoadPlaylist, setToLoadPlaylist, setTracks 
  } = props
  const { enqueueSnackbar } = useSnackbar()
  
  function handleClose () {
    setOpen1(false);
  };
  
  async function delPlaylist() {
    ipcRenderer.send("delPlaylist", toBeEdited)
    ipcRenderer.once('delPlaylist', async function(_event, payload) {
      if (!payload.isErr) {
        getPlaylists();handleClose();
        if (toBeEdited === toLoadPlaylist) {
          setTracks([])
          setToLoadPlaylist(null)
        }
      } else {
        enqueueSnackbar(`Error! -> ${payload.message}`, {
          variant: 'error'
        })
      }
    })
  }

  return (
    <Dialog open={open1} onClose={handleClose}>
      <DialogTitle>Are you sure you want to delete <strong>{toBeEdited}</strong> ?</DialogTitle>
      <DialogActions style={{padding: 20}}>
        <Button onClick={()=>{delPlaylist();setToBeEdited(null)}} color="primary" variant="contained" style={{fontWeight: 'bold'}}>
          Yes
        </Button>
        <Button onClick={()=>{handleClose();setToBeEdited(null)}} color="primary" variant="contained" style={{fontWeight: 'bold'}}>
          No
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function EditCollectionDialog(props) {
  const { enqueueSnackbar } = useSnackbar()
  const [value, setValue] = useState("")
  const { open2, setOpen2, toBeEdited, setToBeEdited, getPlaylists } = props
  
  function handleClose () {
    setOpen2(false);
  };
  
  async function renameColl() {
    if (value.trim() !== "") {
      let payload = {old: toBeEdited, new: value}
      ipcRenderer.send('editPlaylist', payload)
      ipcRenderer.once('editPlaylist', async function(_event, payload) {
        if (!payload.isErr) {
          setToBeEdited(null);setValue("");getPlaylists();handleClose();
        } else {
          enqueueSnackbar(`Error! -> ${payload.message}`, {
            variant: 'error'
          })
        }
      })
    }
    
  }
  return (
    <Dialog open={open2} onClose={handleClose}>
      <DialogTitle>Edit {toBeEdited}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          label="Rename"
          variant="filled"
          fullWidth
          value={value}
          onChange={(e)=>{setValue(e.target.value)}}
        />
      </DialogContent>
      <DialogActions style={{padding: 20}}>
        <Button onClick={()=>{renameColl()}} color="primary" variant="contained" style={{fontWeight: 'bold'}}>
          Rename
        </Button>
        <Button onClick={()=>{setToBeEdited(null);handleClose();setValue("")}} color="primary" variant="contained" style={{fontWeight: 'bold'}}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}