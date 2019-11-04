const globalEventMap = new Map()

const dispatchMaker = eventName => payload => {
  if (globalEventMap.has(eventName) === false) {
    globalEventMap.set(eventName, new Set())
  }
  const listenerSet = globalEventMap.get(eventName)
  listenerSet.forEach(listener => listener(payload))
}

const subscribe = ({ eventName, callback }) => {
  if (globalEventMap.has(eventName) === false) {
    globalEventMap.set(eventName, new Set())
  }
  const listenerSet = globalEventMap.get(eventName)
  if (listenerSet.has(callback) === false) {
    if (typeof callback === 'function') {
      globalEventMap.set(eventName, new Set([...listenerSet, callback]))
    }
  }
  return () => {
    if (globalEventMap.has(eventName)) {
      const listenerSet = globalEventMap.get(eventName)
      if (listenerSet.has(callback)) {
        listenerSet.delete(callback)
        globalEventMap.set(eventName, new Set([...listenerSet]))
      }
    }
  }
}

module.exports = {
  dispatchMaker,
  subscribe
}
