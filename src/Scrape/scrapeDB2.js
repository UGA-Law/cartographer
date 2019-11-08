const { MongoClient } = require('mongodb')

const host = 'localhost'
const port = 27017

const connectionString = `mongodb://${host}:${port}`

const clients = new Map()
const getClient = async ({ clientName }) => {
  if (clients.has(clientName)) {
    return clients.get(clientName)
  } else {
    const client = MongoClient.connect(connectionString)
    clients.set(clientName, client)
    return client
  }
}

const databases = new Map()
const getDatabase = async ({ dbName, clientName, dbOptions }) => {
  const memo = `${clientName} ${dbName}`
  if (databases.has(memo)) {
    return databases.get(memo)
  } else {
    const client = await getClient({ clientName })
    let db = null
    if (dbOptions) {
      db = client.db(dbName, dbOptions)
    } else {
      db = client.db(dbName)
    }
    if (db) {
      databases.set(memo, db)
    }
    return db
  }
}

const collections = new Map()

const collectionDecorator = ({ collection }) => {
  const setupCallback = ({ resolve, reject }) => (error, result) => {
    if (error) {
      reject(error)
    } else {
      resolve(result)
    }
  }

  const wrappedFindOne = ({ filter, projection = {} }) => new Promise((resolve, reject) => {
    collection.findOne(filter, projection, setupCallback({ resolve, reject }))
  })

  const wrappedFindMany = ({ filter, projection = {} }) => new Promise((resolve, reject) => {
    collection.findMany(filter, projection, setupCallback({ resolve, reject }))
  })

  const wrappedInsertOne = ({ document }) => new Promise((resolve, reject) => {
    collection.insertOne(document, setupCallback({ resolve, reject }))
  })

  const wrappedInsertMany = ({ documents = [] }) => new Promise((resolve, reject) => {
    collection.insertMany(documents, setupCallback({ resolve, reject }))
  })

  const wrappedUpdateOne = ({ filter, update, options = {} }) => new Promise((resolve, reject) => {
    collection.updateOne(filter, update, options, setupCallback({ resolve, reject }))
  })

  const wrappedUpdateMany = ({ filter, update, options = {} }) => new Promise((resolve, reject) => {
    collection.updateMany(filter, update, options, setupCallback({ resolve, reject }))
  })

  return {
    collection
  }
}

const getCollection = async ({ collectionName, dbName, clientName }) => {
  const memo = `${clientName} ${dbName} ${collectionName}`
  if (collections.has(memo)) {
    return collections.get(memo)
  } else {
    const database = await getDatabase({ dbName, clientName })
    const collection = database.collection(collectionName)
    const wrappedCollection = collectionDecorator({ collection })
    collections.set(memo, wrappedCollection)
    return collection
  }
}

const setupMongo = async ({ clientName }) => {
  return {
    async getCollection ({ dbName, collectionName }) {
      return getCollection({ dbName, clientName, collectionName })
    }
  }
}

module.exports = { setupMongo }
