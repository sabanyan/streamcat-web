//@flow
import { renderToString } from 'react-dom/server'
import * as React from 'react'

type ReactElementType = React.ReactElement<any, string | React.JSXElementConstructor<any>>

export class ReactDomUtil {
    static renderToString(element: ReactElementType | {}) {
        // elementが{}の場合は空文字を返す
        if (Object.keys(element).length === 0) {
            return '';
        }
        return renderToString(element as ReactElementType);
    }
}

