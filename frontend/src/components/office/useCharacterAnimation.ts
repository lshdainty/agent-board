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
  head: React.RefObject<THREE.Mesh>
  armL: React.RefObject<THREE.Mesh>
  armR: React.RefObject<THREE.Mesh>
  handL: React.RefObject<THREE.Mesh>
  handR: React.RefObject<THREE.Mesh>
  legL: React.RefObject<THREE.Mesh>
  legR: React.RefObject<THREE.Mesh>
  shoeL: React.RefObject<THREE.Mesh>
  shoeR: React.RefObject<THREE.Mesh>
  torso: React.RefObject<THREE.Mesh>
  hairGroup: React.RefObject<THREE.Group>
  eyeL: React.RefObject<THREE.Mesh>
  eyeR: React.RefObject<THREE.Mesh>
}

// Default (standing) rest poses — local positions & rotations
const REST = {
  head:      { pos: [0, 0.7, 0],       rot: [0, 0, 0] },
  armL:      { pos: [-0.22, 0.35, 0],   rot: [0, 0, 0] },
  armR:      { pos: [0.22, 0.35, 0],    rot: [0, 0, 0] },
  handL:     { pos: [-0.22, 0.18, 0],   rot: [0, 0, 0] },
  handR:     { pos: [0.22, 0.18, 0],    rot: [0, 0, 0] },
  legL:      { pos: [-0.07, 0.1, 0],    rot: [0, 0, 0] },
  legR:      { pos: [0.07, 0.1, 0],     rot: [0, 0, 0] },
  shoeL:     { pos: [-0.07, 0.02, 0.01],rot: [0, 0, 0] },
  shoeR:     { pos: [0.07, 0.02, 0.01], rot: [0, 0, 0] },
  torso:     { pos: [0, 0.35, 0],       rot: [0, 0, 0] },
  hairGroup: { pos: [0, 0.84, 0],       rot: [0, 0, 0] },
  eyeL:      { pos: [-0.04, 0.72, 0.12],rot: [0, 0, 0] },
  eyeR:      { pos: [0.04, 0.72, 0.12], rot: [0, 0, 0] },
} as const

