import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// --- PUBLIC PAGES ---
import HomePage from "../Pages/Home";
import Service from "../Pages/Service";
import About from "../Pages/About";
import ContactPage from "../Pages/Contact";
import Product from "../Pages/Product/index";
import Cart from "../Pages/Product/sections/GetProductsInvoice/index";
import BookingPage from "../Pages/Booking/BookingPage";
// import PaypalSuccessPage from "../Pages/Product/sections/GetProductsInvoice/Payments/paypal/PaypalSuccessPage";

// --- AUTH PAGES ---
import LoginPage from "../Pages/Auth/LoginPage";
import SignUp from "../Pages/Auth/SignUp";
import OAuthSuccessHandler from "../Pages/Auth/OAuthSuccessHandler";
import ResetPassword from "../Pages/Auth/ResetPassword"; // [CỦA TUẤN]
import VerifyAccount from "../Pages/Auth/VerifyAccount"; // [CỦA TUẤN]

// --- USER/ACCOUNT PAGES ---
import MyAccount from "../Pages/Account/MyAccount";
import ChangePassword from "../Pages/Account/ChangePassword";
import EmployeeAttendanceView from "../Pages/Account/EmployeeAttendanceView";

// --- HR PAGES ---
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

// --- ADMIN PAGES ---
import ClinicManagement from "../Pages/Admin/Clinics/ClinicManagement";
import AdminAttendanceManagement from "../Pages/Admin/Attendance/AdminAttendanceManagement";
import AdminStaffManagement from "../Pages/Admin/Staff/AdminStaffManagement";
import AdminSystemPage from "../Pages/Admin/System/AdminSystemPage";
import AdminLeaveApproval from "../Pages/Admin/LeaveRequests/AdminLeaveApproval";
import AdminReportsPage from "../Pages/Admin/Reports/AdminReportsPage";
import AdminCustomerManagement from "../Pages/Admin/Customers/AdminCustomerManagement";
import AdminInventoryManagement from "../Pages/Admin/Inventory/AdminInventoryManagement";
import AdminDashboardPage from "../Pages/Admin/Dashboard/AdminDashboardPage";
import AdminSalaryConfigPage from "../Pages/Admin/Payroll/SalaryConfigPage";

// --- DOCTOR PAGES ---
import DoctorDashboard from "../Pages/Doctor/DoctorDashboard";
import MySchedule from "../Pages/Doctor/MySchedule";
import AppointmentDetail from "../Pages/Doctor/AppointmentDetail";
import PatientMedicalRecords from "../Pages/Doctor/PatientMedicalRecords";
import MedicalRecordDetail from "../Pages/Doctor/MedicalRecordDetail";
import AppointmentListDoctor from "../Pages/Doctor/AppointmentListDoctor";

// --- RECEPTION PAGES ---
import ReceptionDashboard from "../Pages/Reception/Dashboard/ReceptionDashboard";
import BookingOffline from "../Pages/Reception/BookingCRM/BookingOffline";
import AppointmentListReception from "../Pages/Reception/Appointment/AppointmentList";
import PatientList from "../Pages/Reception/Patient/PatientList";
import InvoiceList from "../Pages/Reception/Invoice/InvoiceList";

// --- ACCOUNTANT PAGES ---
import AccountantRoutes from "../Pages/Product/accountant";

// --- PATIENT PAGES [CỦA TUẤN] ---
import AppointmentSchedule from "../Pages/Patient/AppointmentSchedule";
import PatientDashboardPage from "../Pages/Patient/Dashboard/PatientDashboardPage";
import PatientProfilePage from "../Pages/Patient/Profile/PatientProfilePage";
import PatientHistoryPage from '../Pages/Patient/History/PatientHistoryPage';

// --- NOTIFICATION PAGES ---
import NotificationPage from "../Pages/Notifications/NotificationPage";

// --- LAYOUTS ---
import AdminLayout from "./layout/AdminLayouts";
import HRLayout from "./layout/HrLayout";
import DoctorLayout from "./layout/DoctorLayout";
import ReceptionLayout from "./layout/ReceptionLayout";

