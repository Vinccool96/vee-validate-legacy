import { defineRuleParamConfig } from "../types"

const validate = (files: File | File[], { size }: Record<string, any>) => {
  if (isNaN(size)) {
    return false
  }

  const nSize = size * 1024
  if (!Array.isArray(files)) {
    return files.size <= nSize
  }

  for (let i = 0; i < files.length; i++) {
    if (files[i].size > nSize) {
      return false
    }
  }

  return true
}

const params = [
  defineRuleParamConfig({
    name: "size",
    cast(value) {
      return Number(value)
    },
  }),
] as const

export { validate, params }

export default {
  validate,
  params,
}
