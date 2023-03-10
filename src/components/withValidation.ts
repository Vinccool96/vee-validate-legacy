import { Component, h } from "vue"

import { ValidationProvider } from "./Provider"
import { identity } from "../utils"
import {
  findModel,
  findModelConfig,
  findValue,
  getInputEventName,
  mergeVNodeListeners,
  normalizeSlots,
} from "../utils/vnode"
import { createCommonHandlers, createValidationCtx, onRenderUpdate, ValidationContext } from "./common"
import { getVueHooks } from "./hooks"
import { enableWarn, suppressWarn } from "../utils/console"

type ValidationContextMapper = (ctx: ValidationContext) => Record<string, any>
type ComponentLike = Component | { options: any }

export function withValidation(component: ComponentLike, mapProps: ValidationContextMapper = identity): Component {
  const options = "options" in component ? component.options : component
  const providerOpts = ValidationProvider as any
  const hoc: any = {
    name: `${options.name || "AnonymousHoc"}WithValidation`,
    props: { ...providerOpts.props },
    data: providerOpts.data,
    computed: { ...providerOpts.computed },
    methods: { ...providerOpts.methods },
    beforeUnmount: providerOpts.beforeUnmount,
    inject: providerOpts.inject,
  }

  const eventName = options?.model?.event || "onUpdate:modelValue"

  hoc.render = function () {
    this.registerField()
    const vctx = createValidationCtx(this)

    const model = findModel(this.$.vnode)
    suppressWarn()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this._inputEventName = this._inputEventName || getInputEventName(this.$.vnode, model)
    enableWarn()
    const value = findValue(this.$.vnode)
    onRenderUpdate(this, value?.value, getVueHooks(this))

    const { onInput, onBlur, onValidate } = createCommonHandlers(this)

    suppressWarn()
    mergeVNodeListeners(this, eventName, onInput)
    mergeVNodeListeners(this, "onBlur", onBlur)
    this.normalizedEvents.forEach((evt: string) => {
      mergeVNodeListeners(this, evt, onValidate)
    })
    enableWarn()

    // Props are any attrs not associated with ValidationProvider Plus the model prop.
    // WARNING: Accidental prop overwrite will probably happen.
    const { prop } = findModelConfig(this.$.vnode) || { prop: "modelValue" }
    const props = { ...{ [prop]: model?.value }, ...mapProps(vctx) }

    suppressWarn()
    const rendered = h(options, props, normalizeSlots(this.$slots, this.$.vnode.ctx.ctx))
    enableWarn()

    return rendered
  }

  return hoc
}
