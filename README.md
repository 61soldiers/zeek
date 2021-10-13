<p align="center">
  <img src="https://cdn.discordapp.com/attachments/680880287864848428/897886404019908618/ZEEK.png">
</p>
<p align="center">
  <span>Chill music player heavily centering around spotify</span><br/>
  <span>Listen to your playlists offline and without ads</span>
  </p>
  <br/><br/><br/>
  <br/>
<p align="center" ><img src="https://cdn.discordapp.com/attachments/680880287864848428/897851702374432828/zeek_icon.png" alt="Logo" width="200" height="200"></p>  
<br/><br/><br/><br/>

## Installation
*Tested only on windows | aimed at cross-platform compatibility*<br/>
[Click to download windows installer](https://github.com/61soldiers/zeek/releases/download/0.1.0/Zeek.Setup.0.1.0.exe)

**Note** <br/>
Downloading a track solely depends on whether said track is hosted on youtube or not. 99% of the times the right track will be downloaded.
Adding spotify playlists will only extract the first 100 songs. You will have to add the rest of the playlist manually using `Add track`

## Screenshot
<img src="https://cdn.discordapp.com/attachments/680880287864848428/897880296475734026/unknown.png">

## Developer mode

```bash
git clone https://github.com/61soldiers/zeek.git .
npm install
```

## Dem scripts

### `npm run dev`

Runs the app in the development mode.
Electron will start automatically and dev server is accessible at [http://localhost:3000](http://localhost:3000)

### `npm run build`

Builds the frontend portion for production into `build` directory.

### `npm run package:(platform)`

Build and distribute the electron app using [electron-builder](https://www.electron.build/) and installer to the `dist` folder. 
Replace `(platform)` with a platform of your choosing -> [`win`, `linux`, `mac`]. 

### `npm run fix:electron`

If you encounter 'Electron failed to install correctly', use this command at will.

## Change log
All features, changes and fixes will be documented [here](https://github.com/61soldiers/zeek/blob/master/CHANGELOG.md).

## License
[MIT](https://github.com/61soldiers/zeek/blob/master/LICENSE)