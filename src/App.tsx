import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTitle, makeStyles } from '@material-ui/core'
import { Typography } from '@mui/material'
import { Route, Switch } from 'react-router-dom'
import { SnackbarProvider } from 'notistack'

import NavBar from './components/NavBar'
import Home from './components/library/Home'

import './App.css'

const ipcRenderer = window.electron

const useStyles = makeStyles((_theme) => ({
  '@global' : {
    WebkitFontSmoothing: 'antialiased'
  },
  error : {
    backgroundColor: '#ff6459'
  }
}))

export default function App() {
  const classes = useStyles()
  
  const [dlProgress, setDlProgress] = useState("0%")
  const [openPRDialog, setOpenPRDialog] = useState(false)
  const [dlStep, setDlStep] = useState(1)

  useEffect(function() {
    ipcRenderer.on("prerequisitesStep", function(_e, payload) {
      setDlStep(payload)
    })
    ipcRenderer.on("prerequisitesCheck", function(_e, payload) {
      setOpenPRDialog(payload)
    })
    ipcRenderer.on("prerequisitesProgress", function(_e, payload) {
      setDlProgress(payload)
    })
  }, [])

  return (
    <SnackbarProvider maxSnack={3} classes={{variantError: classes.error}}>
      <NavBar/>
      <Switch>
        <Route exact path='/' component={Home} />
      </Switch>

      <PreRequisites dlProgress={dlProgress} open={openPRDialog} dlStep={dlStep} />
    </SnackbarProvider>
  )
}

function PreRequisites({dlProgress, open, dlStep}) {
  return (
    <Dialog open={open} disableEscapeKeyDown>
      <DialogTitle>Downloading prerequisites</DialogTitle>
      <DialogContent>
        <Typography align="center" style={{marginBottom: 12}}>
          {`${dlStep} of 2: ${dlProgress}`}
        </Typography>
      </DialogContent>
    </Dialog>
  )
}