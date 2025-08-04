import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./Pages/Public/HomePage";
import LoginPage from "./Pages/Public/LoginPage";
import SignUp from "./Pages/Public/SignUp";
import OAuthSuccessHandler from "./Pages/User/OAuthSuccessHandler";
import MyAccount from "./Pages/User/MyAccount";
import ChangePassword from "./Pages/User/ChangePassword";
import AdminLayout from "./Pages/Admin/AdminLayouts";
import AdminDashboardPage from "./Pages/Admin/Dashboard/AdminDashboardPage";
import ProtectedRouteAdmin from "./components/ProtectedRouteAdmin";

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

        <Route path="/admin" element={<ProtectedRouteAdmin />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboardPage />} />
        </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
