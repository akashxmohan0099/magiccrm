"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AlertCircle, Clock, DollarSign } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

interface StorefrontData {
  businessName: string;
  tagline: string;
  description: string;
  accentColor: string;
  showPricing: boolean;
  showDuration: boolean;
  services: Service[];
}

export default function StorefrontPage() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const [data, setData] = useState<StorefrontData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStorefront() {
      try {
        const res = await fetch(`/api/public/storefront?workspace=${workspaceSlug}`);
        if (!res.ok) {
          const err = await res.json();
          setError(err.error || "Unable to load storefront");
          return;
        }
        const storefrontData = await res.json();
        setData(storefrontData);
      } catch {
        setError("Unable to load storefront. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    if (workspaceSlug) fetchStorefront();
  }, [workspaceSlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading storefront...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Storefront Unavailable</h1>
          <p className="text-sm text-gray-500">{error || "This storefront is not available or has been disabled."}</p>
        </div>
      </div>
    );
  }

  const accent = data.accentColor || "#34D399";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              {data.businessName}
            </h1>
            {data.tagline && (
              <p className="text-lg text-gray-600 mb-3">{data.tagline}</p>
            )}
            {data.description && (
              <p className="text-gray-600 max-w-2xl mx-auto">{data.description}</p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Services Section */}
        <section>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Services</h2>
            <div
              className="mt-2 h-1 w-16 rounded-full"
              style={{ backgroundColor: accent }}
            />
          </div>

          {data.services.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">No services available at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.services.map((service) => (
                <div
                  key={service.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  {/* Service Card Body */}
                  <div className="p-6 pb-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {service.name}
                    </h3>

                    {service.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {service.description}
                      </p>
                    )}

                    {/* Service Details */}
                    <div className="space-y-2 mb-5 py-3 border-y border-gray-100">
                      {data.showDuration && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>
                            {service.duration} {service.duration === 1 ? "minute" : "minutes"}
                          </span>
                        </div>
                      )}

                      {data.showPricing && service.price > 0 && (
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span>${service.price.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Book Now Button */}
                  <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <a
                      href={`/book?workspace=${workspaceSlug}&service=${service.id}`}
                      className="w-full py-2.5 px-4 rounded-lg font-medium text-white text-center transition-opacity duration-200 hover:opacity-90 block"
                      style={{ backgroundColor: accent }}
                    >
                      Book Now
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500">
            Powered by Magic CRM
          </p>
        </footer>
      </main>
    </div>
  );
}
