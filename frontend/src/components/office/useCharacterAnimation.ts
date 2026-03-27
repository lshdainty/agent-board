import { useRef, useCallback } from 'react'
import * as THREE from 'three'

// ---------------------------------------------------------------------------
// Animation state machine
// ---------------------------------------------------------------------------
export type AnimState =
  | 'walking'
  | 'sitting_typing'
  | 'sitting_idle'
  | 'standing_idle'
  | 'sitting_down'
  | 'standing_up'

export interface BodyPartRefs {
  head: React.RefObject<THREE.Group>
  armL: React.RefObject<THREE.Group>
  armR: React.RefObject<THREE.Group>
  handL: React.RefObject<THREE.Mesh>
  handR: React.RefObject<THREE.Mesh>
  legL: React.RefObject<THREE.Group>
  legR: React.RefObject<THREE.Group>
  shoeL: React.RefObject<THREE.Mesh>
  shoeR: React.RefObject<THREE.Mesh>
  torso: React.RefObject<THREE.Mesh>
  hairGroup: React.RefObject<THREE.Group>
  eyeL: React.RefObject<THREE.Mesh>
  eyeR: React.RefObject<THREE.Mesh>
}

// Default (standing) rest poses — local positions & rotations
const REST = {
  head:      { pos: [0, 0.73, 0],      rot: [0, 0, 0] },
  armL:      { pos: [-0.22, 0.35, 0],   rot: [0, 0, 0] },
  armR:      { pos: [0.22, 0.35, 0],    rot: [0, 0, 0] },
  handL:     { pos: [-0.22, 0.18, 0],   rot: [0, 0, 0] },
  handR:     { pos: [0.22, 0.18, 0],    rot: [0, 0, 0] },
  legL:      { pos: [-0.07, 0.1, 0],    rot: [0, 0, 0] },
  legR:      { pos: [0.07, 0.1, 0],     rot: [0, 0, 0] },
  shoeL:     { pos: [-0.07, 0.02, 0.01],rot: [0, 0, 0] },
  shoeR:     { pos: [0.07, 0.02, 0.01], rot: [0, 0, 0] },
  torso:     { pos: [0, 0.35, 0],       rot: [0, 0, 0] },
  hairGroup: { pos: [0, 0.7, 0],        rot: [0, 0, 0] },
  eyeL:      { pos: [-0.055, 0.72, 0.121],rot: [0, 0, 0] },
  eyeR:      { pos: [0.055, 0.72, 0.121], rot: [0, 0, 0] },
} as const

