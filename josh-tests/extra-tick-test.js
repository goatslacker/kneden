let i = 0
function test(assert, val) {
  if (i === 0) {
    assert.equal(val, 1)
  } else {
    assert.equal(val, 2)
  }
  i += 1
}

const foo = async (assert) => {
  test(assert, 1)
  return (await 1) + 2
}


export default async (assert) => {
  foo(assert)
  test(assert, 2)
}
