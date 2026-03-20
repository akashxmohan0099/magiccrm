"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Inbox,
  Calendar,
  Receipt,
  FolderKanban,
  Headphones,
  Megaphone,
  FileText,
  MessageCircle,
  CreditCard,
  Zap,
  BarChart3,
  Check,
  ArrowLeft,
  Mail,
  Smartphone,
} from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import { FEATURE_BLOCKS, FeatureBlock, SubFeature } from "@/types/features";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Users, Inbox, Calendar, Receipt, FolderKanban,
  Headphones, Megaphone, FileText, MessageCircle, CreditCard,
  Zap, BarChart3,
};

const MODULE_TITLES: Record<string, string> = {
  "client-database": "How do you manage your clients?",
  "leads-pipeline": "How do new customers find you?",
  "communication": "Where do you communicate with clients?",
  "bookings-calendar": "How do clients book with you?",
  "quotes-invoicing": "How do you handle quotes & invoicing?",
  "jobs-projects": "How do you track your work?",
  "marketing": "How do you promote your business?",
  "support": "How do you handle support?",
  "documents": "What documents do you need?",
  "payments": "How do you track payments?",
  "automations": "What would you like to automate?",
  "reporting": "What insights matter to you?",
};

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.416-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.416 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 1 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  email: <Mail className="w-5 h-5" />,
  sms: <Smartphone className="w-5 h-5" />,
  "instagram-dms": <InstagramIcon className="w-5 h-5" />,
  "facebook-messenger": <FacebookIcon className="w-5 h-5" />,
  whatsapp: <WhatsAppIcon className="w-5 h-5" />,
  linkedin: <LinkedInIcon className="w-5 h-5" />,
};

type Selections = Record<string, Record<string, boolean>>;

