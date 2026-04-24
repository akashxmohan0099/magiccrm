import { SiteHeader } from "@/components/landing/SiteHeader";
import { PricingSection } from "@/components/landing/PricingSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { SiteFooter } from "@/components/landing/SiteFooter";

export const metadata = {
  title: "Pricing · Magic",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="pt-16 sm:pt-[70px]">
        <PricingSection />
        <ComparisonSection />
      </main>
      <SiteFooter />
    </div>
  );
}
