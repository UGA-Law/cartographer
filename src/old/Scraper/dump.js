const fs = require('fs')
const dump = ({ data, filename }) => new Promise((resolve, reject) => {
  const jsonData = JSON.stringify(data, null, '  ')
  fs.writeFile(filename, jsonData, { encoding: 'utf-8' }, (error) => {
    if (error) {
      reject(error)
    } else {
      resolve(jsonData)
    }
  })
})

module.exports = {
  dump
}
