import { PageTitle } from "../components/PageTitle"
import { Box } from "@mui/material"



export const Homepage = () => {


  return (
    <Box
      minHeight="100vh"
      sx={{
        background: 'radial-gradient(circle at 10% 10%, #1f4aa5 0%, #173174 35%, #1f2833 65%, #0b0c10 100%)'
      }}
    >
      <PageTitle />
    </Box>
  )
}
