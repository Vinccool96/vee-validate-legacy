import { describe, expect, it } from "vitest"

import { mount } from "@vue/test-utils"
import flushPromises from "flush-promises"

import { configure, ValidationProvider } from "../src/index.full"

describe("config", function () {
  it("should set config using configure fn", async function () {
    configure({
      bails: false,
    })

    const wrapper = mount(
      {
        props: {},
        data: () => ({
          value: "",
        }),
        template: `
        <div>
          <ValidationProvider :immediate="true" rules="required|min:3" v-slot="{ errors }">
            <input v-model="value" type="text">
            <span class="error" v-for="error in errors">{{ error }}</span>
          </ValidationProvider>
        </div>
      `,
      },
      { global: { components: { ValidationProvider } } }
    )

    // flush the pending validation.
    await flushPromises()
    const errors = wrapper.findAll(".error")
    expect(errors).toHaveLength(2)

    expect(errors.at(0)?.text()).toContain("The {field} field is required")
    expect(errors.at(1)?.text()).toContain("The {field} field must be at least 3 characters")
  })
})
