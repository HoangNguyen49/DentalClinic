import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// --- Public Pages ---
import HomePage from "../Pages/Home/index";
import Service from "../Pages/Service";
import About from "../Pages/About";
import ContactPage from "../Pages/Contact";

// --- Auth Pages ---
import LoginPage from "../Pages/Auth/LoginPage";
import SignUp from "../Pages/Auth/SignUp";
import OAuthSuccessHandler from "../Pages/Auth/OAuthSuccessHandler";
import ResetPassword from "../Pages/Auth/ResetPassword"; // [CỦA TUẤN]
import VerifyAccount from "../Pages/Auth/VerifyAccount"; // [CỦA TUẤN]

// --- User Pages ---
import MyAccount from "../Pages/Account/MyAccount";
import ChangePassword from "../Pages/Account/ChangePassword";
import EmployeeAttendanceView from "../Pages/Account/EmployeeAttendanceView";

// --- Admin Pages ---
import AdminLayout from "../app/layout/AdminLayouts";
import AdminDashboardPage from "../Pages/Admin/Dashboard/AdminDashboardPage";
import ProtectedRouteAdmin from "../app/routes/ProtectedRouteAdmin";
import AppointmentList from "../Pages/Admin/Appointments/AppointmentList";
import ClinicManagement from "../Pages/Admin/Clinics/ClinicManagement";
import AdminAttendanceManagement from "../Pages/Admin/Attendance/AdminAttendanceManagement";
import AdminStaffManagement from "../Pages/Admin/Staff/AdminStaffManagement";

// --- HR Pages ---
import HRLayout from "../app/layout/HrLayout";
import ProtectedRouteHR from "../app/routes/ProtectedRouteHR";
import HrDashboardPage from "../Pages/HR/Dashboard/HrDashboardPage";
import ScheduleList from "../Pages/HR/Schedules/ScheduleList";
import CreateScheduleForm from "../Pages/HR/Schedules/CreateScheduleForm";
import EmployeesList from "../Pages/HR/Employees/EmployeesList";
import CreateEmployeeForm from "../Pages/HR/Employees/CreateEmployeeForm";
import EmployeeDetail from "../Pages/HR/Employees/EmployeeDetail";
import DailyAttendanceView from "../Pages/HR/Attendance/DailyAttendanceView";
import HrAttendanceManagement from "../Pages/HR/Attendance/HrAttendanceManagement"; // [CỦA LONG]
import LeaveRequestList from "../Pages/HR/LeaveRequests/LeaveRequestList"; // [CỦA LONG]
import LeaveRequestManagement from "../Pages/HR/LeaveRequests/LeaveRequestManagement"; // [CỦA LONG]

// --- Reception Pages [CỦA LONG] ---
import ReceptionLayout from "../app/layout/ReceptionLayout";
import ProtectedRouteReception from "../app/routes/ProtectedRouteReception";
import ReceptionDashboard from "../Pages/Reception/Dashboard/ReceptionDashboard";
import BookingOffline from "../Pages/Reception/BookingCRM/BookingOffline";
import PatientList from "../Pages/Reception/Patient/PatientList";

// --- Product & Accountant [CỦA LONG] ---
import Product from "../Pages/Product/index";
import AccountantRoutes from "../Pages/Product/accountant";
import Cart from "../Pages/Product/sections/GetProductsInvoice/index";
import ProtectedRouteAccountant from "../app/routes/ProtectedRouteAccountant";
import PaypalSuccessPage from "../Pages/Product/sections/GetProductsInvoice/Payments/paypal/PaypalSuccessPage";

// --- Booking ---
import BookingPage from "../Pages/Booking/BookingPage";

// --- Providers & Guards ---
import { NotificationProvider } from "./providers/NotificationContext"; // [QUAN TRỌNG]
import AuthGuard from "../app/routes/AuthGuard";

