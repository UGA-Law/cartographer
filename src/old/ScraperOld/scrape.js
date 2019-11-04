const Xray = require('x-ray')
const cup = require('crawler-url-parser')
const x = Xray()
const normalizeURL = require('normalize-url')

const { canBeScraped } = require('./utilities.js')

const dumbDatabaseObject = {}

const validationMaker = (testFn) => (hostPageUrl, linkHref) => {
  if (hostPageUrl && linkHref) {
    const convertedHostUrl = cup.parse(hostPageUrl)
    const convertedLinkHref = cup.parse(linkHref)
    if (convertedHostUrl && convertedLinkHref) {
      return testFn({
        host: convertedHostUrl,
        link: convertedLinkHref
      })
    } else {
      return false
    }
  } else {
    return false
  }
}

const checkIfIsScrapableUrl = validationMaker(({ link: { url } }) => canBeScraped({ url }))
const checkIfIsSameDomain = validationMaker(({ host, link }) => host.domain === link.domain)
const checkIfIsSameHost = validationMaker(({ host, link }) => host.host === link.host)
const checkIfIsSameSubdomain = validationMaker(({ host, link }) => host.subdomain === link.subdomain)

const scrape = ({ url }) => new Promise((resolve, reject) => {
  x(url,
    {
      pageTitle: 'title',
      linkTitles: ['a'],
      linkHrefs: ['a@href']
    }
  )((error, result) => {
    if (error) {
      reject(error)
    } else {
      const normalizedHostHref = normalizeURL(url)
      const { pageTitle, linkTitles, linkHrefs } = result
      const pageLinks = linkHrefs.map((href, index) => {
        const label = linkTitles[index]

        const isSameHost = checkIfIsSameHost(url, href)
        const isSameDomain = checkIfIsSameDomain(url, href)
        const isSameSubdomain = checkIfIsSameSubdomain(url, href)
        const isScrapable = checkIfIsScrapableUrl(url, href)
        let normalizedHref = ''

        if (isScrapable) {
          normalizedHref = normalizeURL(href)
        }

        return {
          // db: dumbDatabaseObject[normalizedHostHref],
          normalizedHref,
          normalizedHostHref,
          href,
          label,
          hostHref: url,
          isScrapable,
          isSameHost,
          isSameDomain,
          isSameSubdomain
        }
      })

      if (!dumbDatabaseObject[normalizedHostHref]) {
        dumbDatabaseObject[normalizedHostHref] = {
          normalizedHostHref,
          pageLinks,
          pageTitle,
          count: 0
        }
      } else {
        dumbDatabaseObject[normalizedHostHref] = {
          ...dumbDatabaseObject[normalizedHostHref],
          count: dumbDatabaseObject[normalizedHostHref].count + 1
        }
      }

      resolve({ pageLinks, pageTitle })
    }
  })
})

module.exports = { scrape }
