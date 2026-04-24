import { SiteHeader } from "@/components/landing/SiteHeader";
import { WaitlistForm } from "@/components/landing/WaitlistForm";

export const metadata = {
  title: "Join the waitlist · Magic",
};

export default function WaitlistPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-xl mx-auto px-6 pt-16 pb-24">
        <header className="text-center mb-10">
          <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.18em] mb-3">
            Early access
          </p>
          <h1 className="text-[2rem] sm:text-[2.5rem] font-bold text-foreground leading-[1.05] mb-4">
            Join the waitlist.
          </h1>
          <p className="text-[15px] text-text-secondary max-w-md mx-auto">
            Be first in line when we open seats. Takes under a minute —
            we&rsquo;ll only reach out when your spot opens.
          </p>
        </header>
        <WaitlistForm />
      </main>
    </div>
  );
}
