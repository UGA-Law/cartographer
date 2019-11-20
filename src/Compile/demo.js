const { compile } = require('./compile.js')
const fs = require('fs')

const projectName = 'Project:https://www.law.uga.edu'

const writeJSONFile = ({ filename, data }) => new Promise((resolve, reject) => {
  try {
    const jsonData = JSON.stringify(data, null, '  ')
    fs.writeFile(filename, jsonData, { encoding: 'utf-8' }, (error) => {
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
  .then(data => writeJSONFile({ filename: './data.json', data }))
  .then(() => { console.log('File Written.') })
  .catch(error => { console.log('Compile Error', error) })
