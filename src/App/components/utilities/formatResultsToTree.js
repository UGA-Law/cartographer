// const tree = {
//   id: 'root-1',
//   name: 'Root',
//   children: [
//     {
//       id: 'child-1',
//       name: 'Child #1',
//       children: [
//         {
//           id: 'child-2',
//           name: 'Child #2',
//           children: []
//         },
//         {
//           id: 'child-3',
//           name: 'Child #3',
//           children: []
//         }
//       ]
//     },
//     {
//       id: 'child-4',
//       name: 'Child #4',
//       children: [
//         {
//           id: 'child-5',
//           name: 'Child #5',
//           children: []
//         }
//       ]
//     }
//   ]
// }

import { makeTreeFromUrlArray } from './makeTreeFromUrlArray.js'

export const formattedResultsToTree = formattedResults => {
  const paths = formattedResults.map(({ fullPath }) => fullPath)

  const tree = makeTreeFromUrlArray(paths)

  return tree
}
