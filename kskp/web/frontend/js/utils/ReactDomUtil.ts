//@flow
import { renderToString } from 'react-dom/server'
import * as React from 'react'

export class ReactDomUtil {
  static renderToString (element: React.ReactElement<any, string | React.JSXElementConstructor<any>>) {
    return renderToString(element)
  }
}

