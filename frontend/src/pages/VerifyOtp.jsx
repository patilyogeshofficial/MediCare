import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { HeartPulse, ShieldCheck, ArrowLeft, MailCheck } from "lucide-react";
import toast from "react-hot-toast";

import api from "../services/api";

function VerifyOtp() {
    const location = useLocation();
    const navigate = useNavigate();

    const email = location.state?.email || "";

    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);

    if (!email) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
                    <h2 className="text-xl font-bold text-slate-900">
                        Email not found
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        Please request a password reset OTP first.
                    </p>

                    <Link
                        to="/forgot-password"
                        className="mt-5 inline-block font-semibold text-cyan-600"
                    >
                        Go to Forgot Password
                    </Link>
                </div>
            </div>
        );
    }

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (otp.length !== 6) {
            toast.error("Please enter a valid 6-digit OTP.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await api.post("/auth/verify-otp", {
                email,
                otp,
            });

            const resetToken = response.data.resetToken;

            if (!resetToken) {
                toast.error("Unable to generate reset token.");
                return;
            }

            toast.success("OTP verified successfully!");

            navigate("/reset-password", {
                state: {
                    email,
                    resetToken,
                },
            });

        } catch (error) {
            const message = error.response?.data;

            toast.error(
                typeof message === "string"
                    ? message
                    : message?.message || "Invalid or expired OTP."
            );

        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setIsResending(true);

        try {
            await api.post("/auth/forgot-password", {
                email,
            });

            setOtp("");

            toast.success("If the account exists, a new OTP has been sent.");

        } catch (error) {
            toast.error(
                "Unable to resend OTP. Please try again."
            );

        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">

            <div className="w-full max-w-md">

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

                {/* OTP CARD */}
                <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-lg sm:p-10">

                    {/* ICON */}
                    <div className="mb-6 flex justify-center">

                        <div className="rounded-full bg-cyan-50 p-4 text-cyan-600">
                            <ShieldCheck size={32} />
                        </div>

                    </div>

                    {/* HEADING */}
                    <div className="mb-8 text-center">

                        <h1 className="text-2xl font-bold text-slate-900">
                            Verify Your Email
                        </h1>

                        <p className="mt-3 text-sm leading-6 text-slate-500">
                            We've sent a 6-digit verification code to your
                            registered email address.
                        </p>

                        <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-cyan-700">
                            <MailCheck size={17} />
                            <span>{email}</span>
                        </div>

                    </div>

                    {/* OTP FORM */}
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div>

                            <label
                                htmlFor="otp"
                                className="mb-3 block text-center text-sm font-semibold text-slate-700"
                            >
                                Enter 6-Digit OTP
                            </label>

                            <input
                                id="otp"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={6}
                                placeholder="000000"
                                value={otp}
                                onChange={(event) =>
                                    setOtp(
                                        event.target.value
                                            .replace(/\D/g, "")
                                            .slice(0, 6)
                                    )
                                }
                                required
                                className="w-full rounded-xl border border-slate-200 px-4 py-4 text-center text-2xl font-bold tracking-[0.7em] text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                            />

                        </div>

                        <p className="text-center text-xs text-slate-500">
                            Your OTP is valid for 5 minutes.
                        </p>

                        {/* VERIFY BUTTON */}
                        <button
                            type="submit"
                            disabled={isLoading || otp.length !== 6}
                            className="w-full rounded-xl bg-cyan-600 py-3 font-semibold text-white shadow-md transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isLoading ? "Verifying..." : "Verify OTP"}
                        </button>

                    </form>

                    {/* RESEND OTP */}
                    <div className="mt-7 text-center">

                        <p className="text-sm text-slate-500">
                            Didn't receive the code?
                        </p>

                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={isResending}
                            className="mt-2 font-semibold text-cyan-600 transition hover:text-cyan-700 disabled:opacity-50"
                        >
                            {isResending ? "Sending..." : "Resend OTP"}
                        </button>

                    </div>

                    {/* BACK */}
                    <div className="mt-7 text-center">

                        <Link
                            to="/forgot-password"
                            state={{ email }}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-600 transition hover:text-cyan-700"
                        >
                            <ArrowLeft size={17} />
                            Back
                        </Link>

                    </div>

                </div>

                {/* HOMEPAGE */}
                <div className="mt-6 text-center">

                    <Link
                        to="/"
                        className="text-sm font-medium text-slate-500 transition hover:text-cyan-600"
                    >
                        ← Back to Homepage
                    </Link>

                </div>

            </div>

        </div>
    );
}

export default VerifyOtp;