// Seated pose — absolute positions (group y stays at 0).
// Chair seat top = 0.40. Character sits ON the seat surface.
// The whole character is raised so butt is at seat level.
// Legs hang straight down from seat, feet visible above floor.
// Seated pose — group is raised by 0.30 in AgentCharacter.tsx
// So these positions are relative to the raised group.
// Legs/shoes use REST-like positions (hanging straight down from the raised body).
const SEATED = {
  torso:     { pos: [0, 0.35, 0],            rot: [-0.05, 0, 0] },
  head:      { pos: [0, 0.63, 0.01],         rot: [-0.1, 0, 0] },
  hairGroup: { pos: [0, 0.63, 0.01],         rot: [-0.1, 0, 0] },
  eyeL:      { pos: [-0.055, 0.62, 0.131],   rot: [0, 0, 0] },
  eyeR:      { pos: [0.055, 0.62, 0.131],    rot: [0, 0, 0] },
  armL:      { pos: [-0.22, 0.32, 0.1],      rot: [-0.6, 0, 0] },
  armR:      { pos: [0.22, 0.32, 0.1],       rot: [-0.6, 0, 0] },
  handL:     { pos: [-0.15, 0.22, 0.2],      rot: [-0.4, 0, 0] },
  handR:     { pos: [0.15, 0.22, 0.2],       rot: [-0.4, 0, 0] },
  legL:      { pos: [-0.07, 0.10, 0.05],     rot: [0, 0, 0] },
  legR:      { pos: [0.07, 0.10, 0.05],      rot: [0, 0, 0] },
  shoeL:     { pos: [-0.07, 0.02, 0.05],     rot: [0, 0, 0] },
  shoeR:     { pos: [0.07, 0.02, 0.05],      rot: [0, 0, 0] },
} as const

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
function lerpV3(
  obj: THREE.Object3D,
  target: { pos: readonly number[]; rot: readonly number[] },
  alpha: number,
) {
  obj.position.x = THREE.MathUtils.lerp(obj.position.x, target.pos[0], alpha)
  obj.position.y = THREE.MathUtils.lerp(obj.position.y, target.pos[1], alpha)
  obj.position.z = THREE.MathUtils.lerp(obj.position.z, target.pos[2], alpha)
  obj.rotation.x = THREE.MathUtils.lerp(obj.rotation.x, target.rot[0], alpha)
  obj.rotation.y = THREE.MathUtils.lerp(obj.rotation.y, target.rot[1], alpha)
  obj.rotation.z = THREE.MathUtils.lerp(obj.rotation.z, target.rot[2], alpha)
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useCharacterAnimation() {
  const refs: BodyPartRefs = {
    head: useRef<THREE.Group>(null!),
    armL: useRef<THREE.Group>(null!),
    armR: useRef<THREE.Group>(null!),
    handL: useRef<THREE.Mesh>(null!),
    handR: useRef<THREE.Mesh>(null!),
    legL: useRef<THREE.Group>(null!),
    legR: useRef<THREE.Group>(null!),
    shoeL: useRef<THREE.Mesh>(null!),
    shoeR: useRef<THREE.Mesh>(null!),
    torso: useRef<THREE.Mesh>(null!),
    hairGroup: useRef<THREE.Group>(null!),
    eyeL: useRef<THREE.Mesh>(null!),
    eyeR: useRef<THREE.Mesh>(null!),
  }

  const animStateRef = useRef<AnimState>('standing_idle')
  const transitionRef = useRef(0) // 0..1 for sit/stand transitions
  const randomSeedRef = useRef(Math.random() * 1000) // per-agent variation

  // Apply a single animation frame
  const animate = useCallback((state: AnimState, time: number, delta: number) => {
    const seed = randomSeedRef.current
    const t = time + seed // desynchronize agents

    // Transition lerp factor
    const lerpFactor = Math.min(delta * 5, 0.3)

    switch (state) {
      case 'walking':
        animateWalking(refs, t, lerpFactor)
        break
      case 'sitting_typing':
        animateSittingTyping(refs, t, lerpFactor, seed)
        break
      case 'sitting_idle':
        animateSittingIdle(refs, t, lerpFactor, seed)
        break
      case 'standing_idle':
        animateStandingIdle(refs, t, lerpFactor, seed)
        break
      case 'sitting_down':
        animateSittingDown(refs, delta)
        break
      case 'standing_up':
        animateStandingUp(refs, delta)
        break
    }
  }, [])

  return { refs, animStateRef, transitionRef, animate }
}

// ---------------------------------------------------------------------------
// Walking animation
// ---------------------------------------------------------------------------
function animateWalking(r: BodyPartRefs, t: number, alpha: number) {
  const walkCycle = t * 6 // Speed of walk cycle
  const legSwing = Math.sin(walkCycle) * 0.5
  const armSwing = Math.sin(walkCycle) * 0.35
  const bounce = Math.abs(Math.sin(walkCycle)) * 0.02

  // Legs swing forward/backward
  if (r.legL.current) {
    lerpV3(r.legL.current, {
      pos: [REST.legL.pos[0], REST.legL.pos[1] + bounce, REST.legL.pos[2]],
      rot: [legSwing, 0, 0],
    }, alpha)
  }
  if (r.legR.current) {
    lerpV3(r.legR.current, {
      pos: [REST.legR.pos[0], REST.legR.pos[1] + bounce, REST.legR.pos[2]],
      rot: [-legSwing, 0, 0],
    }, alpha)
  }

  // Shoes are children of legs — follow automatically

  // Arms swing opposite to legs
  if (r.armL.current) {
    lerpV3(r.armL.current, {
      pos: REST.armL.pos,
      rot: [-armSwing, 0, 0],
    }, alpha)
  }
  if (r.armR.current) {
    lerpV3(r.armR.current, {
      pos: REST.armR.pos,
      rot: [armSwing, 0, 0],
    }, alpha)
  }

  // Hands are children of arms — follow automatically

  // Torso slight bounce
  if (r.torso.current) {
    lerpV3(r.torso.current, {
      pos: [REST.torso.pos[0], REST.torso.pos[1] + bounce, REST.torso.pos[2]],
      rot: [0, 0, Math.sin(walkCycle) * 0.03],
    }, alpha)
  }

  // Head subtle bounce + slight sway
  if (r.head.current) {
    lerpV3(r.head.current, {
      pos: [REST.head.pos[0], REST.head.pos[1] + bounce, REST.head.pos[2]],
      rot: [0, 0, 0],
    }, alpha)
  }

  // Hair & eyes are children of head group — they follow automatically
}

// ---------------------------------------------------------------------------
// Sitting & typing (working at desk)
// ---------------------------------------------------------------------------
function animateSittingTyping(r: BodyPartRefs, t: number, alpha: number, seed: number) {
  // Typing rhythm — each hand has slightly different rhythm
  const typeL = Math.sin(t * 12 + seed) * 0.015
  const typeR = Math.sin(t * 12 + seed + 1.8) * 0.015

  // Occasional head turn — slow, random-ish
  const headTurnCycle = Math.sin(t * 0.3 + seed * 2.7)
  const headTurn = headTurnCycle > 0.85 ? Math.sin(t * 0.8) * 0.15 : 0

  // Seated base
  if (r.torso.current) lerpV3(r.torso.current, SEATED.torso, alpha)
  if (r.legL.current) lerpV3(r.legL.current, SEATED.legL, alpha)
  if (r.legR.current) lerpV3(r.legR.current, SEATED.legR, alpha)
  if (r.shoeL.current) lerpV3(r.shoeL.current, SEATED.shoeL, alpha)
  if (r.shoeR.current) lerpV3(r.shoeR.current, SEATED.shoeR, alpha)

  // Arms positioned at keyboard, with typing motion
  if (r.armL.current) {
    lerpV3(r.armL.current, {
      pos: SEATED.armL.pos,
      rot: [SEATED.armL.rot[0], 0, 0],
    }, alpha)
  }
  if (r.armR.current) {
    lerpV3(r.armR.current, {
      pos: SEATED.armR.pos,
      rot: [SEATED.armR.rot[0], 0, 0],
    }, alpha)
  }

  // Hands are children of arms — follow automatically

  // Head — look at monitor, occasional turn
  if (r.head.current) {
    lerpV3(r.head.current, {
      pos: SEATED.head.pos,
      rot: [SEATED.head.rot[0], headTurn, 0],
    }, alpha)
  }
  // Hair & eyes are children of head — follow automatically
}

// ---------------------------------------------------------------------------
// Sitting idle (at desk but nothing to do)
// ---------------------------------------------------------------------------
function animateSittingIdle(r: BodyPartRefs, t: number, alpha: number, seed: number) {
  // Subtle lean back
  const leanBack = Math.sin(t * 0.25 + seed) * 0.04
  // Occasional look around
  const lookCycle = Math.sin(t * 0.15 + seed * 3.1)
  const headYaw = lookCycle > 0.6
    ? Math.sin(t * 0.5 + seed) * 0.35
    : lookCycle < -0.6
      ? Math.sin(t * 0.7 + seed * 1.5) * 0.2
      : 0

  // Arms crossed look — arms slightly inward
  const armCross = Math.sin(t * 0.2 + seed) > 0.3

  if (r.torso.current) {
    lerpV3(r.torso.current, {
      pos: [SEATED.torso.pos[0], SEATED.torso.pos[1], SEATED.torso.pos[2] - leanBack * 0.5],
      rot: [SEATED.torso.rot[0] + leanBack, 0, 0],
    }, alpha)
  }

  if (r.legL.current) lerpV3(r.legL.current, SEATED.legL, alpha)
  if (r.legR.current) lerpV3(r.legR.current, SEATED.legR, alpha)
  if (r.shoeL.current) lerpV3(r.shoeL.current, SEATED.shoeL, alpha)
  if (r.shoeR.current) lerpV3(r.shoeR.current, SEATED.shoeR, alpha)

  if (armCross) {
    // Arms folded
    if (r.armL.current) {
      lerpV3(r.armL.current, {
        pos: [-0.15, SEATED.armL.pos[1] + 0.02, 0.06],
        rot: [-0.8, 0.3, 0],
      }, alpha * 0.5)
    }
    if (r.armR.current) {
      lerpV3(r.armR.current, {
        pos: [0.15, SEATED.armR.pos[1] + 0.02, 0.06],
        rot: [-0.8, -0.3, 0],
      }, alpha * 0.5)
    }
    // Hands are children of arms — follow automatically
  } else {
    // Arms resting on desk
    if (r.armL.current) lerpV3(r.armL.current, SEATED.armL, alpha)
    if (r.armR.current) lerpV3(r.armR.current, SEATED.armR, alpha)
    // Hands are children of arms — follow automatically
  }

  // Head — look around
  if (r.head.current) {
    lerpV3(r.head.current, {
      pos: SEATED.head.pos,
      rot: [SEATED.head.rot[0] + leanBack * 0.5, headYaw, 0],
    }, alpha)
  }
  // Hair & eyes are children of head — follow automatically
}

// ---------------------------------------------------------------------------
// Standing idle (near meeting table / coffee)
// ---------------------------------------------------------------------------
function animateStandingIdle(r: BodyPartRefs, t: number, alpha: number, seed: number) {
  // Subtle body sway
  const sway = Math.sin(t * 0.4 + seed) * 0.01
  const breathe = Math.sin(t * 1.2 + seed) * 0.005

  // Occasional gesture — one arm raises
  const gestureCycle = Math.sin(t * 0.18 + seed * 2.3)
  const gestureArm = gestureCycle > 0.7 // raise left arm
  const gestureArm2 = gestureCycle < -0.7 // raise right arm

  // Head looks around
  const headYaw = Math.sin(t * 0.35 + seed * 1.7) * 0.2
  const headPitch = Math.sin(t * 0.2 + seed * 0.9) * 0.05

  // Weight shift — lean slightly to one side
  const weightShift = Math.sin(t * 0.15 + seed) * 0.008

  if (r.torso.current) {
    lerpV3(r.torso.current, {
      pos: [REST.torso.pos[0] + sway, REST.torso.pos[1] + breathe, REST.torso.pos[2]],
      rot: [0, 0, weightShift * 2],
    }, alpha)
  }

  // Legs — slight weight shift
  if (r.legL.current) {
    lerpV3(r.legL.current, {
      pos: REST.legL.pos,
      rot: [0, 0, weightShift],
    }, alpha)
  }
  if (r.legR.current) {
    lerpV3(r.legR.current, {
      pos: REST.legR.pos,
      rot: [0, 0, -weightShift],
    }, alpha)
  }
  if (r.shoeL.current) lerpV3(r.shoeL.current, REST.shoeL, alpha)
  if (r.shoeR.current) lerpV3(r.shoeR.current, REST.shoeR, alpha)

  // Arms — gestures
  if (r.armL.current) {
    if (gestureArm) {
      // Raise left arm (talking gesture)
      const raiseAmt = (gestureCycle - 0.7) / 0.3 // 0..1
      lerpV3(r.armL.current, {
        pos: [-0.22, REST.armL.pos[1] + raiseAmt * 0.08, 0.05],
        rot: [-raiseAmt * 0.6, 0, -raiseAmt * 0.2],
      }, alpha)
    } else {
      lerpV3(r.armL.current, {
        pos: [REST.armL.pos[0] + sway, REST.armL.pos[1] + breathe, REST.armL.pos[2]],
        rot: REST.armL.rot,
      }, alpha)
    }
  }
  if (r.armR.current) {
    if (gestureArm2) {
      const raiseAmt = (-gestureCycle - 0.7) / 0.3
      lerpV3(r.armR.current, {
        pos: [0.22, REST.armR.pos[1] + raiseAmt * 0.08, 0.05],
        rot: [-raiseAmt * 0.6, 0, raiseAmt * 0.2],
      }, alpha)
    } else {
      lerpV3(r.armR.current, {
        pos: [REST.armR.pos[0] + sway, REST.armR.pos[1] + breathe, REST.armR.pos[2]],
        rot: REST.armR.rot,
      }, alpha)
    }
  }

  // Hands are children of arms — follow automatically

  // Head
  if (r.head.current) {
    lerpV3(r.head.current, {
      pos: [REST.head.pos[0] + sway, REST.head.pos[1] + breathe, REST.head.pos[2]],
      rot: [headPitch, headYaw, 0],
    }, alpha)
  }
  // Hair & eyes are children of head — follow automatically
}

// ---------------------------------------------------------------------------
// Sit down / stand up transitions — lerp all parts toward target pose
// ---------------------------------------------------------------------------
function animateSittingDown(r: BodyPartRefs, delta: number) {
  const alpha = Math.min(delta * 4, 0.2)
  const parts = Object.keys(SEATED) as (keyof typeof SEATED)[]
  for (const key of parts) {
    const ref = r[key]
    if (ref.current) lerpV3(ref.current, SEATED[key], alpha)
  }
}

function animateStandingUp(r: BodyPartRefs, delta: number) {
  const alpha = Math.min(delta * 4, 0.2)
  const parts = Object.keys(REST) as (keyof typeof REST)[]
  for (const key of parts) {
    const ref = r[key]
    if (ref.current) lerpV3(ref.current, REST[key], alpha)
  }
}
