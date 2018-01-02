const hasNoHoles = path =>
    !!path.findParent(({ node }) =>
        node.directives && node.directives.some(({ value }) => value.value === 'no holes'))

const currier = (curry, t) => node =>
    curry
        ? t.callExpression(t.identifier(curry), node)
        : node

export default ({ types: t }, options = {}) => {
    const curried = currier(options.curry, t)
    const isUnderscore = node => t.isIdentifier(node, { name: '_' })

    return {
        visitor: {
            CallExpression(path) {
                if (hasNoHoles(path)) {
                    return
                }

                const parameters = []
                if (t.isMemberExpression(path.node.callee) && isUnderscore(path.node.callee.object)
                    || isUnderscore(path.node.callee)) {
                    parameters.push(path.scope.generateUidIdentifier('_'))
                }

                path.node.arguments
                    .filter(isUnderscore)
                    .forEach(arg => {
                        parameters.push(path.scope.generateUidIdentifier('_'))
                    })

                if (parameters.length === 0) {
                    return
                }

                const provider = parameters.slice()
                const transformCallee = callee =>
                    isUnderscore(callee)
                        ? provider.shift()
                        : t.isMemberExpression(callee) && isUnderscore(callee.object)
                            ? t.memberExpression(provider.shift(), callee.property, callee.computed)
                            : callee

                const lambda = t.arrowFunctionExpression(
                    parameters,
                    t.callExpression(
                        transformCallee(path.node.callee),
                        path.node.arguments.map(arg =>
                            isUnderscore(arg)
                                ? provider.shift()
                                : arg)
                    )
                )

                path.replaceWith(curried(lambda))
            },

            MemberExpression(path) {
                if (hasNoHoles(path)) {
                    return
                }

                const holes = []

                if (isUnderscore(path.node.object)) {
                    holes.push(path.scope.generateUidIdentifier('_'))
                }

                if (isUnderscore(path.node.property)) {
                    holes.push(path.scope.generateUidIdentifier('_'))
                }

                if (holes.length === 0) {
                    return
                }

                const provider = holes.slice()
                const transform = node => isUnderscore(node)
                    ? provider.shift()
                    : node

                const lambda = t.arrowFunctionExpression(
                    holes,
                    t.memberExpression(
                        transform(path.node.object),
                        transform(path.node.property),
                        path.node.computed
                    )
                )

                path.replaceWith(curried(lambda))
            },

            BinaryExpression(path) {
                if (hasNoHoles(path)) {
                    return
                }

                const parameters = []

                if (isUnderscore(path.node.left)) {
                    parameters.push(path.scope.generateUidIdentifier('_'))
                }

                if (isUnderscore(path.node.right)) {
                    parameters.push(path.scope.generateUidIdentifier('_'))
                }

                if (parameters.length === 0) {
                    return
                }

                const provider = parameters.slice()
                const transform = node =>
                    isUnderscore(node)
                        ? provider.shift()
                        : node

                const lambda = t.arrowFunctionExpression(
                    parameters,
                    t.BinaryExpression(
                        path.node.operator,
                        transform(path.node.left),
                        transform(path.node.right)
                    )
                )

                path.replaceWith(curried(lambda))
            },

            UnaryExpression(path) {
                if (!t.isIdentifier(path.node.argument, { name: '_' }) || hasNoHoles(path)) {
                    return
                }

                const parameter = path.scope.generateUidIdentifier('_')
                const lambda = t.arrowFunctionExpression(
                    [parameter],
                    t.unaryExpression(
                        path.node.operator,
                        parameter,
                        path.node.prefix
                    )
                )

                path.replaceWith(curried(lambda))
            },

            Identifier(path) {
                if (path.node.name !== '_' || hasNoHoles(path)) {
                    return
                }

                const parameter = path.scope.generateUidIdentifier('_')
                const lambda = t.arrowFunctionExpression(
                    [parameter],
                    parameter
                )

                path.replaceWith(curried(lambda))
            }
        }
    }
}
