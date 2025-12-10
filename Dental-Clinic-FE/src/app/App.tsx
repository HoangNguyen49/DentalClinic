import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import HomePage from "../pages/Home/index";
import LoginPage from "../pages/Auth/LoginPage";
import SignUp from "../pages/Auth/SignUp";
import OAuthSuccessHandler from "../pages/Auth/OAuthSuccessHandler";
import MyAccount from "../pages/Account/MyAccount";
import ChangePassword from "../pages/Account/ChangePassword";
import EmployeeAttendanceView from "../pages/Account/EmployeeAttendanceView";
import AdminLayout from "../app/layout/AdminLayouts";
import HRLayout from "../app/layout/HrLayout";
import AdminDashboardPage from "../pages/Admin/Dashboard/AdminDashboardPage";
import ProtectedRouteAdmin from "./routes/ProtectedRouteAdmin";
import ProtectedRouteHR from "../app/routes/ProtectedRouteHR";
import HrDashboardPage from "../pages/HR/Dashboard/HrDashboardPage";
import ScheduleList from "../pages/HR/Schedules/ScheduleList";
import CreateScheduleForm from "../pages/HR/Schedules/CreateScheduleForm";
import EmployeesList from "../pages/HR/Employees/EmployeesList";
import CreateEmployeeForm from "../pages/HR/Employees/CreateEmployeeForm";
import EmployeeDetail from "../pages/HR/Employees/EmployeeDetail";
import DailyAttendanceView from "../pages/HR/Attendance/DailyAttendanceView";
import LeaveRequestList from "../pages/HR/LeaveRequests/LeaveRequestList";
import LeaveRequestManagement from "../pages/HR/LeaveRequests/LeaveRequestManagement";
import FaceProfileApprovalManagement from "../pages/HR/Employees/FaceProfileApprovalManagement";
import Service from "../pages/Service";
import About from "../pages/About";
import ContactPage from "../pages/Contact";
import Product from "../pages/Product/index";
import AccountantRoutes from "../pages/Product/accountant";
import Cart from "../pages/Product/sections/GetProductsInvoice/index";
import ProtectedRouteAccountant from "../app/routes/ProtectedRouteAccountant";
import ClinicManagement from "../pages/Admin/Clinics/ClinicManagement";
import AdminAttendanceManagement from "../pages/Admin/Attendance/AdminAttendanceManagement";
import HrAttendanceManagement from "../pages/HR/Attendance/HrAttendanceManagement";
import AdminStaffManagement from "../pages/Admin/Staff/AdminStaffManagement";
import AdminSystemPage from "../pages/Admin/System/AdminSystemPage";
import AdminLeaveApproval from "../pages/Admin/LeaveRequests/AdminLeaveApproval";
import AdminReportsPage from "../pages/Admin/Reports/AdminReportsPage";
import AdminCustomerManagement from "../pages/Admin/Customers/AdminCustomerManagement";
import AdminInventoryManagement from "../pages/Admin/Inventory/AdminInventoryManagement";
import ReceptionLayout from "../app/layout/ReceptionLayout";
import ProtectedRouteReception from "../app/routes/ProtectedRouteReception";
import ReceptionDashboard from "../pages/Reception/Dashboard/ReceptionDashboard";
import BookingOffline from "../pages/Reception/BookingCRM/BookingOffline";
import AppointmentList from "../pages/Admin/Appointments/AppointmentList";
import BookingPage from "../pages/Booking/BookingPage";
import PatientList from "../pages/Reception/Patient/PatientList";
import { NotificationProvider } from "./providers/NotificationContext";
import AuthGuard from "./routes/AuthGuard";

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/service" element={<Service />} />
          <Route path="/products/*" element={<Product />} />
          <Route path="/cart/*" element={<Cart />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<SignUp />} />
          <Route path="/oauth/success" element={<OAuthSuccessHandler />} />
          <Route path="/my-account" element={<MyAccount />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/my-attendance" element={<EmployeeAttendanceView />} />
          <Route path="/my-leave-requests" element={<LeaveRequestList />} />
          <Route path="/booking" element={<BookingPage />} />

          <Route element={<AuthGuard />}>
            <Route path="/admin" element={<ProtectedRouteAdmin />}>
              <Route element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route
                  path="attendance"
                  element={<AdminAttendanceManagement />}
                />
                <Route path="clinics" element={<ClinicManagement />} />
                <Route path="staff" element={<AdminStaffManagement />} />
                <Route path="system" element={<AdminSystemPage />} />
                <Route path="leave-requests" element={<AdminLeaveApproval />} />
                <Route path="reports" element={<AdminReportsPage />} />
                <Route path="customers" element={<AdminCustomerManagement />} />
                <Route path="inventory" element={<AdminInventoryManagement />} />
              </Route>
            </Route>

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
                <Route path="face-profile-approvals" element={<FaceProfileApprovalManagement />} />
              </Route>
            </Route>

            <Route path="/reception" element={<ProtectedRouteReception />}>
              <Route element={<ReceptionLayout />}>
                <Route path="dashboard" element={<ReceptionDashboard />} />
                <Route path="walk-in" element={<BookingOffline />} />
                <Route path="appointments" element={<AppointmentList />} />
                <Route path="patients" element={<PatientList />} />
              </Route>
            </Route>

            <Route element={<ProtectedRouteAccountant />}>
              <Route path="/accountant/*" element={<AccountantRoutes />} />
            </Route>
          </Route>
        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={3000} />
    </NotificationProvider>
  );
}

export default App;