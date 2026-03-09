import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter as Router} from 'react-router-dom'
import { TimeLineContextProvider } from './context/BibleContext';
import { ThemeProvider } from "@mui/material";
import { appTheme } from "./Theme/appTheme";


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(


    <Router basename={process.env.PUBLIC_URL}>
      <TimeLineContextProvider>
        <ThemeProvider theme={appTheme}>
          <App />
        </ThemeProvider>
      </TimeLineContextProvider>
    </Router>
    

);


