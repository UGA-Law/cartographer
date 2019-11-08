const { MongoClient } = require('mongodb')

const {
  mongoHost,
  mongoPort,
  mongoOptions
} = require('../../common/settings.js')

const connectionString = `mongodb://${mongoHost}:${mongoPort}`
const mongoConnectionOptions = { ...mongoOptions }
const getMongoClient = () => new MongoClient(connectionString, mongoConnectionOptions)

module.exports = { getMongoClient }
