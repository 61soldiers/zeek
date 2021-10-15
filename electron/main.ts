import { app, BrowserWindow } from 'electron'
import isDev from 'electron-is-dev'
import electronStore from 'electron-store'
import path from 'path'
import url from 'url'
import { startWatcher } from './watcher'
import { makeDir, sleep } from '../src/utils'

// dem files
import './dbcomms'
import './spotidl'
import { getytdl } from './prerequisites'
// import './discord_rich_presence' -> TODO:

let mainWindow: BrowserWindow|null = null;
const minHeight = 600
const minWidth = 900

const devUrl = "http://localhost:3000"
const devLoadingUrl = path.join(app.getAppPath(), "/public/loading.html")
const prodUrl = url.format({
  pathname: path.join(app.getAppPath(), '/build/index.html'),
  protocol: 'file:',
  slashes: true
})
const prodLoadingUrl = url.format({
  pathname: path.join(app.getAppPath(), '/build/loading.html'),
  protocol: 'file:',
  slashes: true
})

const store = new electronStore()

function createWindow(): void {
  
  // restore window size state
  let sizeState = store.get("bounds") as any

  mainWindow = new BrowserWindow({
    show: false,
    minHeight: minHeight,
    minWidth: minWidth,
    height: sizeState ? sizeState.bounds.height : minHeight,
    width: sizeState ? sizeState.bounds.width : minWidth,
    x: sizeState ? sizeState.bounds.x : undefined,
    y: sizeState ? sizeState.bounds.y : undefined,
    autoHideMenuBar: isDev ? false : true,
    webPreferences: {
      devTools: isDev ? true : false,
      nodeIntegration: false,
      webSecurity: isDev ? false : true,
      preload: path.join(__dirname, "./preload.js")
    },
  })

  mainWindow.loadURL(isDev ? devUrl : prodUrl)
  mainWindow.on('close', function() {
    // save window size state
    const b = {bounds: mainWindow?.getBounds()}
    store.set('bounds', b)
  })
  mainWindow.on('closed', function() {
    mainWindow = null
  })
}

app.on('ready', async function() {
  createWindow()
  const loadingWindow = new BrowserWindow({
    show: false,
    frame: false,
    height: 400,
    width: 250,
  })
  loadingWindow.loadURL(isDev ? devLoadingUrl : prodLoadingUrl)
  loadingWindow.on("ready-to-show", function() {
    loadingWindow.focus()
    loadingWindow.show()
  })

  mainWindow?.webContents.once('dom-ready', async function() {
    loadingWindow?.hide()
    await sleep(2 * 1000)
    loadingWindow?.close()
    mainWindow?.show()
    startWatcher()

    // prerequisites
    if (!store.get("firstLaunch")) {
      // download ytdl
      const dlPath = path.join(app.getPath("userData"), "/dependencies")
      await makeDir(dlPath)
      await getytdl(dlPath, mainWindow, store)
    }
  })
  
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})