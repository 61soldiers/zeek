import { contextBridge, ipcRenderer } from "electron"

const allowedApi = [
  // playlist API
  "getPlaylists", "addPlaylist", "editPlaylist", "delPlaylist", 
  "updateLibraryOrder", "updatePlaylistOrder", "getLastPlaylist", 
  "saveLastPlaylist", "syncPlaylist",

  // tracks API
  "getSpotiTracksInPlaylist", "addTrackToPlaylist", "removeTrackFromPlaylist",
  
  // player API
  "getPlayerState", "savePlayerState", "saveVolume",

  // spoti-dl API
  "dlTrack", "dlTrackPid", "dlTrackProgress", "dlTrackPause",

  // watcher API
  "watcher", "watcherGetLibrary",

  // rich presence API
  "presenceUpdate", "stopPresence",
  
  // prerquisites API
  "prerequisitesProgress", "prerequisitesCheck", "prerequisitesStep"
]

contextBridge.exposeInMainWorld(
  'electron',
  {
    
    send: (channel:string, data:any) => {
      if (allowedApi.includes(channel)) {
          ipcRenderer.send(channel, data)
      }
    },
    on: (channel:string, callback:Function) => {
      if (allowedApi.includes(channel)) {
        const newCallback = (e, data) => callback(e, data);
        ipcRenderer.on(channel, newCallback)
      }
    },
    once: (channel:string, callback:Function) => { 
      if (allowedApi.includes(channel)) {
        const newCallback = (e, data) => callback(e, data);
        ipcRenderer.once(channel, newCallback)
      }
    }
     
  }
)