import { create } from "zustand";
import SHAPES from "../data/shapes";

const useViewerStore = create((set) => ({
  currentShape: SHAPES[0],
  wireframe: false,
  autoRotate: true,
  size: 1.0,
  opacity: 1.0,

  setShape: (shape) =>
    set({
      currentShape: shape,
      size: 1.0,
      opacity: 1.0,
    }),

  toggleWireframe: () => set((s) => ({ wireframe: !s.wireframe })),
  toggleAutoRotate: () => set((s) => ({ autoRotate: !s.autoRotate })),

  setSize: (v) => set({ size: v }),
  setOpacity: (v) => set({ opacity: v }),
}));

export default useViewerStore;
