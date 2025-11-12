import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "../Pages/Home/index";
import LoginPage from "../Pages/Auth/LoginPage";
import SignUp from "../Pages/Auth/SignUp";
import OAuthSuccessHandler from "../Pages/Auth/OAuthSuccessHandler";
import MyAccount from "../Pages/Account/MyAccount";
import ChangePassword from "../Pages/Account/ChangePassword";
import EmployeeAttendanceView from "../Pages/Account/EmployeeAttendanceView";
import AdminLayout from "../app/layout/AdminLayouts";
import HRLayout from "../app/layout/HrLayout";
import AdminDashboardPage from "../Pages/Admin/Dashboard/AdminDashboardPage";
import ProtectedRouteAdmin from "../app/routes/ProtectedRouteAdmin";
import ProtectedRouteHR from "../app/routes/ProtectedRouteHR";
import AppointmentList from "../Pages/Admin/Appointments/AppointmentList";
import HrDashboardPage from "../Pages/HR/Dashboard/HrDashboardPage";
import ScheduleList from "../Pages/HR/Schedules/ScheduleList";
import CreateScheduleForm from "../Pages/HR/Schedules/CreateScheduleForm";
import EmployeesList from "../Pages/HR/Employees/EmployeesList";
import CreateEmployeeForm from "../Pages/HR/Employees/CreateEmployeeForm";
import EmployeeDetail from "../Pages/HR/Employees/EmployeeDetail";
import DailyAttendanceView from "../Pages/HR/Attendance/DailyAttendanceView";
import Service from "../Pages/Service";
import About from "../Pages/About";
import ContactPage from "../Pages/Contact";
import ClinicManagement from "../Pages/Admin/Clinics/ClinicManagement";
import AdminAttendanceManagement from "../Pages/Admin/Attendance/AdminAttendanceManagement";
import AdminStaffManagement from "../Pages/Admin/Staff/AdminStaffManagement";

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
        <Route path="/my-attendance" element={<EmployeeAttendanceView />} />

        <Route path="/admin" element={<ProtectedRouteAdmin />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />{" "}
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="appointments" element={<AppointmentList />} />
            <Route path="attendance" element={<AdminAttendanceManagement />} />
            <Route path="clinics" element={<ClinicManagement />} />
            <Route path="staff" element={<AdminStaffManagement />} />
          </Route>
        </Route>
        
        <Route path="/hr" element={<ProtectedRouteHR />}>
          <Route element={<HRLayout />}>
            <Route path="dashboard" element={<HrDashboardPage />} />
            <Route path="employees" element={<EmployeesList />} />
            <Route path="employees/create" element={<CreateEmployeeForm />} />
            <Route path="employees/:id" element={<EmployeeDetail />} />
            <Route path="attendance" element={<DailyAttendanceView />} />
            <Route path="schedules" element={<ScheduleList />} />
            <Route path="schedules/create" element={<CreateScheduleForm />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;