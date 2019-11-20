const {
  canScrapeUrl,
  afterDelay,
  makeTest,
  isValidUrl,
  isExternalUrl,
  isInternalUrl,
  containsRestrictedExtension,
  getTimestamp,
  normalizeUrl,
  urlToUrlID
} = require('./utilities.js')

const messageSubscriptions = new Set()

function sendMessage (payload) {
  for (const listener of messageSubscriptions) {
    listener(JSON.stringify({
      ...payload,
      messageTimestamp: getTimestamp()
    }))
  }
}

const { getMongoClient } = require('../Utilities/getMongoClient.js')

const { mongoDatabaseName } = require('../../common/settings.js')

const Xray = require('x-ray')

const xrayUrl = ({
  url,
  delayMin = 500,
  delayMax = 1000,
  throttleCount = 10,
  throttleRate = '1s'
}) => new Promise((resolve, reject) => {
  const x = Xray()
    .delay(delayMin, delayMax)
    .throttle(throttleCount, throttleRate)

  const shape = {
    pageTitle: 'title',
    pageCanonical: `head>[rel='canonical']@href`,
    pageShortLink: `head>[rel='shortlink']@href`,
    contentPageTitle: '#page-title',
    rawLinks: x('a', {
      texts: ['a'],
      hrefs: ['a@href']
    })
  }
  x(url, shape).then(data => {
    sendMessage({
      subject: 'x-ray',
      note: 'success',
      payload: {
        url,
        urlID: urlToUrlID({ url })
      }
    })
    resolve({ error: null, data: { ...data, url } })
  }).catch(error => {
    sendMessage({
      subject: 'x-ray',
      note: 'error',
      payload: {
        url,
        urlID: urlToUrlID({ url }),
        error
      }
    })
    resolve({ error: { ...error, url }, data: null })
  })
})

const checkIfShouldRetry = ({ error, data }) => {
  let verdict = false

  if (data) {
    verdict = false
  } else if (error) {
    switch (error.errno) {
      case 'ENOTFOUND':
        console.error('Address Not Found:', error.hostname)
        sendMessage({
          subject: 'error',
          note: 'Address Not Found',
          payload: {
            error
          }
        })
        verdict = true
        break
      default:
        console.error('ERROR:', error)
        sendMessage({
          subject: 'error',
          note: 'Generic Error',
          payload: {
            error
          }
        })
        verdict = true
        break
    }
  }

  return verdict
}

const checkIfWasFound = ({ data }) => {
  if (data) {
    const { pageTitle } = data
    if (pageTitle) {
      if (pageTitle.indexOf('Page not found') > -1) {
        return false
      } else {
        return true
      }
    }
    return false
  } else {
    return false
  }
}

const maxRetryCount = 5
const retryDelay = 1500
const internalRetryCountMap = new Map()

