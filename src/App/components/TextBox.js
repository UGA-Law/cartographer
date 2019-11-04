import styled from 'styled-components'

export const TextBox = styled.input`
  min-width: 0;
  border: 1px solid black;
  font-size: 1rem;
  padding: .5rem;
  flex-grow: 1;
  :disabled{
    color: white;
    background: transparent;
    border: 1px solid transparent;
    user-select: none;
  }
`
