# babel-plugin-holes

This plugin is made to bring the powerful expressivity of Scala functions to JavaScript.
It provides a powerful system of holes to help on functional programming and function
composition, enforcing the point-free style.

It's very well tested and has consistent rules that shouldn't break when used with other
plugins. You can also abstract the native JavaScript operations with it without overheads!

## Examples

```js
// Binary operators
const add = _ + _
const increment = _ + 1

console.log(add(100, 200)) // 300
console.log(increment(1000)) // 1001


// Unary operators
const negate = -_

console.log(negate(10)) // -10


// Operators as functions
const at = _[_]
const call = _(_)

console.log(at([5, 10, 15], 1])) // 10
call(console.log, 'Hello!') // 'Hello!'


// Identity function
const id = _

console.log(id('frobnicate')) // 'frobnicate'


// Method calls
const toString = _.toString()
const toHexString = _.toString(16)

console.log(toString(10)) // 10
console.log(toHexString(10)) // 'a'
```

It works on identifiers, simple members, computed members, calls, binary and unary
expressions, so you can compose functions that take more parameters, for example:

```js
const assocOne = assoc(_, 1, _)

console.log(assocOne('value', {})) // { value: 1 }
```

## Disabling in current scope

If you want to use the original underscore, you can disable this plugin in
current scope (and its children scopes) using `'no holes'` directive.

## Installation

```sh
$ npm install --save-dev babel-plugin-holes
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["holes"]
}
```

### Via CLI

```sh
$ babel --plugins holes script.js
```

### Via Node API

```javascript
require('babel-core').transform('code', {
  plugins: ['holes']
});
```

# License

MIT
