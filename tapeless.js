var tapeless = (function(exports) {
  "use strict"

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
  const assert$1 = reassert()

  // Add named checks for truthiness.
  const truthy = (a) => !!a
  const falsy = (a) => !a

  assert$1.ok = reassert(truthy, true, "!!")
  assert$1.notOk = reassert(falsy, false, "!")

  // Add named checks for equality.
  const same = (a, b) => Object.is(a, b)
  const different = (a, b) => !same(a, b)

  assert$1.equal = reassert(same)
  assert$1.notEqual = reassert(different)

  // # Tapeling
  // TAP utils for sleepyheads.

  // Check if text search positive.
  const contains = text => query => text && text.search(RegExp(query, "i")) >= 0

  // Insert two spaces to the left of input, for when printing out errors.
  const pad = message => `  ${message}`

  // Yank the default logger.
  const { log } = console

  // Conditionally lay message on top of template for logging.
  const echo = (template, message) => (message ? echo(log(template, message)) : echo)

  // Collect stats mutated with each test line and reset on exit.
  const data = { test: 0, pass: 0, fail: 0, skip: 0 }

  // Make sure TAP head only shows on first call.
  Object.defineProperty(data, "head", {
    configurable: true,
    get() {
      return this.test > 1 ? "" : "TAP version 13"
    },
  })

  // Print report, clear stats, and quit.
  const exit = (exitCode) => {
    echo("%s", data.head)

    if (exitCode) {
      echo("Bail out! Exit with code %s", exitCode)
    } else {
      if (data.test || data.head) {
        log(`\n1..${data.test}\n# tests ${data.test}`)
      }

      for (const k of ["pass", "fail", "skip"]) {
        echo(`# ${k}  %d`, data[k])
      }
    }

    // Reset.
    data.test = data.pass = data.fail = data.skip = 0
  }

  // Contains methods for fluently describing and processing testlines.
  const tape = (assert = v => v) => ({
    // Collect testline specifics.
    describe(message, ...rest) {
      data.description = message
      data.diagnostics = rest

      return this
    },
    // Include copies of named module exports.
    exit,
    tape,
    // Process testline and update stats.
    test(...params) {
      let errorBlock

      try {
        assert(...params)
      } catch (error) {
        errorBlock = getErrorBlock(error)
      }

      // Use assertion name if no description provided, extract existing diagnostics.
      const description = data.description ?? (assert?.name || "(anon)")
      const diagnostics = data.diagnostics ?? []

      // Look for directives for items to exclude from vitals.
      const descriptionContains = contains(description)
      const skip = descriptionContains("# skip")
      const todo = descriptionContains("# todo")

      // Update totals.
      data.skip += skip ? 1 : 0
      data.fail += skip || todo || !errorBlock ? 0 : 1
      data.pass += skip || errorBlock ? 0 : 1
      data.test += 1

      // Print header maybe.
      echo("%s", data.head)

      // Print testline.
      echo(`${errorBlock ? "not " : ""}ok ${data.test} - %s`, description)

      // Add error yaml.
      echo("%s", errorBlock)

      // Add diagnostics.
      for (const item of diagnostics) {
        echo("# %s", item)
      }

      // Reset.
      delete data.diagnostics
      delete data.description
      delete data.head

      return this
    },
  })

  // Format error yaml.
  function getErrorBlock(error) {
    const scoop = ["operator", "expected", "actual"].map(k => `${k}: ${JSON.stringify(error[k])}`)
    const stack = error.stack.split("\n").map(pad)

    return ["---", ...scoop, "stack:", ...stack, "..."].map(pad).join("\n")
  }

  const assert = tape(assert$1)

  for (const x in assert$1) {
    assert[x] = tape(assert$1[x])
  }

  exports.assert = assert
  exports.reassert = reassert
  exports.report = exit
  exports.tape = tape

  return exports
})({})
