import { Gamepage } from "./pages/Gamepage";
import { Homepage } from "./pages/Homepage";
import {Routes, Route} from 'react-router-dom'
import { LeaderBoard } from "./pages/LeaderBoard";
import { PvpCreateMatch } from "./pages/PvpCreateMatch";
import { PvpJoinMatch } from "./pages/PvpJoinMatch";
import { PvpLobby } from "./pages/PvpLobby";
import { PvpRound } from "./pages/PvpRound";
import { PvpResults } from "./pages/PvpResults";




function App() {
  return (
    <div className="App">

      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/game" element={<Gamepage />} />
        <Route path="/leaderboard" element={<LeaderBoard/>} />  
        <Route path="/pvp/create" element={<PvpCreateMatch />} />
        <Route path="/pvp/join" element={<PvpJoinMatch />} />
        <Route path="/pvp/lobby" element={<PvpLobby />} />
        <Route path="/pvp/round" element={<PvpRound />} />
        <Route path="/pvp/results" element={<PvpResults />} />
      </Routes> 

    </div>
  );
}

export default App;
