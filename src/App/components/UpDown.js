import React, {
  useState
} from 'react'

import styled from 'styled-components'

const Element = styled.div`
  border: 1px solid black;
  display: inline-flex;
  flex-direction: column;
  text-align: center;
  width: 4rem;
`

const UpperButton = styled.div`
  padding: .5rem;
  user-select: none;
  :hover{
    background: grey;
    color: white;
  }
  :active{
    background: red;
    color: white;
  }
`

const LowerButton = styled.div`
  padding: .5rem;
  user-select: none;
  :hover{
    background: grey;
    color: white;
  }
  :active{
    background: red;
    color: white;
  }
`

const CurrentBox = styled.div`
  padding: .25rem;
  user-select: none;
  background: #eee;
  color: black;
`

const noop = () => {}

export const UpDown = ({
  ammount = 1,
  initialValue = 0,
  min = -Infinity,
  max = Infinity,
  onChange = noop
}) => {
  const [current, setCurrent] = useState(initialValue)

  const upperClickHandler = () => {
    const newValue = current + ammount
    if (newValue > max) {
      onChange(max)
      setCurrent(max)
    } else {
      onChange(newValue)
      setCurrent(newValue)
    }
  }

  const lowerClickHandler = () => {
    const newValue = current - ammount
    if (newValue < min) {
      onChange(min)
      setCurrent(min)
    } else {
      onChange(newValue)
      setCurrent(newValue)
    }
  }

  return (
    <Element>
      <UpperButton onClick={upperClickHandler}>+</UpperButton>
      <CurrentBox>{ current }</CurrentBox>
      <LowerButton onClick={lowerClickHandler}>-</LowerButton>
    </Element>
  )
}
