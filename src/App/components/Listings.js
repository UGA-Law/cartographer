import React, { useState, useEffect } from 'react'
import styled from 'styled-components'

import { useMongoDataMany } from '../hooks/mongo.js/index.js

const SubItem = ({ payload }) => {
  const { href, text } = payload

  const {
    isConnected,
    isWorking,
    results
  } = useMongoDataMany({
    dbName: 'cartographer-scrape-database',
    collectionName: 'pageData',
    skip: 0,
    limit: 10,
    filter: { url: href }
  })

  return (
    <div>
      <div>{href}</div>
      <div>"{text}"</div>
      <pre>{results[0].pageTitle}</pre>
    </div>
  )
}

const Item = ({ payload }) => {
  const {
    pageTitle,
    pageUrl,
    scrapeLinks
  } = payload
  return (
    <div>
      <div>{ pageTitle } * { pageUrl }</div>
      <pre>
        {
          scrapeLinks.map((payload, index) => {
            return <SubItem payload={payload} key={`${payload.href}${index}`} />
          })
        }
      </pre>
    </div>
  )
}

export const Listings = ({ results }) => {
  return (
    <div>
      <div>Count:{results.length}</div>
      {
        results.map((payload) => {
          const { _id: key } = payload
          return <Item payload={payload} key={key} />
        })
      }
    </div>
  )
}
