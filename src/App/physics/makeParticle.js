export const makeParticle = ({
  x = 0,
  y = 0,
  oldX = 0,
  oldY = 0,
  speed = 0,
  direction = 0,
  gravity = 0,
  mass = 1,
  radius = 0,
  bounce = -1,
  friction = 1,
  isPinned = false
}) => {
  let internalX = x
  let internalY = y
  let internalOldX = oldX || x
  let internalOldY = oldY || y
  let internalRadius = radius
  let internalBounce = bounce
  let internalGravity = gravity
  let internalFriction = friction
  let internalIsPinned = isPinned
  let internalMass = mass

  setSpeed(speed)
  setDirection(direction)

  function getSpeed () {
    const vx = internalX - internalOldX
    const vy = internalY - internalOldY
    return Math.sqrt((vx * vx) + (vy * vy))
  }

  function setSpeed (newSpeed) {
    const angle = getDirection()
    internalOldX += Math.cos(angle) * newSpeed
    internalOldY += Math.sin(angle) * newSpeed
  }

  function getDirection () {
    const speed = getSpeed()
    const vx = (internalX - internalOldX) * speed
    const vy = (internalY - internalOldY) * speed
    return Math.atan2(vy, vx)
  }

  function setDirection (newAngle) {
    const speed = getSpeed()
    internalOldX += Math.cos(newAngle) * speed
    internalOldY += Math.sin(newAngle) * speed
  }

  const update = () => {
    if (!internalIsPinned) {
      const vx = (internalX - internalOldX) * internalFriction
      const vy = (internalY - internalOldY) * internalFriction
      internalOldX = internalX
      internalOldY = internalY
      internalX += vx
      internalY += vy
      internalY += internalGravity
    }
  }

  const api = {
    update,
    get x () {
      return internalX
    },
    set x (newX) {
      internalX = newX
    },
    get y () {
      return internalY
    },
    set y (newY) {
      internalY = newY
    },
    get vx () {
      return internalX - internalOldX
    },
    set vx (newVX) {
      internalOldX += newVX
    },
    get vy () {
      return internalY - internalOldY
    },
    set vy (newVY) {
      internalOldY += newVY
    },
    get oldX () {
      return internalOldX
    },
    set oldX (newOldX) {
      internalOldX = newOldX
    },
    get oldY () {
      return internalOldY
    },
    set oldY (newOldY) {
      internalOldY = newOldY
    },
    get radius () {
      return internalRadius
    },
    set radius (newRadius) {
      internalRadius = newRadius
    },
    get bounce () {
      return internalBounce
    },
    set bounce (newBounce) {
      internalBounce = newBounce
    },
    get gravity () {
      return internalGravity
    },
    set gravity (newGravity) {
      internalGravity = newGravity
    },
    get friction () {
      return internalFriction
    },
    set friction (newFriction) {
      internalFriction = newFriction
    },
    get isPinned () {
      return internalIsPinned
    },
    set isPinned (newIsPinned) {
      internalIsPinned = newIsPinned
    },
    get mass () {
      return internalMass
    },
    set mass (newMass) {
      internalMass = newMass
    },
    get direction () {
      return getDirection()
    },
    set direction (angle) {
      setDirection(angle)
    },
    get speed () {
      return getSpeed()
    },
    set speed (newSpeed) {
      setSpeed(newSpeed)
    }
  }

  return api
}
