import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";

// Pages - Public
import HomePage from "../Pages/Home";
import Service from "../Pages/Service";
import About from "../Pages/About";
import ContactPage from "../Pages/Contact";
import Product from "../Pages/Product/index";
import Cart from "../Pages/Product/sections/GetProductsInvoice/index";
import BookingPage from "../Pages/Booking/BookingPage";

// Pages - Auth
import LoginPage from "../Pages/Auth/LoginPage";
import SignUp from "../Pages/Auth/SignUp";
import OAuthSuccessHandler from "../Pages/Auth/OAuthSuccessHandler";

// Pages - Account
import MyAccount from "../Pages/Account/MyAccount";
import ChangePassword from "../Pages/Account/ChangePassword";
import EmployeeAttendanceView from "../Pages/Account/EmployeeAttendanceView";

// Pages - HR
import LeaveRequestList from "../Pages/HR/LeaveRequests/LeaveRequestList";
import LeaveRequestManagement from "../Pages/HR/LeaveRequests/LeaveRequestManagement";
import FaceProfileApprovalManagement from "../Pages/HR/Employees/FaceProfileApprovalManagement";
import HrAttendanceManagement from "../Pages/HR/Attendance/HrAttendanceManagement";
import HrDashboardPage from "../Pages/HR/Dashboard/HrDashboardPage";
import EmployeesList from "../Pages/HR/Employees/EmployeesList";
import CreateEmployeeForm from "../Pages/HR/Employees/CreateEmployeeForm";
import EmployeeDetail from "../Pages/HR/Employees/EmployeeDetail";
import DailyAttendanceView from "../Pages/HR/Attendance/DailyAttendanceView";
import ScheduleList from "../Pages/HR/Schedules/ScheduleList";
import CreateScheduleForm from "../Pages/HR/Schedules/CreateScheduleForm";

// Pages - Admin
import ClinicManagement from "../Pages/Admin/Clinics/ClinicManagement";
import AdminAttendanceManagement from "../Pages/Admin/Attendance/AdminAttendanceManagement";
import AdminStaffManagement from "../Pages/Admin/Staff/AdminStaffManagement";
import AdminSystemPage from "../Pages/Admin/System/AdminSystemPage";
import AdminLeaveApproval from "../Pages/Admin/LeaveRequests/AdminLeaveApproval";
import AdminDashboardPage from "../Pages/Admin/Dashboard/AdminDashboardPage";
// import AppointmentList from "../Pages/Admin/Appointments/AppointmentList";

// Pages - Doctor
import DoctorDashboard from "../Pages/Doctor/DoctorDashboard";
import MySchedule from "../Pages/Doctor/MySchedule";
import AppointmentDetail from "../Pages/Doctor/AppointmentDetail";
import PatientMedicalRecords from "../Pages/Doctor/PatientMedicalRecords";
import MedicalRecordDetail from "../Pages/Doctor/MedicalRecordDetail";

// Pages - Reception
import ReceptionDashboard from "../Pages/Reception/Dashboard/ReceptionDashboard";
import BookingOffline from "../Pages/Reception/BookingCRM/BookingOffline";
import PatientList from "../Pages/Reception/Patient/PatientList";

// Pages - Accountant
import AccountantRoutes from "../Pages/Product/accountant";
import ProtectedRouteAccountant from "../app/routes/ProtectedRouteAccountant";

// Layouts
import AdminLayout from "../app/layout/AdminLayouts";
import HRLayout from "../app/layout/HrLayout";
import DoctorLayout from "../app/layout/DoctorLayout";
import ReceptionLayout from "../app/layout/ReceptionLayout";

// Routes
import ProtectedRouteAdmin from "../app/routes/ProtectedRouteAdmin";
import ProtectedRouteHR from "../app/routes/ProtectedRouteHR";
import ProtectedRouteDoctor from "../app/routes/ProtectedRouteDoctor";
import ProtectedRouteReception from "../app/routes/ProtectedRouteReception";
import AuthGuard from "../app/routes/AuthGuard";

// Providers
import { NotificationProvider } from "./providers/NotificationContext";
import AppointmentList from "../Pages/Reception/Appointment/AppointmentList";
import AppointmentListDoctor from "../Pages/Doctor/AppointmentListDoctor";

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
                <Route index element={<AdminDashboardPage />} />{" "}
                <Route path="dashboard" element={<AdminDashboardPage />} />
                {/* <Route path="appointments" element={<AppointmentList />} /> */}
                <Route
                  path="attendance"
                  element={<AdminAttendanceManagement />}
                />
                <Route path="clinics" element={<ClinicManagement />} />
                <Route path="staff" element={<AdminStaffManagement />} />
                <Route path="system" element={<AdminSystemPage />} />
                <Route path="leave-requests" element={<AdminLeaveApproval />} />
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

            <Route path="/doctor" element={<ProtectedRouteDoctor />}>
              <Route element={<DoctorLayout />}>
                <Route index element={<DoctorDashboard />} />
                <Route path="dashboard" element={<DoctorDashboard />} />
                <Route path="schedule" element={<MySchedule />} />
                <Route path="appointments" element={<AppointmentListDoctor />} />
                <Route path="appointments/:appointmentId" element={<AppointmentDetail />} />
                <Route path="patients/:patientId/records" element={<PatientMedicalRecords />} />
                <Route path="patients/:patientId/records/:recordId" element={<MedicalRecordDetail />} />
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