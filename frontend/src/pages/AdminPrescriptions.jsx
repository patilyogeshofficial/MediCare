
import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Search,
  Eye,
  Edit,
  Trash2,
  X,
  Pill,
  CalendarDays,
  UserRound,
  Stethoscope,
  RefreshCw,
  AlertCircle,
  Plus,
  Save,
  ShieldCheck,
  History,
  Copy,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import AccessibleModal from "../components/ui/AccessibleModal";

function AdminPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditTarget, setAuditTarget] = useState(null);

  const openAuditModal = async (prescription) => {
    setAuditTarget(prescription);
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const res = await api.get(`/admin/audit-logs/PRESCRIPTION/${prescription.prescriptionId}`);
      setAuditLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
      toast.error("Unable to load audit trail.");
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  };

  const fetchPrescriptions = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      const response = await api.get("/prescriptions");
      setPrescriptions(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to fetch prescriptions:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load prescriptions. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const parseMedications = (value) => {
    try {
      const parsed =
        typeof value === "string" ? JSON.parse(value) : value;

      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const filteredPrescriptions = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) return prescriptions;

    return prescriptions.filter((prescription) =>
      [
        prescription.prescriptionId,
        prescription.appointmentId,
        prescription.verificationCode,
        prescription.diagnosis,
        prescription.instructions,
      ].some((value) =>
        String(value || "").toLowerCase().includes(search)
      )
    );
  }, [prescriptions, searchTerm]);

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const openEditModal = (prescription) => {
    setEditingPrescription({
      ...prescription,
      medicationsList: parseMedications(prescription.medications).map(
        (medicine) => ({
          medicineName: medicine.medicineName || medicine.medicine || "",
          dosage: medicine.dosage || "",
          frequency: medicine.frequency || "",
          duration: medicine.duration || "",
          instructions: medicine.instructions || "",
        })
      ),
    });
  };

  const handleMedicineChange = (index, field, value) => {
    setEditingPrescription((previous) => ({
      ...previous,
      medicationsList: previous.medicationsList.map((medicine, i) =>
        i === index ? { ...medicine, [field]: value } : medicine
      ),
    }));
  };

  const addMedicine = () => {
    setEditingPrescription((previous) => ({
      ...previous,
      medicationsList: [
        ...previous.medicationsList,
        {
          medicineName: "",
          dosage: "",
          frequency: "",
          duration: "",
          instructions: "",
        },
      ],
    }));
  };

  const removeMedicine = (index) => {
    setEditingPrescription((previous) => ({
      ...previous,
      medicationsList: previous.medicationsList.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const handleUpdatePrescription = async (e) => {
    e.preventDefault();

    if (!editingPrescription.diagnosis.trim()) {
      toast.error("Diagnosis is required.");
      return;
    }

    const medications = editingPrescription.medicationsList;

    if (
      medications.some(
        (medicine) =>
          !medicine.medicineName.trim() ||
          !medicine.dosage.trim() ||
          !medicine.frequency.trim() ||
          !medicine.duration.trim()
      )
    ) {
      toast.error("Complete all required medicine fields.");
      return;
    }

    const payload = {
      appointmentId: editingPrescription.appointmentId,
      diagnosis: editingPrescription.diagnosis.trim(),
      medications: JSON.stringify(medications),
      instructions: editingPrescription.instructions?.trim() || "",
    };

    try {
      setSaving(true);

      const response = await api.put(
        `/prescriptions/${editingPrescription.prescriptionId}`,
        payload
      );

      setPrescriptions((previous) =>
        previous.map((item) =>
          item.prescriptionId === response.data.prescriptionId
            ? response.data
            : item
        )
      );

      setEditingPrescription(null);
      toast.success("Prescription updated successfully.");
    } catch (err) {
      console.error("Prescription update failed:", err);
      toast.error(
        err.response?.data?.message ||
          "Unable to update prescription."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePrescription = async (prescription) => {
    const confirmed = window.confirm(
      `Delete prescription #${prescription.prescriptionId}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(prescription.prescriptionId);

      await api.delete(`/prescriptions/${prescription.prescriptionId}`);

      setPrescriptions((previous) =>
        previous.filter(
          (item) =>
            item.prescriptionId !== prescription.prescriptionId
        )
      );

      if (
        selectedPrescription?.prescriptionId ===
        prescription.prescriptionId
      ) {
        setSelectedPrescription(null);
      }

      toast.success("Prescription deleted successfully.");
    } catch (err) {
      console.error("Prescription deletion failed:", err);
      toast.error(
        err.response?.data?.message ||
          "Unable to delete prescription."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const totalMedicines = prescriptions.reduce(
    (total, prescription) =>
      total + parseMedications(prescription.medications).length,
    0
  );

  // Escape key handler to close active modals (WCAG 2.1.2)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (auditModalOpen) setAuditModalOpen(false);
        if (editingPrescription) setEditingPrescription(null);
        if (selectedPrescription) setSelectedPrescription(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [auditModalOpen, editingPrescription, selectedPrescription]);

  return (
    <div>
      {/* PAGE HEADER */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Prescriptions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View and manage patient prescription records.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchPrescriptions(true)}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* SUMMARY */}
      <div className="mb-8 grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
              <FileText size={23} />
            </div>
            <div>
              <p className="text-sm text-slate-500">
                Total Prescriptions
              </p>
              <h3 className="mt-1 text-2xl font-extrabold text-slate-900">
                {loading ? "..." : prescriptions.length}
              </h3>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
              <Pill size={23} />
            </div>
            <div>
              <p className="text-sm text-slate-500">
                Total Prescribed Medicines
              </p>
              <h3 className="mt-1 text-2xl font-extrabold text-slate-900">
                {loading ? "..." : totalMedicines}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="relative">
          <label htmlFor="prescription-search" className="sr-only">
            Search prescriptions
          </label>
          <Search
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="prescription-search"
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by prescription ID, appointment ID or diagnosis..."
            className="w-full rounded-xl border border-slate-200 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          />
        </div>
      </div>

      {/* PRESCRIPTION TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              All Prescriptions
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {filteredPrescriptions.length} record(s) found
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500" role="status" aria-live="polite">
            Loading prescriptions...
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle
              size={38}
              className="mx-auto text-red-500"
            />
            <p className="mt-3 text-sm text-red-600">{error}</p>
            <button
              onClick={() => fetchPrescriptions()}
              className="mt-4 rounded-lg bg-cyan-600 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
            >
              Try Again
            </button>
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="p-12 text-center">
            <FileText
              size={42}
              className="mx-auto text-slate-300"
            />
            <h3 className="mt-4 font-bold text-slate-800">
              No prescriptions found
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {searchTerm
                ? "Try another search term."
                : "Prescriptions created by doctors will appear here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">
                    Prescription ID
                  </th>
                  <th className="px-6 py-4 font-semibold">
                    Verification Code
                  </th>
                  <th className="px-6 py-4 font-semibold">
                    Appointment ID
                  </th>
                  <th className="px-6 py-4 font-semibold">
                    Diagnosis
                  </th>
                  <th className="px-6 py-4 font-semibold">
                    Medicines
                  </th>
                  <th className="px-6 py-4 font-semibold">
                    Prescribed Date
                  </th>
                  <th className="px-6 py-4 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredPrescriptions.map((prescription) => (
                  <tr
                    key={prescription.prescriptionId}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-sm font-bold text-cyan-700">
                      #{prescription.prescriptionId}
                    </td>

                    <td className="px-6 py-4 text-xs font-mono font-bold text-slate-800">
                      {prescription.verificationCode ? (
                        <span className="rounded bg-cyan-50 px-2 py-0.5 text-cyan-800 border border-cyan-200">
                          {prescription.verificationCode}
                        </span>
                      ) : (
                        <span className="text-slate-400">Legacy</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                      #{prescription.appointmentId}
                    </td>

                    <td className="max-w-xs px-6 py-4 text-sm text-slate-700">
                      <p className="truncate font-medium">
                        {prescription.diagnosis}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {parseMedications(prescription.medications).length}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(prescription.prescribedAt)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          title="View prescription"
                          aria-label={`View prescription details for appointment #${prescription.appointmentId}`}
                          onClick={() =>
                            setSelectedPrescription(prescription)
                          }
                          className="rounded-lg bg-cyan-50 p-2 text-cyan-700 hover:bg-cyan-100 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
                        >
                          <Eye size={17} aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          title="View Audit Trail"
                          aria-label={`View security audit trail for prescription #${prescription.prescriptionId}`}
                          onClick={() => openAuditModal(prescription)}
                          className="rounded-lg bg-slate-100 p-2 text-slate-700 hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
                        >
                          <History size={17} aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          title="Edit prescription"
                          aria-label={`Edit prescription #${prescription.prescriptionId}`}
                          onClick={() => openEditModal(prescription)}
                          className="rounded-lg bg-amber-50 p-2 text-amber-700 hover:bg-amber-100 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
                        >
                          <Edit size={17} aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          title="Delete prescription"
                          aria-label={`Delete prescription #${prescription.prescriptionId}`}
                          onClick={() =>
                            handleDeletePrescription(prescription)
                          }
                          disabled={
                            deletingId === prescription.prescriptionId
                          }
                          className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
                        >
                          <Trash2 size={17} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW DETAILS MODAL */}
      <AccessibleModal
        isOpen={Boolean(selectedPrescription)}
        onClose={() => setSelectedPrescription(null)}
        title="Prescription Details"
        description={selectedPrescription ? `Prescription #${selectedPrescription.prescriptionId}` : ""}
        maxWidth="max-w-3xl"
      >
        {selectedPrescription && (
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
            {/* VERIFICATION CODE & AUDIT ACTIONS */}
            <div className="flex flex-col gap-3 rounded-xl border border-cyan-100 bg-cyan-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-800">
                  Official Verification Code
                </span>
                <p className="mt-0.5 font-mono text-base font-extrabold text-cyan-950">
                  {selectedPrescription.verificationCode || "Legacy Record"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {selectedPrescription.verificationCode && (
                  <a
                    href={`/verify-prescription?code=${encodeURIComponent(
                      selectedPrescription.verificationCode
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-cyan-700 transition focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
                  >
                    <ShieldCheck size={14} aria-hidden="true" />
                    Verify Online
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => openAuditModal(selectedPrescription)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
                >
                  <History size={14} aria-hidden="true" />
                  Audit Trail
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Appointment
                </p>
                <p className="mt-2 font-bold text-slate-800">
                  #{selectedPrescription.appointmentId}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Prescribed Date
                </p>
                <p className="mt-2 font-bold text-slate-800">
                  {formatDate(selectedPrescription.prescribedAt)}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800">Diagnosis</h4>
              <p className="mt-2 rounded-xl border border-cyan-100 bg-cyan-50 p-4 text-sm leading-6 text-cyan-900">
                {selectedPrescription.diagnosis}
              </p>
            </div>

            <div>
              <h4 className="flex items-center gap-2 font-bold text-slate-800">
                <Pill size={18} className="text-cyan-600" aria-hidden="true" />
                Prescribed Medicines
              </h4>

              <div className="mt-3 overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <caption className="sr-only">List of prescribed medicines with dosage, frequency, and instructions</caption>
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th scope="col" className="px-4 py-3">Medicine</th>
                      <th scope="col" className="px-4 py-3">Dosage</th>
                      <th scope="col" className="px-4 py-3">Frequency</th>
                      <th scope="col" className="px-4 py-3">Duration</th>
                      <th scope="col" className="px-4 py-3">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parseMedications(
                      selectedPrescription.medications
                    ).map((medicine, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {medicine.medicineName ||
                            medicine.medicine ||
                            "Not specified"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {medicine.dosage || "Not specified"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {medicine.frequency || "Not specified"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {medicine.duration || "Not specified"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {medicine.instructions || "Not specified"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedPrescription.instructions && (
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                <h4 className="font-bold text-amber-800">
                  Doctor's Instructions
                </h4>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-amber-900">
                  {selectedPrescription.instructions}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedPrescription(null)}
                className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </AccessibleModal>

      {/* EDIT MODAL */}
      <AccessibleModal
        isOpen={Boolean(editingPrescription)}
        onClose={() => !saving && setEditingPrescription(null)}
        title="Edit Prescription"
        description={editingPrescription ? `Prescription #${editingPrescription.prescriptionId}` : ""}
        maxWidth="max-w-3xl"
        showCloseButton={!saving}
      >
        {editingPrescription && (
          <form onSubmit={handleUpdatePrescription} className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
            <div>
              <label htmlFor="edit-diagnosis" className="mb-2 block text-sm font-semibold text-slate-700">
                Diagnosis <span className="text-red-500">*</span>
              </label>
              <textarea
                id="edit-diagnosis"
                required
                maxLength={5000}
                rows={3}
                value={editingPrescription.diagnosis}
                onChange={(e) =>
                  setEditingPrescription({
                    ...editingPrescription,
                    diagnosis: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-bold text-slate-800">
                  Medicines
                </h4>
                <button
                  type="button"
                  onClick={addMedicine}
                  className="flex items-center gap-1 rounded-lg bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-700 hover:bg-cyan-100 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
                >
                  <Plus size={15} aria-hidden="true" />
                  Add Medicine
                </button>
              </div>

              {editingPrescription.medicationsList.map(
                (medicine, index) => (
                  <div
                    key={index}
                    className="mb-4 rounded-xl border border-slate-200 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-700">
                        Medicine {index + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeMedicine(index)}
                        aria-label={`Remove medicine ${index + 1}`}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {[
                        ["medicineName", "Medicine Name"],
                        ["dosage", "Dosage"],
                        ["frequency", "Frequency"],
                        ["duration", "Duration"],
                        ["instructions", "Instructions"],
                      ].map(([field, label]) => {
                        const inputId = `edit-med-${index}-${field}`;
                        return (
                          <div key={field}>
                            <label htmlFor={inputId} className="mb-1 block text-xs font-semibold text-slate-600">
                              {label}
                              {field !== "instructions" ? " *" : ""}
                            </label>
                            <input
                              id={inputId}
                              required={field !== "instructions"}
                              type="text"
                              value={medicine[field]}
                              onChange={(e) =>
                                handleMedicineChange(
                                  index,
                                  field,
                                  e.target.value
                                )
                              }
                              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              )}

              {editingPrescription.medicationsList.length === 0 && (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  No medicines added.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="edit-instructions" className="mb-2 block text-sm font-semibold text-slate-700">
                Additional Instructions
              </label>
              <textarea
                id="edit-instructions"
                rows={3}
                maxLength={5000}
                value={editingPrescription.instructions || ""}
                onChange={(e) =>
                  setEditingPrescription({
                    ...editingPrescription,
                    instructions: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
              <button
                type="button"
                onClick={() => setEditingPrescription(null)}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
              >
                <Save size={17} aria-hidden="true" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </AccessibleModal>

      {/* AUDIT TRAIL MODAL */}
      <AccessibleModal
        isOpen={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        title="Security Audit Trail"
        description={auditTarget ? `Immutable history for Prescription #${auditTarget.prescriptionId} (${auditTarget.verificationCode || "Legacy"})` : ""}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {auditLoading ? (
            <div className="py-12 text-center" role="status" aria-live="polite">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent" />
              <p className="mt-3 text-xs text-slate-500">Loading audit trail...</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              <History size={36} className="mx-auto text-slate-300 mb-2" aria-hidden="true" />
              <p>No audit logs recorded for this prescription.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div
                  key={log.logId}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] font-mono uppercase tracking-wide">
                      {log.action}
                    </span>
                    <span className="text-slate-400 font-normal">
                      {new Date(log.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {log.details}
                  </p>
                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 font-mono">
                    <span>Actor: {log.performedBy} ({log.userRole})</span>
                    {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-slate-100 pt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setAuditModalOpen(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
            >
              Close
            </button>
          </div>
        </div>
      </AccessibleModal>
    </div>
  );
}

export default AdminPrescriptions;
