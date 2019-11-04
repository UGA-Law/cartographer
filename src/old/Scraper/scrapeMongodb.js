const { MongoClient } = require('mongodb')

const host = 'localhost'
const port = 27017

const connectionString = `mongodb://${host}:${port}`

let internalClient = null
const databaseInstances = new Map()
const databaseCollections = new Map()

const getClient = () => new Promise((resolve, reject) => {
  if (internalClient) {
    resolve(internalClient)
  } else {
    MongoClient.connect(connectionString, (error, client) => {
      if (error) {
        console.log('Mongo Connection Error')
        reject(error)
      } else {
        console.log('Mongo Connection Success!')
        internalClient = client
        resolve(internalClient)
      }
    })
  }
})

const getDB = ({ dbName }) => new Promise((resolve, reject) => {
  if (databaseInstances.has(dbName)) {
    resolve(databaseInstances.get(dbName))
  } else {
    getClient().then(client => {
      const db = client.db(dbName)
      databaseInstances.set(dbName, db)
      console.log('Sending fresh DB instance', { dbName })
      resolve(db)
    }).catch(reject)
  }
})

const getCollection = ({ collectionName, dbName }) => new Promise((resolve, reject) => {
  const memo = `${dbName}___${collectionName}`
  if (databaseCollections.has(memo)) {
    resolve(databaseCollections.get(memo))
  } else {
    getDB({ dbName }).then(db => {
      const collection = db.collection(collectionName)
      databaseCollections.set(memo, collection)
      resolve(collection)
    })
  }
})

module.exports = {
  getClient,
  getCollection,
  getDB
}
