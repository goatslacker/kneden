const { transformFileSync } = require('babel-core')

const BabelPluginAsyncToPromise = require('./')

const { code } = transformFileSync('./josh-tests/array-expr-exec-order.js', {
  plugins: [
    [BabelPluginAsyncToPromise],
  ]
})

function errorHandler(err) {
  console.log(code)
  console.log('/EOF')
  console.error(err.stack)
  process.exit(1)
}

process.on('unhandledRejection', errorHandler)
process.on('uncaughtException', errorHandler)
eval(code)
//console.log(code)
