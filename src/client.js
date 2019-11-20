import React from 'react'
import { render } from 'react-dom'
import { App } from './App/components/App.js'
import { ScrapeMode } from './App/components/ScrapeMode.js'
import { SitemapMode } from './App/components/SitemapMode.js'

// render(<App />, document.getElementById('root'))
// render(<ScrapeMode />, document.getElementById('root'))
render(<SitemapMode />, document.getElementById('root'))
