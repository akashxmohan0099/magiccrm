import { SiteHeader } from "@/components/landing/SiteHeader";
import { WaitlistForm } from "@/components/landing/WaitlistForm";

export const metadata = {
  title: "Get early access · Magic",
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
            Get early access to Magic.
          </h1>
          <p className="text-[15px] text-text-secondary max-w-md mx-auto">
            Tell us what kind of beauty business you run. We&rsquo;ll invite early
            users as seats open.
          </p>
        </header>
        <WaitlistForm />
      </main>
    </div>
  );
}
