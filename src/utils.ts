import prettyMS from 'pretty-ms'
import fileExists from 'file-exists'
import fs from 'fs'
import commandExists from 'command-exists'
import { ISpotifyTrack, ShapedTrack } from '../@types/global'

export function shapeTrackArray(playerTracks: ISpotifyTrack[]): ShapedTrack[] {
  let shaped: any = []
  playerTracks.forEach(function(track) {
    shaped.push({
      name: track.name,
      musicSrc: track.fileLocation,
      cover: track.album.images[0].url,
      singer: artistsString(track.artists as any)
    })
  })
  return shaped
}

export function reOrderArrayElement(array: Array<any>, from: number, to: number) {
  if( to === from ) return array;

  var target = array[from];                         
  var increment = to < from ? -1 : 1;

  for(var k = from; k !== to; k += increment){
    array[k] = array[k + increment];
  }
  array[to] = target;
  return array;
}

export function artistsString(arts:Array<any>) {
  if (arts.length === 1) return arts[0].name
  var artString = ""
  arts.forEach(artist => {
    artString += `${artist.name}, `
  })
  return artString.trim().slice(0, -1)
}

export function parseDuration(dur: number) {
  const prms = prettyMS(dur, {colonNotation: true, secondsDecimalDigits: 0})
  return prms.replace(":", " : ")
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function isInList(toBeChecked: any, checkInArray: any[]) {
  var i: number, len: number;
  for (i = 0, len = checkInArray.length; i < len; i++)
  {
    if (checkInArray[i] === toBeChecked) { return true; }
  }
  return false;
}

export async function isDirExist(dirPath: string): Promise<boolean> {
  if (await fileExists(dirPath)) return false
  return new Promise(async function(resolve, _reject) {
    fs.access(dirPath, function(err) {
      if (err) resolve(false)
      else resolve(true)
    })
  })
}

export function makeDir(dirPath: string): Promise<boolean> {
  return new Promise(function(resolve, _reject) {
    fs.mkdir(dirPath, function(err) {
      if (err) resolve(false)
      else resolve(true)
    })
  }) // return true if success
}

export function getFilesInDir(dir: string): Promise<string[]> {
  return new Promise(function(resolve, reject) {
    fs.readdir(dir, function(err, files) {
      if(err) reject()
      else resolve(files)
    })
  })
}

export function moveFile(oldDir: string, newDir: string): Promise<boolean> {
  return new Promise(function(resolve, _reject) {
    fs.rename(oldDir, newDir, function(err) {
      if (err) return resolve(false)
      else resolve(true)
    })
  })
}

export function isCommandExist(command: string): Promise<boolean> {
  return new Promise(async function(resolve, _reject) {
    try {
      await commandExists(command)
      resolve(true)
    } catch {
      resolve(false)
    }
  })
}