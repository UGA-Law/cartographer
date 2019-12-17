const Bundler = require('parcel-bundler')
const concurrently = require('concurrently')
const path = require('path')

const { devPort } = require('./common/settings.js')

const entryFile = path.join(__dirname, `./src/index.html`)

const options = {
  port: devPort,
  target: 'electron',
  outDir: './build',
  useMaps: true,
  watch: true,
  // publicUrl: './',
  sourceRoot: './src',
  // detailedReport: true,
  autoInstall: false
}

const bundler = new Bundler(entryFile, options)
bundler.serve(devPort).then(server => {
  const portRegex = /\d+$/g
  const resolvedPortString = portRegex.exec(server._connectionKey)[0] || null
  if (resolvedPortString.length > 0) {
    const port = parseInt(resolvedPortString)
    process.env.CARTOGRAPHER_PORT = port
    concurrently([`CARTOGRAPHER_PORT=${port} && electron . `]).then(() => {
      server.close()
      process.exit(0)
    }).catch(error => {
      console.error(error)
    })
  } else {
    console.error('No Port?!?', resolvedPortString)
  }
})