const classifyLinks = ({ array, masterWebsiteURL }) => {
  const validUrlTest = makeTest({
    resultIfTrue: 'valid',
    resultIfFalse: 'invalid',
    testFn (input) {
      return isValidUrl({ url: input })
    }
  })

  const externalUrlTest = makeTest({
    resultIfTrue: 'external',
    testFn (href) {
      return isExternalUrl({ url: href, referenceUrl: masterWebsiteURL })
    }
  })

  const internalUrlTest = makeTest({
    resultIfTrue: 'internal',
    testFn (href) {
      return isInternalUrl({ url: href, referenceUrl: masterWebsiteURL })
    }
  })

  const scrapableUrlTest = makeTest({
    resultIfTrue: 'scrapable',
    testFn (href) {
      return canScrapeUrl({
        testUrl: href,
        projectUrl: masterWebsiteURL
      })
    }
  })

  const httpTest = makeTest({
    resultIfTrue: 'http',
    testFn (href) {
      const isValid = isValidUrl({ url: href })
      if (isValid) {
        return href.toLowerCase().indexOf('http:') > -1
      } else {
        return false
      }
    }
  })

  const httpsTest = makeTest({
    resultIfTrue: 'https',
    testFn (href) {
      const isValid = isValidUrl({ url: href })
      if (isValid) {
        return href.toLowerCase().indexOf('https:') > -1
      } else {
        return false
      }
    }
  })

  const mailtoTest = makeTest({
    resultIfTrue: 'email',
    testFn (href) {
      const isValid = isValidUrl({ url: href })
      if (isValid) {
        return href.toLowerCase().indexOf('mailto:') > -1
      } else {
        return false
      }
    }
  })

  const telTest = makeTest({
    resultIfTrue: 'phone',
    testFn (href) {
      const isValid = isValidUrl({ url: href })
      const potentialBadThings = [
        'tel:',
        'https://tel:',
        'http://tel:',
        'tel://',
        'https:tel:',
        'http:tel:'
      ]
      if (isValid) {
        const isPhone = potentialBadThings.reduce((acc, badThing) => {
          if (!acc) {
            acc = href.toLowerCase().indexOf(badThing) > -1
          }
          return acc
        }, false)

        return isPhone
      } else {
        return false
      }
    }
  })

  const serverScriptTest = makeTest({
    resultIfTrue: 'serverScript',
    testFn (href) {
      const isValid = isValidUrl({ url: href })
      if (isValid) {
        return href.toLowerCase().indexOf('cgi-bin') > -1
      } else {
        return false
      }
    }
  })

  const fileTest = makeTest({
    resultIfTrue: 'file',
    testFn (href) {
      const isValid = isValidUrl({ url: href })
      if (isValid) {
        const isFile = containsRestrictedExtension(href)
        return isFile
      } else {
        return false
      }
    }
  })

  const depthTest = makeTest({
    resultIfTrue: 'pathHasDepth',
    testFn (href) {
      const isValid = isValidUrl({ url: href })
      if (isValid) {
        if (telTest(href) === 'phone' || mailtoTest(href) === 'email') {
          return false
        } else {
          const intermediate = new URL(href)
          const parts = intermediate.pathname.split('/')
          parts.shift()
          return parts.length > 1
        }
      } else {
        return false
      }
    }
  })

  const hasWWWTest = makeTest({
    resultIfTrue: 'www',
    testFn (href) {
      const isValid = isValidUrl({ url: href })
      if (isValid) {
        return href.toLowerCase().indexOf('www.') > -1
      } else {
        return false
      }
    }
  })

  const containesMixedCaseTest = makeTest({
    resultIfTrue: 'containsMixedCase',
    testFn (href) {
      const isValid = isValidUrl({ url: href })
      if (isValid) {
        const versionA = `${href}`
        const versionB = `${href.toLowerCase()}`
        return versionA !== versionB
      } else {
        return false
      }
    }
  })

  const testList = [
    validUrlTest,
    scrapableUrlTest,
    externalUrlTest,
    internalUrlTest,
    httpTest,
    httpsTest,
    mailtoTest,
    telTest,
    fileTest,
    depthTest,
    hasWWWTest,
    containesMixedCaseTest,
    serverScriptTest
  ]

  const classifyHref = href => {
    return testList.reduce((acc, test) => {
      const result = test(href)
      if (result) {
        acc.push(result)
      }
      return acc
    }, [])
  }

  const tagsToFlags = ({ tags }) => {
    return tags.reduce((acc, tagName) => {
      return {
        ...acc,
        [tagName]: true
      }
    }, {})
  }

  return array.map(({ href, ...rest }) => {
    const flags = tagsToFlags({ tags: classifyHref(href) })
    return {
      href,
      ...rest,
      flags
    }
  })
}

