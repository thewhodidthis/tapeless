## about

Runtime agnostic pure JS package to help with [TAP](https://testanything.org) formatted unit testing.

## setup

Load via script tag:

```html
<!-- Just an IIFE namespaced `tapeless` -->
<script src="https://thewhodidthis.github.io/tapeless/tapeless.js"></script>
```

Source from an [import map](https://github.com/WICG/import-maps):

```json
{
  "imports": {
    "tapeless": "https://thewhodidthis.github.io/tapeless/main.js"
  }
}
```

Download from GitHub directly if using a package manager:

```sh
# Add to package.json
npm install thewhodidthis/tapeless -D
```

## usage

When testing against the DOM or Web APIs is there any replacement for the browser? And then why would a bundler be even necessary?

```html
<script src="https://thewhodidthis.github.io/tapeless/tapeless.js"></script>
<script type="module">
  tapeless.assert.notOk.describe("JS is weird").test(0, -0)
  tapeless.report()
</script>
```

## overview
### main

A test harness that is smaller than [tape](https://github.com/substack/tape) and can be used in-browser as is. There are only four assertions provided: `ok()`, `notOk()`, `equal()`, and `notEqual()`. Add [kpow](https://npm.im/kpow) and [cutaway](https://npm.im/cutaway) to run browser side. For example, given a test script like:

```js
// Sample test.js
import "https://thewhodidthis.github.io/cutaway/main.js"
import * as tapeless from "https://thewhodidthis.github.io/tapeless/main.js"

const { equal: same, ok } = tapeless.assert

const sample = { a: "a", b: "b" }
const id = (input = sample) => input

same.test(typeof id, "function")
ok.test(sample)
same.test(sample, id())

tapeless.report()
```

Bundling along the lines of:

```sh
npx -p kpow 'cat test.js | kpow'
```

Gives out:

![TAP in HTML sample](https://i.imgur.com/A2bwjDX.png)

### likewise

Produces exceptions for failing assertions. Includes ready-made checks for truthiness and equality. The named export `reassert()` is available for creating own assertions. For example,

```js
import { reassert } from "https://thewhodidthis.github.io/tapeless/likewise.js"

// Basic truthiness checking
const truthy = v => !!v
const falsy = v => !v

// Wrap with `reassert()` to throw an `Error` with
// the 'expected' value and an 'operator' key on failure,
// the 2nd and 3rd arguments respectively.
const ok = reassert(truthy, true, "!!")
const notOk = reassert(falsy, false, "!")

// Clean run hopefully.
console.assert(ok(true), "ok")
console.assert(notOk(0), "not ok")
```

Additionally, `ok()` and `equal()` plus counterparts are attached to `assert()` already wrapped. For example,

```js
import { assert } from "https://thewhodidthis.github.io/tapeless/likewise.js"

// Clean run hopefully.
console.assert(assert.notOk(0), "not ok")
console.assert(assert.ok(true), "ok")

// Based on `Object.is()`.
console.assert(assert.notEqual(null, 0), "not equal")
console.assert(assert.equal(null, null), "equal")
```

### tapeling

Helps gather TAP reports. Assuming a test function that throws if a given operation fails as for example,

```js
// Check for sameness or equality.
function throwsIfDifferent(a, b, message = "Sorry!") {
  const result = Object.is(a, b)

  if (result) {
    return result
  }

  const error = Error(message)

  error.operator = "is"
  error.expected = a
  error.actual = b

  throw error
}
```

Wrap with `tape()` and call `exit()` to print out the corresponding TAP report. For example,

```js
// Needs the `--experimental-network-imports` flag when called with `node(1)`.
import * as tapeling from "https://thewhodidthis.github.io/tapeless/tapeling.js"

const assert = tapeling.tape(throwsIfDifferent)

assert
  // Fails.
  .test(2, 3)
  // Name test case, add diagnostic.
  .describe("is same", "will compute")
  // Passes.
  .test(2, 2)

// Print totals.
process.on("exit", tapeling.exit)
```

Sample output with truncated error stack:

```console
TAP version 13
not ok 1 - throwsIfDifferent
  ---
  operator: "is"
  expected: 2
  actual: 3
  stack:
    Error: Sorry!
        at throwsIfDifferent
  ...
ok 2 - is same
# will compute

1..2
# tests 2
# pass  1
# fail  1
```

In Node.js all of [`assert`](https://nodejs.org/api/assert.html) may be wrapped a-la [tapjs/tapsert](https://github.com/tapjs/tapsert) making a range of involved checks available:

```js
import process from "process"
import axxert from "assert"

// As above.
import { tape, exit } from "https://thewhodidthis.github.io/tapeless/tapeling.js"

// Print out results once the script is done.
process.on("exit", exit)

const assert = tape(axxert)

for (const x in axxert) {
  if (x !== "CallTracker" || x !== "AssertionError") {
    assert[x] = tape(axxert[x])
  }
}

/*
TAP version 13
ok 1 - ok

1..1
# tests 1
# pass  1
*/
assert.test(typeof assert, "function")
```
