"use client";

import { useEffect, useState } from "react";

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
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTickets() {
      try {
        const response = await fetch("/api/tickets");

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch tickets");
        }

        setTickets(data.tickets);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Something went wrong",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchTickets();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8fc]">
        <p className="text-sm text-slate-500">Loading your tickets...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8fc]">
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f8fc]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <a href="/tickets" className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
              SS
            </div>

            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">
                Student Support
              </p>

              <p className="text-xs text-slate-500">
                Support & Ticket Management
              </p>
            </div>
          </a>

          <a
            href="/tickets/new"
            className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
          >
            + New Request
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
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

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {tickets.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl">
                ?
              </div>

              <h2 className="text-lg font-semibold text-slate-800">
                No support requests yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                When you submit a support request, it will appear here so you
                can track its progress.
              </p>

              <a
                href="/tickets/new"
                className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Create your first request
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <a
                  key={ticket._id}
                  href={`/tickets/${ticket._id}`}
                  className="block rounded-xl border border-slate-200 p-5 transition hover:border-blue-300 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
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

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {ticket.status}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs text-slate-400">
                      Priority: {ticket.priority}
                    </span>

                    <span className="text-xs text-slate-400">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
