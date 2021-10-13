const fs = require("fs")
const path = require("path")

const dataDir = path.join(__dirname, "./data")

const files = fs.readdirSync(dataDir)

files.forEach(file => {
  const fullDir = path.join(dataDir, file)
  if (file.includes("meta")) {
    fs.writeFileSync(fullDir, "json::fdb::{}")
  } else {
    fs.writeFileSync(fullDir, "json::fdb::[]")
  }
})

console.log("DONE!")