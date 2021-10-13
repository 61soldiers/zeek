import drpc from 'discord-rpc'
import { ipcMain } from 'electron'

let rpc: drpc.Client|null = null;
const client = new drpc.Client({ transport: 'ipc' });

ipcMain.on("presenceUpdate", async function(event, payload) {
  try {

    await client.login({clientId: "896733982090227712"}).catch(console.error)
    await rpc.setActivity(payload)

  } catch(e) {
    event.reply("presenceUpdate", {isErr: true, err: e, message: "fatal error"})
  }
})

ipcMain.on("stopPresence", async function(event, _payload) {
  try {

    await rpc.destroy()

  } catch(e) {
    event.reply("stopPresence", {isErr: true, err: e, message: "fatal error"})
  }
})