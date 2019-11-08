import React, { useState, useEffect } from 'react'
import styled from 'styled-components'

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

export const App = () => {
  return (
    <AppContainer>
      <Headline>In Charge</Headline>
    </AppContainer>
  )
}
