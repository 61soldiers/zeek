import got from 'got'
import fs from 'fs'
import progress from 'progress-stream'
import path from 'path'
import axios from 'axios'
import unzipper from 'unzipper'
import { BrowserWindow } from 'electron'
import { getFilesInDir, isCommandExist, isDirExist } from '../src/utils'
import ElectronStore from 'electron-store'

// ytdl
async function getDownloadData(platform?: string) {
  const ENDPOINT =
  'https://api.github.com/repos/ytdl-org/youtube-dl/releases?per_page=1'

  const [lastRelease] = await got(ENDPOINT, {
    responseType: 'json',
    resolveBodyOnly: true
  })
  const assets: any[] = lastRelease.assets
  const bin = (platform === 'linux') ? 'youtube-dl' : 'youtube-dl.exe'
  const { browser_download_url, size } = assets.find(
    ({ name }) => name === bin
  )

  return {
    url: browser_download_url,
    size: size,
    bin: bin
  }
}

export async function getytdl(downloadLocation: string, mainWindow: BrowserWindow, 
    store: ElectronStore<Record<string, unknown>>) {
  mainWindow.webContents.send("prerequisitesCheck", true)
  const dlData = await getDownloadData((process.platform === 'win32') ? "win" : "linux")
  const progressOut = progress({
    length: dlData.size,
    time: 1000
  })

  progressOut.on('progress', function({percentage}) {
    const rPercent = Math.round(percentage)
    mainWindow.webContents.send("prerequisitesStep", 1)
    mainWindow.webContents.send("prerequisitesProgress", `${rPercent}%`)
  })

  progressOut.on("finish", async function() {
    await getffmpeg(downloadLocation, mainWindow, store)
  })

  got.stream(dlData.url)
    .pipe(progressOut)
    .pipe(fs.createWriteStream(`${downloadLocation}/${dlData.bin}`))
}






// ffmpeg
const ARCH = {'ia32': 'x86', 'x32': 'x86'};
const URL = {
  'linux': {
    'arm':   'https://johnvansickle.com/ffmpeg/builds/ffmpeg-git-armhf-static.tar.xz',
    'arm64': 'https://johnvansickle.com/ffmpeg/builds/ffmpeg-git-arm64-static.tar.xz',
    'x86':   'https://johnvansickle.com/ffmpeg/builds/ffmpeg-git-i686-static.tar.xz',
    'x64':   'https://johnvansickle.com/ffmpeg/builds/ffmpeg-git-amd64-static.tar.xz  '
  },
  'win32': {
    'x86': 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip',
    'x64': 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip'
  },
  'darwin': {
    'x64': 'https://evermeet.cx/ffmpeg/ffmpeg-4.4.zip'
  }
}

function ffmpegUrl() {
  var platform = process.platform
  if(!URL.hasOwnProperty(platform)) platform = 'linux'
  var arch = process.arch
  arch = ARCH[arch]||arch
  return URL[platform][arch]
}

export async function getffmpegBinPath(downloadLocation: string) {
  const files = await getFilesInDir(downloadLocation)
  for (let i = 0; i < files.length; i++) {
    const unzippedDir = path.join(downloadLocation, files[i])
    if(await isDirExist (unzippedDir)) {
      if (files[i].includes("ffmpeg")) {
        if (process.platform!=="win32") {
          return path.join(unzippedDir, "ffmpeg")
        } else {
          return path.join(unzippedDir, "/bin/ffmpeg.exe")
        }
      }
    }
    
  }
  return null
}

export async function getffmpeg(downloadLocation: string, mainWindow: BrowserWindow, 
  store: ElectronStore<Record<string, unknown>>) {

  if (await isCommandExist("ffmpeg")) {
    mainWindow.webContents.send("prerequisitesCheck", false)
    return
  }

  const dlUrl = ffmpegUrl()
  const dlSize = parseInt((await axios.head(dlUrl)).headers['content-length'])
  const fileUrlObj = path.parse(dlUrl)
  const filePathObj = path.parse(`${downloadLocation}/${fileUrlObj.base}`)

  const progressOut = progress({
    length: dlSize,
    time: 1000
  })

  progressOut.on('progress', function({percentage}) {
    const rPercent = Math.round(percentage)
    if (percentage > 0.01) {
      mainWindow.webContents.send("prerequisitesStep", 2)
    }
    mainWindow.webContents.send("prerequisitesProgress", `${rPercent}%`)
    if (rPercent === 100) {
      mainWindow.webContents.send("prerequisitesProgress", "processing")
    }
  })
  
  progressOut.on("finish", function() {
    mainWindow.webContents.send("prerequisitesCheck", false)
    store.set("firstLaunch", true)
  })
  
  got.stream(dlUrl)
    .pipe(progressOut)
    .pipe(fs.createWriteStream(`${downloadLocation}/${fileUrlObj.base}`))
      .on("finish", function() {
        fs.createReadStream(`${filePathObj.dir}/${filePathObj.base}`)
          .pipe(unzipper.Extract({ path: filePathObj.dir }))
      })

}