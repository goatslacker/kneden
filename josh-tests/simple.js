import assert from 'assert'

const d = async () => ({
  ok: 4,
})

async function test() {
  const val = await d()
  return val.ok
}

export default async assert => {
  const val = await test()
  assert.equal(val, 4)
}
