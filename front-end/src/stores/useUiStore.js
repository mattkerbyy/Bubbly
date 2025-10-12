import { create } from 'zustand'

export const useUiStore = create((set) => ({
  theme: 'light',
  showModal: false,
  setTheme: (theme) => set(() => ({ theme })),
  toggleModal: () => set((state) => ({ showModal: !state.showModal })),
}))
