const { compile } = require('./compile.js')
const { projectName } = require('../../common/settings.js')
const fs = require('fs')

const writeJSONFile = ({ filename, data }) => new Promise(async (resolve, reject) => {
  try {
    const jsonData = JSON.stringify(data)
    await fs.writeFile(filename, jsonData, { encoding: 'utf-8' }, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  } catch (error) {
    reject(error)
  }
})

compile({ projectName })
  .then(data => {
    return Promise.all([
      writeJSONFile({ filename: './data.json', data })
    ])
  })
  .then(() => {
    console.log('File Written.')
  })
  .catch(error => { console.log('Compile Error', error) })
