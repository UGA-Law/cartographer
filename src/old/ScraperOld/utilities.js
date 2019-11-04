const cup = require('crawler-url-parser')

const canBeScraped = ({ url }) => {
  const urlBits = cup.parse(url)
  if (urlBits) {
    const { protocol } = urlBits
    if (protocol === 'http:' || protocol === 'https:') {
      return true
    } else {
      return false
    }
  } else {
    return false
  }
}

module.exports = {
  canBeScraped
}
