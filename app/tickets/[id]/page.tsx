"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Activity = {
  _id: string;
  action?: string;
  type?: string;
  comment?: string;
  createdAt: string;
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
};

export default function TicketDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTicket() {
      try {
        const response = await fetch(`/api/tickets/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch ticket");
        }

        setTicket(data.ticket);
        setActivities(data.activities || []);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchTicket();
    }
  }, [id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8fc]">
        <p className="text-sm text-slate-500">
          Loading ticket...
        </p>
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8fc] px-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-center">
          <h1 className="font-semibold text-red-800">
            Unable to load ticket
          </h1>

          <p className="mt-1 text-sm text-red-600">
            {error || "Ticket not found"}
          </p>

          <a
            href="/tickets"
            className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ← Back to tickets
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f8fc]">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/tickets" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
              SS
            </div>

            <div>
              <p className="font-semibold text-slate-900">
                Student Support
              </p>

              <p className="text-xs text-slate-500">
                Support & Ticket Management
              </p>
            </div>
          </a>

          <a
            href="/tickets/new"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            + New Request
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Back */}
        <a
          href="/tickets"
          className="text-sm font-medium text-slate-500 hover:text-blue-600"
        >
          ← Back to My Requests
        </a>

        {/* Ticket heading */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">
                {ticket.ticketNumber}
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {ticket.subject}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Submitted{" "}
                {new Date(ticket.createdAt).toLocaleDateString()}
              </p>
            </div>

            <span className="inline-flex w-fit rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700">
              {ticket.status}
            </span>
          </div>

          {/* Meta */}
          <div className="mt-8 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Category
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {ticket.category}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Priority
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {ticket.priority}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Status
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {ticket.status}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
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

          {/* Activity */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">
              Activity
            </h2>

            {activities.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">
                No activity recorded yet.
              </p>
            ) : (
              <div className="mt-6">
                {activities.map((activity, index) => (
                  <div
                    key={activity._id}
                    className="relative flex gap-4 pb-6 last:pb-0"
                  >
                    {index !== activities.length - 1 && (
                      <div className="absolute left-2.75 top-7 h-full w-px bg-slate-200" />
                    )}

                    <div className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                      ✓
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">
                        {activity.action ||
                          activity.type ||
                          "Ticket updated"}
                      </p>

                      {activity.comment && (
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {activity.comment}
                        </p>
                      )}

                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(
                          activity.createdAt
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
