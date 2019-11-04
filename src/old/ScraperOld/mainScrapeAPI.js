const { ipcMain } = require('electron')
const { scrape } = require('../Scraper/scrape.js')
ipcMain.on('request-scrape', (event, payload) => {
  const { url, requestID } = payload
  scrape({ url }).then(result => {
    event.reply('request-completed', { resultType: 'resolve', resultPayload: { result, url }, requestID })
  })
})
