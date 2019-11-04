const { scrapeWebsite } = require('./scrape.js')
const websiteUrl = 'http://www.law.uga.edu/'
scrapeWebsite({ url: websiteUrl }).then(result => {
  console.log('Complete', result)
}).catch(error => {
  console.error(error)
})
