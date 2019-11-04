/* globals expect test */
const {
  scrapePage,
  scrapeWebsite
} = require('./scrape.js')

const websiteUrl = 'https://www.google.com'

test.skip(`'scrapePage' works with: ${websiteUrl}`, () => {
  return scrapePage({
    url: websiteUrl
  }).then(result => {
    const { pageUrl, pageTitle, pageLinks } = result
    expect(pageTitle).toBeDefined()
    expect(pageUrl).toBeDefined()
    expect(pageLinks).toBeDefined()
    expect(Array.isArray(pageLinks)).toBeTruthy()
  })
})

test(`'scrapeWebsite' works for url: ${websiteUrl}'`, () => {
  return scrapeWebsite({ url: websiteUrl }).then(result => {
    console.log(result)
    expect(result).toBeDefined()
  })
})
