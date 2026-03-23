import Link from "next/link";

export const metadata = { title: "Privacy Policy — Magic" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background px-6 py-16 max-w-3xl mx-auto">
      <Link href="/" className="text-[13px] text-text-tertiary hover:text-foreground transition-colors mb-8 block">
        &larr; Back to Magic
      </Link>
      <h1 className="text-[32px] font-bold text-foreground tracking-tight mb-2">Privacy Policy</h1>
      <p className="text-[13px] text-text-tertiary mb-8">Last updated: March 2026</p>

      <div className="prose prose-sm max-w-none text-text-secondary space-y-6 text-[14px] leading-relaxed">
        <section>
          <h2 className="text-[18px] font-semibold text-foreground mt-8 mb-3">1. Information We Collect</h2>
          <p>We collect information you provide when creating an account (email, password), business information entered during onboarding, and data you store in the platform (clients, bookings, invoices, etc.).</p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-foreground mt-8 mb-3">2. How We Use Your Information</h2>
          <p>We use your information to provide and improve the Service, communicate with you about your account, and ensure the security of the platform. We do not sell your personal data to third parties.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-foreground mt-8 mb-3">3. Data Storage</h2>
          <p>Your data is stored securely using Supabase (hosted on AWS). We implement industry-standard security measures including encryption in transit and at rest, and row-level security policies.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-foreground mt-8 mb-3">4. Third-Party Services</h2>
          <p>We may integrate with third-party services (payment processors, communication providers) as configured by you. These services have their own privacy policies.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-foreground mt-8 mb-3">5. Your Rights</h2>
          <p>You can access, update, or delete your personal data at any time from your account settings. You can export all your data or request account deletion by contacting us.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-foreground mt-8 mb-3">6. Cookies</h2>
          <p>We use essential cookies for authentication and session management. We do not use tracking cookies or third-party advertising cookies.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-foreground mt-8 mb-3">7. Changes to This Policy</h2>
          <p>We may update this policy from time to time. We will notify you of significant changes via email or through the platform.</p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold text-foreground mt-8 mb-3">8. Contact</h2>
          <p>For privacy-related questions, contact us at privacy@usemagic.com.</p>
        </section>
      </div>
    </div>
  );
}
