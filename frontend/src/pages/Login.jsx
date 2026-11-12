import { useState } from "react";
import { HeartPulse, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
    const location = useLocation();
    const navigate = useNavigate();
    const { login } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        rememberMe: false,
    });

    const handleChange = (event) => {
        const { name, value, checked, type } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);

        try {
            const response = await login({
                email: formData.email.trim(),
                password: formData.password,
            });

            toast.success("Login successful!");

            // Redirect to originally requested page if available
            const redirectTo = location.state?.from;

            if (redirectTo) {
                navigate(redirectTo, { replace: true });
            } else {
                // Default role-based navigation
                switch (response.role) {
                    case "ADMIN":
                        navigate("/admin/dashboard", { replace: true });
                        break;

                    case "DOCTOR":
                        navigate("/doctor/dashboard", { replace: true });
                        break;

                    case "PATIENT":
                        navigate("/patient/dashboard", { replace: true });
                        break;

                    default:
                        toast.error("Unsupported account role.");
                }
            }
        } catch (error) {
            const status = error.response?.status;

            if (status === 401) {
                toast.error("Invalid email or password.");
            } else if (status === 403) {
                toast.error("Account inactive or access denied.");
            } else if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else if (error.request) {
                toast.error("Unable to connect to server.");
            } else {
                toast.error("Login failed. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
            <main id="main-content" tabIndex="-1" className="w-full max-w-md">

                {/* LOGO */}
                <div className="mb-8 text-center">
                    <Link to="/" className="inline-flex items-center gap-3">
                        <div className="rounded-xl bg-cyan-600 p-3 text-white">
                            <HeartPulse size={30} />
                        </div>

                        <span className="text-3xl font-extrabold text-slate-900">
                            Medi<span className="text-cyan-600">Care</span>
                        </span>
                    </Link>

                    <p className="mt-3 text-sm text-slate-500">
                        Healthcare Administration Console
                    </p>
                </div>

                {/* LOGIN CARD */}
                <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-lg sm:p-10">

                    <div className="mb-8 text-center">
                        <h1 className="text-2xl font-bold text-slate-900">
                            Welcome Back!
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            Sign in to access your MediCare Plus account.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* EMAIL */}
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Email Address
                            </label>

                            <div className="relative">
                                <Mail
                                    size={19}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    autoComplete="email"
                                    required
                                    className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                                />
                            </div>
                        </div>

                        {/* PASSWORD */}
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <label
                                    htmlFor="password"
                                    className="text-sm font-semibold text-slate-700"
                                >
                                    Password
                                </label>

                                <Link
                                    to="/forgot-password"
                                    state={{ email: formData.email }}
                                    className="text-xs font-semibold text-cyan-600 transition hover:text-cyan-700"
                                >
                                    Forgot Password?
                                </Link>

                            </div>

                            <div className="relative">
                                <LockKeyhole
                                    size={19}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                    required
                                    className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-12 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                                >
                                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                                </button>
                            </div>
                        </div>

                        {/* REMEMBER ME */}
                        <div className="flex items-center gap-2">
                            <input
                                id="rememberMe"
                                name="rememberMe"
                                type="checkbox"
                                checked={formData.rememberMe}
                                onChange={handleChange}
                                className="h-4 w-4 accent-cyan-600"
                            />

                            <label
                                htmlFor="rememberMe"
                                className="text-sm text-slate-600"
                            >
                                Remember me
                            </label>
                        </div>

                        {/* LOGIN BUTTON */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full rounded-xl bg-cyan-600 py-3 font-semibold text-white shadow-md transition hover:bg-cyan-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isLoading ? "Signing In..." : "Sign In"}
                        </button>

                    </form>

                    {/* REGISTER LINK */}
                    <div className="mt-7 text-center">
                        <p className="text-sm text-slate-500">
                            Don't have an account?{" "}
                            <Link
                                to="/register"
                                className="font-semibold text-cyan-600 hover:text-cyan-700"
                            >
                                Register Now
                            </Link>
                        </p>
                    </div>

                </div>

                {/* BACK TO HOME */}
                <div className="mt-6 text-center">
                    <Link
                        to="/"
                        className="text-sm font-medium text-slate-500 transition hover:text-cyan-600"
                    >
                        ← Back to Homepage
                    </Link>
                </div>

            </main>
        </div>
    );
}

export default Login;