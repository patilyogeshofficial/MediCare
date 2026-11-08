import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

import PatientDashboard from "./pages/PatientDashboard";
import AppointmentBooking from "./pages/AppointmentBooking";
import AdminDashboard from "./pages/AdminDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";

import ProtectedRoute from "./components/ProtectedRoute";
import VerifyOtp from "./pages/VerifyOtp";
import ResetPassword from "./pages/ResetPassword";
import AllDoctors from "./pages/AllDoctors";

function App() {
  return (
    <>
      <Toaster position="top-right" />

      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ADMIN ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route
            path="/admin/dashboard"
            element={<AdminDashboard />}
          />
        </Route>

        {/* DOCTOR ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={["DOCTOR"]} />}>
          <Route
            path="/doctor/dashboard"
            element={<DoctorDashboard />}
          />
        </Route>

        {/* PATIENT ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={["PATIENT"]} />}>
          <Route
            path="/patient/dashboard"
            element={<PatientDashboard />}
          />

          <Route
            path="/patient/appointments/book"
            element={<AppointmentBooking />}
          />
        </Route>
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/doctors" element={<AllDoctors />} />
      </Routes>
    </>
  );
}

export default App;