import { app, ipcMain } from 'electron'
import { getData, getPreview, getTracks } from 'spotify-url-info'
import { ISpotifyPlaylistCustom, ISpotifyTrack } from '../@types/global'
import ForerunnerDB from 'forerunnerdb'
import fileExists from 'file-exists'
import path from 'path'
import { sanitize } from 'string-sanitizer'

// Init db
const fdb = new ForerunnerDB()
const db = fdb.db('main')
db.persist.auto(true)
db.persist.dataDir('./data')

// Collections
const tracks = db.collection('tracks'); 
tracks.load(function(err:string) {
  if (err){console.log(err)}
  else {global.tracks = tracks}
})
const playlists = db.collection('playlists'); playlists.load(function(err:string){if (err){console.log(err)}})
const misc = db.collection('userData'); misc.load(function(err:string){if (err){console.log(err)}})

/* 
 * Playlist API
 */
// get
ipcMain.on("getPlaylists", async function(event, _payload) {
  try {

    const plsInOrder = await misc.findOne({docName: "libraryOrder"}) as any
    const libPlsToSend = []
    for (let i = 0; i < plsInOrder.order.length; i++) {
      libPlsToSend.push(await playlists.findOne({title: plsInOrder.order[i]}))
    }
    event.reply("getPlaylists", {isErr: false, err: null, payload: libPlsToSend})
  } catch(e) {
    event.reply("getPlaylists", {isErr: true, err: e, message: "fatal error"})
  }
})

// add
ipcMain.on("addPlaylist", async function(event, payload: string) {
  try {

    const plExist = await playlists.findOne({title: payload})
    if (plExist) {
      event.reply("addPlaylist", {isErr: true, err: null, message: 'duplicate'})
      return
    }
    
    const libOrder = await misc.findOne({docName: "libraryOrder"}) as any

    if (!payload.includes("spotify.com/playlist/")) {
      try {
        await playlists.insert({date: Date.now(), title: payload, trackIds: []})
        if (libOrder) {
          libOrder.order.push(payload)
          await misc.update({docName: "libraryOrder"}, {$overwrite: {order: libOrder.order}})
          event.reply("addPlaylist", {isErr: false, err: null, message: "success"})
          return
        } else {
          await misc.insert({docName: "libraryOrder", order: [payload]})
          event.reply("addPlaylist", {isErr: false, err: null, message: "success"})
          return
        }
      } catch(e) {
        event.reply("addPlaylist", {isErr: true, err: e, message: 'insert failed'})
      }
        
    } else {
      try {
        var pl = await getPreview(payload) as ISpotifyPlaylistCustom
      } catch(e) {
        event.reply("addPlaylist", {isErr: true, err: e, message: "invalid url"})
        return
      }
      try {
        // insert track ids
        const plTracks = await getTracks(payload) as Array<ISpotifyTrack>
        pl.trackIds = []
        for (let i = 0; i < plTracks.length; i++) {
          pl.trackIds.push(plTracks[i].id)
          // check if track already exist

          const libPath = path.join(app.getPath("userData"), "/library")
          const fileName = `${sanitize(plTracks[i].name)}-[id].${plTracks[i].id}.opus`
          const fullPath = path.join(libPath, fileName)
          const isTrackExist = await fileExists(fullPath)

          plTracks[i].fileLocation = isTrackExist ? fullPath : null
          // insert tracks to track collection
          if (! (await tracks.findOne({id: plTracks[i].id}))) {
            await tracks.insert(plTracks[i])
          }
        }
        await playlists.insert(pl)
        // lib order
        if (libOrder) {
          libOrder.order.push(pl.title)
          await misc.update({docName: "libraryOrder"}, {$overwrite: {order: libOrder.order}})
          event.reply("addPlaylist", {isErr: false, err: null, message: "success"})
          return
        } else {
          await misc.insert({docName: "libraryOrder", order: [pl.title]})
          event.reply("addPlaylist", {isErr: false, err: null, message: "success"})
          return
        }
      } catch(e) {
        event.reply("addPlaylist", {isErr: true, err: e, message: 'insert failed'})
      }
    }

    event.reply("addPlaylist", {isErr: false, err: null, message: "success"})

  } catch(e) {
    event.reply("addPlaylist", {isErr: true, err: e, message: 'fatal error'})
  }
})

