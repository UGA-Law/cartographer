export const makeConstraint = ({
  pointA,
  pointB,
  isHidden = false,
  length,
  stiffness = 1.0
}) => {
  let internalPointA = pointA
  let internalPointB = pointB
  let internalLength = length
  let internalIsHidden = isHidden
  let internalStiffness = stiffness

  const update = () => {
    const distanceX = internalPointA.x - internalPointB.x
    const distanceY = internalPointA.y - internalPointB.y
    const fullDistance = Math.sqrt((distanceX * distanceX) + (distanceY * distanceY))
    const difference = internalLength - fullDistance
    const percent = difference / fullDistance / 2
    const offsetX = distanceX * percent * internalStiffness
    const offsetY = distanceY * percent * internalStiffness
    if (!internalPointA.isPinned) {
      internalPointA.x += offsetX
      internalPointA.y += offsetY
    }
    if (!internalPointB.isPinned) {
      internalPointB.x -= offsetX
      internalPointB.y -= offsetY
    }
  }

  return {
    update,
    get pointA () {
      return internalPointA
    },
    set pointA (newPointA) {
      internalPointA = newPointA
    },
    get pointB () {
      return internalPointB
    },
    set pointB (newPointB) {
      internalPointB = newPointB
    },
    get length () {
      return internalLength
    },
    set length (newLength) {
      internalLength = newLength
    },
    get isHidden () {
      return internalIsHidden
    },
    set isHidden (newIsHidden) {
      internalIsHidden = newIsHidden
    },
    get stiffness () {
      return internalStiffness
    },
    set stiffness (newStiffness) {
      internalStiffness = newStiffness
    }
  }
}
