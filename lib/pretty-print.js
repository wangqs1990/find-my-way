function prettyPrintFlattenedNode (flattenedNode, prefix, tail) {
  var paramName = ''
  var methods = new Set(flattenedNode.nodes.map(node => node.method))

  if (flattenedNode.prefix.includes(':')) {
    flattenedNode.nodes.forEach((node, index) => {
      var params = node.handler.params
      var param = params[params.length - 1]
      if (methods.size > 1) {
        if (index === 0) {
          paramName += param + ` (${node.method})\n`
          return
        }
        paramName += prefix + '    :' + param + ` (${node.method})`
        paramName += (index === methods.size - 1 ? '' : '\n')
      } else {
        paramName = params[params.length - 1] + ` (${node.method})`
      }
    })
  } else if (methods.size) {
    paramName = ` (${Array.from(methods).join('|')})`
  }

  var tree = `${prefix}${tail ? '└── ' : '├── '}${flattenedNode.prefix}${paramName}\n`

  prefix = `${prefix}${tail ? '    ' : '│   '}`
  const labels = Object.keys(flattenedNode.children)
  for (var i = 0; i < labels.length; i++) {
    const child = flattenedNode.children[labels[i]]
    tree += prettyPrintFlattenedNode(child, prefix, i === (labels.length - 1))
  }
  return tree
}

function flattenNode (flattened, node) {
  if (node.handler) {
    flattened.nodes.push(node)
  }

  if (node.children) {
    for (const child of Object.values(node.children)) {
      const childPrefixSegments = child.prefix.split(/(?=\/)/) // split on the slash separator but use a regex to lookahead and not actually match it, preserving it in the returned string segments
      let cursor = flattened
      let parent
      for (const segment of childPrefixSegments) {
        parent = cursor
        cursor = cursor.children[segment]
        if (!cursor) {
          cursor = {
            prefix: segment,
            nodes: [],
            children: {}
          }
          parent.children[segment] = cursor
        }
      }

      flattenNode(cursor, child)
    }
  }
}

function compressFlattenedNode (flattenedNode) {
  const childKeys = Object.keys(flattenedNode.children)
  if (flattenedNode.nodes.length === 0 && childKeys.length === 1) {
    const child = flattenedNode.children[childKeys[0]]
    if (child.nodes.length <= 1) {
      compressFlattenedNode(child)
      flattenedNode.nodes = child.nodes
      flattenedNode.prefix += child.prefix
      flattenedNode.children = child.children
      return flattenedNode
    }
  }

  for (const key of Object.keys(flattenedNode.children)) {
    compressFlattenedNode(flattenedNode.children[key])
  }

  return flattenedNode
}

module.exports = { flattenNode, compressFlattenedNode, prettyPrintFlattenedNode }
