const hasNoShortPropertyAccess = path =>
    !!path.findParent(({ node }) =>
        node.directives && node.directives.some(({ value }) => value.value === 'no short property access'))

export default ({ types: t }) => ({
    visitor: {
        CallExpression(path) {
            if (hasNoShortPropertyAccess(path)
                || !t.isMemberExpression(path.node.callee)
                || !t.isIdentifier(path.node.callee.object, { name: '_' })) {
                return
            }

            const parameter = path.scope.generateUidIdentifier('_')
            const lambda = t.arrowFunctionExpression(
                [parameter],
                t.callExpression(
                    t.memberExpression(
                        parameter,
                        path.node.callee.property
                    ),
                    path.node.arguments
                )
            )

            path.replaceWith(lambda)
        },

        MemberExpression(path) {
            if (!t.isIdentifier(path.node.object, { name: '_' }) || hasNoShortPropertyAccess(path)) {
                return
            }

            const parameter = path.scope.generateUidIdentifier('_')
            const lambda = t.arrowFunctionExpression(
                [parameter],
                t.memberExpression(
                    parameter,
                    path.node.property
                )
            )

            path.replaceWith(lambda)
        },

        BinaryExpression(path) {
            if (hasNoShortPropertyAccess(path)) {
                return
            }

            const parameters = []
            const isUnderscore = node => t.isIdentifier(node, { name: '_' })

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

            path.replaceWith(lambda)
        },

        UnaryExpression(path) {
            if (!t.isIdentifier(path.node.argument, { name: '_' }) || hasNoShortPropertyAccess(path)) {
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

            path.replaceWith(lambda)
        },

        Identifier(path) {
            if (path.node.name !== '_' || hasNoShortPropertyAccess(path)) {
                return
            }

            const parameter = path.scope.generateUidIdentifier('_')
            const lambda = t.arrowFunctionExpression(
                [parameter],
                parameter
            )

            path.replaceWith(lambda)
        }
    }
})
