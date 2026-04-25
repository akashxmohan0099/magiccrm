import { create } from "zustand";

interface WaitlistModalStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useWaitlistModal = create<WaitlistModalStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
