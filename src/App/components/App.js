import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Button } from './Button.js'
import { Bar } from './Bar.js'
import { TextBox } from './TextBox.js'
import { Spacer } from './Spacer.js'
import { requestAScrape, hasBeenScraped } from '../../Scraper/clientScrapeAPI.js/'
import cuid from 'cuid'

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  border: .25rem solid black;
  height: 100vh;
  font-family: sans-serif;
`

export const App = () => {
  const [ activeUrl, setActiveUrl ] = useState('https://www.with-two-dashes.com')
  const [ isScraping, setIsScraping ] = useState(false)

  useEffect(() => {

  }, [activeUrl])

  const handleTextboxChange = event => {
    const { target: { value } } = event
    setActiveUrl(value)
  }

  const handleScrapeButtonClick = () => {
    console.log('Would Scrape', activeUrl)
    if (isScraping === false) {
      setIsScraping(true)
    }
  }

  const handleAbortButtonClick = () => {
    setIsScraping(false)
  }

  return (
    <AppContainer>
      <Bar>
        <div>
          { isScraping ? 'Now Scraping:' : null }
        </div>
        <TextBox
          onChange={handleTextboxChange}
          value={activeUrl}
          disabled={isScraping}
        />
        <Spacer />
        { isScraping === false ? (<Button
          onClick={handleScrapeButtonClick}
          disabled={isScraping}
        >Scrape</Button>) : null }
        { isScraping ? (<Spacer />) : null }
        { isScraping ? (<Button onClick={handleAbortButtonClick}>Abort</Button>) : null }
      </Bar>
      <div>Disinfirmation</div>
    </AppContainer>
  )
}
