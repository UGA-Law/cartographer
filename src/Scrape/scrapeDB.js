const { MongoClient } = require('mongodb')

const host = 'localhost'
const port = 27017

const connectionString = `mongodb://${host}:${port}`

const clientList = new Map()

const getClient = ({ clientName }) => new Promise((resolve, reject) => {
  if (clientList.has(clientName)) {
    resolve(clientList.get(clientName))
  } else {
    const mongoClientOptions = { useUnifiedTopology: true }
    MongoClient.connect(connectionString, mongoClientOptions, (error, client) => {
      if (error) {
        reject(error)
      } else {
        clientList.set(clientName, client)
        resolve(client)
      }
    })
  }
})

const getDB = ({ dbName, clientName }) => getClient({ clientName }).then(client => client.db(dbName))

const collectionList = new Map()

const setupScrapeCollection = ({ projectName, collectionName }) => new Promise((resolve, reject) => {
  const simplifiedWebsite = projectName.replace('.', '_')
  const dbName = `scrapeTargetDatabase::${simplifiedWebsite}`
  const clientName = `client::${simplifiedWebsite}`
  const collectionMemo = `${dbName}${collectionName}`
  if (collectionList.has(collectionMemo)) {
    resolve(collectionList.get(collectionMemo))
  } else {
    getDB({ dbName, clientName }).then(db => {
      const collection = db.collection(collectionName)
      collectionList.set(collectionMemo, collection)
      resolve(collection)
    })
  }
})

const lookupItemWithinCollection = ({ collection, lookup }) => new Promise((resolve, reject) => {
  if (collection) {
    collection.findOne(lookup, (error, document) => {
      if (error) {
        reject(error)
      } else {
        resolve(document)
      }
    })
  } else {
    reject(new Error('Collection is not defined'))
  }
})

const addToCollection = ({ collection, document }) => new Promise((resolve, reject) => {
  if (collection) {
    collection.insertOne(document, (error, data) => {
      if (error) {
        reject(error)
      } else {
        resolve(data)
      }
    })
  } else {
    reject(new Error('Collection is not defined'))
  }
})

const isWithinCollection = ({ collection, lookup }) => lookupItemWithinCollection({ collection, lookup }).then(doc => (doc != null))

const updateItemWithinCollection = ({ collection, lookup, data }) => new Promise((resolve, reject) => {
  collection.updateOne(lookup, { $set: data }, (error, result) => {
    if (error) {
      reject(error)
    } else {
      resolve(result)
    }
  })
})

const removeItemWithinCollection = ({ collection, lookup }) => new Promise((resolve, reject) => {
  collection.deleteOne(lookup, (error, result) => {
    if (error) {
      reject(error)
    } else {
      resolve(result)
    }
  })
})

const readAllFromCollection = ({ collection }) => new Promise((resolve, reject) => {
  collection.find({}).toArray((error, documents) => {
    if (error) {
      reject(error)
    } else {
      resolve(documents)
    }
  })
})

const readManyWithinCollection = ({ collection, lookup }) => new Promise((resolve, reject) => {
  collection.find(lookup).toArray(
    (error, results) => {
      if (error) {
        reject(error)
      } else {
        resolve(results)
      }
    }
  )
})

const crudifyCollection = ({ collection }) => {
  const create = ({ document }) => addToCollection({ collection, document })
  const update = ({ lookup, data }) => updateItemWithinCollection({ collection, lookup, data })
  const remove = ({ lookup }) => removeItemWithinCollection({ collection, lookup })
  const readOne = ({ lookup }) => lookupItemWithinCollection({ collection, lookup })
  const readMany = ({ lookup }) => readManyWithinCollection({ collection, lookup })
  const has = ({ lookup }) => isWithinCollection({ collection, lookup })
  const readAll = ({ skip = 0, count = 100 }) => readAllFromCollection({ collection, skip, count })
  const add = create
  const addIfNew = ({ lookup, document }) => new Promise((resolve, reject) => {
    has({ lookup }).then(verdict => {
      if (verdict === false) {
        create({ document }).then(resolve)
      } else {
        resolve(null)
      }
    }).catch(reject)
  })
  return (
    {
      add,
      addIfNew,
      has,
      create,
      update,
      remove,
      readOne,
      readMany,
      readAll
    }
  )
}

module.exports = {
  setupScrapeCollection,
  isWithinCollection,
  addToCollection,
  crudifyCollection,
  lookupItemWithinCollection,
  updateItemWithinCollection,
  removeItemWithinCollection
}
