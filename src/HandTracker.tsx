import { useEffect, useRef, useState } from 'react'
import { useHandStore } from './store'

declare global {
  interface Window {
    Hands?: any
    Camera?: any
    drawLandmarks?: any
    drawConnectors?: any
  }
}

const clamp = (value: number) => Math.min(1, Math.max(0, value))
const distanceBetween = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y)
const SNAP_COOLDOWN_MS = 260
const isFingerExtended = (landmarks: any[], tip: number, pip: number) =>
  landmarks[tip].y < landmarks[pip].y - 0.02

const isFingerFolded = (landmarks: any[], tip: number, pip: number) =>
  landmarks[tip].y > landmarks[pip].y + 0.01

const isRockOnGesture = (landmarks: any[]) => {
  const indexExtended = isFingerExtended(landmarks, 8, 6)
  const pinkyExtended = isFingerExtended(landmarks, 20, 18)
  const middleFolded = isFingerFolded(landmarks, 12, 10)
  const ringFolded = isFingerFolded(landmarks, 16, 14)

  return indexExtended && pinkyExtended && middleFolded && ringFolded
}

const isMoonwalkGesture = (landmarks: any[]) => {
  const indexExtended = isFingerExtended(landmarks, 8, 6)
  const middleExtended = isFingerExtended(landmarks, 12, 10)
  const ringFolded = isFingerFolded(landmarks, 16, 14)
  const pinkyFolded = isFingerFolded(landmarks, 20, 18)
  const handTiltedSideways = Math.abs(landmarks[5].y - landmarks[17].y) > 0.07
  const wrist = landmarks[0]
  const middleMcp = landmarks[9]
  const ringMcp = landmarks[13]
  const handIsFlipped =
    wrist.y < middleMcp.y - 0.03 && wrist.y < ringMcp.y - 0.02

  return (
    indexExtended &&
    middleExtended &&
    ringFolded &&
    pinkyFolded &&
    handTiltedSideways &&
    handIsFlipped
  )
}

const HAND_CONNECTIONS: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [0, 17],
]

export function HandTracker() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragStartRef = useRef<{ x: number; y: number; left: number; top: number } | null>(
    null,
  )
  const [position, setPosition] = useState({ left: 24, top: 24 })
  const lastSnapAtRef = useRef(0)
  const snapArmedRef = useRef(true)
  const setPinchDistance = useHandStore((state) => state.setPinchDistance)
  const cycleCubeHue = useHandStore((state) => state.cycleCubeHue)
  const setLeftHandPos = useHandStore((state) => state.setLeftHandPos)
  const setIsRockGesture = useHandStore((state) => state.setIsRockGesture)
  const setIsMoonwalkGesture = useHandStore((state) => state.setIsMoonwalkGesture)

  const videoWidth = 320
  const videoHeight = 180

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !window.Hands || !window.Camera) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const hands = new window.Hands({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    })

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    })

    hands.onResults((results: any) => {
      const width = canvas.width
      const height = canvas.height
      ctx.clearRect(0, 0, width, height)

      const rightIndex = results.multiHandedness?.findIndex(
        (hand: any) => hand.label === 'Right',
      )
      const leftIndex = results.multiHandedness?.findIndex(
        (hand: any) => hand.label === 'Left',
      )

      const rightLandmarks =
        rightIndex >= 0 ? results.multiHandLandmarks?.[rightIndex] : undefined
      const leftLandmarks =
        leftIndex >= 0 ? results.multiHandLandmarks?.[leftIndex] : undefined

      if (rightLandmarks) {
        const thumbTip = rightLandmarks[4]
        const indexTip = rightLandmarks[8]
        const middleTip = rightLandmarks[12]
        const thumbToIndex = distanceBetween(thumbTip, indexTip)
        const thumbToMiddle = distanceBetween(thumbTip, middleTip)
        const snapPose = thumbToIndex < 0.045 || thumbToMiddle < 0.045
        const openHandAgain = thumbToIndex > 0.1 && thumbToMiddle > 0.1
        const now = performance.now()

        setPinchDistance(clamp(thumbToIndex))

        if (
          snapPose &&
          snapArmedRef.current &&
          now - lastSnapAtRef.current > SNAP_COOLDOWN_MS
        ) {
          cycleCubeHue()
          lastSnapAtRef.current = now
          snapArmedRef.current = false
        }

        if (openHandAgain) {
          snapArmedRef.current = true
        }
      } else {
        snapArmedRef.current = true
      }

      if (leftLandmarks) {
        const wrist = leftLandmarks[0]
        setLeftHandPos({ x: clamp(wrist.x), y: clamp(wrist.y) })
        setIsRockGesture(isRockOnGesture(leftLandmarks))
        setIsMoonwalkGesture(isMoonwalkGesture(leftLandmarks))
      } else {
        setIsRockGesture(false)
        setIsMoonwalkGesture(false)
      }

      results.multiHandLandmarks?.forEach((landmarks: any[]) => {
        ctx.lineWidth = 2
        ctx.strokeStyle = 'rgba(255, 86, 164, 0.9)'
        ctx.fillStyle = '#ff56a4'

        HAND_CONNECTIONS.forEach(([start, end]) => {
          const a = landmarks[start]
          const b = landmarks[end]
          ctx.beginPath()
          ctx.moveTo(a.x * width, a.y * height)
          ctx.lineTo(b.x * width, b.y * height)
          ctx.stroke()
        })

        landmarks.forEach((landmark) => {
          const cx = landmark.x * width
          const cy = landmark.y * height
          ctx.beginPath()
          ctx.arc(cx, cy, 4, 0, Math.PI * 2)
          ctx.fill()
        })
      })
    })

    const camera = new window.Camera(video, {
      onFrame: async () => {
        await hands.send({ image: video })
      },
      width: videoWidth,
      height: videoHeight,
    })

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: videoWidth, height: videoHeight },
        })
        video.srcObject = stream
        await video.play()
        await camera.start()
      } catch (error) {
        console.error('Webcam access denied or unavailable', error)
      }
    }

    startCamera()

    return () => {
      camera.stop()
      const stream = video.srcObject as MediaStream | null
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [
    setPinchDistance,
    cycleCubeHue,
    setLeftHandPos,
    setIsRockGesture,
    setIsMoonwalkGesture,
  ])

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      left: position.left,
      top: position.top,
    }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return
    const dx = event.clientX - dragStartRef.current.x
    const dy = event.clientY - dragStartRef.current.y
    setPosition({
      left: dragStartRef.current.left + dx,
      top: dragStartRef.current.top + dy,
    })
  }

  const handlePointerUp = () => {
    dragStartRef.current = null
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: position.left,
        top: position.top,
        width: videoWidth,
        height: videoHeight,
        cursor: 'grab',
        zIndex: 20,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 32px 70px rgba(0,0,0,0.35)',
          border: '1px solid rgba(255,255,255,0.18)',
          backdropFilter: 'blur(18px)',
          background: 'rgba(0,0,0,0.15)',
          pointerEvents: 'auto',
        }}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
        <canvas
          ref={canvasRef}
          width={videoWidth}
          height={videoHeight}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  )
}
