import styled from 'styled-components'

export const Button = styled.button`
  border: 1px solid black;
  font-size: 1rem;
  padding: .5rem;
  :active{
    background: black;
    color: white;
  }
  :hover{
    background: #ddd;
  }
  :disabled{
    color: white;
    background: transparent;
    border: 1px solid transparent;
  }
`
