const cuid = require('cuid')
const { ipcRenderer } = require('electron')

const moment = require('moment')

const activeRequestStorage = new Map()
const completedScrapes = new Map()

const requestedUrls = new Set()

const { canBeScraped } = require('./utilities.js.js.js')

const cup = require('crawler-url-parser')

const workingQueue = []

let isWorking = false

ipcRenderer.on('request-completed', (_event, payload) => {
  console.log('Message from Electron Host Recieved.', { payload })
  isWorking = false
  const { requestID, resultType, resultPayload } = payload
  if (activeRequestStorage.has(requestID)) {
    const { resolve, reject, url } = activeRequestStorage.get(requestID)
    const nowTimestamp = moment().valueOf()
    if (resultType === 'resolve') {
      console.log('Resolving.', resultPayload)
      resolve(resultPayload)
      completedScrapes.set(url, { resultPayload, completedTimestamp: nowTimestamp, resultType })
      activeRequestStorage.delete(requestID)
    } else if (resultType === 'reject') {
      console.log('Rejecting.', resultPayload)
      reject(resultPayload)
      activeRequestStorage.delete(requestID)
    } else {
      console.log('Unhandled result type from ipcMain to ipcRenderer', { resultType })
    }
  }
  if (workingQueue.length > 0) {
    const requestID = workingQueue.pop()
    if (activeRequestStorage.has(requestID)) {
      const { url } = activeRequestStorage.get(requestID)
      const payload = { url, requestID }
      sendToMain({ payload })
    }
  }
})

const getScrapedData = ({ url }) => {
  if (hasBeenScraped({ url })) {
    return completedScrapes.get(url).resultPayload
  } else {
    return null
  }
}

const hasBeenScraped = ({ url }) => {
  if (completedScrapes.has(url)) {
    const { resultType } = completedScrapes.get(url)
    if (resultType === 'resolve') {
      return true
    } else {
      return false
    }
  } else {
    return false
  }
}

const sendToMain = ({ payload }) => {
  isWorking = true
  console.log('Sending Payload to Electron Host', payload)
  ipcRenderer.send('request-scrape', payload)
}

const requestAScrape = ({ url }) => {
  const requestID = cuid()
  const payload = { url, requestID }
  return new Promise((resolve, reject) => {
    const normalizedUrl = cup.parse(url)

    if (requestedUrls.has(normalizedUrl.url) === false) {
      requestedUrls.add(normalizedUrl.url)
      if (isWorking === true) {
        if (canBeScraped({ url }) === true) {
          activeRequestStorage.set(requestID, { resolve, reject, url })
          workingQueue.push(requestID)
        } else {
          reject(new Error(`Cannot scrape url: ${url}`))
        }
      } else {
        if (canBeScraped({ url }) === false) {
          reject(new Error(`Cannot scrape url: ${url}`))
        } else {
          sendToMain({ payload })
          activeRequestStorage.set(requestID, { resolve, reject, url })
        }
      }
    } else {
      // console.log('Skipping', url)
      reject(new Error(`Already Working on Url: ${url}`))
    }
  })
}

const getActiveRequests = () => {
  const output = []
  for (const [requestID, requestedElement] of activeRequestStorage) {
    output.push({ requestID, requestedElement })
  }
  return output
}

module.exports = {
  requestAScrape,
  hasBeenScraped,
  getScrapedData,
  getActiveRequests,
  canBeScraped
}
