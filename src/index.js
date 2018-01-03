const hasNoHoles = path =>
    !!path.findParent(({ node }) =>
        node.directives && node.directives.some(({ value }) => value.value === 'no holes'))

const currier = (curry, t) => node =>
    curry
        ? t.callExpression(t.identifier(curry), [node])
        : node

export default ({ types: t }, options = { curry: false, skip: [] }) => {
    const curried = currier(options.curry, t)
    const isUnderscore = node => t.isIdentifier(node, { name: '_' })
    const isUnderscoreAccess = node => t.isMemberExpression(node)
        && isUnderscore(node.object)

    return {
        visitor: {
            CallExpression(path) {
                if (hasNoHoles(path)) {
                    return
                }

                const parameters = []
                if (isUnderscoreAccess(path.node.callee) || isUnderscore(path.node.callee)) {
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
                        : isUnderscoreAccess(callee)
                            ? t.memberExpression(provider.shift(), callee.property, callee.computed)
                            : callee

                const lambda = t.arrowFunctionExpression(
                    parameters,
                    t.callExpression(
                        transformCallee(path.node.callee),
                        path.node.arguments.map(arg =>
                            isUnderscore(arg)
                                ? provider.shift()
                                : arg)))

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

                const computed = isUnderscore(path.node.property)
                if (computed) {
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
                        computed || path.node.computed))

                path.replaceWith(curried(lambda))
            },

            BinaryExpression(path) {
                if (hasNoHoles(path) || options.skip.indexOf(path.node.operator) !== -1) {
                    return
                }

                const parameters = []

                if (isUnderscore(path.node.left) || isUnderscoreAccess(path.node.left)) {
                    parameters.push(path.scope.generateUidIdentifier('_'))
                }

                if (isUnderscore(path.node.right) || isUnderscoreAccess(path.node.right)) {
                    parameters.push(path.scope.generateUidIdentifier('_'))
                }

                if (parameters.length === 0) {
                    return
                }

                const provider = parameters.slice()
                const transform = node =>
                    isUnderscore(node)
                        ? provider.shift()
                        : isUnderscoreAccess(node)
                            ? t.memberExpression(
                                provider.shift(),
                                node.property,
                                node.computed)
                            : node

                const lambda = t.arrowFunctionExpression(
                    parameters,
                    t.BinaryExpression(
                        path.node.operator,
                        transform(path.node.left),
                        transform(path.node.right)))

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
                        path.node.prefix))

                path.replaceWith(curried(lambda))
            },

            Identifier(path) {
                if (path.node.name !== '_' || hasNoHoles(path)) {
                    return
                }

                const parameter = path.scope.generateUidIdentifier('_')
                const lambda = t.arrowFunctionExpression(
                    [parameter],
                    parameter)

                path.replaceWith(curried(lambda))
            }
        }
    }
}
