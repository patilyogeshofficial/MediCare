import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  FileCheck,
  Award,
  ArrowRight,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";

function VerifyPrescriptionSection() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      toast.error("Please enter a prescription verification code.");
      return;
    }
    navigate(`/verify-prescription?code=${encodeURIComponent(cleanCode)}`);
  };

  return (
    <section
      id="verify-prescription"
      className="relative scroll-mt-20 overflow-hidden bg-gradient-to-b from-slate-50 via-cyan-50/30 to-white py-16 sm:py-20"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-cyan-100 bg-gradient-to-br from-white via-cyan-50/40 to-sky-50/60 p-8 shadow-xl shadow-cyan-900/5 sm:p-12 lg:p-16">
          {/* BACKGROUND GLOW */}
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-cyan-200/40 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative grid items-center gap-10 lg:grid-cols-12">
            {/* LEFT CONTENT */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800">
                <ShieldCheck size={16} className="text-emerald-600" aria-hidden="true" />
                OFFICIAL TAMPER-PROOF MEDICAL RECORDS
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Verify Any Official Prescription
              </h2>

              <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
                Authenticate medical prescriptions issued by licensed doctors at MediCare Plus Hospital.
                Enter the unique 16-character RX verification code printed on your prescription receipt or
                scan the QR code to instantly verify authenticity, medications, and clinical signatures.
              </p>

              {/* SEARCH FORM */}
              <form onSubmit={handleSearch} className="mt-8 max-w-xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-600"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="e.g. RX-2026-PHX2-51B5"
                      className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm font-semibold tracking-wider uppercase text-slate-900 shadow-sm placeholder:text-slate-400 placeholder:normal-case placeholder:tracking-normal focus:border-cyan-600 focus:outline-none focus:ring-4 focus:ring-cyan-100"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-cyan-600/20 transition hover:bg-cyan-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
                  >
                    <ShieldCheck size={18} aria-hidden="true" />
                    Verify Now
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Sample format: <code className="font-mono text-cyan-700">RX-YYYY-XXXX-XXXX</code>. Printed on top right of all MediCare Plus receipts.
                </p>
              </form>

              {/* PILLARS LIST */}
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-2.5 rounded-xl bg-white/80 p-3 shadow-xs border border-slate-100">
                  <Lock size={18} className="text-cyan-600 shrink-0" aria-hidden="true" />
                  <span className="text-xs font-semibold text-slate-700">Cryptographically Signed</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl bg-white/80 p-3 shadow-xs border border-slate-100">
                  <Award size={18} className="text-teal-600 shrink-0" aria-hidden="true" />
                  <span className="text-xs font-semibold text-slate-700">Licensed Doctor Issuance</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl bg-white/80 p-3 shadow-xs border border-slate-100">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" aria-hidden="true" />
                  <span className="text-xs font-semibold text-slate-700">Pharmacy & Insurer Ready</span>
                </div>
              </div>
            </div>

            {/* RIGHT CARD / PORTAL PREVIEW */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-slate-100 bg-white p-7 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-700">
                    <FileCheck size={28} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Prescription Portal
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      MediCare Plus Verification Desk
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3.5 border-t border-slate-100 pt-5 text-sm text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={17} className="mt-0.5 text-emerald-500 shrink-0" aria-hidden="true" />
                    <p className="text-xs leading-relaxed">
                      Instant validation of consultation diagnosis and prescribed drug dosages.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={17} className="mt-0.5 text-emerald-500 shrink-0" aria-hidden="true" />
                    <p className="text-xs leading-relaxed">
                      Prevents counterfeit prescriptions, unauthorized refills, and dosage tampering.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={17} className="mt-0.5 text-emerald-500 shrink-0" aria-hidden="true" />
                    <p className="text-xs leading-relaxed">
                      Open to patients, caregivers, registered pharmacists, and health insurance auditors.
                    </p>
                  </div>
                </div>

                <Link
                  to="/verify-prescription"
                  className="mt-6 flex items-center justify-center gap-2 rounded-2xl border-2 border-cyan-600 bg-cyan-50/50 py-3 text-sm font-bold text-cyan-700 transition hover:bg-cyan-600 hover:text-white"
                >
                  Open Verification Portal
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default VerifyPrescriptionSection;
