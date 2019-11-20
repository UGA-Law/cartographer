import fs from 'fs'
import { useState, useEffect } from 'react'

export const useJSONFile = ({ filename }) => {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [isWorking, setIsWorking] = useState(false)
  useEffect(() => {
    setIsWorking(true)
    setError(null)
    setData(null)
    fs.readFile(filename, { encoding: 'utf-8' }, (error, data) => {
      if (error) {
        setIsWorking(false)
        setError(error)
      } else {
        setIsWorking(false)
        try {
          const parsed = JSON.parse(data)
          setData(parsed)
        } catch (error) {
          setError(error)
        }
      }
    })
  }, [filename])
  return {
    isWorking,
    data,
    error
  }
}
