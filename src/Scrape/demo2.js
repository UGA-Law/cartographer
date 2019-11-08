const { scrapeWebsite } = require('./scrape2')
const moment = require('moment')

const targetSite = `https://www.law.uga.edu`

const startMoment = moment()
scrapeWebsite({ url: targetSite }).then(() => {
  const endMoment = moment()
  console.log(`-- -- --`)
  console.log(`-- Scrape Complete --`)
  console.log(`-- Website: ${targetSite}`)
  console.log(`-- Time taken to scrape: ${startMoment.from(endMoment, true)}`)
  console.log(`-- -- --`)
}).catch(error => console.error(error))
