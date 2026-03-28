"use client";

import { useState } from "react";
import { Store, ExternalLink, Plus, Image, X } from "lucide-react";
import { useStorefrontStore } from "@/store/storefront";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FeatureSection } from "@/components/modules/FeatureSection";

/* ── Gallery photo type ── */
interface GalleryPhoto {
  id: string;
  label: string;
  color: string;  // tailwind bg class for simulated placeholder
}

const placeholderColors = [
  "bg-rose-200", "bg-sky-200", "bg-amber-200", "bg-emerald-200",
  "bg-violet-200", "bg-pink-200", "bg-teal-200", "bg-orange-200",
];

export function StorefrontPage() {
  const { config, updateConfig } = useStorefrontStore();

  /* ── Photo Gallery state ── */
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [photoLabel, setPhotoLabel] = useState("");

  const addPhoto = () => {
    if (!photoLabel.trim()) return;
    const color = placeholderColors[photos.length % placeholderColors.length];
    setPhotos((prev) => [...prev, { id: crypto.randomUUID(), label: photoLabel.trim(), color }]);
    setPhotoLabel("");
    setUploadOpen(false);
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const inputClass = "w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card-bg after:rounded-full after:h-5 after:w-5 after:transition-all" />
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
            <span className="text-sm text-foreground">Show pricing on services</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={config.showDuration} onChange={(e) => updateConfig({ showDuration: e.target.checked })} className="rounded" />
            <span className="text-sm text-foreground">Show duration on services</span>
          </label>
        </div>

        <FeatureSection moduleId="storefront" featureId="photo-gallery" featureLabel="Photo Gallery">
          <div className="bg-card-bg rounded-xl border border-border-light p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-foreground">Photo Gallery</h3>
              <Button variant="primary" size="sm" onClick={() => setUploadOpen(true)}>
                <Image className="w-4 h-4 mr-1" />
                Upload Photo
              </Button>
            </div>

            {photos.length === 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div
                  onClick={() => setUploadOpen(true)}
                  className="aspect-square bg-surface rounded-lg border-2 border-dashed border-border-light flex flex-col items-center justify-center cursor-pointer hover:border-foreground/20 transition-colors gap-1"
                >
                  <Plus className="w-5 h-5 text-text-tertiary" />
                  <span className="text-[11px] text-text-tertiary">Add photo</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {photos.map((photo) => (
                  <div key={photo.id} className={`relative aspect-square ${photo.color} rounded-lg flex items-center justify-center group`}>
                    <span className="text-xs font-medium text-gray-700 text-center px-2">{photo.label}</span>
                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <div
                  onClick={() => setUploadOpen(true)}
                  className="aspect-square bg-surface rounded-lg border-2 border-dashed border-border-light flex flex-col items-center justify-center cursor-pointer hover:border-foreground/20 transition-colors gap-1"
                >
                  <Plus className="w-5 h-5 text-text-tertiary" />
                  <span className="text-[11px] text-text-tertiary">Add more</span>
                </div>
              </div>
            )}

            <p className="text-[11px] text-text-tertiary">Upload photos to showcase your work on your public storefront.</p>
          </div>

          <Modal open={uploadOpen} onClose={() => { setUploadOpen(false); setPhotoLabel(""); }} title="Upload Photo">
            <div className="space-y-4">
              <p className="text-[13px] text-text-secondary">In production this would open a file picker. For now, enter a label and a color placeholder will be added.</p>
              <div>
                <label className="block text-[13px] font-medium text-foreground mb-1.5">Photo Label</label>
                <input
                  type="text"
                  value={photoLabel}
                  onChange={(e) => setPhotoLabel(e.target.value)}
                  placeholder="e.g. Before & After #1"
                  className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && addPhoto()}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => { setUploadOpen(false); setPhotoLabel(""); }}>Cancel</Button>
                <Button variant="primary" size="sm" onClick={addPhoto} disabled={!photoLabel.trim()}>Add Photo</Button>
              </div>
            </div>
          </Modal>
        </FeatureSection>

        <FeatureSection moduleId="storefront" featureId="reviews-display" featureLabel="Reviews Display">
          <div className="bg-card-bg rounded-xl border border-border-light p-6 space-y-4">
            <h3 className="text-[15px] font-semibold text-foreground">Client Reviews</h3>
            <p className="text-[13px] text-text-tertiary">Client reviews will be displayed on your public storefront. Reviews are collected through the Marketing module.</p>
          </div>
        </FeatureSection>

        {!config.enabled && (
          <div className="bg-surface rounded-xl border border-border-light p-8 text-center">
            <Store className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
            <p className="text-sm text-text-secondary">Enable your storefront to see a live preview</p>
          </div>
        )}
      </div>
    </div>
  );
}
