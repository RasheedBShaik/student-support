"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "STAFF" | "MANAGER" | "ADMIN";
};

const studentCategories = [
  {
    title: "Fees & Payments",
    category: "FEES",
    description: "Fee payments, receipts and financial queries",
    icon: "₹",
  },
  {
    title: "Attendance",
    category: "ATTENDANCE",
    description: "Attendance corrections and related requests",
    icon: "✓",
  },
  {
    title: "ID Card",
    category: "ID_CARD",
    description: "New, replacement or correction requests",
    icon: "ID",
  },
  {
    title: "Documents",
    category: "DOCUMENTS",
    description: "Bonafide, transcripts and other documents",
    icon: "▤",
  },
  {
    title: "Certificates",
    category: "CERTIFICATES",
    description: "Certificate requests and status enquiries",
    icon: "★",
  },
  {
    title: "Examination",
    category: "EXAMINATION",
    description: "Exam forms, results and examination queries",
    icon: "✎",
  },
  {
    title: "Hostel",
    category: "HOSTEL",
    description: "Accommodation and hostel-related requests",
    icon: "⌂",
  },
  {
    title: "Transport",
    category: "TRANSPORT",
    description: "Transport, routes and pass-related queries",
    icon: "→",
  },
];

const staffFeatures = [
  {
    title: "Ticket Queue",
    description: "View and manage incoming student requests.",
    icon: "▤",
  },
  {
    title: "Assignment",
    description: "Assign tickets to the appropriate support owner.",
    icon: "→",
  },
  {
    title: "Priorities",
    description: "Monitor LOW, MEDIUM, HIGH and URGENT requests.",
    icon: "!",
  },
  {
    title: "SLA Monitoring",
    description: "Track response and resolution deadlines.",
    icon: "◷",
  },
  {
    title: "Ageing",
    description: "Identify older requests requiring attention.",
    icon: "◫",
  },
  {
    title: "Resolution",
    description: "Process, resolve and close support requests.",
    icon: "✓",
  },
];

function roleLabel(role: User["role"]) {
  switch (role) {
    case "STAFF":
      return "Staff";
    case "MANAGER":
      return "Manager";
    case "ADMIN":
      return "Administrator";
    default:
      return "Student";
  }
}

