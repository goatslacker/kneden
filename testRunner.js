const assert = require('assert')
const vm = require('vm')
const { transformFileSync } = require('babel-core')

const BabelPluginAsyncToPromise = require('./src/index')

//const file = './josh-tests/array-expr-exec-order.js'
//const file = './josh-tests/simple.js'
const file = './josh-tests/extra-tick-test.js'
//const file = './josh-tests/await-func-call.js'

const { code } = transformFileSync(file, {
  plugins: [
    [BabelPluginAsyncToPromise],
  ]
})

function errorHandler(err) {
  console.log(code)
  console.error(err.stack)
  process.exit(1)
}

process.on('unhandledRejection', errorHandler)
process.on('uncaughtException', errorHandler)

function wrap() {
  let assertions = 0
  const assert2 = {}

  Object.keys(assert).forEach(key => {
    if (typeof assert[key] === 'function') {
      assert2[key] = function (...args) {
        assertions += 1
        return assert[key](...args)
      }
    } else {
      assert2[key] = assert[key]
    }
  })

  assert2.getAssertions = () => assertions

  return assert2
}

const assert2 = wrap(assert)
const result = vm.runInNewContext(code, {
  exports,
})
result(assert2).then(() => {
  console.log('OK')
  console.log('Tests', assert2.getAssertions())
}).catch(errorHandler)
