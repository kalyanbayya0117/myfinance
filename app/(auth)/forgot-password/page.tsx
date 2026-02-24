import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen grid lg:grid-cols-[1.1fr_0.9fr] bg-white">
      <section className="relative hidden lg:flex flex-col justify-between p-12 bg-[radial-gradient(circle_at_top,_#f5e9ff,_#ffffff_55%)]">
        <div className="flex items-center gap-2 text-lg font-extrabold text-[var(--primary)]">
          My<span className="text-black">Finance</span>
        </div>

        <div className="max-w-lg">
          <h1 className="text-4xl font-extrabold leading-tight text-black">
            Reset your access in minutes.
          </h1>
          <p className="mt-4 text-base text-gray-600">
            We will send a secure reset link to your registered email.
          </p>

          <div className="mt-8 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Need help?</p>
            <p className="mt-2 text-base font-semibold text-black">
              Contact the admin team for assistance.
            </p>
            <p className="text-sm text-gray-500">Support: +91 80000 00000</p>
          </div>
        </div>

        <p className="text-xs text-gray-500">Secure access for staff only.</p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
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

          <form className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Email address
              </label>
              <input
                type="email"
                placeholder="you@company.com"
                className="input mt-2"
              />
            </div>

            <button type="submit" className="btn-primary w-full">
              Send reset link
            </button>

            <button type="button" className="btn-outline w-full">
              Contact admin
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