// --- ROUTES & GUARDS ---
import ProtectedRouteAdmin from "./routes/ProtectedRouteAdmin";
import ProtectedRouteHR from "./routes/ProtectedRouteHR";
import ProtectedRouteDoctor from "./routes/ProtectedRouteDoctor";
import ProtectedRouteReception from "./routes/ProtectedRouteReception";
import ProtectedRouteAccountant from "./routes/ProtectedRouteAccountant";
import AuthGuard from "./routes/AuthGuard";

// --- PROVIDERS ---
import { NotificationProvider } from "./providers/NotificationContext";
import PaymentResult from "../Pages/Booking/DepositService/PaymentResult";

function App() {
    return (
        <NotificationProvider>
            <Router>
                <Routes>
                    {/* --- PUBLIC --- */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/service" element={<Service />} />
                    <Route path="/products/*" element={<Product />} />
                    <Route path="/cart/*" element={<Cart />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/about" element={<About />} />
                    {/* <Route path="/paypal/success" element={<PaypalSuccessPage />} /> Long thêm */}

                    {/* --- AUTH --- */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<SignUp />} />
                    <Route path="/oauth/success" element={<OAuthSuccessHandler />} />
                    <Route path="/reset-password" element={<ResetPassword />} /> {/* Của Tuấn */}
                    <Route path="/verify-account" element={<VerifyAccount />} /> {/* Của Tuấn */}
                    <Route path="/booking/payment-result" element={<PaymentResult />} />

                    {/* --- PROTECTED ROUTES --- */}
                    <Route element={<AuthGuard />}>
                        
                        {/* USER COMMON */}
                        <Route path="/my-account" element={<MyAccount />} />
                        <Route path="/change-password" element={<ChangePassword />} />
                        <Route path="/my-attendance" element={<EmployeeAttendanceView />} />
                        <Route path="/my-leave-requests" element={<LeaveRequestList />} />
                        <Route path="/booking" element={<BookingPage />} />
                        <Route path="/notifications" element={<NotificationPage />} />

                        {/* PATIENT ROUTES [CỦA TUẤN] */}
                        <Route path="/my-appointments" element={<AppointmentSchedule />} />
                        <Route path="/patient-dashboard" element={<PatientDashboardPage />} />
                        <Route path="/patient-profile" element={<PatientProfilePage />} />
                        <Route path="/patient-history" element={<PatientHistoryPage />} />

                        {/* --- ADMIN --- */}
                        <Route path="/admin" element={<ProtectedRouteAdmin />}>
                            <Route element={<AdminLayout />}>
                                <Route index element={<AdminDashboardPage />} />
                                <Route path="dashboard" element={<AdminDashboardPage />} />
                                <Route path="attendance" element={<AdminAttendanceManagement />} />
                                <Route path="clinics" element={<ClinicManagement />} />
                                <Route path="staff" element={<AdminStaffManagement />} />
                                <Route path="system" element={<AdminSystemPage />} />
                                <Route path="leave-requests" element={<AdminLeaveApproval />} />
                                <Route path="reports" element={<AdminReportsPage />} />
                                <Route path="customers" element={<AdminCustomerManagement />} />
                                <Route path="inventory" element={<AdminInventoryManagement />} />
                                <Route path="payroll/contract" element={<AdminSalaryConfigPage />} />
                            </Route>
                        </Route>

                        {/* --- HR --- */}
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

                        {/* --- RECEPTION --- */}
                        <Route path="/reception" element={<ProtectedRouteReception />}>
                            <Route element={<ReceptionLayout />}>
                                <Route path="dashboard" element={<ReceptionDashboard />} />
                                <Route path="walk-in" element={<BookingOffline />} />
                                <Route path="appointments" element={<AppointmentListReception />} />
                                <Route path="patients" element={<PatientList />} />
                                <Route path="invoices" element={<InvoiceList />} />
                            </Route>
                        </Route>

                        {/* --- DOCTOR --- */}
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

                        {/* --- ACCOUNTANT --- */}
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