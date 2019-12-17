import naturalCompare from 'string-natural-compare'

export const formatResults = resultsRaw => {
  const output = resultsRaw.map((rawUrl) => {
    const parsableUrl = new URL(rawUrl)
    const pathPartsRaw = parsableUrl.pathname.split('/')
    pathPartsRaw.shift()
    const pathParts = pathPartsRaw.map(part => `/${part}`)
    const pathBreakdown = []
    let previousPart = null
    for (const part of pathParts) {
      if (previousPart == null) {
        pathBreakdown.push(part)
        previousPart = part
      } else {
        previousPart = `${previousPart}${part}`
        pathBreakdown.push(previousPart)
      }
    }
    return {
      url: rawUrl,
      path: parsableUrl.pathname,
      pathBreakdown
    }
  })
  const internalSet = new Set()
  const sortedAndUniqueList = output
    .sort((a, b) => naturalCompare(a.path, b.path))
    .filter((item) => {
      if (internalSet.has(item.path)) {
        return false
      } else {
        internalSet.add(item.path)
        return true
      }
    })

  const finalList = []

  for (const item of sortedAndUniqueList) {
    const { pathBreakdown, path: fullPath, url } = item
    const hasParts = pathBreakdown.length > 1
    const [rootPath, ...childPaths] = pathBreakdown
    for (const childPath of childPaths) {
      finalList.push({
        isStub: true,
        url: childPath,
        fullPath: childPath,
        rootPath,
        hasParts,
        childPaths
      })
    }
    finalList.push({
      isStub: false,
      url,
      fullPath,
      rootPath,
      hasParts,
      childPaths
    })
  }

  return finalList
}
