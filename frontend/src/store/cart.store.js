import { create } from 'zustand';

export const useCartStore = create((set) => ({
  isOpen: false,
  itemCount: 0,

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
  setItemCount: (count) => set({ itemCount: count }),
}));
