import React, { useState } from 'react'
import styled, { css } from 'styled-components'
import { scrapeWebsite } from '../../Scrape3/scrapeWebsite.js'
import { useScrapeMessages } from '../hooks/useScrapeMessages.js'
import { projectName } from '../../../common/settings.js'

import moment from 'moment'

// {  // current performance on www.law.uga.edu:
//   sessionStartMoment: '2019-11-26T13:33:42-05:00',
//   endMoment: '2019-11-26T22:13:29-05:00'
// } // total time: ~9 hours

const ScrapeModeContainer = styled.div`
  border: 1rem solid black;
  display: flex;
  flex-direction: column;
  font-family: sans-serif;
  height: 100vh;
  overflow: auto;
`

const TextBox = styled.input`

`

const Button = styled.button`

`

const FancyWorkloadBox = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  ${props => {
    if (props.isComplete) {
      return css`
        background: gold;
      `
    } else {
      return css`
        background: transparent;
      `
    }
  }}
`

const FancyWorkloadItem = styled.div`
  height: 1rem;
  width: 1rem;
  border: 1px solid black;
  margin: 1px;
  ${props => {
    if (props.isComplete) {
      return css`
        background: green;
      `
    } else {
      return css`
        background: orange;
      `
    }
  }}
`

const WorkloadItem = ({ isComplete }) => {
  return <FancyWorkloadItem isComplete={isComplete} />
}

const RenderWorkloadItems = ({
  activeWorkloadIsComplete,
  activeWorkloadNumber,
  items
}) => {
  const uniqueKeyFromItem = ({
    sessionNumber,
    jobIndex,
    urlID
  }) => `${sessionNumber}_${jobIndex}_${urlID}`
  return (
    <div>
      <div>Workload Session: { activeWorkloadNumber }</div>
      <FancyWorkloadBox isComplete={activeWorkloadIsComplete}>
        {
          items.map(item => {
            return (<WorkloadItem key={uniqueKeyFromItem(item)} isComplete={item.isComplete} />)
          })
        }
      </FancyWorkloadBox>
    </div>
  )
}

const RenderBacklog = ({ count, additions }) => {
  const maxWorkloadSize = 200
  if (additions - maxWorkloadSize > 0) {
    return <div>Backlog: {count} ( + {additions - maxWorkloadSize} )</div>
  } else {
    return <div>Backlog: {count}</div>
  }
}

// const FancyXrayItem = styled.div`
//   padding: 1rem;
//   border: 1px solid black;
//   opacity: 1;
//   transition: opacity 100ms linear;
//   ${props => {
//     if (props.toBeRemoved) {
//       return css`
//         opacity:0;
//       `
//     }
//   }}
// `
// const FancyXrayItems = styled.div`
//   border: 1rem solid blue;
//   overflow: hidden;
//   flex-grow: 1;
// `

// const XrayItem = ({ item }) => {
//   return <FancyXrayItem toBeRemoved={item.toBeRemoved} >{item.url}</FancyXrayItem>
// }

// const RenderXrayWorkingItems = ({ items, sessionNumber }) => {
//   return (
//     <FancyXrayItems>
//       {
//         items.map(item => {
//           return <XrayItem key={`${item.urlID}`} item={item} />
//         })
//       }
//     </FancyXrayItems>
//   )
// }

let sessionStartMoment

export const ScrapeMode = () => {
  // const [workloadStartMoment, setWorkloadStartMoment] = useState(null)
  const [isScraping, setIsScraping] = useState(false)
  const [activeWorkloadIsComplete, setActiveWorkloadIsComplete] = useState(false)

  const [workTimeTotal, setWorkTimeTotal] = useState(0)

  const [urlToScrape, setUrlToScrape] = useState('https://www.law.uga.edu')

  const [workloadItems, setWorkloadItems] = useState([])

  const [activeWorkloadNumber, setActiveWorkloadNumber] = useState(0)
  const [backlogCount, setBacklogCount] = useState(0)

  const [backlogAdditions, setBacklogAdditions] = useState(0)

  // const [xrayWorkingItems, setXrayWorkingItems] = useState([])

  useScrapeMessages(messageJSON => {
    const message = JSON.parse(messageJSON)
    const { subject, note, payload } = message

    if (subject === 'backlog') {
      if (note === 'Adding To Backlog') {
        setBacklogAdditions(existing => {
          return existing + payload.count
        })
      }
    }

    if (subject === 'workload') {
      if (note === 'Workload Started') {
        handleWorkloadStarted()
      } else if (note === 'Workload Complete') {
        handleWorkloadCompleted()
      } else if (note === 'All Done.') {
        const endMoment = moment().format()
        console.log({ sessionStartMoment, endMoment })
        setIsScraping(false)
        setWorkTimeTotal(moment(endMoment).from(moment(sessionStartMoment)))
      }
    }

    if (subject === 'workload-job') {
      if (note === 'Workload Job Complete') {
        handleJobComplete()
      } else if (note === 'Workload Job Started') {
        handleJobStart()
      }
    }

    function handleWorkloadStarted () {
      setBacklogAdditions(0)
      setBacklogCount(payload.backlogCount)
      setActiveWorkloadNumber(payload.sessionNumber)
      setWorkloadItems([])
      setActiveWorkloadIsComplete(false)
    }

    function handleWorkloadCompleted () {
      setActiveWorkloadIsComplete(true)
    }

    function handleJobStart () {
      setWorkloadItems((existingItems) => {
        return [
          { ...payload, isComplete: false },
          ...existingItems
        ]
      })
    }

    function handleJobComplete () {
      const { urlID } = payload
      setWorkloadItems((existingItems) => {
        return existingItems.map(item => {
          if (item.urlID === urlID) {
            return {
              ...item,
              isComplete: true
            }
          } else {
            return item
          }
        })
      })
    }
  })

  const handleTextboxChange = event => {
    setUrlToScrape(event.target.value)
  }

  const handleScrapeButtonClick = event => {
    if (isScraping === false) {
      const startMoment = moment().format()
      console.log({ startMoment })
      sessionStartMoment = startMoment
      setIsScraping(true)
      scrapeWebsite({ url: urlToScrape, projectName }).then(() => {
        setIsScraping(false)
      }).catch(error => {
        console.error(error)
      })
    }
  }

  return (
    <ScrapeModeContainer>
      <div>Scrape Mode</div>
      <div>
        { isScraping ? 'SCRAPING ON' : null }
      </div>
      <div>Total Work Time: {workTimeTotal}</div>
      <TextBox value={urlToScrape} onChange={handleTextboxChange} disabled={isScraping} />
      <Button onClick={handleScrapeButtonClick} disabled={isScraping}>Scrape!</Button>
      <RenderBacklog count={backlogCount} additions={backlogAdditions} />
      <RenderWorkloadItems
        activeWorkloadIsComplete={activeWorkloadIsComplete}
        items={workloadItems}
        activeWorkloadNumber={activeWorkloadNumber}
      />
    </ScrapeModeContainer>
  )
}
