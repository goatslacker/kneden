const { transformFileSync } = require('babel-core')

const { code } = transformFileSync('./josh-tests/extra-tick-test.js')
const vm = require('vm')

function errorHandler(err) {
  console.log(code)
  console.log('/EOF')
  console.error(err.stack)
  process.exit(1)
}

process.on('unhandledRejection', errorHandler)
process.on('uncaughtException', errorHandler)
eval(code)
