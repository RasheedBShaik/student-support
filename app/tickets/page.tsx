"use client";

import { useEffect, useState } from "react";
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
};

export default function TicketsPage() {
const router = useRouter();

const [tickets, setTickets] = useState<Ticket[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
let mounted = true;

async function loadTickets() {
  try {
    // First verify the session.
    const authResponse = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!authResponse.ok) {
      router.replace("/login");
      return;
    }

    const authData = await authResponse.json();

    if (!authData.authenticated || !authData.user) {
      router.replace("/login");
      return;
    }

    // Only fetch tickets after authentication succeeds.
    const response = await fetch("/api/tickets", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (response.status === 401) {
      router.replace("/login");
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to fetch tickets",
      );
    }

    if (mounted) {
      setTickets(data.tickets || []);
    }
  } catch (error) {
    if (!mounted) return;

    setError(
      error instanceof Error
        ? error.message
        : "Something went wrong",
    );
  } finally {
    if (mounted) {
      setLoading(false);
    }
  }
}

loadTickets();

return () => {
  mounted = false;
};


}, [router]);

if (loading) {
return (
<main className="flex min-h-screen items-center justify-center bg-[#f6f8fc]">
<div className="text-center">
<div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

      <p className="mt-4 text-sm text-slate-500">
        Checking your account...
      </p>
    </div>
  </main>
);


}

if (error) {
return (
<main className="flex min-h-screen items-center justify-center bg-[#f6f8fc] px-4">
<div className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-center">
<p className="font-semibold text-red-800">
Unable to load tickets
</p>

      <p className="mt-2 text-sm text-red-700">
        {error}
      </p>

      <button
        type="button"
        onClick={() => router.push("/")}
        className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Back to Support Center
      </button>
    </div>
  </main>
);


}

return (
<main className="min-h-screen bg-[#f6f8fc]">
<header className="border-b border-slate-200 bg-white">
<div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
<Link href="/" className="flex items-center gap-3" >
<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
SS
</div>

        <div>
          <p className="font-semibold tracking-tight text-slate-900">
            Student Support
          </p>

          <p className="text-xs text-slate-500">
            Support & Ticket Management
          </p>
        </div>
      </Link>

      <Link
        href="/tickets/new"
        className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        + New Request
      </Link>
    </div>
  </header>

  <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
    <button
      type="button"
      onClick={() => router.push("/")}
      className="text-sm font-medium text-slate-500 transition hover:text-blue-600"
    >
      ← Back to Support
    </button>
  </div>

  <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
    <div className="mb-8">
      <p className="mb-2 text-sm font-semibold text-blue-600">
        SUPPORT CENTER
      </p>

      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        My Support Requests
      </h1>

      <p className="mt-2 text-slate-500">
        Track your requests and view their latest status.
      </p>
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      {tickets.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl">
            ?
          </div>

          <h2 className="text-lg font-semibold text-slate-800">
            No support requests yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            When you submit a support request, it will appear
            here so you can track its progress.
          </p>

          <Link
            href="/tickets/new"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Create your first request
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Link
              key={ticket._id}
              href={`/tickets/${ticket._id}`}
              className="block rounded-xl border border-slate-200 p-5 transition hover:border-blue-300 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-blue-600">
                    {ticket.ticketNumber}
                  </p>

                  <h2 className="mt-1 font-semibold text-slate-900">
                    {ticket.subject}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    {ticket.category}
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {ticket.status}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xs text-slate-400">
                  Priority: {ticket.priority}
                </span>

                <span className="text-xs text-slate-400">
                  {new Date(
                    ticket.createdAt,
                  ).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  </div>
</main>


);
}