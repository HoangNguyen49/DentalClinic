import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./Pages/Public/HomePage";
import LoginPage from "./Pages/Public/LoginPage"; 
import SignUp from "./Pages/Public/SignUp";
import OAuthSuccessHandler from "./Pages/User/OAuthSuccessHandler";
import MyAccount from "./Pages/User/MyAccount";
import ChangePassword from "./Pages/User/ChangePassword";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<SignUp />} />
        <Route path="/google-success" element={<OAuthSuccessHandler />} />
        <Route path="/my-account" element={<MyAccount />} />
        <Route path="/change-password" element={<ChangePassword />} />
      </Routes>
    </Router>
  );
}

export default App;
