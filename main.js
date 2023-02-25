import { assert as axxert, reassert } from "./likewise.js"
import { exit as report, tape } from "./tapeling.js"

const assert = tape(axxert)

for (const x in axxert) {
  assert[x] = tape(axxert[x])
}

export { assert, reassert, report, tape }