const formatScrapedData = ({ data, wasFound, url: pageURL, masterWebsiteURL, canScrape }) => {
  const normalizedUrl = normalizeUrl({ url: pageURL })

  const urlID = urlToUrlID({ url: pageURL })
  const scrapeTimestamp = getTimestamp()
  if (canScrape) {
    const {
      pageTitle,
      pageCanonical,
      pageShortLink,
      contentPageTitle,
      rawLinks
    } = data

    const pageLinksRaw = rawLinks.texts.map((text, index) => {
      const href = rawLinks.hrefs[index]
      const normalizedHref = normalizeUrl({ url: href })
      const urlID = urlToUrlID({ url: href })
      return {
        urlID,
        text,
        normalizedHref,
        href
      }
    })

    const pageLinks = classifyLinks({
      array: pageLinksRaw,
      masterWebsiteURL
    })

    return {
      urlID,
      pageURL,
      pageTitle,
      normalizedUrl,
      pageCanonical,
      pageShortLink,
      contentPageTitle,
      wasFound,
      masterWebsiteURL,
      scrapeTimestamp,
      wasRejected: false,
      pageLinks: [...pageLinks]
    }
  } else {
    return {
      urlID,
      pageURL,
      pageTitle: null,
      normalizedUrl,
      pageCanonical: null,
      pageShortLink: null,
      contentPageTitle: null,
      wasFound: false,
      masterWebsiteURL,
      scrapeTimestamp,
      wasRejected: true,
      pageLinks: []
    }
  }
}

const scrapeUrl = ({ url, masterWebsiteURL, ...rest }) => new Promise((resolve, reject) => {
  const verdict = canScrapeUrl({ testUrl: url, projectUrl: masterWebsiteURL })
  const currentRetryCount = internalRetryCountMap.get(url) || 0
  if (verdict) {
    sendMessage({
      subject: 'x-ray',
      note: 'start',
      payload: {
        url,
        urlID: urlToUrlID({ url })
      }
    })
    xrayUrl({ url }).then(({ error, data }) => {
      sendMessage({
        subject: 'x-ray',
        note: 'end',
        payload: {
          url,
          urlID: urlToUrlID({ url })
        }
      })
      const shouldRetry = checkIfShouldRetry({ error, data }) && currentRetryCount < maxRetryCount
      if (shouldRetry) {
        console.log(`Retry Required: ${url}`)
        sendMessage({
          subject: 'scrape-url',
          note: 'Retry Required',
          payload: {
            url,
            urlID: urlToUrlID({ url })
          }
        })
        resolve(afterDelay({ ms: retryDelay }).then(() => {
          console.log(`Retrying: ${url}. (${currentRetryCount + 1} of ${maxRetryCount})`, { url })
          sendMessage({
            subject: 'scrape-url',
            note: 'Retrying Scrape',
            payload: {
              url,
              urlID: urlToUrlID({ url }),
              currentRetryCount,
              maxRetryCount
            }
          })
          internalRetryCountMap.set(url, currentRetryCount + 1)
          return scrapeUrl({ url, masterWebsiteURL, ...rest })
        }))
      } else {
        const wasFound = checkIfWasFound({ error, data })
        if (wasFound) {
          if (data) {
            resolve(formatScrapedData({ data, wasFound, url, masterWebsiteURL, canScrape: verdict }))
          } else {
            console.error('No Data!?!', { error, data, url })
            sendMessage({
              subject: 'error',
              note: 'No Data!?!',
              payload: {
                error,
                url,
                urlID: urlToUrlID({ url }),
                currentRetryCount,
                maxRetryCount
              }
            })
            reject(new Error(`No Data?!? ${url}`))
          }
        } else {
          resolve(formatScrapedData({ data, wasFound, url, masterWebsiteURL, canScrape: verdict }))
        }
      }
    })
  } else {
    resolve(formatScrapedData({ data: null, wasFound: false, url, masterWebsiteURL, canScrape: verdict }))
  }
})

const BacklogWorkloadSize = 200

let sessionCount = 0

