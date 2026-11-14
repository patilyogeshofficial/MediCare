import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  Copy,
  Check,
  Building2,
  Calendar,
  UserCheck,
  Award,
  AlertTriangle,
  HeartPulse,
  ArrowLeft,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

function PrescriptionVerification() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCode = searchParams.get("code") || "";

  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Auto-verify on mount if code query parameter exists
  useEffect(() => {
    if (initialCode && initialCode.trim()) {
      handleVerify(initialCode.trim());
    }
  }, [initialCode]);

  const handleVerify = async (codeToVerify) => {
    const targetCode = (codeToVerify || code).trim().toUpperCase();
    if (!targetCode) {
      toast.error("Please enter a prescription verification code.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      // Update URL query parameter
      setSearchParams({ code: targetCode }, { replace: true });

      const response = await api.get(`/public/prescriptions/verify?code=${encodeURIComponent(targetCode)}`);
      setResult(response.data);
    } catch (err) {
      console.error("Prescription verification failed:", err);
      if (err.response?.status === 429) {
        setError(
          err.response?.data?.message ||
            "Rate limit reached (maximum 10 verification requests per minute). Please wait a moment before trying again."
        );
      } else {
        setResult({
          valid: false,
          verificationCode: targetCode,
          hospitalName: "MediCare Plus Hospital & Research Centre",
          status: "INVALID",
          message:
            err.response?.data?.message ||
            "The provided verification code could not be verified against any authentic hospital record.",
          disclaimer:
            "Patient identity, clinical notes and prescribed medications are strictly protected and withheld in compliance with applicable health data protection guidelines.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleVerify(code);
  };

  const handleCopyLink = () => {
    const verificationUrl = `${window.location.origin}/verify-prescription?code=${encodeURIComponent(
      result?.verificationCode || code
    )}`;
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    toast.success("Verification link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-800">
      {/* HEADER BAR */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-sm">
              <HeartPulse size={22} />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">
              Medi<span className="text-cyan-600">Care</span>{" "}
              <span className="text-teal-600 font-black">Plus</span>
            </span>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-cyan-600 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </header>

      {/* HERO & SEARCH CONTAINER */}
      <main id="main-content" tabIndex="-1" className="mx-auto max-w-4xl px-6 py-12 lg:py-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-100/80 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-cyan-800">
            <ShieldCheck size={16} className="text-cyan-700" />
            Official Verification Portal
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Verify Prescription Authenticity
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
            Authenticate official medical prescriptions issued by licensed doctors at MediCare Plus Hospital. Instant, cryptographically backed validation for patients, pharmacies, and healthcare providers.
          </p>
        </div>

        {/* SEARCH FORM */}
        <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <label htmlFor="prescription-code-input" className="sr-only">
                Prescription Verification Code
              </label>
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="prescription-code-input"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter Verification Code (e.g. RX-2026-9F4B-8E2A)"
                aria-describedby="code-hint"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-3.5 pl-12 pr-4 text-base font-semibold tracking-wider text-slate-900 outline-none transition-all placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 focus-visible:ring-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-6 py-3.5 text-base font-bold text-white shadow-md shadow-cyan-600/20 transition-all hover:bg-cyan-700 hover:shadow-cyan-600/30 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={20} aria-hidden="true" />
                  <span>Verify Code</span>
                </>
              )}
            </button>
          </form>

          <div id="code-hint" className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Standard Format: <code className="font-mono text-cyan-700">RX-YYYY-XXXX-XXXX</code></span>
            <span>Rate-limited: 10 queries / min</span>
          </div>
        </div>

        {/* RATE LIMIT ERROR ALERT */}
        {error && (
          <div
            role="alert"
            className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm animate-fade-in"
          >
            <div className="flex items-start gap-4">
              <AlertTriangle size={24} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
              <div>
                <h3 className="font-bold text-amber-950">Verification Throttled</h3>
                <p className="mt-1 text-sm text-amber-800 leading-relaxed">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* VERIFICATION RESULT CARD */}
        {result && (
          <div
            role="region"
            aria-live="polite"
            aria-label="Verification Result"
            className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition-all"
          >
            {result.valid ? (
              // AUTHENTIC PRESCRIPTION CARD
              <div>
                {/* STATUS BANNER */}
                <div className="flex flex-col gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                      <CheckCircle2 size={24} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black tracking-tight">Authentic Hospital Prescription</h2>
                      <p className="text-xs text-emerald-100">Official digital issuance verified by MediCare Plus Healthcare System</p>
                    </div>
                  </div>

                  <span className="inline-flex self-start rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-sm sm:self-center">
                    Verified Authentic
                  </span>
                </div>

                {/* DETAILS GRID */}
                <div className="p-6 sm:p-8 space-y-6">
                  {/* VERIFICATION CODE HERO */}
                  <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Official Verification Code
                      </span>
                      <p className="mt-0.5 font-mono text-xl font-black text-cyan-800 sm:text-2xl">
                        {result.verificationCode}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-cyan-600"
                    >
                      {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                      <span>{copied ? "Link Copied" : "Copy Verification Link"}</span>
                    </button>
                  </div>

                  {/* METADATA ATTRIBUTES */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                        <UserCheck size={16} className="text-cyan-600" />
                        Issuing Practitioner
                      </div>
                      <p className="mt-2 text-base font-bold text-slate-900">{result.doctorName}</p>
                      <p className="text-xs text-slate-500 font-mono">Lic: {result.doctorLicenseNumber}</p>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                        <Award size={16} className="text-cyan-600" />
                        Clinical Department
                      </div>
                      <p className="mt-2 text-base font-bold text-slate-900">{result.specializationName}</p>
                      <p className="text-xs text-slate-500">Outpatient Consultation</p>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                        <Calendar size={16} className="text-cyan-600" />
                        Prescribed Date
                      </div>
                      <p className="mt-2 text-base font-bold text-slate-900">{result.prescribedDate}</p>
                      <p className="text-xs text-slate-500">Tamper-locked Record</p>
                    </div>
                  </div>

                  {/* ISSUING AUTHORITY */}
                  <div className="flex items-center gap-3 rounded-xl border border-cyan-100 bg-cyan-50/60 p-4 text-cyan-900">
                    <Building2 size={24} className="shrink-0 text-cyan-700" />
                    <div className="text-xs leading-relaxed">
                      <span className="font-bold">{result.hospitalName}</span> · All clinical prescriptions issued through this portal are tamper-proof and protected against subsequent modifications.
                    </div>
                  </div>

                  {/* DATA PROTECTION & PRIVACY STATEMENT */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-600 leading-relaxed">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                      <Lock size={14} className="text-slate-500" />
                      Data Protection & Privacy Notice (DPDP Act Compliance)
                    </div>
                    {result.disclaimer}
                  </div>
                </div>
              </div>
            ) : (
              // INVALID PRESCRIPTION CARD
              <div>
                <div className="flex items-center gap-3 bg-red-600 px-6 py-5 text-white">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                    <ShieldAlert size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight">Prescription Unverified</h2>
                    <p className="text-xs text-red-100">No matching hospital record could be confirmed</p>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-4">
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
                    <p className="text-sm font-semibold">{result.message}</p>
                  </div>

                  <div className="text-xs text-slate-600 space-y-2">
                    <p className="font-semibold text-slate-800">Verification Tips:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Double check the code format: <code className="font-mono text-cyan-700">RX-YYYY-XXXX-XXXX</code>.</li>
                      <li>Ensure there are no leading or trailing spaces.</li>
                      <li>If you were provided this prescription slip by a third party, request an updated slip with an active verification code.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default PrescriptionVerification;
