import type { OnboardingArtistType, Service } from "@/types/models";

export type ServiceSeed = Pick<Service, "name" | "description" | "duration" | "price" | "category">;

export const SERVICE_TEMPLATES: Record<OnboardingArtistType, ServiceSeed[]> = {
  hair_stylist: [
    { name: "Cut & Blow Dry", duration: 60, price: 85, description: "Precision cut with blow dry finish", category: "Hair" },
    { name: "Full Colour", duration: 120, price: 180, description: "Root to tip single-process colour", category: "Hair" },
    { name: "Balayage", duration: 180, price: 320, description: "Hand-painted highlights for natural depth", category: "Hair" },
  ],
  nail_technician: [
    { name: "Builder Gel Full Set", duration: 90, price: 110, description: "Builder gel set with shaping and finish", category: "Nails" },
    { name: "Gel Refill", duration: 75, price: 85, description: "Rebalance and refresh for existing gel sets", category: "Nails" },
    { name: "Nail Art Add-On", duration: 20, price: 25, description: "Custom nail art add-on", category: "Nails" },
  ],
  makeup_artist: [
    { name: "Event Makeup", duration: 75, price: 140, description: "Full-face makeup for events and photoshoots", category: "Makeup" },
    { name: "Bridal Trial", duration: 90, price: 170, description: "Wedding makeup trial and consultation", category: "Makeup" },
    { name: "Bridal Party Booking", duration: 180, price: 420, description: "Group booking for bridal parties", category: "Makeup" },
  ],
  lash_brow_artist: [
    { name: "Classic Full Set", duration: 120, price: 140, description: "Classic lash extension full set", category: "Lashes & Brows" },
    { name: "Lash Fill", duration: 60, price: 85, description: "Maintenance fill for returning clients", category: "Lashes & Brows" },
    { name: "Brow Lamination & Tint", duration: 45, price: 80, description: "Shape, tint, and set brows", category: "Lashes & Brows" },
  ],
  esthetician_facialist: [
    { name: "Signature Facial", duration: 60, price: 130, description: "Deep cleanse, exfoliation, and hydration", category: "Skin" },
    { name: "Advanced Peel", duration: 75, price: 165, description: "Targeted peel for texture and pigmentation", category: "Skin" },
    { name: "LED Add-On", duration: 20, price: 35, description: "LED light therapy add-on", category: "Skin" },
  ],
  barber: [
    { name: "Standard Cut", duration: 30, price: 45, description: "Clipper and scissor cut with finish", category: "Barbering" },
    { name: "Skin Fade", duration: 45, price: 55, description: "Detailed fade with blend and styling", category: "Barbering" },
    { name: "Beard Trim", duration: 20, price: 25, description: "Beard shaping and tidy-up", category: "Barbering" },
  ],
  massage_therapist: [
    { name: "Relaxation Massage", duration: 60, price: 110, description: "Full-body relaxation massage", category: "Massage & Spa" },
    { name: "Deep Tissue Massage", duration: 60, price: 130, description: "Targeted tension relief massage", category: "Massage & Spa" },
    { name: "90-Minute Session", duration: 90, price: 165, description: "Extended massage session", category: "Massage & Spa" },
  ],
  tattoo_artist: [
    { name: "Consultation", duration: 30, price: 0, description: "Tattoo concept and placement consultation", category: "Tattoo" },
    { name: "Half-Day Session", duration: 240, price: 600, description: "Half-day tattoo booking", category: "Tattoo" },
    { name: "Full-Day Session", duration: 420, price: 1000, description: "Full-day tattoo booking", category: "Tattoo" },
  ],
  spa_wellness: [
    { name: "Wellness Treatment", duration: 60, price: 125, description: "Signature spa treatment", category: "Spa & Wellness" },
    { name: "Body Ritual", duration: 90, price: 180, description: "Body exfoliation and massage ritual", category: "Spa & Wellness" },
    { name: "Infrared Session", duration: 45, price: 70, description: "Infrared sauna or wellness session", category: "Spa & Wellness" },
  ],
  other: [
    { name: "Signature Service", duration: 60, price: 100, description: "Starter service template for your business", category: "Services" },
    { name: "Extended Session", duration: 90, price: 150, description: "Longer appointment template", category: "Services" },
  ],
};
