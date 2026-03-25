import type { WorkspaceBlueprint } from "@/types/workspace-blueprint";
import { nailTechBlueprint } from "./blueprints/nail-tech";
import { photographerBlueprint } from "./blueprints/photographer";
import { tutorBlueprint } from "./blueprints/tutor";

// Beauty-Wellness blueprints
import { beautyWellnessDefaultBlueprint } from "./blueprints/beauty-wellness-default";
import { lashBrowTechBlueprint } from "./blueprints/lash-brow-tech";
import { hairSalonBlueprint } from "./blueprints/hair-salon";
import { barberBlueprint } from "./blueprints/barber";
import { spaMassageBlueprint } from "./blueprints/spa-massage";
import { makeupArtistBlueprint } from "./blueprints/makeup-artist";

// Trades-Construction blueprints
import { tradesDefaultBlueprint } from "./blueprints/trades-default";
import { hvacTechnicianBlueprint } from "./blueprints/hvac-technician";
import { electricianBlueprint } from "./blueprints/electrician";
import { cleanerBlueprint } from "./blueprints/cleaner";

// Creative Services blueprints
import { creativeDefaultBlueprint } from "./blueprints/creative-default";
import { webDesignerBlueprint } from "./blueprints/web-designer";
import { interiorDesignerBlueprint } from "./blueprints/interior-designer";

// Health & Fitness blueprints
import { healthDefaultBlueprint } from "./blueprints/health-default";
import { physioChiroBlueprint } from "./blueprints/physio-chiro";
import { gymStudioBlueprint } from "./blueprints/gym-studio";
import { therapistBlueprint } from "./blueprints/therapist";

// Professional Services blueprints
import { professionalDefaultBlueprint } from "./blueprints/professional-default";
import { lawyerBlueprint } from "./blueprints/lawyer";
import { realEstateBlueprint } from "./blueprints/real-estate";

// Hospitality & Events blueprints
import { eventsDefaultBlueprint } from "./blueprints/events-default";
import { floristBlueprint } from "./blueprints/florist";
import { weddingPlannerBlueprint } from "./blueprints/wedding-planner";

// Education & Coaching blueprints
import { educationDefaultBlueprint } from "./blueprints/education-default";
import { lifeCoachBlueprint } from "./blueprints/life-coach";
import { musicTeacherBlueprint } from "./blueprints/music-teacher";
import { drivingInstructorBlueprint } from "./blueprints/driving-instructor";
import { onlineCourseCreatorBlueprint } from "./blueprints/online-course-creator";

// Retail & Ecommerce blueprints
import { retailDefaultBlueprint } from "./blueprints/retail-default";
import { onlineStoreBlueprint } from "./blueprints/online-store";
import { boutiqueShopBlueprint } from "./blueprints/boutique-shop";
import { handmadeArtisanBlueprint } from "./blueprints/handmade-artisan";
import { foodBeverageBlueprint } from "./blueprints/food-beverage";

// ── Blueprint Registry ──────────────────────────────────────

const BLUEPRINT_MAP: Record<string, WorkspaceBlueprint> = {
  [nailTechBlueprint.id]: nailTechBlueprint,
  [photographerBlueprint.id]: photographerBlueprint,
  [tutorBlueprint.id]: tutorBlueprint,

  // Beauty-Wellness
  [beautyWellnessDefaultBlueprint.id]: beautyWellnessDefaultBlueprint,
  [lashBrowTechBlueprint.id]: lashBrowTechBlueprint,
  [hairSalonBlueprint.id]: hairSalonBlueprint,
  [barberBlueprint.id]: barberBlueprint,
  [spaMassageBlueprint.id]: spaMassageBlueprint,
  [makeupArtistBlueprint.id]: makeupArtistBlueprint,

  // Trades-Construction
  [tradesDefaultBlueprint.id]: tradesDefaultBlueprint,
  [hvacTechnicianBlueprint.id]: hvacTechnicianBlueprint,
  [electricianBlueprint.id]: electricianBlueprint,
  [cleanerBlueprint.id]: cleanerBlueprint,

  // Creative Services
  [creativeDefaultBlueprint.id]: creativeDefaultBlueprint,
  [webDesignerBlueprint.id]: webDesignerBlueprint,
  [interiorDesignerBlueprint.id]: interiorDesignerBlueprint,

  // Health & Fitness
  [healthDefaultBlueprint.id]: healthDefaultBlueprint,
  [physioChiroBlueprint.id]: physioChiroBlueprint,
  [gymStudioBlueprint.id]: gymStudioBlueprint,
  [therapistBlueprint.id]: therapistBlueprint,

  // Professional Services
  [professionalDefaultBlueprint.id]: professionalDefaultBlueprint,
  [lawyerBlueprint.id]: lawyerBlueprint,
  [realEstateBlueprint.id]: realEstateBlueprint,

  // Hospitality & Events
  [eventsDefaultBlueprint.id]: eventsDefaultBlueprint,
  [floristBlueprint.id]: floristBlueprint,
  [weddingPlannerBlueprint.id]: weddingPlannerBlueprint,

  // Education & Coaching
  [educationDefaultBlueprint.id]: educationDefaultBlueprint,
  [lifeCoachBlueprint.id]: lifeCoachBlueprint,
  [musicTeacherBlueprint.id]: musicTeacherBlueprint,
  [drivingInstructorBlueprint.id]: drivingInstructorBlueprint,
  [onlineCourseCreatorBlueprint.id]: onlineCourseCreatorBlueprint,

  // Retail & Ecommerce
  [retailDefaultBlueprint.id]: retailDefaultBlueprint,
  [onlineStoreBlueprint.id]: onlineStoreBlueprint,
  [boutiqueShopBlueprint.id]: boutiqueShopBlueprint,
  [handmadeArtisanBlueprint.id]: handmadeArtisanBlueprint,
  [foodBeverageBlueprint.id]: foodBeverageBlueprint,
};

/** All registered blueprints */
export const ALL_BLUEPRINTS: WorkspaceBlueprint[] = Object.values(BLUEPRINT_MAP);

/** Look up a blueprint by exact ID */
export function getBlueprintById(id: string): WorkspaceBlueprint | undefined {
  return BLUEPRINT_MAP[id];
}

/** Resolve the best blueprint for an industry + persona combination */
export function resolveBlueprint(
  industryId: string,
  personaId?: string,
): WorkspaceBlueprint | undefined {
  // 1. Try exact match: "industry:persona"
  if (personaId) {
    const exact = BLUEPRINT_MAP[`${industryId}:${personaId}`];
    if (exact) return exact;
  }

  // 2. Try industry default: "industry:default"
  const industryDefault = BLUEPRINT_MAP[`${industryId}:default`];
  if (industryDefault) return industryDefault;

  // 3. No blueprint available — caller should fall back to existing config
  return undefined;
}

/** Get all blueprint IDs */
export function getAllBlueprintIds(): string[] {
  return Object.keys(BLUEPRINT_MAP);
}