// update
ipcMain.on("editPlaylist", async function(event, payload) {
  try {

    if (!await playlists.findOne({title: payload.new})) {
      const libOrder = await misc.findOne({docName: "libraryOrder"}) as any
      for(let i = 0; i < libOrder.order.length; i++) {
        if (libOrder.order[i] === payload.old) {
          libOrder.order[i] = payload.new
          await misc.update({docName: "libraryOrder"}, {$overwrite: {order: libOrder.order}})
          await playlists.update({title: payload.old}, {$overwrite:{title: payload.new}})
          event.reply('editPlaylist', {isErr: false, err: null, message: "success"})
          return
        }
      }
      
    } else {
      event.reply('editPlaylist', {status: 'failed'})
    }

  } catch(e) {
    event.reply("editPlaylist", {isErr: true, err: e, message: 'fatal error'})
  }
})

// delete
ipcMain.on("delPlaylist", async function(event, payload) {
  try {

    await playlists.remove({title: payload})
    const libOrder = await misc.findOne({docName: "libraryOrder"}) as any
    if (libOrder) {
      await misc.update({docName: "libraryOrder"}, 
          {$overwrite: {order: libOrder.order.filter(e => e !== payload)}})
    }

    if(await misc.findOne({docName: "lastPlaylist"})) {
      await misc.update({docName: "lastPlaylist"}, 
        {$overwrite: {lastPlaylist: null, currentTime: 0}})
    }
    event.reply("delPlaylist", {isErr: false, err: null, messsage: "success"})

  } catch(e) {
    event.reply("delPlaylist", {isErr: true, err: e, message: 'fatal error'})
  }
})

// update library order
ipcMain.on("updateLibraryOrder", async function(event, payload) {
  try {
    let libOrder = await misc.findOne({docName: "libraryOrder"})
    if(libOrder) {
      await misc.update({docName: "libraryOrder"}, {$overwrite: {order: payload}})
      event.reply("updateLibraryOrder", {isErr: false, err: null, message: "success"})
    } else {
      await misc.insert({docName: "libraryOrder", order: payload})
      event.reply("updateLibraryOrder", {isErr: false, err: null, message: "success"})
    }

    await playlists.update({title: payload.title}, {$overwrite: {trackIds: payload.trackIds}})
    event.reply("updateLibraryOrder", {isErr: false, err: null, message: "success"})

  } catch(e) {
    event.reply("updateLibraryOrder", {isErr: true, err: e, message: 'fatal error'})
  }
})

// update playlist order
ipcMain.on("updatePlaylistOrder", async function(event, payload) {
  try {

    await playlists.update({title: payload.title}, {$overwrite: {trackIds: payload.trackIds}})
    event.reply("updatePlaylistOrder", {isErr: false, err: null, message: "success"})

  } catch(e) {
    event.reply("updatePlaylistOrder", {isErr: true, err: e, message: 'fatal error'})
  }
})

// get last toLoadPlaylist
ipcMain.on("getLastPlaylist", async function(event, payload) {
  try {

    const pl = await misc.findOne({docName: "lastPlaylist"})
    event.reply("getLastPlaylist", {isErr: false, err: null, message: "success", lastPlaylist: pl})

  } catch(e) {
    event.reply("getLastPlaylist", {isErr: true, err: e, message: 'fatal error'})
  }
})

// save last toLoadPlaylist
ipcMain.on("saveLastPlaylist", async function(event, payload) {
  try {

    if(! await misc.findOne({docName: "lastPlaylist"})) {
      await misc.insert({docName: "lastPlaylist", lastPlaylist: payload})
    } else {
      await misc.update({docName: "lastPlaylist"}, {$overwrite: {lastPlaylist: payload}})
    }
    event.reply("saveLastPlaylist", {isErr: false, err: null, message: "success"})

  } catch(e) {
    event.reply("saveLastPlaylist", {isErr: true, err: e, message: 'fatal error'})
  }
})

