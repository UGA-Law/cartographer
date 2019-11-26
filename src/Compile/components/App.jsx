import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import naturalCompare from 'string-natural-compare'

const StylishRenderItem = styled.div`

`

const Highlighter = styled.span`
  background-color: ${props => props.color};
`

const Spacer = styled.span`
  display: inline-block;
  width: ${props => props.width};
`

const SmallButton = styled.div`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
  border: 1px solid black;
  text-align: center;
  border-radius: 100%;
  cursor: pointer;
  user-select: none;
`

const ChildRenderer = ({ children, depth }) => {
  const [shouldShow, setShouldShow] = useState(true)

  const clickHandler = () => {
    setShouldShow(existing => !existing)
  }

  const itemLabel = children.length === 1 ? 'child' : 'children'

  if (children.length === 0) {
    return null
  }

  if (shouldShow === false) {
    return <div><Spacer width={`${depth + 1}rem`} /><SmallButton onClick={clickHandler}>+</SmallButton> Expand {children.length} {itemLabel}</div>
  } else {
    return (
      <div>
        <div><Spacer width={`${depth + 1}rem`} /><SmallButton onClick={clickHandler}>-</SmallButton> Collapse { children.length } {itemLabel}</div>
        <div>{children}</div>
      </div>
    )
  }
}

const RenderItem = ({ data, depth = 0 }) => {
  const {
    children,
    href,
    part,
    title
    // id
  } = data

  const sortedChildren = children.sort(({ part: partA }, { part: partB }) => naturalCompare(partA, partB))

  return (
    <StylishRenderItem>
      <div><Spacer width={`${depth}rem`} /><Highlighter color='yellow'>/{part}</Highlighter> {href ? <a href={href}><Highlighter color='cyan'>{title}</Highlighter></a> : <span><Highlighter color='pink'>{title}</Highlighter></span>}</div>
      <ChildRenderer depth={depth}>
        {
          sortedChildren
            .map(itemData => {
              const { id } = itemData
              return <RenderItem key={id} data={itemData} depth={depth + 1} />
            })
        }
      </ChildRenderer>
    </StylishRenderItem>
  )
}

export const App = ({ data = [], projectName }) => {
  const [myData, setMyData] = useState(data)

  const sortedData = myData.sort(({ part: partA }, { part: partB }) => {
    return naturalCompare(partA, partB)
  })

  useEffect(() => {
    const url = `http://${location.host}/data.json`
    fetch(url).then(response => {
      console.log('Got file in Dist directory.')
      return response.json()
    }).then(data => {
      console.log('Converted.', data)
      setMyData(data)
    }).catch(error => {
      console.error(error, url)
    })
  }, [])

  return (
    <div>
      <div>{projectName}</div>
      <div>
        {
          sortedData.map(itemData => {
            const { id } = itemData
            return <RenderItem key={id} data={itemData} />
          })
        }
      </div>
    </div>
  )
}
