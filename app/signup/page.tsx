"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
const router = useRouter();

const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");

const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

const [loading, setLoading] = useState(false);
const [message, setMessage] = useState("");

const handleSubmit = async (e: FormEvent) => {
e.preventDefault();

setLoading(true);
setMessage("");

if (password !== confirmPassword) {
  setMessage("Passwords do not match");
  setLoading(false);
  return;
}

if (password.length < 6) {
  setMessage("Password must be at least 6 characters");
  setLoading(false);
  return;
}

try {
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to create account");
  }

  setMessage("Account created successfully!");

  setTimeout(() => {
    router.push("/login");
  }, 1000);
} catch (error) {
  setMessage(
    error instanceof Error
      ? error.message
      : "Something went wrong",
  );
} finally {
  setLoading(false);
}


};

return (
<main className="min-h-screen bg-[#f6f8fc]">
<div className="grid min-h-screen lg:grid-cols-2">

    {/* Left panel */}
    <section className="relative hidden overflow-hidden bg-slate-950 lg:flex">
      <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">

        {/* Logo */}
        <a href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
            SS
          </div>

          <div>
            <p className="font-semibold text-white">
              Student Support
            </p>

            <p className="text-xs text-slate-400">
              Support & Ticket Management
            </p>
          </div>
        </a>

        {/* Content */}
        <div className="max-w-lg">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-blue-300">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            STUDENT PORTAL
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
            Create your
            <span className="block text-blue-400">
              support account.
            </span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-7 text-slate-400">
            Create an account to submit support requests, track
            your tickets, and stay updated throughout the
            resolution process.
          </p>

          <div className="mt-9 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-bold text-white">
                24/7
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Request tracking
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-bold text-white">
                1
              </p>

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

    {/* Signup */}
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

        {/* Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-8">

          <div className="mb-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl text-blue-600">
              +
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Create account
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Create your student account to access the support portal.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Full name
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rahul Sharma"
                autoComplete="name"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

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
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  {showPassword ? "◉" : "◌"}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Confirm password
              </label>

              <div className="relative">
                <input
                  id="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="Enter your password again"
                  autoComplete="new-password"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (current) => !current,
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  {showConfirmPassword ? "◉" : "◌"}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Creating account..."
                : "Create Account →"}
            </button>

            {/* Message */}
            {message && (
              <div
                className={`rounded-xl border px-4 py-3 text-center text-sm font-medium ${
                  message.startsWith("Account created")
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {message.startsWith("Account created")
                  ? "✓"
                  : "!"}{" "}
                {message}
              </div>
            )}
          </form>
        </div>

        {/* Login link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-semibold text-blue-600 transition hover:text-blue-700"
            >
              Sign in
            </a>
          </p>
        </div>

        <div className="mt-4 text-center">
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