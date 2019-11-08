const Xray = require('x-ray')
const moment = require('moment')

const delayMin = 10
const delayMax = 500
const throttleCount = 10
const throttleRate = '1s'

const projectName = 'scrape-law-school-website'

const x = Xray().delay(delayMin, delayMax).throttle(throttleCount, throttleRate)
const { normalizeUrl, getScrapableLinks } = require('./utilities.js')
const { setupScrapeCollection, crudifyCollection } = require('./scrapeDB.js')

const getTimestamp = () => moment().toISOString()

const pad = ({ max, current, pad = ' ' }) => {
  const maxDigitCount = (`${max}`).length
  let paddedValue = `${current}`
  while (paddedValue.length < maxDigitCount) {
    paddedValue = `${pad}${paddedValue}`
  }
  return `( ${paddedValue} / ${max} )`
}

const xrayUrl = ({ url: pageUrl }) => new Promise((resolve, reject) => {
  if (pageUrl) {
    x(pageUrl, {
      pageTitle: 'title',
      linkTexts: ['a'],
      linkHrefs: ['a@href']
    }).then(rawPageData => {
      const { pageTitle, linkTexts, linkHrefs } = rawPageData
      const scrapeTimestamp = getTimestamp()
      const pageLinksRaw = linkTexts.map((text, index) => {
        const href = linkHrefs[index]
        return {
          text,
          href
        }
      })
      const scrapeLinks = getScrapableLinks({ pageLinks: pageLinksRaw, pageUrl })
      const payload = {
        pageTitle,
        pageUrl,
        pageLinksRaw,
        scrapeTimestamp,
        scrapeLinks
      }
      resolve(payload)
    }).catch(error => {
      if (error.code === 'ECONNRESET') {
        console.log('--- Connection Reset ---')
        setTimeout(() => {
          console.log('💫  ', pageUrl)
          resolve(xrayUrl({ url: pageUrl }))
        }, 2000)
      } else {
        reject(error)
      }
    })
  } else {
    reject(new Error(`Page URL is not usable ${pageUrl}`))
  }
})

const scrapeWebsite = ({ url }) => new Promise((resolve, reject) => {
  const masterResolve = resolve
  const masterReject = reject

  const backlogCollectionRawPromise = setupScrapeCollection({ projectName, collectionName: 'backlog' })
  const webPageDataCollectionRawPromise = setupScrapeCollection({ projectName, collectionName: 'webpages' })

  Promise.all([ backlogCollectionRawPromise, webPageDataCollectionRawPromise ])
    .then(([ backlogCollectionRaw, webpageDataCollectionRaw ]) => {
      const crudBacklog = crudifyCollection({ collection: backlogCollectionRaw })
      const crudWebPageData = crudifyCollection({ collection: webpageDataCollectionRaw })

      const getAllUrlsThatHaveNoData = ({ limit = 1000 }) => crudBacklog.readMany({ lookup: { hasBeenScraped: false }, limit })

      const addScrapableUrlsToBacklog = ({ scrapeLinks }) => {
        const addedTimestamp = getTimestamp()
        let count = 0
        return getOnlyNewUrls({ scrapeLinks }).then(results => {
          return Promise.all(results.map(({ href, text }) => {
            return crudBacklog.addIfNew({
              lookup: { url: normalizeUrl(href) },
              document: { url: normalizeUrl(href), text, hasBeenScraped: false, addedTimestamp }
            }).then(() => {
              count++
            })
          })).then(() => {
            if (count !== 0) {
              console.log('New URLs Added Count: ', count)
            }
          })
        })
      }

      const addScrapedPageData = ({ data }) => {
        const { pageTitle, pageUrl, pageLinksRaw, scrapeTimestamp, scrapeLinks } = data
        const document = { url, scrapeLinks, pageTitle, scrapeTimestamp, pageLinksRaw, pageUrl, hasBeenScraped: true }
        return crudWebPageData.add({ document })
      }

      const getOnlyNewUrls = ({ scrapeLinks }) => Promise.all(scrapeLinks.map(({ href }) => {
        return crudBacklog.has({ lookup: { url: normalizeUrl(href) } })
      })).then(results => {
        const newLinks = scrapeLinks.filter((_value, index) => {
          const alreadyExists = results[index]
          if (alreadyExists) {
            return false // is old
          } else {
            return true // is new
          }
        })
        return Promise.resolve(newLinks)
      })

      const workOnBacklog = () => {
        let counter = 0
        const startMoment = moment()
        console.log('[Working on Backlog]')
        return getAllUrlsThatHaveNoData({ limit: 1000 }).then(resultsArray => {
          console.log('Batch Size:', resultsArray.length)
          if (resultsArray.length > 0) {
            return Promise.all(resultsArray.map(({ url }) => {
              return xrayUrl({ url: normalizeUrl(url) }).then((data) => {
                const { scrapeLinks } = data
                return crudBacklog.update(
                  {
                    lookup: { url: normalizeUrl(url) },
                    data: { hasBeenScraped: true }
                  }
                ).then(() => {
                  counter++
                  const currentPlace = pad({ max: resultsArray.length, current: counter })
                  console.log('🎁 ', `${currentPlace}`, url)
                  return addScrapedPageData({ data }).then(() => {
                    return addScrapableUrlsToBacklog({ scrapeLinks })
                  })
                })
              })
            })).then(() => {
              const endMoment = moment()
              const timeTaken = startMoment.from(endMoment, true)
              console.log('🏆 Backlog Session Complete. Updated Item Count:', counter)
              console.log(` Time Taken: ${timeTaken}`)
              console.log(' --- 10 second break ---')
              setTimeout(() => {
                console.log(' --- Break Over, Continuing Work on Backlog ---')
                workOnBacklog()
              }, 10000)
            })
          } else {
            masterResolve('Done')
          }
        })
      }

      return crudWebPageData.has({ lookup: { url: normalizeUrl(url) } }).then(verdict => {
        if (verdict === false) {
          return xrayUrl({ url: normalizeUrl(url) }).then((data) => {
            console.log('🎁', url)
            const { scrapeLinks } = data
            return addScrapedPageData({ data })
              .then(() => addScrapableUrlsToBacklog({ scrapeLinks }))
              .then(() => workOnBacklog())
          })
        } else {
          return workOnBacklog()
        }
      })
    }).catch(masterReject)
})

module.exports = { scrapeWebsite }
