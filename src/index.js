const hasNoShortPropertyAccess = path =>
    !!path.findParent(({ node }) =>
        node.directives && node.directives.some(({ value }) => value.value === 'no short property access'))

export default ({ types: t }) => ({
    visitor: {
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
        }
    }
})
