import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms and Conditions | MyFinance Admin",
  description: "Terms and Conditions for using the MyFinance Admin platform.",
};

export default function TermsAndConditionsPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-lg font-extrabold text-[var(--primary)] mb-10 border-b border-black/10 pb-4 w-full"
        >
          My<span className="text-black">Finance</span>
        </Link>
        <h1 className="text-3xl font-extrabold text-black sm:text-4xl">
          Terms and Conditions
        </h1>
        <p className="mt-3 text-sm text-gray-500">Last updated: February 23, 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-7 text-gray-700 sm:text-base">
          <section>
            <h2 className="text-xl font-bold text-black">1. Acceptance of Terms</h2>
            <p className="mt-2">
              By accessing or using the MyFinance Admin platform (the “Service”), you agree to be
              bound by these Terms and Conditions. If you do not agree with these terms, you must
              not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black">2. Eligibility and Account Responsibility</h2>
            <p className="mt-2">
              You confirm that you are authorized by your organization to use this Service.
              You are responsible for maintaining the confidentiality of your account credentials
              and for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black">3. Permitted Use</h2>
            <p className="mt-2">You agree to use the Service only for lawful business purposes, including:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Managing client records and loan data accurately.</li>
              <li>Tracking payments, balances, and repayment status.</li>
              <li>Generating internal reports for finance operations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black">4. Prohibited Conduct</h2>
            <p className="mt-2">You must not:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Use the Service for fraudulent, deceptive, or unlawful activity.</li>
              <li>Attempt unauthorized access to systems, data, or user accounts.</li>
              <li>Upload malware or perform actions that disrupt platform availability.</li>
              <li>Reverse engineer, copy, or resell the Service without written permission.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black">5. Data Accuracy and User Duties</h2>
            <p className="mt-2">
              You are responsible for ensuring that information entered into the Service is
              complete, accurate, and updated. Decisions made based on incorrect data are solely
              your responsibility.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black">6. Service Availability</h2>
            <p className="mt-2">
              We aim to provide reliable access, but we do not guarantee uninterrupted availability.
              The Service may be temporarily unavailable due to maintenance, upgrades, or events
              beyond our control.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black">7. Intellectual Property</h2>
            <p className="mt-2">
              All rights, title, and interest in the Service, including software, design, and
              content (excluding your submitted data), remain the property of MyFinance or its
              licensors.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black">8. Limitation of Liability</h2>
            <p className="mt-2">
              To the maximum extent permitted by law, MyFinance is not liable for indirect,
              incidental, special, or consequential losses, including lost profits, data, or
              business opportunities resulting from use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black">9. Termination</h2>
            <p className="mt-2">
              We may suspend or terminate access to the Service at any time if these Terms are
              violated or if continued access poses legal or security risks.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black">10. Changes to Terms</h2>
            <p className="mt-2">
              We may update these Terms from time to time. Continued use of the Service after
              updates are posted constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black">11. Contact</h2>
            <p className="mt-2">
              For questions regarding these Terms, contact us at{" "}
              <a className="font-semibold text-[var(--primary)] hover:underline" href="mailto:support@myfinance.com">
                support@myfinance.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-10 border-t border-black/10 pt-6 text-sm text-gray-600">
          Read our{" "}
          <Link className="font-semibold text-[var(--primary)] hover:underline" href="/privacy-policy">
            Privacy Policy
          </Link>
          .
        </div>
      </div>
    </main>
  );
}
