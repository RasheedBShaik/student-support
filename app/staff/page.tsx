"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Ticket = {
  _id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  age: string;
  slaStatus: string;
  sla?: {
    resolutionDueAt?: string;
  };
  studentId?: {
    name?: string;
    email?: string;
  };
  assignedTo?: {
    name?: string;
    email?: string;
  };
  departmentId?: {
    name?: string;
  };
};

type Stats = {
  total: number;
  new: number;
  assigned: number;
  inProgress: number;
  pending: number;
  resolved: number;
  closed: number;
  urgent: number;
  slaBreached: number;
  slaAtRisk: number;
};

const emptyStats: Stats = {
  total: 0,
  new: 0,
  assigned: 0,
  inProgress: 0,
  pending: 0,
  resolved: 0,
  closed: 0,
  urgent: 0,
  slaBreached: 0,
  slaAtRisk: 0,
};

function statusClass(status: string) {
  switch (status) {
    case "NEW":
      return "bg-blue-50 text-blue-700";
    case "ASSIGNED":
      return "bg-indigo-50 text-indigo-700";
    case "IN_PROGRESS":
      return "bg-amber-50 text-amber-700";
    case "PENDING_STUDENT":
      return "bg-orange-50 text-orange-700";
    case "PENDING_INTERNAL":
      return "bg-purple-50 text-purple-700";
    case "RESOLVED":
      return "bg-emerald-50 text-emerald-700";
    case "CLOSED":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function priorityClass(priority: string) {
  switch (priority) {
    case "URGENT":
      return "bg-red-100 text-red-700";
    case "HIGH":
      return "bg-orange-100 text-orange-700";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-700";
    case "LOW":
      return "bg-green-100 text-green-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function slaClass(slaStatus: string) {
  switch (slaStatus) {
    case "BREACHED":
      return "bg-red-50 text-red-700";
    case "AT_RISK":
      return "bg-orange-50 text-orange-700";
    case "ON_TRACK":
      return "bg-emerald-50 text-emerald-700";
    case "COMPLETED":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function StaffDashboard() {
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats>(emptyStats);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");

  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (status !== "ALL") {
        params.set("status", status);
      }

      if (priority !== "ALL") {
        params.set("priority", priority);
      }

      const query = params.toString();

      const response = await fetch(
        query
          ? `/api/staff/tickets?${query}`
          : "/api/staff/tickets",
        {
          credentials: "include",
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }

        throw new Error(
          data.message || "Failed to load tickets",
        );
      }

      setTickets(
        Array.isArray(data.tickets)
          ? data.tickets
          : [],
      );

      setStats(data.stats || emptyStats);

      setUserName(data.user?.name || "");
      setUserRole(data.user?.role || "");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  }, [priority, router, search, status]);

  const handleSearch = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    await loadTickets();
  };

  const handleStatusChange = async (
    value: string,
  ) => {
    setStatus(value);
  };

  const handlePriorityChange = async (
    value: string,
  ) => {
    setPriority(value);
  };

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
              SS
            </div>

            <div>
              <p className="font-semibold">
                Student Support
              </p>

              <p className="text-xs text-slate-500">
                Staff Management Portal
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">
                {userName || "Staff"}
              </p>

              <p className="text-xs text-slate-500">
                {userRole}
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Home
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
            Management
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Support Operations
          </h1>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Monitor requests, ownership, priorities, SLA
            performance, and ageing from one place.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
          <StatCard
            label="Total"
            value={stats.total}
            color="blue"
          />

          <StatCard
            label="New"
            value={stats.new}
            color="indigo"
          />

          <StatCard
            label="In Progress"
            value={stats.inProgress}
            color="amber"
          />

          <StatCard
            label="Pending"
            value={stats.pending}
            color="purple"
          />

          <StatCard
            label="Urgent"
            value={stats.urgent}
            color="red"
          />

          <StatCard
            label="Resolved"
            value={stats.resolved}
            color="green"
          />

          <StatCard
            label="Closed"
            value={stats.closed}
            color="slate"
          />

          <StatCard
            label="SLA Breached"
            value={stats.slaBreached}
            color="red"
          />

          <StatCard
            label="SLA At Risk"
            value={stats.slaAtRisk}
            color="orange"
          />
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <form
            onSubmit={handleSearch}
            className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]"
          >
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search ticket number or subject..."
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />

            <select
              value={status}
              onChange={(event) =>
                void handleStatusChange(
                  event.target.value,
                )
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-blue-500"
            >
              <option value="ALL">
                All statuses
              </option>
              <option value="NEW">New</option>
              <option value="ASSIGNED">
                Assigned
              </option>
              <option value="IN_PROGRESS">
                In Progress
              </option>
              <option value="PENDING_STUDENT">
                Pending Student
              </option>
              <option value="PENDING_INTERNAL">
                Pending Internal
              </option>
              <option value="RESOLVED">
                Resolved
              </option>
              <option value="CLOSED">
                Closed
              </option>
            </select>

            <select
              value={priority}
              onChange={(event) =>
                void handlePriorityChange(
                  event.target.value,
                )
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-blue-500"
            >
              <option value="ALL">
                All priorities
              </option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">
                Medium
              </option>
              <option value="HIGH">High</option>
              <option value="URGENT">
                Urgent
              </option>
            </select>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Loading..." : "Search"}
            </button>
          </form>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-slate-900">
                  Ticket Queue
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {tickets.length} ticket
                  {tickets.length === 1
                    ? ""
                    : "s"}{" "}
                  shown
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadTickets()}
                disabled={loading}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Refresh
              </button>
            </div>
          </div>

          {loading && tickets.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm text-slate-500">
                Loading ticket queue...
              </p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl">
                ✓
              </div>

              <h3 className="mt-4 font-semibold">
                No tickets found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Try changing your filters or search
                terms.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tickets.map((ticket) => (
                <div
                  key={ticket._id}
                  className="p-5 transition hover:bg-slate-50/70"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-blue-600">
                          {ticket.ticketNumber}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass(
                            ticket.status,
                          )}`}
                        >
                          {ticket.status.replaceAll(
                            "_",
                            " ",
                          )}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${priorityClass(
                            ticket.priority,
                          )}`}
                        >
                          {ticket.priority}
                        </span>
                      </div>

                      <h3 className="mt-2 text-base font-bold text-slate-900">
                        {ticket.subject}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {ticket.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                        <span>
                          Student:{" "}
                          <strong className="text-slate-700">
                            {ticket.studentId?.name ||
                              "Unknown"}
                          </strong>
                        </span>

                        <span>
                          Category:{" "}
                          <strong className="text-slate-700">
                            {ticket.category}
                          </strong>
                        </span>

                        <span>
                          Department:{" "}
                          <strong className="text-slate-700">
                            {ticket.departmentId?.name ||
                              "Unassigned"}
                          </strong>
                        </span>

                        <span>
                          Owner:{" "}
                          <strong className="text-slate-700">
                            {ticket.assignedTo?.name ||
                              "Unassigned"}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="w-full shrink-0 lg:w-52">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-500">
                            Age
                          </span>

                          <span className="text-sm font-bold text-slate-800">
                            {ticket.age}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-500">
                            SLA
                          </span>

                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-bold ${slaClass(
                              ticket.slaStatus,
                            )}`}
                          >
                            {ticket.slaStatus.replaceAll(
                              "_",
                              " ",
                            )}
                          </span>
                        </div>

                        {ticket.sla
                          ?.resolutionDueAt && (
                          <p className="mt-3 text-[11px] text-slate-400">
                            Due{" "}
                            {new Date(
                              ticket.sla.resolutionDueAt,
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/tickets/${ticket._id}`,
                          )
                        }
                        className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                      >
                        Open Ticket →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color:
    | "blue"
    | "indigo"
    | "amber"
    | "purple"
    | "red"
    | "green"
    | "slate"
    | "orange";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    indigo: "bg-indigo-50 text-indigo-700",
    amber: "bg-amber-50 text-amber-700",
    purple: "bg-purple-50 text-purple-700",
    red: "bg-red-50 text-red-700",
    green: "bg-emerald-50 text-emerald-700",
    slate: "bg-slate-100 text-slate-700",
    orange: "bg-orange-50 text-orange-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className={`inline-flex rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${colors[color]}`}
      >
        {label}
      </div>

      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}
