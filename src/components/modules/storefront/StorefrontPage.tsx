"use client";

import { Store, ExternalLink, Plus } from "lucide-react";
import { useStorefrontStore } from "@/store/storefront";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { FeatureSection } from "@/components/modules/FeatureSection";

export function StorefrontPage() {
  const { config, updateConfig } = useStorefrontStore();

  const inputClass = "w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

  return (
    <div>
      <PageHeader
        title="Online Storefront"
        description="A public page showcasing your services with booking links."
        actions={
          config.enabled ? (
            <Button variant="secondary" size="sm"><ExternalLink className="w-4 h-4" /> Preview</Button>
          ) : null
        }
      />

      <div className="max-w-2xl space-y-6">
        <div className="bg-card-bg rounded-xl border border-border-light p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-semibold text-foreground">Storefront Status</h3>
              <p className="text-[13px] text-text-secondary">Make your service menu visible to the public</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={config.enabled} onChange={(e) => updateConfig({ enabled: e.target.checked })} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
            </label>
          </div>
        </div>

        <div className="bg-card-bg rounded-xl border border-border-light p-6 space-y-4">
          <h3 className="text-[15px] font-semibold text-foreground">Details</h3>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Business Name</label>
            <input type="text" value={config.businessName} onChange={(e) => updateConfig({ businessName: e.target.value })} placeholder="Your business name" className={inputClass} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Tagline</label>
            <input type="text" value={config.tagline} onChange={(e) => updateConfig({ tagline: e.target.value })} placeholder="e.g. Your beauty, our passion" className={inputClass} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Description</label>
            <textarea value={config.description} onChange={(e) => updateConfig({ description: e.target.value })} placeholder="Tell clients about your business..." rows={3} className={`${inputClass} resize-none`} />
          </div>
        </div>

        <div className="bg-card-bg rounded-xl border border-border-light p-6 space-y-4">
          <h3 className="text-[15px] font-semibold text-foreground">Display Options</h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={config.showPricing} onChange={(e) => updateConfig({ showPricing: e.target.checked })} className="rounded" />
            <span className="text-[14px] text-foreground">Show pricing on services</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={config.showDuration} onChange={(e) => updateConfig({ showDuration: e.target.checked })} className="rounded" />
            <span className="text-[14px] text-foreground">Show duration on services</span>
          </label>
        </div>

        <FeatureSection moduleId="storefront" featureId="photo-gallery" featureLabel="Photo Gallery">
          <div className="bg-card-bg rounded-xl border border-border-light p-6 space-y-4">
            <h3 className="text-[15px] font-semibold text-foreground">Photo Gallery</h3>
            <div className="grid grid-cols-3 gap-2">
              {[1,2,3].map((i) => (
                <div key={i} className="aspect-square bg-surface rounded-lg border-2 border-dashed border-border-light flex items-center justify-center cursor-pointer hover:border-foreground/20 transition-colors">
                  <Plus className="w-5 h-5 text-text-tertiary" />
                </div>
              ))}
            </div>
            <p className="text-[11px] text-text-tertiary">Upload photos to showcase your work on your public storefront.</p>
          </div>
        </FeatureSection>

        {!config.enabled && (
          <div className="bg-surface rounded-xl border border-border-light p-8 text-center">
            <Store className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
            <p className="text-[14px] text-text-secondary">Enable your storefront to see a live preview</p>
          </div>
        )}
      </div>
    </div>
  );
}
