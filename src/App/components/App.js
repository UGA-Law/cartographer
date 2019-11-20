import React, { useState } from 'react'
import styled, { css } from 'styled-components'
import { useJSONFile } from '../hooks/useJSONFile.js'
import naturalCompare from 'string-natural-compare'

const AppContainer = styled.div`
  border: 1rem solid black;
  display: flex;
  flex-direction: column;
  font-family: sans-serif;
  height: 100vh;
  overflow: auto;
`

const Headline = styled.div`
  padding: 1rem;
  background: red;
  color: white;
  font-size: 2rem;
  text-align: center;
`

const ParsedData = styled.div`
  padding: 1rem;
  overflow-y: auto;
`

const FancyDataItem = styled.div`
  /* border: 1px solid black; */
  padding: .25rem;
  padding-left: 1rem;
  ${props => {
    if (props.isNotFound) {
      return css`
        background: gold;
      `
    } else if (props.isAccessDenied) {
      return css`
        background: crimson;
      `
    } else if (props.isPasswordProtected) {
      return css`
        background: aqua;
      `
    }
  }};
`

const DataItem = ({ pageData = {}, pageChildren, depth }) => {
  const {
    pageTitle,
    pageUrl,
    urlPart
  } = pageData

  const isNotFound = pageTitle === 'Page not found | www.law.uga.edu'
  const isAccessDenied = pageTitle === 'Access denied | www.law.uga.edu'
  const isPasswordProtected = pageTitle === 'Password Protected Page | www.law.uga.edu'

  if (pageChildren) { // kids.
    if (pageUrl) {
      return (
        <FancyDataItem isNotFound={isNotFound} isAccessDenied={isAccessDenied} isPasswordProtected={isPasswordProtected}>
          <strong>/{urlPart}</strong>
          <div>{ pageTitle }</div>
          <div>{ pageUrl }</div>
          <div>{ renderData(pageChildren, depth + 1) }</div>
        </FancyDataItem>
      )
    } else {
      return (
        <FancyDataItem isNotFound={isNotFound} isAccessDenied={isAccessDenied} isPasswordProtected={isPasswordProtected}>
          <strong>/{urlPart}</strong>
          <div>
            { renderData(pageChildren, depth + 1) }
          </div>
        </FancyDataItem>
      )
    }
  } else { // no kids.
    return (
      <FancyDataItem isNotFound={isNotFound} isAccessDenied={isAccessDenied} isPasswordProtected={isPasswordProtected}>
        <strong>/{urlPart}</strong>
        <div>{ pageTitle }</div>
        <div>{ pageUrl }</div>
      </FancyDataItem>
    )
  }
}

const renderData = (dataObj, depth = 0) => {
  const rootKeys = Object.keys(dataObj).sort(naturalCompare)
  return rootKeys.map((key, index) => {
    const value = dataObj[key]
    const { pageData, pageChildren } = value
    return <DataItem key={index} pageData={pageData} pageChildren={pageChildren} depth={depth} />
  })
}

export const App = () => {
  const { isWorking, data, error } = useJSONFile({ filename: './data.json' })

  if (isWorking) {
    return (
      <AppContainer>
        Working...
      </AppContainer>
    )
  }

  if (error) {
    return (
      <AppContainer>
        <pre>Error: { JSON.stringify(error, null, '  ') }</pre>
      </AppContainer>
    )
  }

  const dataTransformer = inputObject => {
    const rootKeys = Object.keys(inputObject).reduce((acc, key) => {
      const value = inputObject[key]
      const { __pageData, __childPages, ...rest } = value
      const children = Object.keys(__childPages)
      if (children.length === 0) {
        acc[key] = {
          pageData: { ...__pageData, ...rest },
          pageChildren: null
        }
      } else {
        acc[key] = {
          pageData: { ...__pageData, ...rest },
          pageChildren: dataTransformer(__childPages)
        }
      }
      return acc
    }, {})

    return rootKeys
  }

  if (data) {
    return (
      <AppContainer>
        <Headline>Cartographer</Headline>
        <ParsedData>
          <div>{ renderData(dataTransformer(data), 0) }</div>
        </ParsedData>
      </AppContainer>
    )
  }

  return (
    <AppContainer>
      Default
    </AppContainer>
  )
}
