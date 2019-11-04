const vendorNormalizeUrl = require('normalize-url')
const cup = require('crawler-url-parser')
const path = require('path')

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
  const uniqueSet = new Set()
  return pageLinks.filter(({ href }) => {
    if (href) {
      if (uniqueSet.has(href)) {
        return false
      } else {
        uniqueSet.add(href)
      }
      if (href.indexOf('tel:') >= 0) {
        return false
      }
      if (path.extname(href) !== '') {
        return false
      }
      // if (href.indexOf('/calling-all-papers/') >= 0) {
      //   console.log('Skipping a /calling-all-papers/ related url.')
      //   return false
      // }
      const pageUrlParts = cup.parse(pageUrl)
      const hrefParts = cup.parse(href)
      if (hrefParts && pageUrlParts) {
        const sameSubdomain = hrefParts.subdomain === pageUrlParts.subdomain
        const sameDomain = hrefParts.domain === pageUrlParts.domain
        if (sameDomain && sameSubdomain) {
          return true
        } else {
          return false
        }
      } else {
        return false
      }
    } else {
      return false
    }
  })
}

module.exports = {
  normalizeUrl,
  getScrapableLinks
}
