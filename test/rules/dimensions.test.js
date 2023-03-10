import { beforeEach, expect, test } from "vitest"

import { validate } from "../../src/rules/dimensions"
import helpers from "./../helpers"

let fails = false

beforeEach(() => {
  global.window.URL = {
    createObjectURL() {
      return "data:image/png;base64,AAAAAAA"
    },
  }

  global.window.webkitURL = {
    createObjectURL() {
      return "data:image/png;base64,AAAAAAA"
    },
  }

  global.Image = class Image {
    set src(value) {
      this.width = 150
      this.height = 100

      this[fails ? "onerror" : "onload"]()
    }
  }
})

// eslint-disable-next-line
test('validates image dimensions', async () => {
  let result = await validate(helpers.file("file.jpg", "image/jpeg", 10), { width: 150, height: 100 })
  expect(result).toBe(true)

  // mock a failing Image, even with the right dimensions.
  fails = true
  result = await validate([helpers.file("file.jpg", "image/jpeg", 10)], { width: 150, height: 100 })
  expect(result).toBe(false)

  fails = false
  // not an image.
  result = await validate([helpers.file("file.pdf", "application/pdf", 10)], { width: 150, height: 100 })
  expect(result).toBe(false)

  // wrong dimensions.
  result = await validate([helpers.file("file.jpg", "image/jpeg", 10)], { width: 15, height: 10 })
  expect(result).toBe(false)

  global.URL = undefined // test webkit fallback.
  result = await validate([helpers.file("file.jpg", "image/jpeg", 10)], { width: 150, height: 100 })
  expect(result).toBe(true)
})
