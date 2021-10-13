import { app, BrowserWindow, ipcMain } from 'electron'
import chokidar from 'chokidar'
import path from 'path'
import { getFilesInDir } from '../src/utils'


const pathToLibary = path.join(app.getPath("userData"), "/library")

export function startWatcher() {
  
  const ignored = [
    /(^|[\\/\\])\\../, // dot files
    /^.*\.(part)$/ // part files
  ]
  const watcher = chokidar.watch(pathToLibary, {ignored: ignored, persistent: true})

  const mainWindow = BrowserWindow.getFocusedWindow()

  watcher.on("all", async function(_e, filePath) {
    const allTracksInLib = await getFilesInDir(path.parse(filePath).dir)
    mainWindow?.webContents.send("watcher", allTracksInLib)
  })

}

ipcMain.on("watcherGetLibrary", async function(event, _p) {
  const allTracksInLib = await getFilesInDir(pathToLibary)
  event.reply("watcherGetLibrary", allTracksInLib)
})