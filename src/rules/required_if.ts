import { includes, isEmptyArray } from "../utils"
import { defineRuleParamConfig } from "../types"

const testEmpty = (value: any) =>
  isEmptyArray(value) || includes([false, null, undefined], value) || !String(value).trim().length

const validate = (value: any, { target, values }: Record<string, any>) => {
  let required

  if (values && values.length) {
    if (!Array.isArray(values) && typeof values === "string") {
      values = [values]
    }

    // eslint-disable-next-line
    required = values.some((val: any) => val == String(target).trim());
  } else {
    required = !testEmpty(target)
  }

  if (!required) {
    return {
      valid: true,
      required,
    }
  }

  return {
    valid: !testEmpty(value),
    required,
  }
}

const params = [
  defineRuleParamConfig({
    name: "target",
    isTarget: true,
  }),
  defineRuleParamConfig({
    name: "values",
  }),
] as const

export const computesRequired = true

export { validate, params }

export default {
  validate,
  params,
  computesRequired,
}
