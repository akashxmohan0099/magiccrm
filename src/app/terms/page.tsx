import Link from "next/link";

export const metadata = { title: "Terms of Service — Magic" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background px-6 py-16 max-w-3xl mx-auto">
      <Link href="/" className="text-[13px] text-text-tertiary hover:text-foreground transition-colors mb-8 block">
        &larr; Back to Magic
      </Link>
      <h1 className="text-[32px] font-bold text-foreground tracking-tight mb-2">Terms of Service</h1>
      <p className="text-[13px] text-text-tertiary mb-8">Last updated: March 2026</p>

      <div className="prose prose-sm max-w-none text-text-secondary space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-[18px] font-semibold text-foreground mt-8 mb-3">1. Acceptance of Terms</h2>
          <p>By accessing or using Magic (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-foreground mt-8 mb-3">2. Description of Service</h2>
          <p>Magic is a modular business software platform that provides tools for client management, scheduling, billing, communication, and more. The Service is provided on a subscription basis.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-foreground mt-8 mb-3">3. User Accounts</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information when creating your account and to update it as needed.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-foreground mt-8 mb-3">4. Acceptable Use</h2>
          <p>You agree not to misuse the Service, including but not limited to: attempting to gain unauthorized access, interfering with other users, or using the Service for illegal purposes.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-foreground mt-8 mb-3">5. Data and Privacy</h2>
          <p>Your use of the Service is also governed by our <Link href="/privacy" className="text-foreground underline">Privacy Policy</Link>. You retain ownership of all data you enter into the Service.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-foreground mt-8 mb-3">6. Subscription and Billing</h2>
          <p>Paid plans are billed on a recurring basis. You may cancel at any time. Refunds are handled on a case-by-case basis.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-foreground mt-8 mb-3">7. Limitation of Liability</h2>
          <p>The Service is provided &quot;as is&quot; without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the Service.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-foreground mt-8 mb-3">8. Changes to Terms</h2>
          <p>We may update these terms from time to time. Continued use of the Service after changes constitutes acceptance of the new terms.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-foreground mt-8 mb-3">9. Contact</h2>
          <p>For questions about these terms, contact us at hello@usemagic.com.</p>
        </section>
      </div>
    </div>
  );
}
