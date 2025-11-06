import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "../pages/Home/index";
import LoginPage from "../pages/Auth/LoginPage";
import SignUp from "../pages/Auth/SignUp";
import OAuthSuccessHandler from "../pages/Auth/OAuthSuccessHandler";
import MyAccount from "../pages/Account/MyAccount";
import ChangePassword from "../pages/Account/ChangePassword";
import AdminLayout from "../app/layout/AdminLayouts";
import HRLayout from "../app/layout/HrLayout";
import AdminDashboardPage from "../pages/Admin/Dashboard/AdminDashboardPage";
import ProtectedRouteAdmin from "../app/routes/ProtectedRouteAdmin";
import ProtectedRouteHR from "../app/routes/ProtectedRouteHR";
import AppointmentList from "../pages/Admin/Appointments/AppointmentList";
import HrDashboardPage from "../pages/HR/Dashboard/HrDashboardPage";
import ScheduleList from "../pages/HR/Schedules/ScheduleList";
import CreateScheduleForm from "../pages/HR/Schedules/CreateScheduleForm";
import EmployeesList from "../pages/HR/Employees/EmployeesList";
import CreateEmployeeForm from "../pages/HR/Employees/CreateEmployeeForm";
import EmployeeDetail from "../pages/HR/Employees/EmployeeDetail";
import Service from "../pages/Service";
import About from "../pages/About";
import ContactPage from "../pages/Contact";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/service" element={<Service />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<SignUp />} />
        <Route path="/oauth/success" element={<OAuthSuccessHandler />} />
        <Route path="/my-account" element={<MyAccount />} />
        <Route path="/change-password" element={<ChangePassword />} />

        <Route path="/admin" element={<ProtectedRouteAdmin />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />{" "}
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="appointments" element={<AppointmentList />} />
          </Route>
        </Route>
        
        <Route path="/hr" element={<ProtectedRouteHR />}>
          <Route element={<HRLayout />}>
            <Route path="dashboard" element={<HrDashboardPage />} />
            <Route path="employees" element={<EmployeesList />} />
            <Route path="employees/create" element={<CreateEmployeeForm />} />
            <Route path="employees/:id" element={<EmployeeDetail />} />
            <Route path="schedules" element={<ScheduleList />} />
            <Route path="schedules/create" element={<CreateScheduleForm />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
