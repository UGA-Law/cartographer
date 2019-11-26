const { scrapeWebsite, subscribeToAllMessages } = require('./scrapeWebsite.js')
const moment = require('moment')

// const projectName = 'development'
const { projectName } = require('../../common/settings.js')
const url = 'http://www.law.uga.edu/'

const startMoment = moment()

// subscribeToAllMessages(messageString => {
//   const messageParsed = JSON.parse(messageString)
//   if (messageParsed) {
//     const { subject, note } = messageParsed
//     switch (subject) {
//       case 'workload-job':
//         if (note === 'Workload Job Started') {
//           console.log('Workload Job Started', messageParsed.payload.normalizedHref)
//         } else if (note === 'Workload Job Complete') {
//           console.log('Workload Job Complete', messageParsed.payload.normalizedHref)
//         } else {
//           console.log('JOB:', messageParsed)
//         }
//         break
//       case 'x-ray':
//         if (note === 'success') {
//           console.log('Xray Success', messageParsed.payload.url)
//         } else if (note === 'error') {
//           console.log('Xray Error', messageParsed.payload.url)
//         } else {
//           console.log(messageParsed)
//         }
//         break
//     }
//   }
// })

scrapeWebsite({ url, projectName }).then(() => {
  const endMoment = moment()
  console.log()
  console.log('+---------------')
  console.log(`| Scrape Complete. ${url}`)
  console.log(`| Project: ${projectName}`)
  console.log(`| Total Time: ${startMoment.from(endMoment, true)}`)
  console.log('+---------------')
}).catch(error => {
  console.log('scrapeWebsite Error:', error)
})
