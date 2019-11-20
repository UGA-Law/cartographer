
const cup = require('crawler-url-parser')
const path = require('path')
const { isUri } = require('valid-url')
const { restrictedExtensionSet } = require('./restrictedExtensions.js')
const moment = require('moment')
const vendorNormalizeUrl = require('normalize-url')
const md5 = require('md5')

const isValidUrl = ({ url }) => {
  try {
    const demoUrl = new URL(url)
    const verdict = isUri(url)
    return typeof verdict === 'string' && verdict.length > 0
  } catch (error) {
    return false
  }
}

// const containsRestrictedExtension = test => restrictedExtensions.indexOf(path.extname(test).toLowerCase()) > -1
const containsRestrictedExtension = test => restrictedExtensionSet.has(path.extname(test).toLowerCase())

const canScrapeUrl = ({ testUrl, projectUrl }) => {
  if (isValidUrl({ url: testUrl }) === false) {
    // console.log('ERROR: Url failed internal validity test.')
    return false
  }

  if (!testUrl) {
    // console.log('ERROR: Url Is Falsey', testUrl)
    return false
  } else if (typeof testUrl !== 'string') { // we only want strings
    // console.log('ERROR: Url is not a string.')
    return false
  }

  if (testUrl.indexOf('tel:') > -1) { // skip phone number links
    // console.log('ERROR: Url is a phone link')
    return false
  }

  if (testUrl.indexOf('cgi-bin') > -1) {
    return false // skip server scripts
  }

  if (containsRestrictedExtension(testUrl) === true) { // skip files
    // console.log('ERROR: Url is a file link.')
    return false
  }

  if (isInternalUrl({ url: testUrl, referenceUrl: projectUrl })) {
    return true
  } else {
    // console.error('ERROR: Url is an external link.')
    return false
  }
}

const isExternalUrl = ({ url, referenceUrl }) => {
  if (isValidUrl({ url })) {
    const testUrl = cup.parse(url)
    const refUrl = cup.parse(referenceUrl)
    if (testUrl && refUrl) {
      const differentSubdomain = testUrl.subdomain !== refUrl.subdomain
      const differentDomain = testUrl.domain !== refUrl.domain
      return differentDomain || differentSubdomain
    } else {
      return false
    }
  } else {
    return false
  }
}

const isInternalUrl = ({ url, referenceUrl }) => {
  if (isValidUrl({ url })) {
    const testUrl = cup.parse(url)
    const refUrl = cup.parse(referenceUrl)
    if (testUrl && refUrl) {
      const sameSubdomain = testUrl.subdomain === refUrl.subdomain
      const sameDomain = testUrl.domain === refUrl.domain
      return sameDomain && sameSubdomain
    } else {
      return false
    }
  } else {
    return false
  }
}

const afterDelay = ({ ms }) => new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve()
  }, ms)
})

const repeat = (fn, count) => {
  for (let counter = 0; counter < count; counter++) {
    fn({
      total: count,
      current: counter
    })
  }
}

const isMailtoUrl = ({ url }) => {
  const isValid = isValidUrl({ url })
  if (isValid) {
    return url.toLowerCase().indexOf('mailto:') >= 0
  } else {
    return false
  }
}

const makeTest = ({
  resultIfTrue = true,
  resultIfFalse = false,
  testFn
}) => (input) => {
  const verdict = testFn(input)
  if (verdict) {
    return resultIfTrue
  } else {
    return resultIfFalse
  }
}

const getTimestamp = () => moment().toISOString()

const normalizeUrl = ({ url }) => {
  if (isValidUrl({ url }) && url.indexOf('tel:') === -1 && url.indexOf('mailto:') === -1) {
    try {
      return vendorNormalizeUrl(url, {
        stripAuthentication: true,
        stripHash: true,
        forceHttps: true,
        removeQueryParameters: [
          'tid',
          /tid\[\]/,
          /tid%5b%5d/,
          /tid\[.+\]/,
          /tid%5b.+%5d/, // same as above, but more robust
          'mini'
        ]
      }).toLowerCase()
    } catch (error) {
      console.error(error)
      return (`${url}`).toLowerCase()
    }
  } else {
    return (`${url}`).toLowerCase()
  }
}

const urlToUrlID = ({ url }) => {
  if (url) {
    return md5(`${normalizeUrl({ url })}`)
  } else {
    return 'NULL'
  }
}

module.exports = {
  canScrapeUrl,
  afterDelay,
  repeat,
  makeTest,
  isValidUrl,
  isInternalUrl,
  isExternalUrl,
  isMailtoUrl,
  containsRestrictedExtension,
  getTimestamp,
  normalizeUrl,
  urlToUrlID
}
