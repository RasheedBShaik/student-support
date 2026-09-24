"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, type FormEvent, useEffect, useState } from "react";

const categories = [
  {
    value: "FEES",
    label: "Fees & Payments",
    icon: "₹",
    description: "Payment, fee receipts, refunds",
  },
  {
    value: "ATTENDANCE",
    label: "Attendance",
    icon: "✓",
    description: "Attendance corrections and issues",
  },
  {
    value: "ID_CARD",
    label: "ID Card",
    icon: "▣",
    description: "New, lost or replacement ID",
  },
  {
    value: "DOCUMENTS",
    label: "Documents",
    icon: "▤",
    description: "Bonafide, transcripts and documents",
  },
  {
    value: "CERTIFICATES",
    label: "Certificates",
    icon: "★",
    description: "Academic and other certificates",
  },
  {
    value: "EXAMINATION",
    label: "Examination",
    icon: "✎",
    description: "Exam forms, results and queries",
  },
  {
    value: "HOSTEL",
    label: "Hostel",
    icon: "⌂",
    description: "Hostel-related requests",
  },
  {
    value: "TRANSPORT",
    label: "Transport",
    icon: "→",
    description: "Bus and transport queries",
  },
  {
    value: "OTHER",
    label: "Other",
    icon: "•••",
    description: "Anything that doesn't fit the categories above",
  },
];

const priorities = [
  {
    value: "LOW",
    label: "Low",
    description: "General request",
    color: "border-slate-200 bg-slate-50 text-slate-700",
  },
  {
    value: "MEDIUM",
    label: "Medium",
    description: "Needs attention",
    color: "border-blue-200 bg-blue-50 text-blue-700",
  },
  {
    value: "HIGH",
    label: "High",
    description: "Requires prompt action",
    color: "border-orange-200 bg-orange-50 text-orange-700",
  },
  {
    value: "URGENT",
    label: "Urgent",
    description: "Immediate attention",
    color: "border-red-200 bg-red-50 text-red-700",
  },
];

type FormState = {
  subject: string;
  description: string;
  category: string;
  priority: string;
};

function NewTicketForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState<FormState>({
    subject: "",
    description: "",
    category: "",
    priority: "MEDIUM",
  });

  useEffect(() => {
    const category = searchParams.get("category");

    if (!category) {
      return;
    }

    const isValidCategory = categories.some((item) => item.value === category);

    if (!isValidCategory) {
      return;
    }

    const timer = window.setTimeout(() => {
      setForm((current) => {
        if (current.category === category) {
          return current;
        }

        return {
          ...current,
          category,
        };
      });
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchParams]);

  const updateForm = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const subject = form.subject.trim();
    const description = form.description.trim();

    if (!subject) {
      setMessage("Please enter a subject.");
      return;
    }

    if (!form.category) {
      setMessage("Please select a category.");
      return;
    }

    if (!description) {
      setMessage("Please describe your issue.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          subject,
          description,
          category: form.category,
          priority: form.priority,
        }),
      });

      const data: {
        success?: boolean;
        message?: string;
      } = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }

        throw new Error(data.message || "Failed to create ticket");
      }

      setMessage("Ticket created successfully!");

      setForm({
        subject: "",
        description: "",
        category: "",
        priority: "MEDIUM",
      });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f8fc]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-sm">
              SS
            </div>

            <div>
              <p className="font-semibold text-slate-900">Student Support</p>

              <p className="hidden text-xs text-slate-500 sm:block">
                Support & Ticket Management
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
              S
            </div>

            <div>
              <p className="text-sm font-medium text-slate-800">Student</p>

              <p className="text-xs text-slate-500">Student Portal</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm font-medium text-slate-500 transition hover:text-blue-600"
          >
            ← Back to Support
          </Link>
        </div>

        <div className="mb-8 sm:mb-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            NEW SUPPORT REQUEST
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            How can we help you?
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
            Tell us what you need help with. Our support team will review your
            request and get back to you as soon as possible.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
          >
            <div className="mb-8">
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                What do you need help with?
              </label>

              <input
                type="text"
                value={form.subject}
                onChange={(event) => updateForm("subject", event.target.value)}
                placeholder="e.g. Fee payment was deducted but status is pending"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                required
              />
            </div>

            <div className="mb-8">
              <div className="mb-3">
                <label className="block text-sm font-semibold text-slate-800">
                  Select a category
                </label>

                <p className="mt-1 text-xs text-slate-500">
                  Choose the area that best matches your request.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => {
                  const selected = form.category === category.value;

                  return (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => updateForm("category", category.value)}
                      className={`rounded-xl border p-4 text-left transition ${
                        selected
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                          : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                            selected
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {category.icon}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {category.label}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {category.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-8">
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Describe your issue
              </label>

              <textarea
                value={form.description}
                onChange={(event) =>
                  updateForm("description", event.target.value)
                }
                placeholder="Please provide any details that can help our support team understand and resolve your request..."
                rows={6}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                required
              />

              <p className="mt-2 text-xs text-slate-400">
                Include relevant details such as transaction IDs, dates,
                document names, or error messages.
              </p>
            </div>

            <div className="mb-8">
              <div className="mb-3">
                <label className="block text-sm font-semibold text-slate-800">
                  Priority
                </label>

                <p className="mt-1 text-xs text-slate-500">
                  Help us understand how urgently you need assistance.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {priorities.map((priority) => {
                  const selected = form.priority === priority.value;

                  return (
                    <button
                      key={priority.value}
                      type="button"
                      onClick={() => updateForm("priority", priority.value)}
                      className={`rounded-xl border p-4 text-left transition ${
                        selected
                          ? `${priority.color} ring-2 ring-blue-100`
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">
                          {priority.label}
                        </span>

                        {selected && <span className="text-sm">✓</span>}
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        {priority.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Creating your request..."
                  : "Submit Support Request →"}
              </button>

              {message && (
                <div
                  className={`mt-4 rounded-xl border px-4 py-3 text-center text-sm font-medium ${
                    message.includes("successfully")
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {message.includes("successfully") ? "✓" : "!"} {message}
                </div>
              )}
            </div>
          </form>

          <aside className="space-y-5">
            <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-xl">
                ?
              </div>

              <h2 className="text-lg font-semibold">Need help?</h2>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Provide as much information as possible. This helps our support
                team resolve your request faster.
              </p>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex gap-3">
                  <span className="text-blue-400">✓</span>
                  Include relevant details
                </div>

                <div className="flex gap-3">
                  <span className="text-blue-400">✓</span>
                  Mention any deadlines
                </div>

                <div className="flex gap-3">
                  <span className="text-blue-400">✓</span>
                  Add transaction or reference numbers
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                  ⏱
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-slate-800">
                    What happens next?
                  </h2>

                  <p className="text-xs text-slate-500">
                    Your request follows our support workflow.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                    1
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Request submitted
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      You receive a unique ticket number.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                    2
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Support team reviews
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Your request is assigned to the right team.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                    3
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Issue resolved
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Track progress until your request is closed.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-500">
              🔒 Your support requests are visible only to you and authorized
              support staff.
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function NewTicketPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f6f8fc]" />}>
      <NewTicketForm />
    </Suspense>
  );
}
