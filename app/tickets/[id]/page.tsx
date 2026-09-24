"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/dist/client/link";

type UserRef = {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
  department?: string | null;
};

type Activity = {
  _id: string;
  action?: string;
  type?: string;
  comment?: string;
  createdAt: string;
  actorId?: UserRef | null;
};

type Ticket = {
  _id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  age?: string;

  studentId?: UserRef | null;
  assignedTo?: UserRef | null;
  departmentId?: {
    _id: string;
    name?: string;
    description?: string;
  } | null;

  sla?: {
    responseDueAt?: string | null;
    resolutionDueAt?: string | null;
    respondedAt?: string | null;
    resolvedAt?: string | null;
  };

  slaStatus?: string;

  resolution?: {
    summary?: string;
    resolvedAt?: string;
    resolvedBy?: UserRef | string | null;
  };
};

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string | null;
};

type StaffOption = {
  _id: string;
  name: string;
  email: string;
  role: string;
  department?: string | null;
};

const STATUSES = [
  "NEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "PENDING_STUDENT",
  "PENDING_INTERNAL",
  "RESOLVED",
  "CLOSED",
];

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const STAFF_ROLES = ["STAFF"];

function formatLabel(value?: string | null) {
  if (!value) return "—";

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

function getStatusClasses(status: string) {
  switch (status) {
    case "NEW":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "ASSIGNED":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";

    case "IN_PROGRESS":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "PENDING_STUDENT":
      return "bg-orange-50 text-orange-700 border-orange-200";

    case "PENDING_INTERNAL":
      return "bg-purple-50 text-purple-700 border-purple-200";

    case "RESOLVED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "CLOSED":
      return "bg-slate-100 text-slate-700 border-slate-200";

    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function getPriorityClasses(priority: string) {
  switch (priority) {
    case "URGENT":
      return "bg-red-50 text-red-700 border-red-200";

    case "HIGH":
      return "bg-orange-50 text-orange-700 border-orange-200";

    case "MEDIUM":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "LOW":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function getSlaClasses(status?: string) {
  switch (status) {
    case "BREACHED":
      return "bg-red-50 text-red-700 border-red-200";

    case "AT_RISK":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "ON_TRACK":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "COMPLETED":
      return "bg-blue-50 text-blue-700 border-blue-200";

    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

export default function TicketDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);

  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedAssignedTo, setSelectedAssignedTo] = useState("");

  const [comment, setComment] = useState("");
  const [resolutionSummary, setResolutionSummary] = useState("");

  const isStaff = currentUser && STAFF_ROLES.includes(currentUser.role);

  const canManageTicket = currentUser && STAFF_ROLES.includes(currentUser.role);

  const backUrl = isStaff ? "/tickets" : "/tickets";

  const loadTicket = useCallback(async () => {
    if (!id) return;

    try {
      setError("");

      const response = await fetch(`/api/tickets/${id}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch ticket");
      }

      setTicket(data.ticket);
      setActivities(data.activities || []);
      setCurrentUser(data.currentUser || null);

      setSelectedStatus(data.ticket?.status || "");
      setSelectedPriority(data.ticket?.priority || "");
      setSelectedAssignedTo(data.ticket?.assignedTo?._id || "");

      setResolutionSummary(data.ticket?.resolution?.summary || "");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTicket();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadTicket]);

  /*
   * Load staff members from the staff ticket endpoint.
   *
   * We use the existing /api/staff/tickets endpoint rather
   * than assuming another users/staff API exists.
   *
   * The returned tickets give us the staff members already
   * visible in the current department.
   */
  useEffect(() => {
    async function loadStaff() {
      if (!currentUser || !STAFF_ROLES.includes(currentUser.role)) {
        return;
      }

      try {
        setLoadingStaff(true);

        const response = await fetch("/api/staff/tickets", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (!data.success || !Array.isArray(data.tickets)) {
          return;
        }

        const uniqueStaff = new Map<string, StaffOption>();

        for (const item of data.tickets) {
          const assigned = item.assignedTo;

          if (
            assigned &&
            assigned._id &&
            assigned.name &&
            STAFF_ROLES.includes(assigned.role)
          ) {
            uniqueStaff.set(assigned._id, {
              _id: assigned._id,
              name: assigned.name,
              email: assigned.email || "",
              role: assigned.role,
              department: assigned.department || null,
            });
          }
        }

        if (
          ticket?.assignedTo?._id &&
          ticket.assignedTo.name &&
          STAFF_ROLES.includes(ticket.assignedTo.role || "")
        ) {
          uniqueStaff.set(ticket.assignedTo._id, {
            _id: ticket.assignedTo._id,
            name: ticket.assignedTo.name,
            email: ticket.assignedTo.email || "",
            role: ticket.assignedTo.role || "STAFF",
            department: ticket.assignedTo.department || null,
          });
        }

        setStaffOptions(
          Array.from(uniqueStaff.values()).sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        );
      } catch (error) {
        console.error("Failed to load staff:", error);
      } finally {
        setLoadingStaff(false);
      }
    }

    loadStaff();
  }, [currentUser, ticket]);

  const hasChanges = useMemo(() => {
    if (!ticket) return false;

    const originalAssigned = ticket.assignedTo?._id || "";

    return (
      selectedStatus !== ticket.status ||
      selectedPriority !== ticket.priority ||
      selectedAssignedTo !== originalAssigned ||
      comment.trim().length > 0 ||
      resolutionSummary.trim() !== (ticket.resolution?.summary || "")
    );
  }, [
    ticket,
    selectedStatus,
    selectedPriority,
    selectedAssignedTo,
    comment,
    resolutionSummary,
  ]);

  async function updateTicket() {
    if (!ticket || !canManageTicket) {
      return;
    }

    setSaving(true);
    setActionError("");
    setSuccessMessage("");

    try {
      const body: Record<string, string | null> = {};

      if (selectedStatus !== ticket.status) {
        body.status = selectedStatus;
      }

      if (selectedPriority !== ticket.priority) {
        body.priority = selectedPriority;
      }

      const originalAssigned = ticket.assignedTo?._id || "";

      if (selectedAssignedTo !== originalAssigned) {
        body.assignedTo = selectedAssignedTo || null;
      }

      if (comment.trim()) {
        body.comment = comment.trim();
      }

      if (resolutionSummary.trim() !== (ticket.resolution?.summary || "")) {
        body.resolutionSummary = resolutionSummary.trim();
      }

      if (Object.keys(body).length === 0) {
        setSaving(false);
        return;
      }

      const response = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update ticket");
      }

      setComment("");

      setSuccessMessage(data.message || "Ticket updated successfully");

      await loadTicket();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to update ticket",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8fc]">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Loading ticket...
          </p>
        </div>
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8fc] px-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 px-6 py-6 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600">
            !
          </div>

          <h1 className="mt-4 font-semibold text-red-800">
            Unable to load ticket
          </h1>

          <p className="mt-2 text-sm leading-6 text-red-600">
            {error || "Ticket not found"}
          </p>

          <Link
            href={backUrl}
            className="mt-5 inline-block rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
          >
            ← Back to tickets
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f8fc]">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href={backUrl} className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
              SS
            </div>

            <div>
              <p className="font-semibold text-slate-900">Student Support</p>

              <p className="hidden text-xs text-slate-500 sm:block">
                Support & Ticket Management
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {currentUser && (
              <span className="hidden text-sm font-semibold text-slate-600 sm:inline">
                {currentUser.name}
              </span>
            )}

            {!isStaff && (
              <Link
                href="/tickets/new"
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                + New Request
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Back */}
        <Link
          href={backUrl}
          className="text-sm font-medium text-slate-500 transition hover:text-blue-600"
        >
          ← Back to {isStaff ? "Tickets" : "My Requests"}
        </Link>

        {/* Success */}
        {successMessage && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {successMessage}
          </div>
        )}

        {/* Error */}
        {actionError && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {actionError}
          </div>
        )}

        {/* Ticket heading */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold text-blue-600">
                {ticket.ticketNumber}
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {ticket.subject}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Submitted {formatDate(ticket.createdAt)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusClasses(
                  ticket.status,
                )}`}
              >
                {formatLabel(ticket.status)}
              </span>

              <span
                className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${getPriorityClasses(
                  ticket.priority,
                )}`}
              >
                {formatLabel(ticket.priority)} Priority
              </span>
            </div>
          </div>

          {/* Ticket metadata */}
          <div className="mt-8 grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Category
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {formatLabel(ticket.category)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Department
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {ticket.departmentId?.name || "Unassigned"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Age
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {ticket.age || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Assigned To
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {ticket.assignedTo?.name || "Unassigned"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Main content */}
          <div className="space-y-6">
            {/* Student information - staff only */}
            {isStaff && ticket.studentId && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">
                  Student
                </h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Name
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {ticket.studentId.name || "—"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Email
                    </p>

                    <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                      {ticket.studentId.email || "—"}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Description */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">
                Request Details
              </h2>

              <div className="mt-5 rounded-xl bg-slate-50 p-5">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {ticket.description}
                </p>
              </div>
            </section>

            {/* Resolution */}
            {(ticket.resolution?.summary || isStaff) && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">
                  Resolution
                </h2>

                {isStaff ? (
                  <div className="mt-5">
                    <label className="text-sm font-semibold text-slate-700">
                      Resolution Summary
                    </label>

                    <textarea
                      value={resolutionSummary}
                      onChange={(event) =>
                        setResolutionSummary(event.target.value)
                      }
                      rows={5}
                      placeholder="Describe how this ticket was resolved..."
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl bg-emerald-50 p-5">
                    <p className="whitespace-pre-wrap text-sm leading-7 text-emerald-800">
                      {ticket.resolution?.summary ||
                        "No resolution summary available."}
                    </p>
                  </div>
                )}

                {ticket.resolution?.resolvedAt && (
                  <p className="mt-3 text-xs text-slate-400">
                    Resolved {formatDate(ticket.resolution.resolvedAt)}
                  </p>
                )}
              </section>
            )}

            {/* Activity */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Activity History
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    {activities.length}{" "}
                    {activities.length === 1 ? "activity" : "activities"}
                  </p>
                </div>
              </div>

              {activities.length === 0 ? (
                <div className="mt-6 rounded-xl bg-slate-50 p-6 text-center">
                  <p className="text-sm text-slate-500">
                    No activity recorded yet.
                  </p>
                </div>
              ) : (
                <div className="mt-6">
                  {activities.map((activity, index) => (
                    <div
                      key={activity._id}
                      className="relative flex gap-4 pb-7 last:pb-0"
                    >
                      {index !== activities.length - 1 && (
                        <div className="absolute left-3 top-7 h-full w-px bg-slate-200" />
                      )}

                      <div className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600 ring-4 ring-white">
                        ✓
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm font-semibold text-slate-800">
                            {activity.action ||
                              formatLabel(activity.type) ||
                              "Ticket updated"}
                          </p>

                          <p className="text-xs text-slate-400">
                            {formatDate(activity.createdAt)}
                          </p>
                        </div>

                        {activity.actorId?.name && (
                          <p className="mt-1 text-xs font-medium text-slate-400">
                            By {activity.actorId.name}
                            {activity.actorId.role
                              ? ` • ${formatLabel(activity.actorId.role)}`
                              : ""}
                          </p>
                        )}

                        {activity.comment && (
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-500">
                            {activity.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* SLA */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-slate-900">SLA</h2>

                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-bold ${getSlaClasses(
                    ticket.slaStatus,
                  )}`}
                >
                  {formatLabel(ticket.slaStatus)}
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Resolution Due
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatDate(ticket.sla?.resolutionDueAt)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Response
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {ticket.sla?.respondedAt
                      ? `Responded ${formatDate(ticket.sla.respondedAt)}`
                      : "Not responded yet"}
                  </p>
                </div>

                {ticket.sla?.resolvedAt && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Resolved At
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {formatDate(ticket.sla.resolvedAt)}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Staff controls */}
            {canManageTicket && (
              <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
                    Staff Controls
                  </p>

                  <h2 className="mt-1 text-base font-semibold text-slate-900">
                    Manage Ticket
                  </h2>
                </div>

                <div className="mt-6 space-y-5">
                  {/* Status */}
                  <div>
                    <label
                      htmlFor="ticket-status"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Status
                    </label>

                    <select
                      id="ticket-status"
                      value={selectedStatus}
                      onChange={(event) =>
                        setSelectedStatus(event.target.value)
                      }
                      disabled={saving}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {formatLabel(status)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label
                      htmlFor="ticket-priority"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Priority
                    </label>

                    <select
                      id="ticket-priority"
                      value={selectedPriority}
                      onChange={(event) =>
                        setSelectedPriority(event.target.value)
                      }
                      disabled={saving}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                    >
                      {PRIORITIES.map((priority) => (
                        <option key={priority} value={priority}>
                          {formatLabel(priority)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Assignment */}
                  <div>
                    <label
                      htmlFor="ticket-assignee"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Assign To
                    </label>

                    <select
                      id="ticket-assignee"
                      value={selectedAssignedTo}
                      onChange={(event) =>
                        setSelectedAssignedTo(event.target.value)
                      }
                      disabled={saving || loadingStaff}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                    >
                      <option value="">Unassigned</option>

                      {staffOptions.map((staff) => (
                        <option key={staff._id} value={staff._id}>
                          {staff.name} — {formatLabel(staff.role)}
                        </option>
                      ))}
                    </select>

                    {loadingStaff && (
                      <p className="mt-1.5 text-xs text-slate-400">
                        Loading available staff...
                      </p>
                    )}

                    {!loadingStaff && staffOptions.length === 0 && (
                      <p className="mt-1.5 text-xs text-slate-400">
                        No other assigned staff members are currently available.
                      </p>
                    )}
                  </div>

                  {/* Comment */}
                  <div>
                    <label
                      htmlFor="ticket-comment"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Add Comment
                    </label>

                    <textarea
                      id="ticket-comment"
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      disabled={saving}
                      rows={4}
                      placeholder="Add an internal update or response..."
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                    />
                  </div>

                  {/* Save */}
                  <button
                    type="button"
                    onClick={updateTicket}
                    disabled={saving || !hasChanges}
                    className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </section>
            )}

            {/* Assignment information */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">
                Ownership
              </h2>

              <div className="mt-5">
                {ticket.assignedTo ? (
                  <div className="rounded-xl bg-indigo-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-indigo-400">
                      Assigned Staff
                    </p>

                    <p className="mt-1 text-sm font-bold text-indigo-900">
                      {ticket.assignedTo.name}
                    </p>

                    {ticket.assignedTo.email && (
                      <p className="mt-1 break-all text-xs text-indigo-600">
                        {ticket.assignedTo.email}
                      </p>
                    )}

                    {ticket.assignedTo.role && (
                      <p className="mt-2 text-xs font-semibold text-indigo-500">
                        {formatLabel(ticket.assignedTo.role)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-500">
                      This ticket is currently unassigned.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
