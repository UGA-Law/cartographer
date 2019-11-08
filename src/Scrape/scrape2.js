const Xray = require('x-ray')
const moment = require('moment')
const { normalizeUrl, getScrapableLinks, timeout } = require('./utilities.js')
const { getMongoClient } = require('../Utilities/getMongoClient.js')
const { mongoDatabaseName } = require('../../common/settings.js')
const getTimestamp = () => moment().toISOString()
const workBatchLimit = 100

let activeClient = null

const xrayUrl = async ({
  url,
  delayMin = 500,
  delayMax = 1000,
  throttleCount = 10,
  throttleRate = '1s'
}) => {
  const shape = {
    pageTitle: 'title',
    linkTexts: ['a'],
    linkHrefs: ['a@href']
  }
  let output = null
  try {
    output = await Xray()
      .delay(delayMin, delayMax)
      .throttle(throttleCount, throttleRate)(url, shape)
  } catch (e) {
    console.error(e)
  }
  return output
}

const scrape = async ({ url: pageUrl, ...rest }) => {
  try {
    const xrayPayload = await xrayUrl({ url: pageUrl, ...rest })
    let shouldRetry = false
    if (xrayPayload) {
      const { pageTitle, linkTexts, linkHrefs } = xrayPayload
      const pageLinksRaw = linkTexts.map((text, index) => ({ text, href: linkHrefs[index] }))
      const scrapeLinks = getScrapableLinks({ pageLinks: pageLinksRaw, pageUrl })
      const scrapeTimestamp = getTimestamp()

      let pageExists = true
      if (pageTitle === 'Page not found | www.law.uga.edu') {
        pageExists = false
      }

      if (pageTitle === 'Error | Drupal') {
        shouldRetry = true // because the page in question did not load correctly
      } else {
        return {
          pageUrl,
          pageTitle,
          pageLinksRaw,
          scrapeTimestamp,
          scrapeLinks,
          pageExists
        }
      }
    } else {
      shouldRetry = true // because we don't have any data.
    }
    if (shouldRetry) {
      return new Promise((resolve, reject) => {
        console.log('Retry:', pageUrl)
        // we wrap this in a timeout to avoid stack overflows.
        setTimeout(() => {
          scrape({ url: pageUrl, ...rest }).then(resolve).catch(reject)
        }, 10000)
      })
    }
  } catch (error) {
    console.error('--- --- ---')
    console.error(error)
  }
}

const setupMongoCollections = async ({ dbName, collections = [] }) => {
  const client = getMongoClient()
  activeClient = client
  try {
    await client.connect()
    console.log('Connected to Mongo')
    const db = client.db(mongoDatabaseName)
    console.log('Connected to Database:', mongoDatabaseName)
    return collections.map((collectionName) => {
      console.log('Connected to Collection:', collectionName)
      return db.collection(collectionName)
    })
  } catch (error) {
    console.error(error)
  }
}

const makeBacklogDocument = ({ projectName }) => inputPayload => {
  const { href } = inputPayload
  return {
    url: normalizeUrl(href),
    hasScrapeData: false,
    scrapeTimestamp: null,
    data: inputPayload,
    projectName
  }
}

const isInCollection = ({ collection, filter }) => collection.find(filter).toArray().then(result => {
  if (Array.isArray(result)) {
    if (result.length === 0) {
      return false
    } else {
      return true
    }
  }
})

const urlsNotInCollection = async ({ scrapeLinks, pageData, backlog, projectName }) => {
  const internalSet = new Set()
  const backlogFilterArray = await Promise.all(scrapeLinks.map(({ href }) => {
    return isInCollection({ collection: backlog, filter: { url: normalizeUrl(href), projectName } })
  }))
  const pageDataFilterArray = await Promise.all(scrapeLinks.map(({ href }) => {
    return isInCollection({ collection: pageData, filter: { url: normalizeUrl(href), projectName } })
  }))
  return scrapeLinks.filter((_value, index) => {
    const isNewToBacklog = backlogFilterArray[index] === false
    const isNewToPageData = pageDataFilterArray[index] === false
    if (isNewToPageData && isNewToBacklog) {
      return true
    } else {
      return false
    }
  }).filter(({ href }) => {
    if (internalSet.has(href)) {
      return false
    } else {
      internalSet.add(href)
      return true
    }
  })
}