export function FeatureCustomizationStep() {
  const { needs, teamSize, prevStep, nextStep, setFeatureSelections } =
    useOnboardingStore();
  const isSolo = teamSize === "Just me";

  const visibleBlocks = useMemo(() => {
    const blocks: FeatureBlock[] = [];
    for (const block of FEATURE_BLOCKS) {
      if (block.alwaysShow) { blocks.push(block); continue; }
      if (block.triggeredBy && needs[block.triggeredBy]) { blocks.push(block); continue; }
      if (block.autoEnabledBy && block.autoEnabledBy.some((key) => needs[key])) {
        blocks.push(block);
      }
    }
    return blocks;
  }, [needs]);

  const getVisibleSubFeatures = useCallback(
    (block: FeatureBlock): SubFeature[] =>
      block.subFeatures.filter((sf) => !(isSolo && sf.requiresTeam)),
    [isSolo]
  );

  const [selections, setSelections] = useState<Selections>(() => {
    const initial: Selections = {};
    for (const block of FEATURE_BLOCKS) {
      initial[block.id] = {};
      for (const sf of block.subFeatures) {
        initial[block.id][sf.id] = sf.defaultOn;
      }
    }
    return initial;
  });

  const [moduleIndex, setModuleIndex] = useState(-1);
  const [direction, setDirection] = useState(1);

  const toggleSelection = (blockId: string, featureId: string) => {
    setSelections((prev) => ({
      ...prev,
      [blockId]: { ...prev[blockId], [featureId]: !prev[blockId]?.[featureId] },
    }));
  };

  const persistAndAdvance = () => {
    for (const block of visibleBlocks) {
      const features = getVisibleSubFeatures(block).map((sf) => ({
        id: sf.id,
        label: sf.label,
        description: sf.description,
        selected: selections[block.id]?.[sf.id] ?? sf.defaultOn,
      }));
      setFeatureSelections(block.id, features);
    }
    nextStep();
  };

  const handleNext = () => {
    setDirection(1);
    if (moduleIndex < visibleBlocks.length - 1) {
      setModuleIndex((prev) => prev + 1);
    } else {
      persistAndAdvance();
    }
  };

  const handleBack = () => {
    setDirection(-1);
    if (moduleIndex <= 0) {
      prevStep();
    } else {
      setModuleIndex((prev) => prev - 1);
    }
  };

  // ── Transition screen ──
  if (moduleIndex === -1) {
    const answeredYes = Object.values(needs).filter(Boolean).length;

    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center max-w-md mx-auto"
        >
          <div className="w-10 h-10 bg-foreground rounded-full flex items-center justify-center mx-auto mb-8">
            <Check className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-[32px] font-bold text-foreground tracking-tight mb-4">
            {answeredYes} module{answeredYes !== 1 ? "s" : ""} selected
          </h2>
          <p className="text-[15px] text-text-tertiary mb-8">
            Let&apos;s fine-tune the features in each one.
          </p>

          <div className="flex flex-wrap gap-2 justify-center mb-12">
            {visibleBlocks.map((block, i) => {
              const Icon = ICON_MAP[block.icon];
              return (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.04 }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-surface rounded-lg text-[13px] font-medium text-foreground"
                >
                  {Icon && <Icon className="w-3.5 h-3.5 text-text-secondary" />}
                  {block.name}
                </motion.div>
              );
            })}
          </div>

          <button
            onClick={() => { setDirection(1); setModuleIndex(0); }}
            className="px-10 py-3.5 bg-foreground text-white rounded-full text-[15px] font-medium cursor-pointer hover:opacity-90 transition-opacity"
          >
            Customize
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Module feature screen ──
  const currentBlock = visibleBlocks[moduleIndex];
  if (!currentBlock) return null;

  const IconComp = ICON_MAP[currentBlock.icon] || Zap;
  const visibleSubs = getVisibleSubFeatures(currentBlock);
  const isComm = currentBlock.id === "communication";
  const isLast = moduleIndex === visibleBlocks.length - 1;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col max-w-md mx-auto">
      {/* Progress dots */}
      <div className="pt-6 flex justify-center">
        <div className="flex items-center gap-1.5">
          {visibleBlocks.map((block, i) => (
            <div
              key={block.id}
              className={`rounded-full transition-all duration-200 ${
                i === moduleIndex
                  ? "w-6 h-1.5 bg-foreground"
                  : i < moduleIndex
                  ? "w-1.5 h-1.5 bg-foreground/25"
                  : "w-1.5 h-1.5 bg-border-light"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Centered content */}
      <div className="flex-1 flex items-center justify-center py-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={moduleIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -30 : 30 }}
            transition={{ duration: 0.15 }}
            className="w-full"
          >
            {/* Module header */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-6">
                <IconComp className="w-7 h-7 text-foreground" />
              </div>
              <h2 className="text-[24px] font-bold text-foreground tracking-tight mb-1.5">
                {MODULE_TITLES[currentBlock.id] || currentBlock.name}
              </h2>
              <p className="text-[14px] text-text-tertiary">
                {currentBlock.description}
              </p>
            </div>

            {/* Feature checklist */}
            <div className="space-y-2 mb-8">
              {visibleSubs.map((sf, i) => {
                const isOn = selections[currentBlock.id]?.[sf.id] ?? false;
                const channelIcon = isComm ? CHANNEL_ICONS[sf.id] : null;

                return (
                  <motion.button
                    key={sf.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => toggleSelection(currentBlock.id, sf.id)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-150 cursor-pointer text-left ${
                      isOn
                        ? "bg-surface border border-foreground/10"
                        : "bg-white border border-border-light hover:border-foreground/15"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                        isOn ? "bg-foreground" : "border-2 border-border-light"
                      }`}
                    >
                      {isOn && <Check className="w-3 h-3 text-white" />}
                    </div>

                    {channelIcon && (
                      <div className={`flex-shrink-0 transition-colors ${isOn ? "text-foreground" : "text-text-tertiary"}`}>
                        {channelIcon}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-foreground">
                        {sf.label}
                      </p>
                      {!isComm && (
                        <p className="text-[12px] text-text-tertiary mt-0.5">
                          {sf.description}
                        </p>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Continue */}
            <div className="flex justify-center">
              <button
                onClick={handleNext}
                className="px-10 py-3.5 bg-foreground text-white rounded-full text-[15px] font-medium cursor-pointer hover:opacity-90 transition-opacity"
              >
                {isLast ? "Review" : "Continue"}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom back */}
      <div className="pb-6 flex justify-center">
        <button
          onClick={handleBack}
          className="text-[12px] text-text-tertiary hover:text-text-secondary flex items-center gap-1 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> back
        </button>
      </div>
    </div>
  );
}