// sync playlist
ipcMain.on("syncPlaylist", async function(event, payload) {
  try {

    const plInDb = await playlists.findOne({title: payload}) as ISpotifyPlaylistCustom
    const plTracks = await getTracks(plInDb.link) as ISpotifyTrack[]
    plInDb.trackIds = []
    for (let i = 0; i < plTracks.length; i++) {
      plInDb.trackIds.push(plTracks[i].id)
      if (! (await tracks.findOne({id: plTracks[i].id}))) {
        await tracks.insert(plTracks[i])
      }
    }
    await playlists.update({title: plInDb.title}, {$overwrite: {trackIds: plInDb.trackIds}})
    event.reply("syncPlaylist", {isErr: false, err: null, message: "success"})

  } catch(e) {
    event.reply("syncPlaylist", {isErr: true, err: e, message: 'fatal error'})
  }
})

/* 
 * Tracks API
 */
// get all tracks in spotify playlist
ipcMain.on("getSpotiTracksInPlaylist", async function(event, payload) {
  try {

    const pl = await playlists.findOne({title: payload}) as ISpotifyPlaylistCustom
    if (!pl) {
      event.reply("getSpotiTracksInPlaylist", {isErr: true, err: null, message: "playlist not found"})
    }

    let plTracks: any[] = []
    for (let i = 0; i < pl.trackIds.length; i++) {
      const tk = await tracks.findOne({id: pl.trackIds[i]})
      plTracks.push(tk)
    }

    event.reply("getSpotiTracksInPlaylist", {isErr: false, err: null, payload: plTracks})

  } catch(e) {
    event.reply("getSpotiTracksInPlaylist", {isErr: true, err: e, message: 'fatal error'})
  }
})

ipcMain.on("addTrackToPlaylist", async function(event, payload) {
  try {

    try {
      var tk: ISpotifyTrack = await getData(payload.url)
    } catch(e) {
      event.reply("addTrackToPlaylist", {isErr: true, err: e, message: "invalid url"})
      return
    }

    if (!(await tracks.findOne({id: tk.id}))) {
      await tracks.insert({...tk, fileLocation: null})
    }

    const pl = await playlists.findOne({title: payload.playlist}) as ISpotifyPlaylistCustom
    pl.trackIds.push(tk.id)
    await playlists.update({title: payload.playlist}, {$overwrite: {trackIds: pl.trackIds}})

    event.reply("addTrackToPlaylist", {isErr: false, err: null, message: "success"})

  } catch(e) {
    event.reply("addTrackToPlaylist", {isErr: true, err: e, message: 'fatal error'})
  }
})

ipcMain.on("removeTrackFromPlaylist", async function(event, payload) {
  try {

    const pl = await playlists.findOne({title: payload.playlist}) as ISpotifyPlaylistCustom
    pl.trackIds.splice(pl.trackIds.indexOf(payload.trackId), 1)
    await playlists.update({title: payload.playlist}, {$overwrite: {trackIds: pl.trackIds}})
    event.reply("removeTrackFromPlaylist", {isErr: false, err: null, message: "success"})

  } catch(e) {
    event.reply("removeTrackFromPlaylist", {isErr: true, err: e, message: 'fatal error'})
  }
})

/* 
 * Player API
 */
ipcMain.on("getPlayerState", async function(event, _payload) {
  try {

    const playerState = await misc.findOne({docName: "playerState"})
    event.reply("getPlayerState", playerState)

  } catch(e) {
    event.reply("getPlayerState", {isErr: true, err: e, message: 'fatal error'})
  }
})

ipcMain.on("savePlayerState", async function(event, payload) {
  try {

    if (!misc.findOne({docName: "playerState"})) {
      await misc.insert(payload)
    } else {
      if (payload._id) delete payload._id
      await misc.update({docName: "playerState"}, payload)
    }
    event.reply("savePlayerState", {isErr: false, err: null, message: "success"})

  } catch(e) {
    event.reply("savePlayerState", {isErr: true, err: e, message: 'fatal error'})
  }
})

ipcMain.on("saveVolume", async function(event, payload) {
  try {

    if (!misc.findOne({docName: "playerState"})) {
      await misc.insert({docName: "playerState", volume: payload})
    } else {
      await misc.update({docName: "playerState"}, {$overwrite: {volume: payload}})
    }
    event.reply("saveVolume", {isErr: false, err: null, message: "success"})

  } catch(e) {
    event.reply("saveVolume", {isErr: true, err: e, message: 'fatal error'})
  }
})