const assert = require('assert')

let i = 0
function test(val) {
  if (i === 0) {
    assert.equal(val, 1)
  } else {
    assert.equal(val, 2)
  }
  i += 1
}

const foo = async () => {
  test(1)
  return (await 1) + 2
}
foo()
test(2)
