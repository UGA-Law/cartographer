const { dispatchMaker } = require('../Utilities/events.js')
const { canBeScraped } = require('./utilities.js.js')
const { requestAScrape } = require('./clientScrapeAPI.js.js')

const dispatchPageScrapeBegin = dispatchMaker('pageScrapeBegin')
const dispatchPageScrapeEnd = dispatchMaker('pageScrapeEnd')

let canScrape = true

const cancelScrape = () => {
  canScrape = false
}

const scrapeWebsite = ({ url }) => new Promise((resolve, reject) => {
  if (canBeScraped({ url }) === false) {
    reject(new Error(`Cannot Scrape url: ${url}`))
  } else {
    dispatchPageScrapeBegin({ url, isRoot: true })
    if (canScrape === true) {
      requestAScrape({ url }).then(result => {
        if (canScrape === true) {
          dispatchPageScrapeEnd({ url, isRoot: true, result })
          console.log({ result })
        }
      })
    }
  }
})

module.exports = {
  scrapeWebsite,
  cancelScrape
}
