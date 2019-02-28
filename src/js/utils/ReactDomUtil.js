//@flow
import { renderToString } from 'react-dom/server'
import * as React from 'react'

export default class ReactDomUtil {
  static renderToString(element:React.Node) {
    return renderToString(element)
  }
}

