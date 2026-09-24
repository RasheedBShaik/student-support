"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    // Authentication API will be connected next.
    await new Promise((resolve) => setTimeout(resolve, 600));

    setLoading(false);
    setMessage("Authentication will be connected next.");
  };

  return (
    <main className="min-h-screen bg-[#f6f8fc]">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left panel */}
        <section className="relative hidden overflow-hidden bg-slate-950 lg:flex">
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
            <a href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
                SS
              </div>

              <div>
                <p className="font-semibold text-white">Student Support</p>
                <p className="text-xs text-slate-400">
                  Support & Ticket Management
                </p>
              </div>
            </a>

            <div className="max-w-lg">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-blue-300">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                SUPPORT PORTAL
              </div>

              <h1 className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
                One place for every
                <span className="block text-blue-400">
                  support request.
                </span>
              </h1>

              <p className="mt-5 max-w-md text-base leading-7 text-slate-400">
                Submit requests, track progress, and stay connected with the
                support team throughout the resolution process.
              </p>

              <div className="mt-9 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-2xl font-bold text-white">24/7</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Request tracking
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-2xl font-bold text-white">1</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Central support portal
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              © 2026 Student Support & Ticket Management
            </p>
          </div>
        </section>

        {/* Login panel */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            {/* Mobile branding */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
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
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-8">
              <div className="mb-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl text-blue-600">
                  →
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Sign in to access your support portal.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-slate-800"
                    >
                      Password
                    </label>

                    <button
                      type="button"
                      className="text-xs font-semibold text-blue-600 transition hover:text-blue-700"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                {/* Remember */}
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600"
                  />

                  <span className="text-sm text-slate-600">
                    Keep me signed in
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Signing in..." : "Sign in →"}
                </button>

                {message && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm font-medium text-blue-700">
                    {message}
                  </div>
                )}
              </form>
            </div>

            <div className="mt-6 text-center">
              <a
                href="/"
                className="text-sm font-medium text-slate-500 transition hover:text-blue-600"
              >
                ← Back to Support Center
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}