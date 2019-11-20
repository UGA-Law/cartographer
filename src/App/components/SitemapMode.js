import React from 'react'
import naturalCompare from 'string-natural-compare'
import { useMongoDataDistinct } from '../hooks/mongo.js'

export const SitemapMode = () => {
  const {
    isWorking,
    isConnected,
    results
  } = useMongoDataDistinct({
    dbName: 'cartographer-scrape-database',
    collectionName: 'pageData',
    fieldName: 'pageURL',
    filter: { wasFound: true }
  })

  const formatResults = (resultsRaw) => {
    const output = resultsRaw.map((rawUrl) => {
      const parsableUrl = new URL(rawUrl)
      const pathPartsRaw = parsableUrl.pathname.split('/')
      pathPartsRaw.shift()
      const pathParts = pathPartsRaw.map(part => `/${part}`)
      const pathBreakdown = []
      let previousPart = null
      for (const part of pathParts) {
        if (previousPart == null) {
          pathBreakdown.push(part)
          previousPart = part
        } else {
          previousPart = `${previousPart}${part}`
          pathBreakdown.push(previousPart)
        }
      }
      return {
        url: rawUrl,
        path: parsableUrl.pathname,
        pathBreakdown
      }
    })
    const internalSet = new Set()
    const cleanList = output
      .sort((a, b) => naturalCompare(a.path, b.path))
      .filter((item) => {
        if (internalSet.has(item.path)) {
          return false
        } else {
          internalSet.add(item.path)
          return true
        }
      })

    const finalList = []

    for (const item of cleanList) {
      const { pathBreakdown, path, url } = item
      if (pathBreakdown.length > 1) {
        finalList.push({
          path,
          children: []
        })
      } else {
        finalList.push({
          path,
          children: []
        })
      }
    }

    return finalList
  }

  if (results) {
    return (
      <div>
        <div>Sitemap Mode</div>
        <div>isConnected: {isConnected ? 'Yes' : 'No'}</div>
        <div>isWorking: {isWorking ? 'Yes' : 'No'}</div>
        <pre>{JSON.stringify(formatResults(results), null, '  ')}</pre>
      </div>
    )
  } else {
    return (
      <div>
        <div>Sitemap Mode</div>
        <div>isConnected: {isConnected ? 'Yes' : 'No'}</div>
        <div>isWorking: {isWorking ? 'Yes' : 'No'}</div>
      </div>
    )
  }
}
