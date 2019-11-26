const { App } = require('./App.jsx')
const ReactDOMServer = require('react-dom/server.node')
const React = require('react')

const extract = ({ data, ...rest }) => {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(App, { data, ...rest }, null)
  )
}

module.exports = { extract }
