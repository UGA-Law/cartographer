import naturalCompare from 'string-natural-compare'

export const makeTreeFromUrlArray = urlArray => {
  const makeAncestryArray = url => {
    const splitAlongSlashes = url.split('/')
    splitAlongSlashes.shift() // remove the first entry. its always an empty string.
    const output = []
    let lastPart = ''
    for (const part of splitAlongSlashes) {
      const parent = lastPart === '' ? '/' : lastPart
      lastPart = `${lastPart}/${part}`
      output.push({
        part: lastPart,
        parent
      })
    }
    return output
  }

  const mapping = new Map()

  for (const url of urlArray) {
    const pathParts = makeAncestryArray(url)
    for (const pathPart of pathParts) {
      const { part, parent } = pathPart

      if (mapping.has(parent) === false) {
        mapping.set(parent, {
          path: parent,
          children: new Set()
        })
      }

      const parentPart = mapping.get(parent)

      if (parent !== part) {
        if (parentPart.children.has(part) === false) {
          parentPart.children.add(part)
          mapping.set(part, {
            path: part,
            children: new Set()
          })
        }
      }
    }
  }

  const root = mapping.get('/')

  const rootChildren = []

  const extractChildren = (set, depth = 0) => {
    const output = []
    for (const child of set.values()) {
      const data = mapping.get(child)
      const { path, children: dataChildren } = data
      const children = extractChildren(dataChildren, depth + 1)
      const hasChildren = children.length > 0
      output.push({
        id: path,
        name: path,
        path,
        depth,
        hasChildren,
        children
      })
    }
    return output.sort((a, b) => naturalCompare(a.name, b.name) * -1)
  }
  if (root) {
    for (const child of root.children.values()) {
      const data = mapping.get(child)
      if (data) {
        const { path, children: dataChildren } = data
        const grandChildren = extractChildren(dataChildren, 2)
        const hasChildren = grandChildren.length > 0
        rootChildren.push({
          id: path,
          name: path,
          path,
          depth: 1,
          hasChildren,
          children: grandChildren
        })
      } else {
        console.error('No data found for:', child, data)
      }
    }
  } else {
    // console.error('no root?!?', root)
  }

  const hasChildren = rootChildren.length > 0

  return { path: '/', name: 'Site Root', id: '/', depth: 0, hasChildren, children: rootChildren.sort((a, b) => naturalCompare(a.name, b.name) * -1) }
}
