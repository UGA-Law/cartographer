import React from 'react'
import styled, { css } from 'styled-components'
import { useMongoDataDistinct } from '../hooks/mongo.js'
import { FixedSizeTree as Tree } from 'react-vtree'
import { formatResults } from './utilities/formatResults.js'
import { formattedResultsToTree } from './utilities/formatResultsToTree.js'
import AutoSizer from 'react-virtualized-auto-sizer'

const StylishNode = styled.div`
  border: 1px solid black;
  padding: 1rem;
  ${
    props => {
      if (props.isLeaf) {
        return css`
          background: yellow;
          border-left-radius: 1rem;
        `
      }
    }
  }
  ${
    props => {
      if (props.nestingLevel > 0) {
        return css`
          border-left: ${props.nestingLevel * 2}rem solid black;
        `
      }
    }
  }

`

const StylishExpanderButton = styled.div`
  border: 1px solid black;
  background: black;
  color: white;
  display: inline-flex;
  // width: 1rem;
  padding: 0 .25rem;
  height: 1rem;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-radius: 1rem;
  margin-right: 1rem;
`

const Node = ({ data: { isLeaf, name, nestingLevel, childCount }, isOpen, style, toggle }) => {
  const canExpand = !isLeaf
  return (
    <StylishNode style={style} nestingLevel={nestingLevel} isLeaf={isLeaf} onClick={toggle}>
      {
        canExpand ? (
          <StylishExpanderButton onClick={toggle}>{isOpen ? 'collapse' : 'expand'}</StylishExpanderButton>
        ) : null
      }
      <span>Name: {name} {childCount > 0 ? `(${childCount})` : null}</span>
    </StylishNode>
  )
}

const StylishRenderRoot = styled.div`
  display: flex;
  flex-grow: 1;
`

const renderResults = formattedResults => {
  const canRender = Array.isArray(formattedResults) && formattedResults.length > 0

  const tree = formattedResultsToTree(formattedResults)

  function * treeWalker (refresh) {
    const stack = []

    stack.push({
      nestingLevel: 0,
      node: tree
    })

    while (stack.length !== 0) {
      const { node, nestingLevel } = stack.pop()
      const { children, id, name } = node

      const childCount = children.length

      const isLeaf = Array.isArray(children) && children.length === 0

      const isOpened = yield refresh ? {
        id,
        isLeaf,
        isOpenByDefault: false,
        name,
        nestingLevel,
        childCount
      } : id

      if (children.length !== 0 && isOpened) {
        for (const child of children) {
          stack.push({
            nestingLevel: nestingLevel + 1,
            node: child
          })
        }
      }
    }
  }

  return canRender ? (
    <StylishRenderRoot>
      <AutoSizer>
        {({ height, width }) => {
          return (
            <Tree treeWalker={treeWalker} itemSize={52} height={height} width={width}>
              {Node}
            </Tree>
          )
        }}
      </AutoSizer>
    </StylishRenderRoot>
  ) : (
    <div>Nothing to display.</div>
  )
}

const StylishPageRoot = styled.div`
  display: flex;
  height: 100vh;
  border: 1rem solid white;
`

export const SitemapMode = () => {
  const {
    isWorking,
    isConnected,
    results
  } = useMongoDataDistinct({
    dbName: 'cartographer-scrape-database',
    collectionName: 'pageData',
    fieldName: 'pageURL',
    filter: { wasFound: true }
  })

  if (results) {
    return (
      <StylishPageRoot>
        {renderResults(formatResults(results))}
      </StylishPageRoot>
    )
  } else {
    return (
      <StylishPageRoot>
        <div>Sitemap Mode</div>
        <div>isConnected: {isConnected ? 'Yes' : 'No'}</div>
        <div>isWorking: {isWorking ? 'Yes' : 'No'}</div>
      </StylishPageRoot>
    )
  }
}
