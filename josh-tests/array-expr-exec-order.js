const assert = require('assert')

const a = () => 1
const b = async () => 2
const c = () => 3
const d = async () => ({
  ok: 4,
})

async function test() {
  return [a(), await b(), c(), (await d()).ok];
}

test().then(value => {
  assert.deepEqual(value, [1, 2, 3, 4])
})