function roleDescription(role: User["role"]) {
  switch (role) {
    case "STAFF":
      return "Manage student support requests and ticket operations.";
    case "MANAGER":
      return "Monitor support operations, ownership and SLA performance.";
    case "ADMIN":
      return "Manage and monitor the complete support operation.";
    default:
      return "Create requests, track progress and view resolutions.";
  }
}

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (response.ok) {
          const data = await response.json();

          if (data.authenticated && data.user) {
            setUser(data.user);
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      setUser(null);
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  const isStaff =
    user?.role === "STAFF" ||
    user?.role === "MANAGER" ||
    user?.role === "ADMIN";

  /*
   * -------------------------------------------------------
   * LOGGED-IN STAFF / MANAGER / ADMIN HOME
   * -------------------------------------------------------
   */

  if (!checkingAuth && isStaff) {
    return (
      <main className="min-h-screen bg-[#f6f8fc] text-slate-900">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <a href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm">
                SS
              </div>

              <div>
                <p className="font-semibold tracking-tight">
                  Student Support
                </p>

                <p className="hidden text-xs text-slate-500 sm:block">
                  Staff Management Portal
                </p>
              </div>
            </a>

            <nav className="flex items-center gap-2">
              <span className="hidden text-sm font-semibold text-slate-700 sm:inline">
                Hi, {user?.name}
              </span>

              <span className="hidden rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 md:inline">
                {roleLabel(user!.role)}
              </span>

              <button
                type="button"
                onClick={() => router.push("/staff")}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Staff Dashboard
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-red-600 disabled:opacity-50"
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </nav>
          </div>
        </header>

        {/* Staff Hero */}
        <section>
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
            <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                  {roleLabel(user!.role)} Portal
                </div>

                <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl">
                  Support operations,
                  <span className="block text-blue-600">
                    under control.
                  </span>
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  {roleDescription(user!.role)} Monitor ticket
                  status, ownership, priority, SLA performance and
                  ageing from one place.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => router.push("/staff")}
                    className="rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                  >
                    Open Support Dashboard →
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/tickets")}
                    className="rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    Ticket View
                  </button>
                </div>
              </div>

              {/* Operations card */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
                  Operations Overview
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  Manage every request
                </h2>

                <div className="mt-7 space-y-4">
                  {[
                    ["01", "New requests", "Review incoming tickets"],
                    ["02", "Ownership", "Assign the right staff member"],
                    ["03", "SLA & ageing", "Identify attention required"],
                    ["04", "Resolution", "Resolve and close requests"],
                  ].map(([number, title, description]) => (
                    <div
                      key={number}
                      className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xs font-bold text-white">
                        {number}
                      </div>

                      <div>
                        <p className="text-sm font-bold">
                          {title}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Staff Features */}
        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
                Staff Tools
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Everything needed to operate support
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Keep ownership clear, prioritize requests and
                monitor the complete ticket lifecycle.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {staffFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">
                    {feature.icon}
                  </div>

                  <h3 className="mt-4 font-semibold">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={() => router.push("/staff")}
                className="rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Go to Staff Dashboard →
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>Student Support & Ticket Management</p>
            <p>{roleLabel(user!.role)} Portal</p>
          </div>
        </footer>
      </main>
    );
  }

  /*
   * -------------------------------------------------------
   * STUDENT / LOGGED-OUT HOME
   * -------------------------------------------------------
   */

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm">
              SS
            </div>

            <div>
              <p className="font-semibold tracking-tight">
                Student Support
              </p>

              <p className="hidden text-xs text-slate-500 sm:block">
                Support & Ticket Management
              </p>
            </div>
          </a>

          <nav className="flex items-center gap-2 sm:gap-3">
            {!checkingAuth && user ? (
              <>
                <span className="hidden text-sm font-semibold text-slate-700 sm:inline">
                  Hi, {user.name}
                </span>

                <a
                  href="/tickets"
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  My Tickets
                </a>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-red-600 disabled:opacity-50"
                >
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              </>
            ) : !checkingAuth ? (
              <>
                <a
                  href="/login"
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 sm:px-4"
                >
                  Student Login
                </a>

                <a
                  href="/login"
                  className="hidden rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:inline-flex sm:px-4"
                >
                  Staff Login
                </a>
              </>
            ) : (
              <div className="h-9 w-28 animate-pulse rounded-xl bg-slate-100" />
            )}

            <a
              href="/tickets/new"
              className="rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:px-4"
            >
              <span className="sm:hidden">+ Request</span>
              <span className="hidden sm:inline">
                + New Request
              </span>
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                Student Support Center
              </div>

              <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Need help?
                <span className="block text-blue-600">
                  We&apos;re here.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                Raise administrative requests, track their
                progress, and stay informed until your issue is
                resolved — all from one place.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="/tickets/new"
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  Create Support Request
                  <span className="ml-2">→</span>
                </a>

                <a
                  href="/tickets"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  View My Tickets
                </a>
              </div>
            </div>

            {/* Student Journey */}
            <div className="relative">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-100/70 blur-3xl" />

              <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-indigo-100/70 blur-3xl" />

              <div className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-7">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Request Overview
                    </p>

                    <p className="mt-1 text-lg font-bold">
                      Your support journey
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">
                    ✓
                  </div>
                </div>

                <div className="mt-7 space-y-5">
                  {[
                    [
                      "1",
                      "Submit your request",
                      "Tell us what you need help with.",
                    ],
                    [
                      "2",
                      "Get assigned",
                      "Your request reaches the appropriate team.",
                    ],
                    [
                      "3",
                      "Track progress",
                      "Follow updates and activity on your ticket.",
                    ],
                    [
                      "✓",
                      "Get resolved",
                      "Receive the resolution and close your request.",
                    ],
                  ].map(([number, title, description], index) => (
                    <div key={title}>
                      <div className="flex gap-4">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            index === 3
                              ? "bg-emerald-50 text-emerald-600"
                              : index === 0
                                ? "bg-blue-600 text-white"
                                : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          {number}
                        </div>

                        <div>
                          <p className="text-sm font-semibold">
                            {title}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {description}
                          </p>
                        </div>
                      </div>

                      {index < 3 && (
                        <div className="ml-4 mt-2 h-4 border-l border-dashed border-slate-200" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
              How can we help?
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Choose a support category
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
              Select the area related to your request and our
              support team will take it from there.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {studentCategories.map((category) => (
              <a
                key={category.title}
                href={`/tickets/new?category=${category.category}`}
                className="group rounded-2xl border border-slate-200 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-lg hover:shadow-slate-200/50"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600 transition group-hover:bg-blue-100 group-hover:text-blue-600">
                  {category.icon}
                </div>

                <h3 className="mt-4 font-semibold">
                  {category.title}
                </h3>

                <p className="mt-1.5 text-sm leading-5 text-slate-500">
                  {category.description}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Staff access */}
      {!user && !checkingAuth && (
        <section className="bg-slate-950">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
                  Staff Access
                </p>

                <h2 className="mt-2 text-2xl font-bold text-white">
                  Are you a support team member?
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                  Staff, managers and administrators can sign in
                  to manage the ticket queue, assignments, SLAs and
                  resolutions.
                </p>
              </div>

              <a
                href="/login"
                className="shrink-0 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Staff Sign In →
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Student CTA */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="overflow-hidden rounded-3xl bg-blue-600 px-6 py-10 text-center shadow-xl shadow-blue-600/20 sm:px-10 sm:py-14">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-100">
              Need assistance?
            </p>

            <h2 className="mx-auto mt-3 max-w-2xl text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Submit a request and let us handle the rest.
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-blue-100">
              Every request gets a ticket number so you can easily
              follow its progress and view updates.
            </p>

            <a
              href="/tickets/new"
              className="mt-7 inline-flex rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Create Support Request →
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-center text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-left">
          <p>Student Support & Ticket Management</p>
          <p>Administrative Support Portal</p>
        </div>
      </footer>
    </main>
  );
}
