import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Kalyan Pawn Brokers",
  description: "Privacy Policy for the Kalyan Pawn Brokers platform.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-lg font-extrabold text-[var(--primary)] mb-10 border-b border-black/10 pb-4 w-full"
        >
          Kalyan<span className="text-black"> Pawn Brokers</span>
        </Link>
        <h1 className="text-3xl font-extrabold text-black sm:text-4xl">Privacy Policy</h1>
        <p className="mt-3 text-sm text-gray-500">Last updated: February 23, 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-7 text-gray-700 sm:text-base">
          <section>
            <h2 className="text-xl font-bold text-black">1. Overview</h2>
            <p className="mt-2">
              This Privacy Policy explains how Kalyan Pawn Brokers collects, uses, stores, and protects
              personal and financial information when you use the Kalyan Pawn Brokers platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black">2. Information We Collect</h2>
            <p className="mt-2">Depending on your use of the Service, we may collect:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Account information (name, email address, role).</li>
              <li>Client and loan data entered by authorized users.</li>
              <li>Payment and transaction records.</li>
              <li>Technical data (IP address, browser details, usage logs).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black">3. How We Use Information</h2>
            <p className="mt-2">We use information to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Provide and operate the Service.</li>
              <li>Authenticate users and maintain account security.</li>
              <li>Generate operational reports and analytics.</li>
              <li>Improve system performance and user experience.</li>
              <li>Comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black">4. Legal Basis and Consent</h2>
            <p className="mt-2">
              Where required by applicable law, we process personal data based on consent,
              contractual necessity, legal obligations, and legitimate business interests.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black">5. Data Sharing</h2>
            <p className="mt-2">We do not sell personal data. We may share information with:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Service providers assisting with hosting, security, and support.</li>
              <li>Professional advisers and auditors under confidentiality obligations.</li>
              <li>Authorities where disclosure is required by law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black">6. Data Retention</h2>
            <p className="mt-2">
              We retain information only as long as necessary for business, legal, and compliance
              purposes. Retention periods may vary by data category and applicable regulations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black">7. Security Measures</h2>
            <p className="mt-2">
              We use appropriate technical and organizational safeguards to protect data against
              unauthorized access, alteration, disclosure, or destruction. No method of
              transmission or storage is fully secure, so absolute security cannot be guaranteed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black">8. Your Rights</h2>
            <p className="mt-2">Subject to local law, you may have rights to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Access, correct, or delete personal information.</li>
              <li>Restrict or object to specific processing activities.</li>
              <li>Request a portable copy of your data.</li>
              <li>Withdraw consent where processing relies on consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black">9. Children’s Privacy</h2>
            <p className="mt-2">
              The Service is intended for business use and is not directed to children. We do not
              knowingly collect personal data from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black">10. Policy Updates</h2>
            <p className="mt-2">
              We may update this Privacy Policy from time to time. The latest version will always
              be available on this page with the updated effective date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black">11. Contact</h2>
            <p className="mt-2">
              For privacy-related requests or questions, contact{" "}
              <a className="font-semibold text-[var(--primary)] hover:underline" href="mailto:privacy@kalyanpawnbrokers.com">
                privacy@kalyanpawnbrokers.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-10 border-t border-black/10 pt-6 text-sm text-gray-600">
          Read our{" "}
          <Link className="font-semibold text-[var(--primary)] hover:underline" href="/terms-and-conditions">
            Terms and Conditions
          </Link>
          .
        </div>
      </div>
    </main>
  );
}