// --- Patient Pages [CỦA TUẤN + MỚI] ---
import AppointmentSchedule from "../Pages/Patient/AppointmentSchedule";
import PatientDashboardPage from "../Pages/Patient/Dashboard/PatientDashboardPage"; // [MỚI - Dashboard]
import PatientProfilePage from "../Pages/Patient/Profile/PatientProfilePage";


function App() {
  return (
    // Provider này của Long dùng để hiện thông báo Realtime, giữ lại nhé
    <NotificationProvider>
      <Router>
        <Routes>
          {/* ========================================================= */}
          {/* 1. PUBLIC ROUTES (Ai cũng vào được)                       */}
          {/* ========================================================= */}
          <Route path="/" element={<HomePage />} />
          <Route path="/service" element={<Service />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<ContactPage />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<SignUp />} />
          <Route path="/oauth/success" element={<OAuthSuccessHandler />} />
          
          {/* [CỦA TUẤN] - Routes khôi phục tài khoản */}
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-account" element={<VerifyAccount />} />

          {/* [CỦA LONG] - Shop Routes */}
          <Route path="/products/*" element={<Product />} />
          <Route path="/cart/*" element={<Cart />} />
          <Route path="/paypal/success" element={<PaypalSuccessPage />} />


          {/* ========================================================= */}
          {/* 2. PROTECTED ROUTES (Phải đăng nhập mới vào được)         */}
          {/* ========================================================= */}
          <Route element={<AuthGuard />}>
            
            {/* User Cá nhân */}
            <Route path="/my-account" element={<MyAccount />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/my-attendance" element={<EmployeeAttendanceView />} />
            <Route path="/my-leave-requests" element={<LeaveRequestList />} />
            <Route path="/booking" element={<BookingPage />} />

            {/* --- PATIENT ROUTES --- */}
            <Route path="/my-appointments" element={<AppointmentSchedule />} />
            {/* [MỚI] Dashboard cho Patient */}
            <Route path="/patient-dashboard" element={<PatientDashboardPage />} />
            <Route path="/patient-profile" element={<PatientProfilePage />} />

            {/* --- ADMIN ROLE --- */}
            <Route path="/admin" element={<ProtectedRouteAdmin />}>
              <Route element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="appointments" element={<AppointmentList />} />
                <Route path="attendance" element={<AdminAttendanceManagement />} />
                <Route path="clinics" element={<ClinicManagement />} />
                <Route path="staff" element={<AdminStaffManagement />} />
              </Route>
            </Route>

            {/* --- HR ROLE --- */}
            <Route path="/hr" element={<ProtectedRouteHR />}>
              <Route element={<HRLayout />}>
                <Route path="dashboard" element={<HrDashboardPage />} />
                <Route path="employees" element={<EmployeesList />} />
                <Route path="employees/create" element={<CreateEmployeeForm />} />
                <Route path="employees/:id" element={<EmployeeDetail />} />
                <Route path="attendance" element={<DailyAttendanceView />} />
                <Route path="attendance/explanations" element={<HrAttendanceManagement />} />
                <Route path="schedules" element={<ScheduleList />} />
                <Route path="schedules/create" element={<CreateScheduleForm />} />
                <Route path="leave-requests" element={<LeaveRequestManagement />} />
              </Route>
            </Route>

            {/* --- RECEPTION ROLE [CỦA LONG] --- */}
            <Route path="/reception" element={<ProtectedRouteReception />}>
              <Route element={<ReceptionLayout />}>
                <Route path="dashboard" element={<ReceptionDashboard />} />
                <Route path="walk-in" element={<BookingOffline />} />
                <Route path="appointments" element={<AppointmentList />} />
                <Route path="patients" element={<PatientList />} />
              </Route>
            </Route>

            {/* --- ACCOUNTANT ROLE [CỦA LONG] --- */}
            <Route element={<ProtectedRouteAccountant />}>
              <Route path="/accountant/*" element={<AccountantRoutes />} />
            </Route>

          </Route> {/* End AuthGuard */}

        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={3000} />
    </NotificationProvider>
  );
}

export default App;