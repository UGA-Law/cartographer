import React, { useEffect, useRef } from 'react'
import { useRequestAnimationFrame } from '../hooks/useRequestAnimationFrame'

const getDPR = () => window.devicePixelRatio || 1.0

export const Canvas = ({
  onRender,
  contextType = '2d',
  idealFPS = 60
}) => {
  const canvasRef = useRef()
  const contextRef = useRef()

  useEffect(() => {
    if (typeof contextType === 'string') {
      contextRef.current = canvasRef.current.getContext(contextType)
    } else if (Array.isArray(contextType)) {
      contextRef.current = canvasRef.current.getContext(...contextType)
    }
  }, [])

  useRequestAnimationFrame(({ deltaTime, timestamp, isFirstRender }) => {
    const { current: context } = contextRef
    const { current: canvas } = canvasRef
    if (context && canvas) {
      const idealMs = 1000 / idealFPS
      const fps = (idealMs / deltaTime) * idealFPS

      const dpr = getDPR()
      const targetWidth = canvas.clientWidth * dpr
      const targetHeight = canvas.clientHeight * dpr

      let resized = false

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth
        canvas.height = targetHeight
        resized = true
      }

      const clearCanvas = () => {
        const { width, height } = canvas
        context.clearRect(0, 0, width, height)
      }

      onRender({
        deltaTime,
        timestamp,
        context,
        fps,
        canvas,
        clearCanvas,
        idealFPS,
        resized,
        isFirstRender
      })
    }
  })

  return (
    <canvas ref={canvasRef} />
  )
}
