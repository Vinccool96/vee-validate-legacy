import { alphaDash } from "./alpha_helper"
import { defineRuleParamConfig } from "../types"

const validate = (value: string | string[], { locale = "" }: Record<string, any> = {}): boolean => {
  if (Array.isArray(value)) {
    return value.every((val) => validate(val, { locale }))
  }

  // Match at least one locale.
  if (!locale) {
    return Object.keys(alphaDash).some((loc) => alphaDash[loc].test(value))
  }

  return (alphaDash[locale] || alphaDash.en).test(value)
}

const params = [
  defineRuleParamConfig({
    name: "locale",
  }),
] as const

export { validate, params }

export default {
  validate,
  params,
}
