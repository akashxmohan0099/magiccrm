/**
 * Starter menus — pre-built service catalogs the operator can drop in during
 * onboarding (or later when adding a whole category). Operator picks the
 * persona that matches their business; the modal pre-checks every row and
 * lets them untick what they don't want. Everything stays editable.
 *
 * Services and pricing here are anchored to the AU (Gold Coast / Brisbane)
 * market research summarised in `magic_service_library_master_v2.md`.
 * Prices are medians from verified Fresha / studio menus, durations are the
 * common defaults. Operators can edit anything after the import.
 */

import {
  Scissors,
  Eye,
  Brush,
  Sparkles,
  Flower2,
  ScissorsLineDashed,
  type LucideIcon,
} from "lucide-react";

export interface StarterService {
  name: string;
  description: string;
  duration: number; // minutes
  price: number;
  category: string;
}

export interface StarterMenu {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  /** Brand-tone hex used for the icon tint + the card's hover gradient. */
  hex: string;
  services: StarterService[];
}

export const STARTER_MENUS: StarterMenu[] = [
  {
    id: "hair-salon",
    name: "Hair Salon",
    description: "Cuts, colour, treatments, styling, extensions.",
    icon: Scissors,
    hex: "#8B5CF6",
    services: [
      { name: "Maintenance Cut", description: "Trim and refresh on existing shape", duration: 45, price: 45, category: "Cuts" },
      { name: "Restyle Cut", description: "New shape consult and cut", duration: 60, price: 65, category: "Cuts" },
      { name: "Cut & Blow Dry", description: "Cut with professional blow dry styling", duration: 60, price: 70, category: "Cuts" },
      { name: "Fringe Trim", description: "Quick fringe / bang touch-up", duration: 15, price: 20, category: "Cuts" },
      { name: "Men's Haircut", description: "Cut, wash, style", duration: 30, price: 40, category: "Cuts" },
      { name: "Men's Skin Fade", description: "Sharp gradient fade", duration: 30, price: 45, category: "Cuts" },
      { name: "Kids Haircut", description: "Cut for children under 12", duration: 20, price: 25, category: "Cuts" },
      { name: "Blow Dry", description: "Wash and blow dry styling", duration: 30, price: 45, category: "Styling" },
      { name: "Iron Curl / Straighten", description: "Hot tool styling on washed hair", duration: 45, price: 65, category: "Styling" },
      { name: "Up-Style", description: "Pinned event styling", duration: 75, price: 115, category: "Styling" },
      { name: "Bridal Hair Trial", description: "Test run before the wedding day", duration: 90, price: 125, category: "Styling" },
      { name: "Bridal Hair Day-of", description: "Wedding day hair styling", duration: 90, price: 160, category: "Styling" },
      { name: "Regrowth / Root Touch-up", description: "Refresh the regrowth only", duration: 45, price: 75, category: "Color" },
      { name: "Full Head Colour", description: "Root to tip single-process colour", duration: 60, price: 80, category: "Color" },
      { name: "Half Head Foils", description: "Foils through the top section", duration: 75, price: 130, category: "Color" },
      { name: "Full Head Foils", description: "Foils throughout the lengths", duration: 120, price: 190, category: "Color" },
      { name: "Balayage", description: "Hand-painted highlights for a sun-kissed look", duration: 120, price: 215, category: "Color" },
      { name: "Toner", description: "Refresh tone or correct brassiness", duration: 30, price: 40, category: "Color" },
      { name: "Root Stretch", description: "Soft melt between regrowth and lengths", duration: 30, price: 50, category: "Color" },
      { name: "Olaplex / K18 Treatment", description: "Bond-rebuilding add-on", duration: 20, price: 40, category: "Treatments" },
      { name: "Keratin Smoothing", description: "Frizz-control smoothing treatment", duration: 150, price: 280, category: "Treatments" },
      { name: "Deep Conditioning", description: "Intensive moisture treatment", duration: 30, price: 40, category: "Treatments" },
      { name: "Japanese Head Spa", description: "Scalp cleanse, massage and steam ritual", duration: 60, price: 120, category: "Treatments" },
      { name: "Tape-in Extensions Application", description: "Apply tape-in extensions", duration: 60, price: 150, category: "Extensions" },
      { name: "Extension Consultation", description: "Match colour and plan install — no charge", duration: 30, price: 0, category: "Extensions" },
    ],
  },
  {
    id: "lash-brow",
    name: "Lash & Brow",
    description: "Extensions, lifts, tinting, brows, cosmetic tattoo.",
    icon: Eye,
    hex: "#F43F5E",
    services: [
      { name: "Classic Lash Full Set", description: "One extension per natural lash", duration: 90, price: 160, category: "Extensions Sets" },
      { name: "Hybrid Lash Full Set", description: "Mix of classic and volume", duration: 90, price: 180, category: "Extensions Sets" },
      { name: "Volume Lash Full Set", description: "Multiple thin extensions per lash", duration: 90, price: 200, category: "Extensions Sets" },
      { name: "Mega Volume Full Set", description: "Densest volume technique", duration: 105, price: 220, category: "Extensions Sets" },
      { name: "Wet-Look / Gloss Lashes", description: "Spiked, glossy wet-look effect", duration: 90, price: 185, category: "Extensions Sets" },
      { name: "Classic Refill", description: "Top-up at 2–3 weeks", duration: 60, price: 110, category: "Refills" },
      { name: "Hybrid Refill", description: "Top-up for hybrid sets", duration: 45, price: 90, category: "Refills" },
      { name: "Volume Refill", description: "Top-up for volume sets", duration: 60, price: 100, category: "Refills" },
      { name: "Lash Removal", description: "Safe removal of existing extensions", duration: 30, price: 50, category: "Removal" },
      { name: "Lash Lift & Tint", description: "Natural curl with darkening tint", duration: 60, price: 145, category: "Lash Lift" },
      { name: "Lash Lift Only", description: "Lift without tint", duration: 45, price: 100, category: "Lash Lift" },
      { name: "Lash Tint Only", description: "Professional lash colouring", duration: 15, price: 30, category: "Lash Lift" },
      { name: "Brow Shape & Tint", description: "Wax shape with tint", duration: 30, price: 45, category: "Brow" },
      { name: "Brow Wax / Shape", description: "Wax and shape only", duration: 15, price: 25, category: "Brow" },
      { name: "Brow Lamination", description: "Brow restructuring for a fluffy, full look", duration: 45, price: 150, category: "Brow" },
      { name: "Henna Brows", description: "Tinted dye that stains the skin", duration: 30, price: 50, category: "Brow" },
      { name: "Microblading", description: "Hair-stroke cosmetic tattoo brows", duration: 120, price: 400, category: "Cosmetic Tattoo" },
      { name: "Ombre Powder Brows", description: "Soft powdered brow tattoo", duration: 150, price: 500, category: "Cosmetic Tattoo" },
      { name: "Lip Blush", description: "Tinted cosmetic tattoo for lips", duration: 120, price: 500, category: "Cosmetic Tattoo" },
      { name: "Consultation", description: "Pre-treatment consult — no charge", duration: 15, price: 0, category: "Other" },
    ],
  },
  {
    id: "makeup",
    name: "Makeup Artist",
    description: "Bridal, event, editorial, lessons.",
    icon: Brush,
    hex: "#EC4899",
    services: [
      { name: "Bridal Trial", description: "Test run before the wedding day", duration: 90, price: 155, category: "Bridal" },
      { name: "Bride (Day-of)", description: "Wedding day makeup", duration: 60, price: 190, category: "Bridal" },
      { name: "Bridesmaid", description: "Coordinated look for the bridal party", duration: 45, price: 145, category: "Bridal" },
      { name: "Mother of Bride / Groom", description: "Refined glam for family", duration: 45, price: 140, category: "Bridal" },
      { name: "Flower Girl (under 10)", description: "Light age-appropriate makeup", duration: 20, price: 80, category: "Bridal" },
      { name: "Special Occasion / Event", description: "Glam for parties and events", duration: 45, price: 185, category: "Event" },
      { name: "School Formal Makeup", description: "Formal-night look", duration: 45, price: 150, category: "Event" },
      { name: "Studio Makeup", description: "In-studio appointment", duration: 45, price: 140, category: "Event" },
      { name: "Editorial — Half Day", description: "On-set makeup, up to 4 hrs", duration: 240, price: 550, category: "Editorial" },
      { name: "Editorial — Full Day", description: "On-set makeup, up to 8 hrs", duration: 480, price: 1100, category: "Editorial" },
      { name: "1:1 Makeup Lesson", description: "Personalised tutorial with your products", duration: 150, price: 350, category: "Lesson" },
      { name: "Bridal Hair + Makeup Package", description: "Combined hair and makeup, per person", duration: 90, price: 300, category: "Packages" },
      { name: "Hair Up-style", description: "Pinned event styling", duration: 60, price: 290, category: "Hair" },
      { name: "Hair Down-style / Blow-out", description: "Loose styling or blow-wave", duration: 45, price: 280, category: "Hair" },
      { name: "Hair Extension Application", description: "Add clip-in or temporary extensions", duration: 15, price: 40, category: "Hair" },
      { name: "Strip / Individual Lashes", description: "Lash application add-on", duration: 5, price: 25, category: "Add-on" },
      { name: "Airbrush Upgrade", description: "Airbrushed foundation upgrade", duration: 5, price: 50, category: "Add-on" },
      { name: "On-location Touch-up", description: "Hourly mid-event touch-ups", duration: 60, price: 120, category: "Add-on" },
    ],
  },
  {
    id: "nails",
    name: "Nails",
    description: "Manicure, pedicure, BIAB, acrylics, art.",
    icon: Sparkles,
    hex: "#D946EF",
    services: [
      { name: "Express Manicure", description: "File, cuticle care, polish", duration: 30, price: 50, category: "Manicure" },
      { name: "Manicure with Polish", description: "Standard manicure with regular polish", duration: 35, price: 65, category: "Manicure" },
      { name: "Deluxe / Spa Manicure", description: "Soak, scrub, mask, polish", duration: 50, price: 90, category: "Manicure" },
      { name: "Manicure no Polish", description: "Buff and tidy without polish", duration: 30, price: 45, category: "Manicure" },
      { name: "Kids Manicure", description: "Manicure for under 12s", duration: 20, price: 30, category: "Manicure" },
      { name: "Express Pedicure", description: "Quick file and polish", duration: 30, price: 60, category: "Pedicure" },
      { name: "Pedicure with Polish", description: "Foot soak, file, polish", duration: 50, price: 75, category: "Pedicure" },
      { name: "Deluxe Pedicure", description: "Soak, scrub, mask, massage, polish", duration: 60, price: 99, category: "Pedicure" },
      { name: "Kids Pedicure", description: "Pedicure for under 12s", duration: 25, price: 30, category: "Pedicure" },
      { name: "Acrylic Full Set", description: "New acrylic extensions", duration: 60, price: 90, category: "Extensions" },
      { name: "Acrylic Backfill / Infill", description: "Refill on existing acrylics", duration: 60, price: 75, category: "Extensions" },
      { name: "BIAB Full Set", description: "Builder-in-a-bottle for strength and length", duration: 75, price: 95, category: "Extensions" },
      { name: "BIAB Infill", description: "Refill on existing BIAB", duration: 60, price: 80, category: "Extensions" },
      { name: "Soft Gel / Gel-X Extensions", description: "Pre-shaped soft gel tip extensions", duration: 45, price: 95, category: "Extensions" },
      { name: "Shellac Nails", description: "Long-wear shellac polish", duration: 45, price: 55, category: "Extensions" },
      { name: "Gel Polish Removal", description: "Safe soak-off gel removal", duration: 20, price: 25, category: "Removal" },
      { name: "Acrylic Removal", description: "Safe acrylic removal", duration: 30, price: 45, category: "Removal" },
      { name: "Builder Gel Removal", description: "Safe BIAB removal", duration: 30, price: 45, category: "Removal" },
      { name: "Nail Art — Simple", description: "Per nail simple art", duration: 15, price: 25, category: "Nail Art" },
      { name: "Nail Art — Complex", description: "Per nail detailed art", duration: 30, price: 50, category: "Nail Art" },
      { name: "Feature Nail", description: "Single accent nail", duration: 5, price: 20, category: "Nail Art" },
      { name: "Chrome / Ombré Finish", description: "Specialty finish across all nails", duration: 10, price: 10, category: "Nail Art" },
      { name: "Gel Polish Add-on", description: "Upgrade to gel on any manicure or pedicure", duration: 15, price: 20, category: "Add-on" },
      { name: "Builder Gel / BIAB Add-on", description: "Upgrade to BIAB overlay", duration: 20, price: 25, category: "Add-on" },
      { name: "French Add-on", description: "French finish on any service", duration: 5, price: 25, category: "Add-on" },
      { name: "Paraffin Wax Add-on", description: "Heated wax treatment for hands or feet", duration: 15, price: 25, category: "Add-on" },
    ],
  },
  {
    id: "spa",
    name: "Spa & Massage",
    description: "Massage, facials, body treatments, wellness.",
    icon: Flower2,
    hex: "#10B981",
    services: [
      { name: "Swedish Massage 60", description: "Relaxation full-body massage", duration: 60, price: 120, category: "Massage" },
      { name: "Swedish Massage 90", description: "Extended relaxation session", duration: 90, price: 170, category: "Massage" },
      { name: "Deep Tissue Massage 60", description: "Targeted muscle release", duration: 60, price: 130, category: "Massage" },
      { name: "Deep Tissue Massage 90", description: "Extended deep tissue session", duration: 90, price: 180, category: "Massage" },
      { name: "Remedial Massage 60", description: "Therapeutic treatment with health-fund rebates where eligible", duration: 60, price: 140, category: "Massage" },
      { name: "Hot Stone Massage 60", description: "Heated stones with massage", duration: 60, price: 140, category: "Massage" },
      { name: "Aromatherapy Massage 60", description: "Massage with essential oil blends", duration: 60, price: 120, category: "Massage" },
      { name: "Pregnancy Massage 60", description: "Side-lying massage for expectant clients", duration: 60, price: 140, category: "Massage" },
      { name: "Couples Massage 60", description: "Side-by-side massage for two", duration: 60, price: 270, category: "Massage" },
      { name: "Lymphatic Drainage 60", description: "Gentle drainage technique", duration: 60, price: 140, category: "Massage" },
      { name: "Reflexology 60", description: "Pressure-point foot massage", duration: 60, price: 120, category: "Massage" },
      { name: "Express Massage 30", description: "Targeted 30-minute massage", duration: 30, price: 80, category: "Massage" },
      { name: "Signature Facial 60", description: "Cleanse, exfoliate, mask, hydrate", duration: 60, price: 130, category: "Facials" },
      { name: "Anti-Aging Facial 60", description: "Targeted treatment for fine lines", duration: 60, price: 150, category: "Facials" },
      { name: "Hydrating Facial 60", description: "Intensive moisture for dry skin", duration: 60, price: 130, category: "Facials" },
      { name: "Express Facial 30", description: "Quick refresh facial", duration: 30, price: 65, category: "Facials" },
      { name: "Body Scrub / Polish", description: "Exfoliating full-body treatment", duration: 60, price: 140, category: "Body" },
      { name: "Body Wrap", description: "Hydrating or detox body wrap", duration: 60, price: 170, category: "Body" },
      { name: "Couples Spa Package", description: "Massage and facial for two", duration: 120, price: 640, category: "Packages" },
      { name: "Facial + Massage Combo", description: "30 min facial paired with 60 min massage", duration: 90, price: 215, category: "Packages" },
      { name: "Japanese Head Spa", description: "Scalp cleanse, massage and steam ritual", duration: 60, price: 150, category: "Wellness" },
      { name: "Infrared Sauna", description: "Solo infrared sauna session", duration: 30, price: 35, category: "Wellness" },
    ],
  },
  {
    id: "barber",
    name: "Barber",
    description: "Cuts, beards, shaves, combos.",
    icon: ScissorsLineDashed,
    hex: "#475569",
    services: [
      { name: "Haircut", description: "Standard men's cut and style", duration: 30, price: 50, category: "Cuts" },
      { name: "Skin Fade", description: "Sharp gradient fade down to skin", duration: 45, price: 55, category: "Cuts" },
      { name: "Buzz Cut", description: "Single-length all-over clip", duration: 15, price: 30, category: "Cuts" },
      { name: "Long Hair / Scissor Cut", description: "Scissor-over-comb on longer styles", duration: 45, price: 60, category: "Cuts" },
      { name: "Kids Cut (under 12)", description: "Cut for children", duration: 20, price: 35, category: "Cuts" },
      { name: "Pensioner Cut", description: "Concession rate for seniors", duration: 30, price: 30, category: "Cuts" },
      { name: "Apprentice Cut", description: "Cut by a trainee barber", duration: 30, price: 25, category: "Cuts" },
      { name: "Beard Trim", description: "Beard shape and trim", duration: 15, price: 30, category: "Beard" },
      { name: "Beard Trim & Line-Up", description: "Beard trim with sharp line-up", duration: 25, price: 35, category: "Beard" },
      { name: "Hot Towel / Cut Throat Shave", description: "Traditional shave with hot towel", duration: 40, price: 50, category: "Beard" },
      { name: "Beard Colour", description: "Beard colour application", duration: 30, price: 70, category: "Beard" },
      { name: "Cut + Beard Combo", description: "Haircut and beard trim together", duration: 50, price: 75, category: "Combos" },
      { name: "Tracks / Hair Design", description: "Cut-in lines or design work", duration: 15, price: 15, category: "Add-ons" },
      { name: "Hair Colour", description: "Colour application", duration: 30, price: 70, category: "Add-ons" },
      { name: "After-hours Premium", description: "Outside trading hours appointment", duration: 60, price: 150, category: "Premium" },
    ],
  },
];
