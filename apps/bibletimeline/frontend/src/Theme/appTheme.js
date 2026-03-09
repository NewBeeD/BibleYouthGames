import { createTheme } from "@mui/material";

export const appTheme = createTheme({

  palette: {
    primary: {

      main: '#173174'
    },
    secondary: {

      main: '#1976d2'
    }
  },
  typography: {
    fontFamily: [
      'Ubuntu Condensed',
      'sans-serif',
    ].join(','),
  },


})
