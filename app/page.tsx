export default function Home() {
  const categories = [
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
              <p className="font-semibold tracking-tight text-slate-900">
                Student Support
              </p>
              <p className="hidden text-xs text-slate-500 sm:block">
                Support & Ticket Management
              </p>
            </div>
          </a>

          <nav className="flex items-center gap-2 sm:gap-3">
            <a
              href="/tickets"
              className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:inline-flex sm:px-4"
            >
              My Tickets
            </a>

            <a
              href="/login"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:px-4"
            >
              Login
            </a>

            <a
              href="/tickets/new"
              className="rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:px-4"
            >
              <span className="sm:hidden">+ Request</span>
              <span className="hidden sm:inline">+ New Request</span>
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
                <span className="block text-blue-600">We&apos;re here.</span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                Raise administrative requests, track their progress, and stay
                informed until your issue is resolved — all from one place.
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

            {/* Hero card */}
            <div className="relative">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-100/70 blur-3xl" />
              <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-indigo-100/70 blur-3xl" />

              <div className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-7">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Request Overview
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      Your support journey
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">
                    ✓
                  </div>
                </div>

                <div className="mt-7 space-y-5">
                  <div className="flex gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      1
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        Submit your request
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Tell us what you need help with.
                      </p>
                    </div>
                  </div>

                  <div className="ml-4 h-5 border-l border-dashed border-slate-200" />

                  <div className="flex gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                      2
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        Get assigned
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Your request reaches the appropriate team.
                      </p>
                    </div>
                  </div>

                  <div className="ml-4 h-5 border-l border-dashed border-slate-200" />

                  <div className="flex gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                      3
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        Track progress
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Follow updates and activity on your ticket.
                      </p>
                    </div>
                  </div>

                  <div className="ml-4 h-5 border-l border-dashed border-slate-200" />

                  <div className="flex gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-600">
                      ✓
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        Get resolved
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Receive the resolution and close your request.
                      </p>
                    </div>
                  </div>
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

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Choose a support category
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
              Select the area related to your request and our support team will
              take it from there.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <a
                key={category.title}
                href={`/tickets/new?category=${category.category}`}
                className="group rounded-2xl border border-slate-200 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-lg hover:shadow-slate-200/50"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600 transition group-hover:bg-blue-100 group-hover:text-blue-600">
                  {category.icon}
                </div>

                <h3 className="mt-4 font-semibold text-slate-900">
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

      {/* Bottom CTA */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="overflow-hidden rounded-3xl bg-slate-950 px-6 py-10 text-center sm:px-10 sm:py-14">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
              Need assistance?
            </p>

            <h2 className="mx-auto mt-3 max-w-2xl text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Submit a request and let us handle the rest.
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
              Every request gets a ticket number so you can easily follow its
              progress and view updates.
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

// password: Jhz3HR6mOql4Qh6j
// username: student_support_user

// mongodb+srv://student_support_user:Jhz3HR6mOql4Qh6j@cluster0.ltwfbt3.mongodb.net/?appName=Cluster0
