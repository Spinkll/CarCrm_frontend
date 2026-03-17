"use client"

import { motion, AnimatePresence, type HTMLMotionProps, type AnimatePresenceProps } from "framer-motion"
import { forwardRef, type ReactNode, type ElementType, type ComponentPropsWithoutRef } from "react"

export type MotionDivProps = HTMLMotionProps<"div">

export const MotionDiv = forwardRef<HTMLDivElement, MotionDivProps>((props, ref) => {
  return <motion.div ref={ref} {...props} />
})
MotionDiv.displayName = "MotionDiv"

export const MotionSpan = forwardRef<HTMLSpanElement, HTMLMotionProps<"span">>((props, ref) => {
  return <motion.span ref={ref} {...props} />
})
MotionSpan.displayName = "MotionSpan"

export const MotionP = forwardRef<HTMLParagraphElement, HTMLMotionProps<"p">>((props, ref) => {
  return <motion.p ref={ref} {...props} />
})
MotionP.displayName = "MotionP"

export const MotionH1 = forwardRef<HTMLHeadingElement, HTMLMotionProps<"h1">>((props, ref) => {
  return <motion.h1 ref={ref} {...props} />
})
MotionH1.displayName = "MotionH1"

export const MotionH2 = forwardRef<HTMLHeadingElement, HTMLMotionProps<"h2">>((props, ref) => {
  return <motion.h2 ref={ref} {...props} />
})
MotionH2.displayName = "MotionH2"

export const MotionButton = forwardRef<HTMLButtonElement, HTMLMotionProps<"button">>((props, ref) => {
  return <motion.button ref={ref} {...props} />
})
MotionButton.displayName = "MotionButton"

interface AnimatePresenceWrapperProps {
  children: ReactNode
  mode?: AnimatePresenceProps["mode"]
  initial?: boolean
}

export function AnimatePresenceWrapper({ children, mode = "wait", initial = true }: AnimatePresenceWrapperProps) {
  return (
    <AnimatePresence mode={mode} initial={initial}>
      {children}
    </AnimatePresence>
  )
}

export { AnimatePresence }
