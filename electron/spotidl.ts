import { app, ipcMain } from 'electron'
import ytsr from 'ytsr'
import { create } from 'youtube-dl-exec'
import { getData } from 'spotify-url-info'
import strSanitizer from 'string-sanitizer'
import path from 'path'
import { ISpotifyTrack } from '../@types/global'
import { ExecaChildProcess } from 'execa'
import { getffmpegBinPath } from './prerequisites'

// download a track

let stream: ExecaChildProcess<string> | null;
let isPause: boolean = false

ipcMain.on('dlTrack', async function(event, payload) {
  try {
    const track = await getData(payload) as ISpotifyTrack
    try {
      let schQuery = await ytsr(`${track.name} - ${track.artists[0].name}`, { limit: 1 })
      var ytLink = schQuery.items[0]["url"]
    } catch(e) {
      event.reply('dlTrack', {isErr: true, err: e, message: "search failed", id: track.id})
    }
    
    const ffmpegPath = await getffmpegBinPath(path.join(app.getPath("userData"), "/dependencies"))
    const depPath = path.join(app.getPath("userData"), "/dependencies")
    var newBinPath: string;
    if (process.platform!=="win32") {
      newBinPath = path.join(depPath, "youtube-dl")
    } else {
      newBinPath = path.join(depPath, "youtube-dl.exe")
    }

    const cleanFileName = strSanitizer.sanitize(track.name)
    const tLoc = path.join(app.getPath("userData"), `/library/${cleanFileName}-[id].${track.id}`)
    // download
    const ytdlFlags = {
      extractAudio: true,
      audioFormat: "opus",
      audioQuality: 0,
      newline: true,
      ffmpegLocation: ffmpegPath,
      output: `${tLoc}.%(ext)s`
    }
    stream = create(newBinPath).raw(ytLink, ytdlFlags)
    stream.stdout?.setEncoding('utf8')
    
    let flagA = true
    stream.stdout?.on("data", async function(data: string) {
      if (flagA) {
        event.sender.send("dlTrackPid", {id: track.id, pid:stream?.pid})
        isPause = false
        flagA = false
      }
      const rgx = new RegExp('\\[download\\] *([0-9]+(?:\\.[0-9]+)?)%')
      if (data.match(rgx)) {
        event.sender.send("dlTrackProgress", {id: track.id, progress: data.match(rgx)![1]})
      }
    })

    stream.on('error', async function(e) {
      event.reply('dlTrack', {isErr: true, err: e, message: "download failed", id: track.id})
      stream = null
    })

    stream.on('exit', async function() {
      if (!isPause) {
        await global.tracks.update({id: track.id}, {$overwrite: {fileLocation: `${tLoc}.opus`}})
        event.reply('dlTrack', {isErr: false, err: null, message: "success", id: track.id})
        stream = null
      }
    })
    
  } catch(e) {
    event.reply('dlTrack', {isErr: true, err: e, message: "fatal error"})
  }
})

// pause download
ipcMain.on("dlTrackPause", async function(event, payload) {
  try {

    if (stream) {
      isPause = true
      process.kill(payload.pid)
      stream = null
      event.reply("dlTrackPause", {isErr: false, err: null, message: "success"})
    }

  } catch(e) {
    event.reply('dlTrackPause', {isErr: true, err: e, message: "fatal error"})
  }
})