const workOnBacklog = ({ backlogCollection, pageDataCollection, projectName, masterWebsiteURL }) => new Promise(async (resolve, reject) => {
  const backlogCount = await backlogCollection.distinct('urlID', { hasData: false, projectName })
  const workload = await backlogCollection.find({ hasData: false, projectName }).limit(BacklogWorkloadSize).toArray()
  // console.log('')
  // console.log('Current Backlog Size:', backlogCount.length)
  // console.log('')
  let jobCounter = 0

  if (workload.length > 0) {
    // console.log(`[Workload # ${sessionCount + 1}] Started. Job Count: ${workload.length}`)
    sendMessage({
      subject: 'workload',
      note: 'Workload Started',
      payload: {
        sessionNumber: sessionCount + 1,
        sessionSize: workload.length,
        backlogCount: backlogCount.length,
        maxSessionSize: BacklogWorkloadSize
      }
    })
    await Promise.all(workload.map((workloadPayload, workloadIndex) => {
      const { normalizedHref, urlID } = workloadPayload
      sendMessage({
        subject: 'workload-job',
        note: 'Workload Job Started',
        payload: {
          urlID,
          normalizedHref,
          jobStartIndex: jobCounter + 1,
          jobIndex: workloadIndex,
          sessionNumber: sessionCount + 1,
          sessionSize: workload.length
        }
      })
      return processPage({ pageDataCollection, backlogCollection, projectName, masterWebsiteURL, url: normalizedHref }).then(() => {
        return backlogCollection.updateMany({ urlID, projectName }, { $set: { hasData: true } }).then(() => {
          jobCounter++
          // console.log(`[Workload # ${sessionCount + 1}] {${jobCounter} of ${workload.length}} (Job Index ${workloadIndex}) Complete.`)
          sendMessage({
            subject: 'workload-job',
            note: 'Workload Job Complete',
            payload: {
              urlID,
              normalizedHref,
              jobCompleteIndex: jobCounter,
              jobIndex: workloadIndex,
              sessionNumber: sessionCount + 1,
              sessionSize: workload.length
            }
          })
        })
      })
    })).catch(reject)
    sessionCount++
    // console.log(`[Workload # ${sessionCount}] Complete.`)
    sendMessage({
      subject: 'workload',
      note: 'Workload Complete',
      payload: {
        sessionNumber: sessionCount,
        sessionSize: workload.length,
        maxSessionSize: BacklogWorkloadSize
      }
    })
    await afterDelay({ ms: 1000 }).then(() => {
      resolve(workOnBacklog({ backlogCollection, pageDataCollection, projectName, masterWebsiteURL }))
    })
  } else {
    console.log('All Done.')
    sendMessage({
      subject: 'workload',
      note: 'All Done.',
      payload: {
        sessionNumber: sessionCount,
        sessionSize: workload.length
      }
    })
    resolve()
  }
})

const isInCollection = ({ urlID, collection, projectName }) => collection.find({ urlID, projectName }).toArray().then((results) => {
  if (results.length >= 1) {
    return true
  } else {
    return false
  }
})

const getItemsNotInPageData = ({ array, pageDataCollection, projectName }) => new Promise((resolve, reject) => {
  Promise.all(array.map(({ urlID }) => {
    return isInCollection({ urlID, collection: pageDataCollection, projectName })
  })).then(results => {
    const filteredArray = array.filter((item, index) => !results[index])
    resolve(filteredArray)
  })
})

const getItemsNotInBacklog = ({ array, backlogCollection, projectName }) => new Promise((resolve, reject) => {
  Promise.all(array.map(({ urlID }) => {
    return isInCollection({ urlID, collection: backlogCollection, projectName })
  })).then(results => {
    const filteredArray = array.filter((item, index) => !results[index])
    resolve(filteredArray)
  })
})

const splitPathIntoSeperateURLs = path => {
  const rawUrl = new URL(path)
  const { origin, href, pathname } = rawUrl
  const pathParts = pathname.split('/')
  pathParts.shift()

  const outputBits = []

  let composer = `${origin}`

  for (const part of pathParts) {
    composer = `${composer}/${part}`
    outputBits.push(`${composer}`)
  }

  const uniqueSet = new Set()

  const output = [
    href,
    ...outputBits
  ]

  return output.filter(url => {
    if (uniqueSet.has(url)) {
      return false
    } else {
      uniqueSet.add(url)
      return true
    }
  })
}

const deduplicateViaUrlID = array => {
  const workingSet = new Set()
  return array.filter(({ urlID }) => {
    if (workingSet.has(urlID)) {
      return false
    } else {
      workingSet.add(urlID)
      return true
    }
  })
}

