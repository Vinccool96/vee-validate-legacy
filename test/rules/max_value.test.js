import { expect, test } from "vitest"

import { validate } from "../../src/rules/max_value"

const valid = [0, "1", 10]

const invalid = ["", 10.01, 11, [], undefined, null, {}, "abc"]

test("validates number maximum value", () => {
  expect.assertions(11)
  const max = 10

  // valid.
  valid.forEach((value) => expect(validate(value, { max })).toBe(true))

  // invalid
  invalid.forEach((value) => expect(validate(value, { max })).toBe(false))
})

test("handles array of values", () => {
  expect(validate(valid, { max: 10 })).toBe(true)

  expect(validate(invalid, { max: 10 })).toBe(false)
})
