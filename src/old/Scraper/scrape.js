const Xray = require('x-ray')
const cup = require('crawler-url-parser')
const x = Xray().delay(10, 100).throttle(500, '1ms')
const moment = require('moment')

// const toilet = require('toiletdb')

const path = require('path')

// const db = toilet('./dumps/toilet.json')

const normalizeUrl = require('normalize-url')

// const { get, set, hasKey } = require('./scrapeRedis.js')

const { getCollection } = require('./scrapeMongodb.js.js')

const databaseName = 'cartographer'
const databaseCollectionName = 'law-school'
const workingCollectingName = `${databaseCollectionName}/work`

const norm = url => {
  if (url && url.indexOf('tel:') === -1) {
    return normalizeUrl(url, {
      stripHash: true,
      stripAuthentication: true,
      removeTrailingSlash: true
    }).toLowerCase()
  } else {
    return url
  }
}

const lookedAtUrlSet = new Set()

// const getExistingUrlData = ({ url }) => new Promise((resolve, reject) => {
//   db.open().then(() => {
//     return db.read(norm(url))
//   }).then(existingData => {
//     if (existingData) {
//       resolve(existingData)
//     } else {
//       reject(new Error(`No existing data found for url: ${url}`))
//     }
//   }).catch(reject)
// })

// const getExistingUrlData = ({ url }) => get({ key: norm(url) })
const getExistingUrlData = ({ url }) => new Promise((resolve, reject) => {
  getCollection({ collectionName: databaseCollectionName, dbName: databaseName }).then(collection => {
    collection.findOne({ url: norm(url) }, (error, document) => {
      if (error) {
        reject(error)
      } else {
        resolve(document)
        console.log('getExistingUrlData', { document })
      }
    })
  })
})

// const writeDataToDb = ({ url, data }) => new Promise((resolve, reject) => {
//   db.open().then(() => {
//     return db.write(norm(url), data)
//   }).then(resolve).catch(reject)
// })

// const writeDataToDb = ({ url, data }) => set({ key: norm(url), value: data })

const writeDataToDb = ({ url, data }) => new Promise((resolve, reject) => {
  getCollection({ dbName: databaseName, collectionName: databaseCollectionName }).then(collection => {
    collection.insertOne({ url: norm(url), data }, (error, result) => {
      if (error) {
        reject(error)
      } else {
        resolve(result)
      }
    })
  }).catch(reject)
})

const addToWorkingList = ({ url, data }) => new Promise((resolve, reject) => {
  getCollection({ dbName: databaseName, collectionName: workingCollectingName }).then(collection => {
    collection.insertOne({ url: norm(url), processed: false }, (error, result) => {
      if (error) {
        reject(error)
      } else {
        resolve(result)
      }
    })
  })
})

const scrapePage = ({ url }) => new Promise((resolve, reject) => {
  isInDatabase({ url }).then(verdict => {
    if (verdict === false) {
      return x(url,
        {
          pageTitle: 'title',
          linkTitles: ['a'],
          linkHrefs: ['a@href']
        }
      ).then(data => {
        const { pageTitle, linkTitles, linkHrefs } = data
        const pageLinks = linkTitles.map((label, index) => {
          const href = linkHrefs[index]
          return (
            {
              label,
              href
            }
          )
        })
        const scrapeTimestamp = +moment()
        const payload = {
          pageUrl: url,
          pageTitle,
          pageLinks,
          scrapeTimestamp
        }
        return writeDataToDb({ url, data: payload }).then(() => {
          resolve(payload)
        })
      })
    } else {
      resolve(getExistingUrlData({ url }))
    }
  })
})

// const isInDatabase = ({ url }) => new Promise((resolve, reject) => {
//   db.open().then(() => {
//     db.read(norm(url)).then(existingData => {
//       if (existingData) {
//         if (typeof existingData === 'object' && (Object.keys(existingData).length > 0)) {
//           resolve(true)
//         } else {
//           resolve(false)
//         }
//       } else {
//         resolve(false)
//       }
//     })
//   })
// })

// const isInDatabase = ({ url }) => hasKey({ key: norm(url) })

const isInWorkingList = ({ url }) => new Promise((resolve, reject) => {
  getCollection({ collectionName: workingCollectingName, dbName: databaseName }).then(collection => {
    collection.findOne({ url: norm(url) }, (error, doc) => {
      if (error) {
        reject(error)
      } else {
        if (doc == null) {
          resolve(false)
        } else {
          resolve(true)
        }
      }
    })
  })
})

const isInDatabase = ({ url }) => new Promise((resolve, reject) => {
  getCollection({ collectionName: databaseCollectionName, dbName: databaseName }).then(collection => {
    collection.findOne({ url: norm(url) }, (error, doc) => {
      if (error) {
        resolve(false)
      } else {
        if (doc == null) {
          resolve(false)
        } else {
          resolve(true)
        }
      }
    })
  }).catch(reject)
})

const getScrapableLinks = ({ pageLinks = [], pageUrl }) => {
  const uniqueSet = new Set()
  return pageLinks.filter(({ href }) => {
    if (href) {
      if (uniqueSet.has(href)) {
        return false
      } else {
        uniqueSet.add(href)
      }
      if (href.indexOf('tel:') >= 0) {
        return false
      }
      if (path.extname(href) !== '') {
        return false
      }
      if (href.indexOf('/calling-all-papers/') >= 0) {
        console.log('Skipping a /calling-all-papers/ related url.')
        return false
      }
      const pageUrlParts = cup.parse(pageUrl)
      const hrefParts = cup.parse(href)
      if (hrefParts && pageUrlParts) {
        const sameSubdomain = hrefParts.subdomain === pageUrlParts.subdomain
        const sameDomain = hrefParts.domain === pageUrlParts.domain
        if (sameDomain && sameSubdomain) {
          return true
        } else {
          return false
        }
      } else {
        return false
      }
    } else {
      return false
    }
  })
}

const getUnscrapedLinks = ({ pageLinks }) => new Promise((resolve, reject) => {
  Promise.all(pageLinks.map(({ href }) => {
    return isInDatabase({ url: href })
  })).then(results => {
    const unscrapedLinks = pageLinks.filter((_value, index) => {
      return !results[index]
    })
    resolve(unscrapedLinks)
  }).catch(reject)
})

const scrapeWebsite = ({
  url,
  parent = null
}) => {
  if (lookedAtUrlSet.has(norm(url)) === false) {
    if (parent) {
      console.log(`Scrape: ${parent} -> ${url}`)
    } else {
      console.log(`Scrape: ${url}`)
    }
    lookedAtUrlSet.add(norm(url))
    return scrapePage({ url, parent: null }).then((pageData) => {
      const { pageUrl, pageLinks } = pageData
      const scrapableLinks = getScrapableLinks({ pageLinks, pageUrl })
      return getUnscrapedLinks({ pageLinks: scrapableLinks }).then((unscrapedLinks) => {
        if (unscrapedLinks.length > 0) {
          return Promise.all(unscrapedLinks.map(({ href }) => add({ url: href, parent: url })))
        }
      })
    })
  } else {
    return Promise.resolve(null)
  }
}

module.exports = {
  scrapePage,
  scrapeWebsite
}
