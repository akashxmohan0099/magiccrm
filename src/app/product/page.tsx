import { SiteHeader } from "@/components/landing/SiteHeader";

export const metadata = {
  title: "Product · Magic",
};

export default function ProductPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      {/* Blank canvas — to be designed. */}
      <main className="max-w-6xl mx-auto px-6 py-32 text-center">
        <p className="text-[13px] text-text-tertiary font-medium uppercase tracking-wider">
          Product
        </p>
      </main>
    </div>
  );
}