// Seated offset: group is raised to chair seat height (y=0.40) by AgentCharacter,
// so body part y-positions are lowered to keep the character sitting on the seat.
// Upper body uses SEAT_OFFSET_Y; legs/shoes use a larger offset to reach the floor.
const SEAT_OFFSET_Y = -0.20
const LEG_OFFSET_Y = -0.38  // legs need to dangle from seat to near-floor
const SEATED = {
  head:      { pos: [0, 0.7 + SEAT_OFFSET_Y, 0],         rot: [-0.1, 0, 0] },
  armL:      { pos: [-0.22, 0.32 + SEAT_OFFSET_Y, 0.08], rot: [-0.6, 0, 0] },
  armR:      { pos: [0.22, 0.32 + SEAT_OFFSET_Y, 0.08],  rot: [-0.6, 0, 0] },
  handL:     { pos: [-0.15, 0.22 + SEAT_OFFSET_Y, 0.18], rot: [-0.4, 0, 0] },
  handR:     { pos: [0.15, 0.22 + SEAT_OFFSET_Y, 0.18],  rot: [-0.4, 0, 0] },
  legL:      { pos: [-0.07, 0.08 + LEG_OFFSET_Y, 0.10],  rot: [-1.2, 0, 0] },
  legR:      { pos: [0.07, 0.08 + LEG_OFFSET_Y, 0.10],   rot: [-1.2, 0, 0] },
  shoeL:     { pos: [-0.07, -0.02 + LEG_OFFSET_Y, 0.16], rot: [-0.5, 0, 0] },
  shoeR:     { pos: [0.07, -0.02 + LEG_OFFSET_Y, 0.16],  rot: [-0.5, 0, 0] },
  torso:     { pos: [0, 0.35 + SEAT_OFFSET_Y, 0],         rot: [-0.05, 0, 0] },
  hairGroup: { pos: [0, 0.84 + SEAT_OFFSET_Y, 0],         rot: [-0.1, 0, 0] },
  eyeL:      { pos: [-0.04, 0.72 + SEAT_OFFSET_Y, 0.12], rot: [0, 0, 0] },
  eyeR:      { pos: [0.04, 0.72 + SEAT_OFFSET_Y, 0.12],  rot: [0, 0, 0] },
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
    head: useRef<THREE.Mesh>(null!),
    armL: useRef<THREE.Mesh>(null!),
    armR: useRef<THREE.Mesh>(null!),
    handL: useRef<THREE.Mesh>(null!),
    handR: useRef<THREE.Mesh>(null!),
    legL: useRef<THREE.Mesh>(null!),
    legR: useRef<THREE.Mesh>(null!),
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

  // Shoes follow legs
  if (r.shoeL.current) {
    lerpV3(r.shoeL.current, {
      pos: [REST.shoeL.pos[0], REST.shoeL.pos[1] + bounce, REST.shoeL.pos[2]],
      rot: [legSwing * 0.5, 0, 0],
    }, alpha)
  }
  if (r.shoeR.current) {
    lerpV3(r.shoeR.current, {
      pos: [REST.shoeR.pos[0], REST.shoeR.pos[1] + bounce, REST.shoeR.pos[2]],
      rot: [-legSwing * 0.5, 0, 0],
    }, alpha)
  }

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

  // Hands follow arms
  if (r.handL.current) {
    lerpV3(r.handL.current, {
      pos: [REST.handL.pos[0], REST.handL.pos[1], REST.handL.pos[2] + Math.sin(walkCycle) * 0.04],
      rot: [-armSwing * 0.6, 0, 0],
    }, alpha)
  }
  if (r.handR.current) {
    lerpV3(r.handR.current, {
      pos: [REST.handR.pos[0], REST.handR.pos[1], REST.handR.pos[2] - Math.sin(walkCycle) * 0.04],
      rot: [armSwing * 0.6, 0, 0],
    }, alpha)
  }

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

  // Hair follows head
  if (r.hairGroup.current) {
    lerpV3(r.hairGroup.current, {
      pos: [REST.hairGroup.pos[0], REST.hairGroup.pos[1] + bounce, REST.hairGroup.pos[2]],
      rot: [0, 0, 0],
    }, alpha)
  }

  // Eyes follow head
  if (r.eyeL.current) {
    lerpV3(r.eyeL.current, {
      pos: [REST.eyeL.pos[0], REST.eyeL.pos[1] + bounce, REST.eyeL.pos[2]],
      rot: [0, 0, 0],
    }, alpha)
  }
  if (r.eyeR.current) {
    lerpV3(r.eyeR.current, {
      pos: [REST.eyeR.pos[0], REST.eyeR.pos[1] + bounce, REST.eyeR.pos[2]],
      rot: [0, 0, 0],
    }, alpha)
  }
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

  // Hands typing — up/down motion
  if (r.handL.current) {
    lerpV3(r.handL.current, {
      pos: [SEATED.handL.pos[0], SEATED.handL.pos[1] + typeL, SEATED.handL.pos[2]],
      rot: SEATED.handL.rot,
    }, alpha)
  }
  if (r.handR.current) {
    lerpV3(r.handR.current, {
      pos: [SEATED.handR.pos[0], SEATED.handR.pos[1] + typeR, SEATED.handR.pos[2]],
      rot: SEATED.handR.rot,
    }, alpha)
  }

  // Head — look at monitor, occasional turn
  if (r.head.current) {
    lerpV3(r.head.current, {
      pos: SEATED.head.pos,
      rot: [SEATED.head.rot[0], headTurn, 0],
    }, alpha)
  }
  if (r.hairGroup.current) {
    lerpV3(r.hairGroup.current, {
      pos: SEATED.hairGroup.pos,
      rot: [SEATED.hairGroup.rot[0], headTurn, 0],
    }, alpha)
  }
  if (r.eyeL.current) lerpV3(r.eyeL.current, SEATED.eyeL, alpha)
  if (r.eyeR.current) lerpV3(r.eyeR.current, SEATED.eyeR, alpha)
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
    if (r.handL.current) {
      lerpV3(r.handL.current, {
        pos: [-0.05, SEATED.handL.pos[1] + 0.06, 0.1],
        rot: [-0.5, 0.2, 0],
      }, alpha * 0.5)
    }
    if (r.handR.current) {
      lerpV3(r.handR.current, {
        pos: [0.05, SEATED.handR.pos[1] + 0.06, 0.1],
        rot: [-0.5, -0.2, 0],
      }, alpha * 0.5)
    }
  } else {
    // Arms resting on desk
    if (r.armL.current) lerpV3(r.armL.current, SEATED.armL, alpha)
    if (r.armR.current) lerpV3(r.armR.current, SEATED.armR, alpha)
    if (r.handL.current) lerpV3(r.handL.current, SEATED.handL, alpha)
    if (r.handR.current) lerpV3(r.handR.current, SEATED.handR, alpha)
  }

  // Head — look around
  if (r.head.current) {
    lerpV3(r.head.current, {
      pos: SEATED.head.pos,
      rot: [SEATED.head.rot[0] + leanBack * 0.5, headYaw, 0],
    }, alpha)
  }
  if (r.hairGroup.current) {
    lerpV3(r.hairGroup.current, {
      pos: SEATED.hairGroup.pos,
      rot: [SEATED.hairGroup.rot[0] + leanBack * 0.5, headYaw, 0],
    }, alpha)
  }
  if (r.eyeL.current) lerpV3(r.eyeL.current, SEATED.eyeL, alpha)
  if (r.eyeR.current) lerpV3(r.eyeR.current, SEATED.eyeR, alpha)
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

  // Hands follow arms
  if (r.handL.current) {
    if (gestureArm) {
      const raiseAmt = (gestureCycle - 0.7) / 0.3
      lerpV3(r.handL.current, {
        pos: [-0.22, REST.handL.pos[1] + raiseAmt * 0.12, 0.08],
        rot: [-raiseAmt * 0.4, 0, 0],
      }, alpha)
    } else {
      lerpV3(r.handL.current, {
        pos: [REST.handL.pos[0] + sway, REST.handL.pos[1] + breathe, REST.handL.pos[2]],
        rot: REST.handL.rot,
      }, alpha)
    }
  }
  if (r.handR.current) {
    if (gestureArm2) {
      const raiseAmt = (-gestureCycle - 0.7) / 0.3
      lerpV3(r.handR.current, {
        pos: [0.22, REST.handR.pos[1] + raiseAmt * 0.12, 0.08],
        rot: [-raiseAmt * 0.4, 0, 0],
      }, alpha)
    } else {
      lerpV3(r.handR.current, {
        pos: [REST.handR.pos[0] + sway, REST.handR.pos[1] + breathe, REST.handR.pos[2]],
        rot: REST.handR.rot,
      }, alpha)
    }
  }

  // Head
  if (r.head.current) {
    lerpV3(r.head.current, {
      pos: [REST.head.pos[0] + sway, REST.head.pos[1] + breathe, REST.head.pos[2]],
      rot: [headPitch, headYaw, 0],
    }, alpha)
  }
  if (r.hairGroup.current) {
    lerpV3(r.hairGroup.current, {
      pos: [REST.hairGroup.pos[0] + sway, REST.hairGroup.pos[1] + breathe, REST.hairGroup.pos[2]],
      rot: [headPitch, headYaw, 0],
    }, alpha)
  }
  if (r.eyeL.current) {
    lerpV3(r.eyeL.current, {
      pos: [REST.eyeL.pos[0] + sway, REST.eyeL.pos[1] + breathe, REST.eyeL.pos[2]],
      rot: REST.eyeL.rot,
    }, alpha)
  }
  if (r.eyeR.current) {
    lerpV3(r.eyeR.current, {
      pos: [REST.eyeR.pos[0] + sway, REST.eyeR.pos[1] + breathe, REST.eyeR.pos[2]],
      rot: REST.eyeR.rot,
    }, alpha)
  }
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
