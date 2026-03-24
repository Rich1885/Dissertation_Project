import "./App.css";
import Header from "./components/Header";
import Swap from "./components/Swap";
import Tokens from "./components/Tokens";
import LandingPage from "./components/LandingPage"
import { Routes, Route, useLocation } from "react-router-dom";

function App() {
  const location = useLocation();

  return (
    <div className="App">
      {location.pathname !== "/" && <Header />}

      <Routes>
        <Route path="/" element={<LandingPage />} />
      </Routes>

      <div className="mainWindow">
        <Routes>
          <Route path="/swap" element={<Swap />} />
          <Route path="/tokens" element={<Tokens />} />
        </Routes>
      </div>
    </div>
  );
}
export default App;