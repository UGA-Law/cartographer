/* globals cancelAnimationFrame, requestAnimationFrame */
import React, { useEffect, useRef } from 'react'

export const AutoSizer = ({ children }) => {
  const elementRef = useRef()
  const rafRef = useRef()

  const heartbeat = () => {
    rafRef.current = requestAnimationFrame(heartbeat)
    if (typeof children === 'function') {
      const width = elementRef.current.clientWidth
      const height = elementRef.current.clientHeight
      children({ width, height })
    }
  }

  useEffect(() => {
    rafRef.current = requestAnimationFrame(heartbeat)
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return <div ref={elementRef} />
}
