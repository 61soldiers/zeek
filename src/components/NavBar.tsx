import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
// Css files
import '../index.css'
import { ReplayRounded } from '@material-ui/icons'
import ReactTooltip from 'react-tooltip'

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  navbar : {
    background: 'rgba(0,0,0,0)',
    boxShadow: 'none',
  },
  menuButton: {
    marginRight: theme.spacing(2),
    color: theme.palette.primary.main,
  },
  title: {
    flexGrow: 1,
    color: theme.palette.primary.main,
    fontFamily: 'Amatic SC',
    fontWeight: 'bold',
    letterSpacing: 5,
    cursor: 'default',
  },
  reloadButton : {
    position: 'absolute',
    color: theme.palette.primary.main,
    right: 19,
    top: 15,
    transition: 'all 0.2s ease',
    borderRadius: 3,
    transform: "scale(1.1,1.1)",
    '&:hover': {
      cursor: 'pointer',
      transition: 'all 0.1s ease',
      transform: "scale(1.4,1.4)"
    },
  }
}));

export default function ButtonAppBar() {
  const classes = useStyles()

  return (
    <div className={classes.root}>
      <AppBar className={classes.navbar} position="fixed">
        <Toolbar variant="dense">
          <Typography variant="h5" className={classes.title}>
            {"Z E E K"}
          </Typography>
        </Toolbar>
        <div 
          onClick={()=>{window.location.reload()}} 
          color="primary" className={classes.reloadButton} 
          data-tip={"Reload app"}
        >
          <ReplayRounded/>
        </div>
      </AppBar>
      <ReactTooltip/>
    </div>
  );
}