import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    HeartPulse,
    LockKeyhole,
    Eye,
    EyeOff,
    ArrowLeft,
    ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../services/api";

function ResetPassword() {
    const location = useLocation();
    const navigate = useNavigate();

    const email = location.state?.email || "";
    const resetToken = location.state?.resetToken || "";

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isLoading, setIsLoading] = useState(false);

    if (!email || !resetToken) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">

                <div className="rounded-2xl bg-white p-8 text-center shadow-lg">

                    <h2 className="text-xl font-bold text-slate-900">
                        Invalid Password Reset Session
                    </h2>

                    <p className="mt-3 text-sm text-slate-500">
                        Please verify your email and OTP again.
                    </p>

                    <Link
                        to="/forgot-password"
                        className="mt-5 inline-block font-semibold text-cyan-600"
                    >
                        Start Again
                    </Link>

                </div>

            </div>
        );
    }

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (newPassword.length < 8) {
            toast.error("Password must contain at least 8 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        setIsLoading(true);

        try {
            await api.post("/auth/reset-password", {
                email,
                resetToken,
                newPassword,
            });

            toast.success("Password reset successfully!");

            navigate("/login", {
                state: { passwordReset: true },
                replace: true,
            });

        } catch (error) {
            const message = error.response?.data;

            toast.error(
                typeof message === "string"
                    ? message
                    : message?.message || "Unable to reset password."
            );

        } finally {
            setIsLoading(false);
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

                {/* RESET PASSWORD CARD */}
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
                            Create New Password
                        </h1>

                        <p className="mt-3 text-sm leading-6 text-slate-500">
                            Your email has been verified. Create a new
                            password for your MediCare account.
                        </p>

                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* NEW PASSWORD */}
                        <div>

                            <label
                                htmlFor="newPassword"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                New Password
                            </label>

                            <div className="relative">

                                <LockKeyhole
                                    size={19}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    id="newPassword"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={(event) =>
                                        setNewPassword(event.target.value)
                                    }
                                    autoComplete="new-password"
                                    minLength={8}
                                    maxLength={72}
                                    required
                                    className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-12 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-600"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <EyeOff size={19} />
                                    ) : (
                                        <Eye size={19} />
                                    )}
                                </button>

                            </div>

                            <p className="mt-2 text-xs text-slate-500">
                                Minimum 8 characters.
                            </p>

                        </div>

                        {/* CONFIRM PASSWORD */}
                        <div>

                            <label
                                htmlFor="confirmPassword"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Confirm New Password
                            </label>

                            <div className="relative">

                                <LockKeyhole
                                    size={19}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(event) =>
                                        setConfirmPassword(event.target.value)
                                    }
                                    autoComplete="new-password"
                                    minLength={8}
                                    maxLength={72}
                                    required
                                    className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-12 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword(!showConfirmPassword)
                                    }
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-600"
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff size={19} />
                                    ) : (
                                        <Eye size={19} />
                                    )}
                                </button>

                            </div>

                        </div>

                        {/* PASSWORD MATCH */}
                        {confirmPassword && (
                            <p className={`text-xs font-medium ${
                                newPassword === confirmPassword
                                    ? "text-green-600"
                                    : "text-red-500"
                            }`}>
                                {newPassword === confirmPassword
                                    ? "Passwords match."
                                    : "Passwords do not match."}
                            </p>
                        )}

                        {/* RESET BUTTON */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full rounded-xl bg-cyan-600 py-3 font-semibold text-white shadow-md transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isLoading
                                ? "Resetting Password..."
                                : "Reset Password"}
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

            </div>

        </div>
    );
}

export default ResetPassword;