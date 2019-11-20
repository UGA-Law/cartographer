import { useEffect } from 'react'
import { subscribeToAllMessages } from '../../Scrape3/scrapeWebsite.js'

export const useScrapeMessages = callback => {
  const onMessage = (payload) => {
    callback(payload)
  }

  useEffect(() => {
    const unsubscribe = subscribeToAllMessages(onMessage)
    return () => {
      unsubscribe()
    }
  }, [])
}
