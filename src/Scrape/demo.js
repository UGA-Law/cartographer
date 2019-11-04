const { scrapeWebsite } = require('./scrape')

const targetSite = `https://www.law.uga.edu`

scrapeWebsite({ url: targetSite }).then(data => {
  console.log(`-- Website Scrape ${targetSite} Complete --`)
}).catch(error => console.error(error))
