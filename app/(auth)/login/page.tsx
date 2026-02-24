"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HiEye, HiEyeOff } from "react-icons/hi";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Email and password are required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { message?: string } | null;
        toast.error(payload?.message || "Failed to login");
        return;
      }

      toast.success("Logged in successfully");
      router.replace("/");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen grid lg:grid-cols-[1.1fr_0.9fr] bg-white">
      <section className="relative hidden lg:flex flex-col justify-between p-12 bg-[radial-gradient(circle_at_top,_#f5e9ff,_#ffffff_55%)]">
        <div className="flex items-center gap-2 text-lg font-extrabold text-[var(--primary)]">
          My<span className="text-black">Finance</span>
        </div>

        <div className="max-w-lg">
          <h1 className="text-4xl font-extrabold leading-tight text-black">
            Welcome back to your finance dashboard.
          </h1>
          <p className="mt-4 text-base text-gray-600">
            Track loans, manage clients, and see your collections in one place.
          </p>

          <div className="mt-8 grid gap-4">
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Today</p>
              <p className="mt-2 text-2xl font-bold">₹2,10,000</p>
              <p className="text-sm text-gray-500">Collected this month</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Active loans</p>
              <p className="mt-2 text-2xl font-bold">48</p>
              <p className="text-sm text-gray-500">Across 132 clients</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500">Secure access for staff only.</p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <p className="text-sm font-semibold text-[var(--primary)]">Sign in</p>
            <h2 className="text-3xl font-extrabold text-black">Admin Login</h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your credentials to access the dashboard.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-semibold text-gray-700">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className="input mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">Password</label>
              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <HiEyeOff className="text-lg" /> : <HiEye className="text-lg" />}
                </button>
              </div>
              <div className="mt-2 text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm font-semibold text-[var(--primary)] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-8 text-xs text-gray-500">
            By signing in, you agree to the data use and security policy.
          </p>
        </div>
      </section>
    </main>
  );
}
