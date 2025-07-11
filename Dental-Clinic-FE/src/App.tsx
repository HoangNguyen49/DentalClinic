import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./Pages/HomePage";
import LoginPage from "./Pages/LoginPage"; 
import SignUp from "./Pages/SignUp";
import OAuthSuccessHandler from "./Pages/OAuthSuccessHandler";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<SignUp />} />
        <Route path="/oauth-success" element={<OAuthSuccessHandler />} />
      </Routes>
    </Router>
  );
}

export default App;
