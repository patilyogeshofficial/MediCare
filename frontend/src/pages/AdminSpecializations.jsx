import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Search,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  AlertTriangle,
  X,
  Stethoscope,
  CheckCircle2,
  Building2,
  Layers,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import AccessibleModal from "../components/ui/AccessibleModal";

function AdminSpecializations() {
  const [specializations, setSpecializations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Selected or active item for edit/view/delete
  const [currentSpecialization, setCurrentSpecialization] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Load specializations and doctors (to compute association counts)
  const fetchData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const [specsRes, docsRes] = await Promise.all([
        api.get("/specializations").catch(() => ({ data: [] })),
        api.get("/doctors").catch(() => ({ data: [] })),
      ]);

      setSpecializations(Array.isArray(specsRes.data) ? specsRes.data : []);
      setDoctors(Array.isArray(docsRes.data) ? docsRes.data : []);

      if (isManualRefresh) {
        toast.success("Specializations refreshed successfully.");
      }
    } catch (err) {
      console.error("Failed to load specializations:", err);
      toast.error("Unable to load specializations. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute doctor count per specialization
  const doctorCountMap = useMemo(() => {
    const map = {};
    doctors.forEach((doc) => {
      const specName = doc.specializationName?.toLowerCase().trim();
      if (specName) {
        map[specName] = (map[specName] || 0) + 1;
      }
    });
    return map;
  }, [doctors]);

  // Filtered specializations by search term
  const filteredSpecializations = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return specializations;

    return specializations.filter((s) => {
      const name = (s.specializationName || s.name || "").toLowerCase();
      const desc = (s.description || "").toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [specializations, searchTerm]);

  // Metrics
  const metrics = useMemo(() => {
    const total = specializations.length;
    let withDoctors = 0;
    specializations.forEach((s) => {
      const name = (s.specializationName || s.name || "").toLowerCase().trim();
      if ((doctorCountMap[name] || 0) > 0) withDoctors++;
    });
    return {
      total,
      withDoctors,
      unassigned: total - withDoctors,
    };
  }, [specializations, doctorCountMap]);

  // Form Validation
  const validateForm = () => {
    const errors = {};
    const name = formData.name.trim();

    if (!name) {
      errors.name = "Specialization name is required.";
    } else if (name.length < 2) {
      errors.name = "Specialization name must be at least 2 characters.";
    } else if (name.length > 100) {
      errors.name = "Specialization name cannot exceed 100 characters.";
    }

    // Check duplicate name (case-insensitive)
    const currentId = currentSpecialization?.specializationId || currentSpecialization?.id;
    const isDuplicate = specializations.some((s) => {
      const sId = s.specializationId || s.id;
      const sName = (s.specializationName || s.name || "").trim().toLowerCase();
      return sName === name.toLowerCase() && sId !== currentId;
    });

    if (isDuplicate) {
      errors.name = "A specialization with this name already exists.";
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = "Description cannot exceed 500 characters.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setCurrentSpecialization(null);
    setFormData({ name: "", description: "" });
    setFormErrors({});
    setIsCreateOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (spec) => {
    setCurrentSpecialization(spec);
    setFormData({
      name: spec.specializationName || spec.name || "",
      description: spec.description || "",
    });
    setFormErrors({});
    setIsEditOpen(true);
  };

  // Open View Modal
  const handleOpenView = (spec) => {
    setCurrentSpecialization(spec);
    setIsViewOpen(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (spec) => {
    setCurrentSpecialization(spec);
    setIsDeleteOpen(true);
  };

  // Submit Create Specialization
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const payload = {
        specializationName: formData.name.trim(),
        description: formData.description.trim() || null,
      };

      const response = await api.post("/specializations", payload);
      const newSpec = response.data || {
        specializationId: Date.now(),
        ...payload,
      };

      setSpecializations((prev) => [...prev, newSpec]);
      toast.success(`Specialization "${payload.specializationName}" created successfully!`);
      setIsCreateOpen(false);
      setFormData({ name: "", description: "" });
    } catch (err) {
      console.error("Create specialization error:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to create specialization. Please verify your input.";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Specialization
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const id = currentSpecialization?.specializationId || currentSpecialization?.id;
    if (!id) {
      toast.error("Specialization identifier missing.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        specializationName: formData.name.trim(),
        description: formData.description.trim() || null,
      };

      const response = await api.put(`/specializations/${id}`, payload);
      const updatedSpec = response.data || {
        ...currentSpecialization,
        ...payload,
      };

      setSpecializations((prev) =>
        prev.map((s) => {
          const sId = s.specializationId || s.id;
          return sId === id ? updatedSpec : s;
        })
      );

      toast.success(`Specialization "${payload.specializationName}" updated successfully!`);
      setIsEditOpen(false);
      setCurrentSpecialization(null);
    } catch (err) {
      console.error("Update specialization error:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to update specialization. Please try again.";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Delete Specialization
  const handleDeleteSubmit = async () => {
    const id = currentSpecialization?.specializationId || currentSpecialization?.id;
    const name = currentSpecialization?.specializationName || currentSpecialization?.name || "";

    const assignedDoctorsCount = doctorCountMap[name.toLowerCase().trim()] || 0;
    if (assignedDoctorsCount > 0) {
      toast.error(
        `Cannot delete "${name}": It has ${assignedDoctorsCount} active doctor(s) assigned.`
      );
      return;
    }

    try {
      setSubmitting(true);
      await api.delete(`/specializations/${id}`);

      setSpecializations((prev) => {
        return prev.filter((s) => {
          const sId = s.specializationId || s.id;
          return sId !== id;
        });
      });

      toast.success(`Specialization "${name}" deleted successfully.`);
      setIsDeleteOpen(false);
      setCurrentSpecialization(null);
    } catch (err) {
      console.error("Delete specialization error:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to delete specialization. Please ensure no dependent records exist.";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
              <Award size={22} aria-hidden="true" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
              Specialization Management
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Define, update, and manage clinical hospital departments and doctor disciplines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={refreshing || loading}
            aria-label="Refresh specializations"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin text-cyan-600" : "text-slate-500"}
              aria-hidden="true"
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-cyan-600/20 transition hover:bg-cyan-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
          >
            <Plus size={18} aria-hidden="true" />
            Add Specialization
          </button>
        </div>
      </div>

      {/* SUMMARY METRICS */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Specializations
            </span>
            <span className="rounded-lg bg-cyan-50 p-2 text-cyan-600">
              <Layers size={18} aria-hidden="true" />
            </span>
          </div>
          <p className="mt-2 text-3xl font-black text-slate-900">{metrics.total}</p>
          <p className="mt-1 text-xs text-slate-500">Active medical disciplines in MediCare Plus</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Departments
            </span>
            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Stethoscope size={18} aria-hidden="true" />
            </span>
          </div>
          <p className="mt-2 text-3xl font-black text-slate-900">{metrics.withDoctors}</p>
          <p className="mt-1 text-xs text-slate-500">Departments with assigned doctors</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Unassigned Units
            </span>
            <span className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Building2 size={18} aria-hidden="true" />
            </span>
          </div>
          <p className="mt-2 text-3xl font-black text-slate-900">{metrics.unassigned}</p>
          <p className="mt-1 text-xs text-slate-500">Departments awaiting doctor assignments</p>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search specializations by title or clinical description..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 transition focus:border-cyan-600 focus:bg-white focus:outline-none"
          />
        </div>

        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="text-xs font-bold text-slate-500 hover:text-slate-800"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* SPECIALIZATIONS TABLE / CONTENT */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : filteredSpecializations.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Award size={32} aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-800">
              {searchTerm ? "No matching specializations found" : "No specializations defined"}
            </h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
              {searchTerm
                ? `No department matching "${searchTerm}". Try a different keyword.`
                : "Get started by adding your first hospital clinical specialization."}
            </p>
            {!searchTerm && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700"
              >
                <Plus size={16} aria-hidden="true" />
                Add Your First Specialization
              </button>
            )}
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th scope="col" className="px-6 py-4">Department / Specialization</th>
                    <th scope="col" className="px-6 py-4">Clinical Description</th>
                    <th scope="col" className="px-6 py-4">Assigned Doctors</th>
                    <th scope="col" className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSpecializations.map((spec) => {
                    const id = spec.specializationId || spec.id;
                    const name = spec.specializationName || spec.name || "Untitled";
                    const desc = spec.description || "No clinical description provided.";
                    const docCount = doctorCountMap[name.toLowerCase().trim()] || 0;

                    return (
                      <tr key={id} className="transition hover:bg-slate-50/60">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-50 font-bold text-cyan-700">
                              {name.charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <p className="font-bold text-slate-900">{name}</p>
                              <p className="text-[11px] text-slate-400">ID: #{id}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 max-w-md">
                          <p className="line-clamp-2 text-slate-600">{desc}</p>
                        </td>

                        <td className="px-6 py-4">
                          {docCount > 0 ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={12} aria-hidden="true" />
                              {docCount} Doctor{docCount > 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                              0 Doctors
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenView(spec)}
                              title="View Details"
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-cyan-600 transition"
                            >
                              <Eye size={17} aria-hidden="true" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(spec)}
                              title="Edit Specialization"
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition"
                            >
                              <Edit2 size={17} aria-hidden="true" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenDelete(spec)}
                              title="Delete Specialization"
                              className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                            >
                              <Trash2 size={17} aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARD LIST */}
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredSpecializations.map((spec) => {
                const id = spec.specializationId || spec.id;
                const name = spec.specializationName || spec.name || "Untitled";
                const desc = spec.description || "No clinical description provided.";
                const docCount = doctorCountMap[name.toLowerCase().trim()] || 0;

                return (
                  <div key={id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-100 font-bold text-cyan-800 text-sm">
                          {name.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-900">{name}</h4>
                          <span className="text-[11px] text-slate-400">ID: #{id}</span>
                        </div>
                      </div>

                      {docCount > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                          {docCount} Dr{docCount > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">
                          0 Dr
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{desc}</p>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-50">
                      <button
                        type="button"
                        onClick={() => handleOpenView(spec)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        <Eye size={13} aria-hidden="true" />
                        View
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(spec)}
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
                      >
                        <Edit2 size={13} aria-hidden="true" />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenDelete(spec)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                      >
                        <Trash2 size={13} aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ========================================================= */}
      {/* CREATE MODAL */}
      {/* ========================================================= */}
      <AccessibleModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Specialization"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="create-spec-name" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Specialization Name <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">{formData.name.length}/100</span>
            </div>
            <input
              id="create-spec-name"
              type="text"
              maxLength={100}
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (formErrors.name) setFormErrors({ ...formErrors, name: null });
              }}
              placeholder="e.g. Cardiology, Neurology, Orthopedics..."
              aria-invalid={!!formErrors.name}
              aria-describedby={formErrors.name ? "create-spec-name-error" : undefined}
              className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 transition focus:outline-none ${
                formErrors.name ? "border-red-400 bg-red-50/30" : "border-slate-200 focus:border-cyan-600"
              }`}
            />
            {formErrors.name && (
              <p id="create-spec-name-error" role="alert" className="mt-1 text-xs text-red-600 font-medium">
                {formErrors.name}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="create-spec-desc" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Clinical Description
              </label>
              <span className="text-[11px] text-slate-400">
                {formData.description.length}/500
              </span>
            </div>
            <textarea
              id="create-spec-desc"
              rows={4}
              maxLength={500}
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (formErrors.description) setFormErrors({ ...formErrors, description: null });
              }}
              placeholder="Describe the medical discipline, scope of care, and patient services offered by this department..."
              aria-invalid={!!formErrors.description}
              aria-describedby={formErrors.description ? "create-spec-desc-error" : undefined}
              className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 transition focus:outline-none ${
                formErrors.description ? "border-red-400 bg-red-50/30" : "border-slate-200 focus:border-cyan-600"
              }`}
            />
            {formErrors.description && (
              <p id="create-spec-desc-error" role="alert" className="mt-1 text-xs text-red-600 font-medium">
                {formErrors.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-cyan-600/20 hover:bg-cyan-700 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Create Specialization"}
            </button>
          </div>
        </form>
      </AccessibleModal>

      {/* ========================================================= */}
      {/* EDIT MODAL */}
      {/* ========================================================= */}
      <AccessibleModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Specialization"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="edit-spec-name" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Specialization Name <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">{formData.name.length}/100</span>
            </div>
            <input
              id="edit-spec-name"
              type="text"
              maxLength={100}
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (formErrors.name) setFormErrors({ ...formErrors, name: null });
              }}
              aria-invalid={!!formErrors.name}
              aria-describedby={formErrors.name ? "edit-spec-name-error" : undefined}
              className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 transition focus:outline-none ${
                formErrors.name ? "border-red-400 bg-red-50/30" : "border-slate-200 focus:border-cyan-600"
              }`}
            />
            {formErrors.name && (
              <p id="edit-spec-name-error" role="alert" className="mt-1 text-xs text-red-600 font-medium">
                {formErrors.name}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="edit-spec-desc" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Clinical Description
              </label>
              <span className="text-[11px] text-slate-400">
                {formData.description.length}/500
              </span>
            </div>
            <textarea
              id="edit-spec-desc"
              rows={4}
              maxLength={500}
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (formErrors.description) setFormErrors({ ...formErrors, description: null });
              }}
              aria-invalid={!!formErrors.description}
              aria-describedby={formErrors.description ? "edit-spec-desc-error" : undefined}
              className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 transition focus:outline-none ${
                formErrors.description ? "border-red-400 bg-red-50/30" : "border-slate-200 focus:border-cyan-600"
              }`}
            />
            {formErrors.description && (
              <p id="edit-spec-desc-error" role="alert" className="mt-1 text-xs text-red-600 font-medium">
                {formErrors.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-cyan-600/20 hover:bg-cyan-700 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </AccessibleModal>

      {/* ========================================================= */}
      {/* VIEW DETAILS MODAL */}
      {/* ========================================================= */}
      <AccessibleModal
        isOpen={isViewOpen && !!currentSpecialization}
        onClose={() => setIsViewOpen(false)}
        title="Department Details"
        maxWidth="max-w-lg"
      >
        {currentSpecialization && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Specialization Title
              </span>
              <p className="mt-1 text-xl font-extrabold text-slate-900">
                {currentSpecialization.specializationName || currentSpecialization.name}
              </p>
              <span className="mt-1 inline-block text-xs font-semibold text-slate-400">
                Database Record ID: #{currentSpecialization.specializationId || currentSpecialization.id}
              </span>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Clinical Scope & Description
              </span>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-700 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                {currentSpecialization.description || "No specific clinical description documented for this specialization."}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Assigned Practitioners
                </span>
                <span className="text-xs font-bold text-cyan-700">
                  {doctorCountMap[(currentSpecialization.specializationName || currentSpecialization.name || "").toLowerCase().trim()] || 0} Total
                </span>
              </div>

              {(() => {
                const specName = (currentSpecialization.specializationName || currentSpecialization.name || "").toLowerCase().trim();
                const assignedDocs = doctors.filter(
                  (d) => d.specializationName?.toLowerCase().trim() === specName
                );

                if (assignedDocs.length === 0) {
                  return (
                    <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl">
                      No doctors currently assigned to this department.
                    </p>
                  );
                }

                return (
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                    {assignedDocs.map((doc) => (
                      <div
                        key={doc.doctorId || doc.id}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-2.5 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-100 font-bold text-cyan-800 text-[10px]">
                            {doc.fullName?.charAt(0) || "D"}
                          </span>
                          <span className="font-bold text-slate-800">{doc.fullName}</span>
                        </div>
                        <span className="text-slate-500">{doc.qualification || "Licensed"}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsViewOpen(false)}
                className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </AccessibleModal>

      {/* ========================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================= */}
      <AccessibleModal
        isOpen={isDeleteOpen && !!currentSpecialization}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Specialization"
        maxWidth="max-w-md"
      >
        {currentSpecialization && (() => {
          const name = currentSpecialization.specializationName || currentSpecialization.name || "";
          const count = doctorCountMap[name.toLowerCase().trim()] || 0;

          if (count > 0) {
            return (
              <div className="space-y-4">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 space-y-2">
                  <p className="font-bold text-sm">Action Prohibited by System</p>
                  <p>
                    Specialization <strong>"{name}"</strong> is currently associated with{" "}
                    <strong>{count} active doctor(s)</strong>.
                  </p>
                  <p className="text-slate-700">
                    To preserve clinical history and prevent appointment booking errors, you must
                    reassign these doctors to another department before deleting this specialization.
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDeleteOpen(false)}
                    className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    Understood, Cancel
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Are you sure you want to delete specialization <strong>"{name}"</strong>? This will
                remove the department from public listings and doctor assignment options.
              </p>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDeleteOpen(false)}
                  disabled={submitting}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSubmit}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-red-600/20 hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          );
        })()}
      </AccessibleModal>
    </div>
  );
}

export default AdminSpecializations;
