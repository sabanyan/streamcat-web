import TYPES from './actions/types/index'

export type Content = {
  width: number
}

export type Inspector = {
  width: number
}

type State = {
  content: Content
  inspector: Inspector
}

export const CommonReducerInitialState = {
  content: { width: getContentWidth(400) },
  inspector: { width: 400 }
}

function getWindowSize() {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  }
}

function getContentWidth(inspectorWidth:number) {
  let width =  getWindowSize().width - 400
  if (width < 400) width = 400

  return width
}

const CommonReducer = (state: State = CommonReducerInitialState, action: any) => {
  let newState = state

  switch (action.type) {
    case TYPES.SET_INSPECTOR_SIZE: newState = setInspectorSize(state, action)
      break
  }

  return newState
}

function setInspectorSize(state: State, action): State {
  const width = action.wdtih
  const inspector = { ...state.inspector, width: width }
  const content = { ...state.content, width: getContentWidth(width) }

  return { ...state, inspector: inspector, content: content }
}

export default CommonReducer

