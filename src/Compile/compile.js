const { getMongoClient } = require('../Utilities/getMongoClient.js')
const { mongoDatabaseName, projectName: configuredProjectName } = require('../../common/settings.js')
const cuid = require('cuid')

const compile = ({ projectName: specifiedProjectName }) => new Promise((resolve, reject) => {
  const projectName = specifiedProjectName || configuredProjectName
  const client = getMongoClient()
  client.connect({ projectName }).then(() => {
    console.log('Connected To Mongo.')
    const db = client.db(mongoDatabaseName)
    console.log(`Using Database: ${mongoDatabaseName}`)
    const collectionName = 'pageData'
    console.log(`Using Collection: ${collectionName}`)
    console.log(`Beginning Compilation of Project: ${projectName}`)
    db.collection(collectionName).find({ projectName, wasFound: true }).toArray().then(results => {
      const dataSubset = results.map(({
        pageURL,
        urlID,
        pageTitle,
        wasRestricted,
        pageLinks
      }) => {
        return {
          urlID,
          pageURL,
          pageLinks,
          pageTitle,
          wasRestricted
        }
      })

      const output = {}
      console.log('Building URL tree.')
      console.time('Build Time')
      dataSubset.forEach(({
        urlID,
        pageURL,
        pageLinks,
        pageTitle,
        wasRestricted
      }) => {
        const parsedUrl = new URL(pageURL)
        const {
          href,
          pathname
        } = parsedUrl
        const parts = pathname.split('/')
        parts.shift() // remove beginning slash from the path.
        let parentItem = null
        parts.forEach((part, index, array) => {
          const depth = index
          const maxDepth = array.length - 1
          const item = {
            id: cuid(),
            part,
            children: []
          }
          if (depth === maxDepth) {
            item.urlID = urlID
            item.title = pageTitle
            item.href = href
            item.wasRestricted = wasRestricted
            item.links = pageLinks.map(link => {
              const { urlID, text, href } = link
              return {
                urlID, text, href
              }
            })
          }
          if (depth === 0) {
            if (!output[part]) {
              output[part] = item
              parentItem = item
            } else {
              parentItem = output[part]
            }
          } else {
            if (parentItem) {
              const existingChildPart = parentItem.children.find(child => child.part === part)
              if (existingChildPart) {
                parentItem = existingChildPart
              } else {
                parentItem.children.push(item)
                parentItem = item
              }
            } else {
              console.log('No Previous Item', part)
            }
          }
        })
      })
      const formattedOutput = Object.keys(output).map(key => output[key])
      console.timeEnd('Build Time')
      resolve(formattedOutput)
      client.close()
    }).catch(error => {
      reject(error)
      client.close()
    })
  }).catch(error => {
    client.close()
    reject(error)
  })
})

module.exports = { compile }
