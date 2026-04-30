// Re-export React's JSX namespace globally so JSX.Element works
// without needing `import React` in every file (React 19 / Next.js 15).
import type { JSX as ReactJSX } from 'react'

declare global {
  namespace JSX {
    type Element = ReactJSX.Element
    type ElementClass = ReactJSX.ElementClass
    type IntrinsicElements = ReactJSX.IntrinsicElements
  }
}
