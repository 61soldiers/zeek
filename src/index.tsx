import React from 'react';
import ReactDOM from 'react-dom';
import { ThemeProvider } from '@material-ui/core';
import { HashRouter } from 'react-router-dom';

import App from './App';
import theme from './mui_theme'
import './index.css';


ReactDOM.render(
  <ThemeProvider theme={theme}>
    <HashRouter>
      <App />
    </HashRouter>
  </ThemeProvider>,
  document.getElementById('root')
);