const redis = require('redis')

const port = 6379
const host = 'localhost'
const password = 'a password'

const client = redis.createClient({
  port,
  host
  // password
})

const set = ({ key, value }) => new Promise((resolve, reject) => {
  const stringValue = JSON.stringify(value)
  client.set(key, stringValue, error => {
    if (error) {
      reject(error)
    } else {
      resolve()
    }
  })
})

const get = ({ key }) => new Promise((resolve, reject) => {
  client.get(key, (error, value) => {
    if (error) {
      reject(error)
    } else {
      resolve(JSON.parse(value))
    }
  })
})

const hasKey = ({ key }) => new Promise((resolve, reject) => {
  get({ key }).then(value => {
    if (value && typeof value === 'string' && value !== '[object Object]') {
      resolve(true)
    } else {
      resolve(false)
    }
  }).catch(() => {
    resolve(false)
  })
})

module.exports = {
  get,
  set,
  hasKey
}
