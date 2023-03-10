import { nextTick, VNode } from "vue"
import { debounce, isCallable, isRefEqual } from "../utils"
import { InteractionModeFactory, modes } from "../modes"
import { KnownKeys, ProviderInstance, ValidationFlags, ValidationResult } from "../types"
import { addVNodeListener, findModel, findValue, getInputEventName } from "../utils/vnode"
import { VueHookable } from "./hooks"
import { enableWarn, suppressWarn } from "../utils/console"

/**
 * Determines if a provider needs to run validation.
 */
function shouldValidate(ctx: ProviderInstance, value: string) {
  // when an immediate/initial validation is needed and wasn't done before.
  suppressWarn()
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (!ctx._ignoreImmediate && ctx.immediate) {
    return true
  }
  enableWarn()

  // when the value changes for whatever reason.
  if (!isRefEqual(ctx.value, value) && ctx.normalizedEvents.length) {
    return true
  }

  // when it needs validation due to props/cross-fields changes.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (ctx._needsValidation) {
    return true
  }

  // when the initial value is undefined and the field wasn't rendered yet.
  if (!ctx.initialized && value === undefined) {
    return true
  }

  return false
}

export interface ValidationContext extends Pick<ValidationFlags, KnownKeys<ValidationFlags>> {
  errors: string[]
  classes: Record<string, boolean>
  valid: boolean
  failedRules: Record<string, string>
  reset: () => void
  validate: (evtOrNewValue: Event | any) => Promise<ValidationResult>
  ariaInput: {
    "aria-invalid": "true" | "false"
    "aria-required": "true" | "false"
    "aria-errormessage": string
  }
  ariaMsg: {
    id: string
    "aria-live": "off" | "assertive"
  }
}

export function createValidationCtx(ctx: ProviderInstance): ValidationContext {
  return {
    ...ctx.flags,
    errors: ctx.errors,
    classes: ctx.classes,
    failedRules: ctx.failedRules,
    reset: () => ctx.reset(),
    validate: (...args: any[]) => {
      return ctx.validate(...args)
    },
    ariaInput: {
      "aria-invalid": ctx.flags.invalid ? "true" : "false",
      "aria-required": ctx.isRequired ? "true" : "false",
      "aria-errormessage": `vee_${ctx.id}`,
    },
    ariaMsg: {
      id: `vee_${ctx.id}`,
      "aria-live": ctx.errors.length ? "assertive" : "off",
    },
  }
}

export function onRenderUpdate(vm: ProviderInstance, value: any | undefined, vueHooks: VueHookable) {
  if (!vm.initialized) {
    vm.initialValue = value
  }

  const validateNow = shouldValidate(vm, value)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  vm._needsValidation = false
  vm.value = value
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  vm._ignoreImmediate = true

  if (!validateNow) {
    return
  }

  const validate = () => {
    if (vm.immediate || vm.flags.validated) {
      return triggerThreadSafeValidation(vm)
    }

    vm.validateSilent()
  }

  if (vm.initialized) {
    validate()
    return
  }

  vueHooks.hookOnce("hook:mounted", () => validate())
}

export function computeModeSetting(ctx: ProviderInstance) {
  const compute = (isCallable(ctx.mode) ? ctx.mode : modes[ctx.mode]) as InteractionModeFactory

  return compute(ctx)
}

export function triggerThreadSafeValidation(vm: ProviderInstance) {
  const pendingPromise: Promise<ValidationResult> = vm.validateSilent()
  // avoids race conditions between successive validations.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  vm._pendingValidation = pendingPromise
  return pendingPromise.then((result) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (pendingPromise === vm._pendingValidation) {
      vm.applyResult(result)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      vm._pendingValidation = undefined
    }

    return result
  })
}

// Creates the common handlers for a validatable context.
export function createCommonHandlers(vm: ProviderInstance) {
  suppressWarn()
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (!vm.$veeOnInput) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    vm.$veeOnInput = (e: any) => {
      vm.syncValue(e) // track and keep the value updated.
      vm.setFlags({ dirty: true, pristine: false })
    }
  }
  enableWarn()

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const onInput = vm.$veeOnInput

  suppressWarn()
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (!vm.$veeOnBlur) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    vm.$veeOnBlur = () => {
      vm.setFlags({ touched: true, untouched: false })
    }
  }
  enableWarn()

  // Blur event listener.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const onBlur = vm.$veeOnBlur

  suppressWarn()
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  let onValidate = vm.$veeHandler
  enableWarn()
  const mode = computeModeSetting(vm)

  // Handle debounce changes.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (!onValidate || vm.$veeDebounce !== vm.debounce) {
    onValidate = debounce(() => {
      nextTick(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (!vm._pendingReset) {
          triggerThreadSafeValidation(vm)
        }

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        vm._pendingReset = false
      })
    }, mode.debounce || vm.debounce)

    // Cache the handler, so we don't create it each time.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    vm.$veeHandler = onValidate
    // cache the debounced value, so we detect if it was changed.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    vm.$veeDebounce = vm.debounce
  }

  return { onInput, onBlur, onValidate }
}

// Adds all plugin listeners to the vnode.
export function addListeners(vm: ProviderInstance, node: VNode, vueHooks: VueHookable) {
  const value = findValue(node)
  // cache the input eventName.
  suppressWarn()
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  vm._inputEventName = vm._inputEventName || getInputEventName(node, findModel(node))
  enableWarn()
  onRenderUpdate(vm, value?.value, vueHooks)

  const { onInput, onBlur, onValidate } = createCommonHandlers(vm)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  addVNodeListener(node, vm._inputEventName, onInput)
  addVNodeListener(node, "onBlur", onBlur)

  // add the validation listeners.
  vm.normalizedEvents.forEach((evt: string) => {
    addVNodeListener(node, evt, onValidate)
  })

  vm.initialized = true
}