const workload = ({ pageData, backlog, batchItem, projectName }) => new Promise((resolve, reject) => {
  const resolveWorkload = resolve
  const rejectWorkload = reject
  const { url } = batchItem

  const setHasScrapeDataToTrue = ({ url }) => backlog.updateMany({ url: normalizeUrl(url), projectName }, { $set: { hasScrapeData: true, scrapeTimestamp: getTimestamp() } })
  const saveScrapedData = ({ url, data }) => pageData.insertOne({ ...data, url: normalizeUrl(url), projectName })
  const checkForPageDataExistance = ({ url }) => new Promise((resolve, reject) => {
    pageData.findOne({ url: normalizeUrl(url), projectName }).then(result => {
      if (result) {
        resolve(true)
      } else {
        resolve(false)
      }
    })
  })
  checkForPageDataExistance({ url }).then(exists => {
    if (exists) {
      setHasScrapeDataToTrue({ url }).then(() => {
        console.log(`[backlog] hasSrapeData:true -> ${url}`)
        resolveWorkload()
      })
    } else if (exists === false) {
      scrape({ url }).then(scrapeData => {
        const { scrapeLinks } = scrapeData
        checkForPageDataExistance({ url }).then(exists => {
          if (exists) {
            setHasScrapeDataToTrue({ url }).then(() => {
              console.log(`[backlog] hasSrapeData:true -> ${url}`)
              resolveWorkload()
            })
          } else if (exists === false) {
            saveScrapedData({ url, data: scrapeData }).then(() => {
              console.log(`[pageData] saved page data -> ${url}`)
              return urlsNotInCollection({ scrapeLinks, backlog, pageData, projectName }).then(scrapableLinks => {
                const promises = [
                  setHasScrapeDataToTrue({ url }).then(() => {
                    console.log(`[backlog] hasSrapeData:true -> ${url}`)
                  })
                ]
                if (scrapableLinks.length > 0) {
                  promises.unshift(backlog.insertMany(scrapableLinks.map(makeBacklogDocument({ projectName }))).then(() => {
                    console.log(`[backlog] + ${scrapableLinks.length}`)
                  }))
                }
                return Promise.all(promises).then(() => {
                  resolveWorkload()
                })
              })
            }).catch(rejectWorkload)
          }
        }).catch(rejectWorkload)
      }).catch(rejectWorkload)
    }
  })
}) // end of workload

const workOnBacklog = async ({ backlog, pageData, projectName, ...rest }) => {
  const startMoment = moment()
  const backlogCount = await backlog.find({ hasScrapeData: false, projectName }).count()
  if (backlogCount > 0) {
    console.log(`-- * -- Beginning Work on Backlog -- * --`)
    console.log(`[backlog] Total Count: ${backlogCount}`)
    const workBatch = await backlog.find({ hasScrapeData: false, projectName }).limit(workBatchLimit).toArray()
    console.log(`[batch] Current Batch Size: ${workBatch.length}`)
    await Promise.all(workBatch.map(batchItem => workload({ batchItem, backlog, pageData, projectName })))
    const endMoment = moment()
    console.log(`[batch] Completed. Updated Count: ${workBatch.length}`)
    console.log(`[batch] Time Taken: ${ startMoment.from(endMoment, true) }`)
    const nextCount = await backlog.find({ hasScrapeData: false, projectName }).count()
    if (nextCount > 0) {
      await timeout(100).then(async () => {
        await workOnBacklog({ backlog, pageData, projectName, ...rest })
      })
    } else {
      console.log('All Done, Bye!')
    }
  } else {
    console.log('Backlog is empty.')
    console.log('We are done!')
    await activeClient.close()
  }
}

const scrapeWebsite = async ({ url: hostWebsiteUrl }) => {
  const projectName = `Project:${hostWebsiteUrl}`
  try {
    // -- setup database --
    const [
      backlog,
      pageData
    ] = await setupMongoCollections({
      dbName: mongoDatabaseName,
      collections: [
        'backlog',
        'pageData'
      ]
    })
    // Database connected.
    // -- lookup host webpage's data --
    const lookupForHostPage = await pageData.findOne({ url: normalizeUrl(hostWebsiteUrl), projectName })
    if (lookupForHostPage == null) {
      // Host Webpage's data is not already in the database.
      // -- scrape the host webpage --
      const hostScrapePayload = await scrape({ url: hostWebsiteUrl })
      if (hostScrapePayload) {
        // Host webpage's data was scraped
        // -- insert host page's data into the database --
        await pageData.insertOne({ ...hostScrapePayload, url: normalizeUrl(hostWebsiteUrl), projectName })
        // Host webpage data has been inserted into the pageData collection.
        // -- destructure and extract raw scrape links --
        const { scrapeLinks } = hostScrapePayload
        // -- create array of links that are valid to add to backlog --
        const scapableLinks = await urlsNotInCollection({ scrapeLinks, backlog, pageData, projectName })
        if (scapableLinks.length > 0) {
          // -- add new entries to the backlog.
          await backlog.insertMany(scapableLinks.map(makeBacklogDocument({ projectName })))
          // Entries added to the backlog.
          console.log(`[backlog] + ${scapableLinks.length}`)
        }
      } else {
        // Unable to scrape host webpage.
        console.error('No Data retrieved.')
      }
    } else {
      // Host webpage data already exists in the database.
      console.log('Host Page Data already exists.')
    }
    // -- have a look at the backlog --
    await workOnBacklog({ backlog, pageData, projectName })
  } catch (error) {
    console.error(error)
  }
}

module.exports = { scrapeWebsite }
