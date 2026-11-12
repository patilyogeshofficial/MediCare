import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { HeartPulse, Mail, ArrowLeft, Send } from "lucide-react";
import toast from "react-hot-toast";

import api from "../services/api";

function ForgotPassword() {
    const location = useLocation();
    const navigate = useNavigate();

    const [email, setEmail] = useState(
        location.state?.email || ""
    );

    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        setIsLoading(true);

        try {
            await api.post("/auth/forgot-password", {
                email: email.trim(),
            });

            toast.success("OTP request submitted successfully!");

            navigate("/verify-otp", {
                state: { email: email.trim() },
            });

        } catch (error) {
            const message = error.response?.data;

            toast.error(
                typeof message === "string"
                    ? message
                    : message?.message || "Unable to process your request."
            );

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

                {/* FORGOT PASSWORD CARD */}
                <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-lg sm:p-10">

                    <div className="mb-6 flex justify-center">
                        <div className="rounded-full bg-cyan-50 p-4 text-cyan-600">
                            <Mail size={30} />
                        </div>
                    </div>

                    <div className="mb-8 text-center">

                        <h1 className="text-2xl font-bold text-slate-900">
                            Forgot Password?
                        </h1>

                        <p className="mt-3 text-sm leading-6 text-slate-500">
                            No worries! Enter your registered email address
                            and we'll send you a password reset OTP.
                        </p>

                    </div>

                    {/* EMAIL FORM */}
                    <form onSubmit={handleSubmit} className="space-y-5">

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
                                    type="email"
                                    name="email"
                                    placeholder="Enter your registered email"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    autoComplete="email"
                                    required
                                    className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                                />

                            </div>

                        </div>

                        {/* SEND OTP */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 font-semibold text-white shadow-md transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >

                            <Send size={18} />

                            {isLoading ? "Sending OTP..." : "Send OTP"}

                        </button>

                    </form>

                    {/* BACK TO LOGIN */}
                    <div className="mt-7 text-center">

                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-600 transition hover:text-cyan-700"
                        >
                            <ArrowLeft size={17} />
                            Back to Login
                        </Link>

                    </div>

                </div>

                {/* BACK TO HOMEPAGE */}
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

export default ForgotPassword;