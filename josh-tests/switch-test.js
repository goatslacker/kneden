const assert = require('assert')

async function one() {
  return Promise.resolve(1)
}

async function two() {
  return Promise.resolve(2)
}

async function three() {
  return Promise.resolve(3)
}

function okSwitch(x) {
  switch (x) {
    case 1:
      return 1
    case 2:
      val = 2
    default:
      val = 3
  }
  return val
}

// async function testSwitch(x) {
//   let val = null
//   switch (x) {
//     case 1:
//       return await one()
//     case 2:
//       val = await two()
//       break
//     default:
//       val = await three()
//   }
//
//   return val
// }

// broken
// testSwitch(1).then(v => assert.equal(v, 1))

// works
// testSwitch(2).then(v => assert.equal(v, 2))
// testSwitch(3).then(v => assert.equal(v, 3))
