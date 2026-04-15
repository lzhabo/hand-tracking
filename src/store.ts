import { create } from 'zustand'

export type LeftHandPos = {
  x: number
  y: number
}

export type HandState = {
  pinchDistance: number
  cubeHue: number
  leftHandPos: LeftHandPos
  isRockGesture: boolean
  isMoonwalkGesture: boolean
  setPinchDistance: (value: number) => void
  setCubeHue: (value: number) => void
  cycleCubeHue: () => void
  setLeftHandPos: (value: LeftHandPos) => void
  setIsRockGesture: (value: boolean) => void
  setIsMoonwalkGesture: (value: boolean) => void
}

export const useHandStore = create<HandState>((set) => ({
  pinchDistance: 0,
  cubeHue: 0.92,
  leftHandPos: { x: 0.5, y: 0.5 },
  isRockGesture: false,
  isMoonwalkGesture: false,
  setPinchDistance: (value) => set({ pinchDistance: value }),
  setCubeHue: (value) => set({ cubeHue: value }),
  cycleCubeHue: () =>
    set((state) => ({
      cubeHue: (state.cubeHue + 0.16) % 1,
    })),
  setLeftHandPos: (value) => set({ leftHandPos: value }),
  setIsRockGesture: (value) => set({ isRockGesture: value }),
  setIsMoonwalkGesture: (value) => set({ isMoonwalkGesture: value }),
}))
