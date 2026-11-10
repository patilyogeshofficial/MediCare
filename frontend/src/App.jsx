
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
import ServiceDetails from "./pages/ServiceDetails";
import HealthcareServiceDetails from "./pages/HealthcareServiceDetails";
import ScrollToTop from "./components/ScrollToTop";
import AllServices from "./pages/AllServices";

function App() {
  return (
    <>
      <Toaster position="top-right" />

      {/* Automatically scroll to top on page navigation */}
      <ScrollToTop />

      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/doctors" element={<AllDoctors />} />

        {/* MEDICAL SERVICE ROUTES */}
        <Route path="/services/:serviceSlug" element={<ServiceDetails />} />

        {/* HEALTHCARE SERVICE ROUTES */}
        <Route
          path="/healthcare-services/:serviceSlug"
          element={<HealthcareServiceDetails />}
        />
        <Route path="/healthcare-services" element={<AllServices />} />

        {/* ADMIN ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>

        {/* DOCTOR ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={["DOCTOR"]} />}>
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        </Route>

        {/* PATIENT ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={["PATIENT"]} />}>
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route
            path="/patient/appointments/book"
            element={<AppointmentBooking />}
          />
        </Route>
      </Routes>
    </>
  );
}

export default App;
