const { getMongoClient } = require('./getMongoClient.js')
const { mongoDatabaseName } = require('../../common/settings.js')

const getMongoDB = async () => {
  const client = getMongoClient()
  try {
    await client.connect()
    console.log(`Successful Connection to Mongo Database: ${mongoDatabaseName}`)
    return client.db(mongoDatabaseName)
  } catch (error) {
    console.error(error)
  }
}

module.exports = { getMongoDB }
