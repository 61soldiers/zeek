import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
// @ts-ignore
import logo from './image-not-found.png'

// Css
const useStyles = makeStyles((theme) => ({
  thumbnail : {
    position: 'absolute',
    height: 40,
    width: 40,
    borderRadius: 3,
  }
}))

function ImgNotFound() {
  const classes = useStyles()
  return <img className={classes.thumbnail} src={logo} alt="" />;
}

export default ImgNotFound;