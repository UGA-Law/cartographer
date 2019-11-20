const { getMongoClient } = require('../Utilities/getMongoClient.js')
const { mongoDatabaseName } = require('../../common/settings.js')
const cuid = require('cuid')

const compile = ({ projectName }) => new Promise((resolve, reject) => {
  const client = getMongoClient()
  client.connect({ projectName }).then(() => {
    console.log('Connected To Mongo.')
    const db = client.db(mongoDatabaseName)
    db.collection('pageData').find({}).toArray().then(results => {
      const urlMap = {}
      let activeUrlMapPortion = {}
      for (let index = 0; index < results.length; index++) {
        const result = results[index]
        const { pageUrl, pageTitle } = result
        activeUrlMapPortion = urlMap // reset to the root.

        const pageUrlParts = new URL(pageUrl).pathname.split('/')
        pageUrlParts.shift()

        for (let partIndex = 0; partIndex < pageUrlParts.length; partIndex++) {
          const pageUrlPart = pageUrlParts[partIndex]
          const isLastPart = partIndex === pageUrlParts.length - 1
          if (activeUrlMapPortion[pageUrlPart]) {
            activeUrlMapPortion = activeUrlMapPortion[pageUrlPart].__childPages
          } else {
            activeUrlMapPortion[pageUrlPart] = {
              urlPart: pageUrlPart,
              __childPages: {}
            }
            if (isLastPart) {
              activeUrlMapPortion[pageUrlPart] = {
                urlPart: pageUrlPart,
                __pageData: {
                  id: cuid(),
                  pageUrl,
                  pageTitle
                },
                __childPages: {}
              }
            } else {
              activeUrlMapPortion = activeUrlMapPortion[pageUrlPart].__childPages
            }
          }
        }
      }
      client.close()
      resolve(urlMap)
    }).catch(error => {
      client.close()
      reject(error)
    })
  }).catch(error => {
    client.close()
    reject(error)
  })
})

module.exports = { compile }
