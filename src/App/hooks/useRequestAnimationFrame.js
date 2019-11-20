/* globals requestAnimationFrame, cancelAnimationFrame */
import { useEffect, useRef } from 'react'

export const useRequestAnimationFrame = renderCallback => {
  const requestFrameRef = useRef()
  const previousTimeRef = useRef()
  const isFirstRenderRef = useRef()

  const animate = timestamp => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = timestamp - previousTimeRef.current
      const isFirstRender = isFirstRenderRef.current === undefined
      isFirstRenderRef.current = false
      renderCallback({ deltaTime, timestamp, isFirstRender })
    }
    previousTimeRef.current = timestamp
    requestFrameRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    requestFrameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(requestFrameRef.current)
  }, [])
}
