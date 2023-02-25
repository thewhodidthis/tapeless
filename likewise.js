// # Likewise
// Helps create assertions with a few basic ones added in.

// Creates an assertion by wrapping a given function, "expected" value, and "operator" key
// to produce a custom `Error` if the original function fails when called.
function reassert(assert = identity, expectedMaybe, operator = "is") {
  // Attempt to extract a name for the would be assertion; could be using the
  // optional chaining operator in ES2020, eg. `assert?.name`.
  const name = assert && assert.name

  // Throws if the function being wrapped fails.
  const test = (...assertion) => {
    // Run test and pass on the result if truthy.
    const result = assert(...assertion)

    if (result) {
      return result
    }

    // Fill in a few details cooking up own exception if the result is falsy.
    const [actual, expected = expectedMaybe] = assertion
    const error = Error(name)

    throw Object.assign(error, { actual, expected, operator })
  }

  // Preserve name of function being wrapped.
  Object.defineProperty(test, "name", {
    value: name,
    configurable: true,
  })

  return test
}

// Declare placeholder input.
function identity(v) {
  return v
}

// Checks for truthiness by default when no function is fed in.
// https://2ality.com/2013/04/quirk-implicit-conversion.html
const assert = reassert()

// Add named checks for truthiness.
const truthy = (a) => !!a
const falsy = (a) => !a

assert.ok = reassert(truthy, true, "!!")
assert.notOk = reassert(falsy, false, "!")

// Add named checks for equality.
const same = (a, b) => Object.is(a, b)
const different = (a, b) => !same(a, b)

assert.equal = reassert(same)
assert.notEqual = reassert(different)

export { assert, reassert }