const processPage = async ({
  pageDataCollection,
  backlogCollection,
  url,
  projectName,
  masterWebsiteURL
}) => {
  let backlogAdditons = 0
  const urlID = urlToUrlID({ url })
  try {
    const existingData = await pageDataCollection.find({ urlID, projectName }).toArray()
    if (existingData.length === 0) {
      const rootWebpageData = await scrapeUrl({ url, masterWebsiteURL })
      if (rootWebpageData) {
        const wrappedPayload = { ...rootWebpageData, projectName }
        await pageDataCollection.insertOne({ ...wrappedPayload })
        if (Array.isArray(rootWebpageData.pageLinks)) {
          const scrapableUrlsRaw = rootWebpageData.pageLinks.filter(({ flags }) => flags.scrapable && flags.valid && !flags.phone)
          const uniqueScrapableUrlsRaw = deduplicateViaUrlID(scrapableUrlsRaw)
          const notInBacklog = await getItemsNotInBacklog({ array: uniqueScrapableUrlsRaw, backlogCollection, projectName })
          const addableItems = await getItemsNotInPageData({ array: notInBacklog, pageDataCollection, projectName })
          await Promise.all(addableItems.map(async (linkData) => {
            const { urlID, flags, href } = linkData
            if (flags.pathHasDepth) {
              const urls = splitPathIntoSeperateURLs(href)
              const urlPackage = urls.map(url => {
                const urlID = urlToUrlID({ url })
                const href = url
                return { urlID, href }
              })
              const notInBacklog = await getItemsNotInBacklog({ array: urlPackage, backlogCollection, projectName })
              const addableItems = await getItemsNotInPageData({ array: notInBacklog, pageDataCollection, projectName })
              await Promise.all(addableItems.map(({ urlID, href }) => {
                return backlogCollection.find({ urlID, projectName }).toArray().then(async (results) => {
                  if (results.length === 0) {
                    const normalizedHref = normalizeUrl({ url: href })
                    return backlogCollection.insertOne({ href, urlID, text: null, flags, normalizedHref, projectName, hasData: false }).then(() => {
                      // console.log(`+ ${href}`)
                      backlogAdditons++
                    })
                  }
                })
              }))
            } else {
              return backlogCollection.find({ urlID, projectName }).toArray().then(results => {
                if (results.length === 0) {
                  return backlogCollection.insertOne({ ...linkData, projectName, hasData: false }).then(() => {
                    // console.log(`+ ${linkData.href}`)
                    backlogAdditons++
                  })
                }
              })
            }
          }))
        } else {
          console.log('Pagelinks is not an array?!?', rootWebpageData)
        }
      } else {
        console.error(`No Webpage Data?!?`, rootWebpageData)
      }
    } else {
      // console.log('Updating', url)
      await backlogCollection.updateMany({ urlID, projectName }, { $set: { hasData: true } })
    }
  } catch (error) {
    throw error
  }
  if (backlogAdditons > 0) {
    // console.log(`+ ${backlogAdditons} to backlog`)
    sendMessage({
      subject: 'backlog',
      note: 'Adding To Backlog',
      payload: {
        count: backlogAdditons
      }
    })
  }
}

const scrapeWebsite = async ({ url: masterWebsiteURL, projectName }) => {
  const client = getMongoClient()
  try {
    await client.connect()
    const db = client.db(mongoDatabaseName)
    const pageDataCollection = db.collection('pageData')
    const backlogCollection = db.collection('backlog')
    console.log('+ Connected to MongoDB')

    await processPage({ url: masterWebsiteURL, backlogCollection, pageDataCollection, projectName, masterWebsiteURL })

    await workOnBacklog({ backlogCollection, pageDataCollection, projectName, masterWebsiteURL })
  } catch (error) {
    throw error
  }
  client.close()
}

const subscribeToAllMessages = callback => {
  if (messageSubscriptions.has(callback) === false) {
    if (typeof callback === 'function') {
      messageSubscriptions.add(callback)
    }
  }
  return () => {
    if (messageSubscriptions.has(callback)) {
      messageSubscriptions.delete(callback)
    }
  }
}

module.exports = {
  scrapeWebsite,
  subscribeToAllMessages
}
