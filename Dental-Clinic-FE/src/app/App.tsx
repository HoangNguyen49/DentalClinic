import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "../pages/Home/index";
import LoginPage from "../pages/Auth/LoginPage";
import SignUp from "../pages/Auth/SignUp";
import OAuthSuccessHandler from "../pages/Auth/OAuthSuccessHandler";
import MyAccount from "../pages/Account/MyAccount";
import ChangePassword from "../pages/Account/ChangePassword";
import AdminLayout from "../app/layout/AdminLayouts";
import AdminDashboardPage from "../pages/Admin/Dashboard/AdminDashboardPage";
import ProtectedRouteAdmin from "../app/routes/ProtectedRouteAdmin";
import AppointmentList from "../pages/Admin/Appointments/AppointmentList";
import Service from "../pages/Service";
import About from "../pages/About";
import ContactPage from "../pages/Contact";
import Product from "../pages/Product";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/service" element={<Service />} />
        <Route path="/products/*" element={<Product />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<SignUp />} />
        <Route path="/google-success" element={<OAuthSuccessHandler />} />
        <Route path="/my-account" element={<MyAccount />} />
        <Route path="/change-password" element={<ChangePassword />} />

        <Route path="/admin" element={<ProtectedRouteAdmin />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />{" "}
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="appointments" element={<AppointmentList />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
