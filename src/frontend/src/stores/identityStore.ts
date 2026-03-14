import type { Ed25519KeyIdentity } from "@dfinity/identity";
import { create } from "zustand";

interface IdentityStore {
  identity: Ed25519KeyIdentity | null;
  setIdentity: (identity: Ed25519KeyIdentity | null) => void;
}

export const useIdentityStore = create<IdentityStore>((set) => ({
  identity: null,
  setIdentity: (identity) => set({ identity }),
}));
