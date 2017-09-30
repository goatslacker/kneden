const db = {
  async destroy() {
    return null
  }
}

async function test() {
  await db.destroy();
}

export default async (assert) => {
  const val = await test()
  assert.equal(val, undefined)
}
