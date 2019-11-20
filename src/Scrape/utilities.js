const vendorNormalizeUrl = require('normalize-url')
const cup = require('crawler-url-parser')
const path = require('path')

const canScrapeUrl = ({ testUrl, projectUrl }) => {
  if (!testUrl) {
    return false
  } else if (typeof testUrl !== 'string') { // we only want strings
    return false
  }

  if (testUrl.indexOf('tel:') > -1) { // skip phone number links
    console.log('Skipping Tel: url')
    return false
  }

  if (path.extname(testUrl) !== '') { // skip files
    return false
  }

  const testUrlAnatomy = cup.parse(testUrl)
  const projectUrlAnatomy = cup.parse(projectUrl)

  if (testUrlAnatomy && projectUrlAnatomy) {
    const sameSubdomain = testUrlAnatomy.subdomain === projectUrlAnatomy.subdomain
    const sameDomain = testUrlAnatomy.domain === projectUrlAnatomy.domain
    if (sameSubdomain && sameDomain) {
      return true
    } else {
      return false
    }
  } else {
    return false
  }
}

const normalizeUrl = url => {
  if (url && url.indexOf('tel:') === -1) {
    return vendorNormalizeUrl(url, {
      stripHash: true,
      stripAuthentication: true,
      removeTrailingSlash: true
    }).toLowerCase()
  } else {
    return url
  }
}

const getScrapableLinks = ({ pageLinks = [], pageUrl }) => {
  return pageLinks.filter(({ href }) => {
    return canScrapeUrl({ testUrl: href, projectUrl: pageUrl })
  }).map(({ href: rawHref, text }) => {
    const linkParts = cup.parse(rawHref, pageUrl)
    const { subdomain, domain, path } = linkParts
    const href = `https://${subdomain ? `${subdomain}.` : ''}${domain}${path}`.toLowerCase()
    return { href, rawHref, text, ...linkParts }
  })
}

const extractUrlParts = url => {
  const rawUrl = new URL(url)
  const parts = rawUrl.basename.split('/').map(name => `/${name}`)
  console.log(parts)
  return parts
}

const timeout = ms => new Promise((resolve, reject) => {
  setTimeout(resolve, ms)
})

module.exports = {
  normalizeUrl,
  getScrapableLinks,
  timeout
}
