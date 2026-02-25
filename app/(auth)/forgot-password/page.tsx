"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        toast.error(payload?.message || "Failed to send reset link");
        return;
      }

      toast.success(payload?.message || "Reset link generated");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <section className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <p className="text-sm font-semibold text-[var(--primary)]">
              Forgot password
            </p>
            <h2 className="text-3xl font-extrabold text-black">
              Recover Access
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your email and we will send a reset link.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className="input mt-2"
              />
            </div>

            <button
              type="submit"
              className={`btn-primary w-full ${submitting ? "opacity-50" : "cursor-pointer"}`}
              disabled={submitting}
            >
              {submitting ? "Sending..." : "Send reset link"}
            </button>
          </form>

          <div className="mt-6 text-sm text-gray-600">
            Remembered your password?{" "}
            <Link
              href="/login"
              className="font-semibold text-[var(--primary)] hover:underline"
            >
              Back to login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
