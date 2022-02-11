import TYPES from './types/index';

export function setInspectorSizeAction(width:number) {
  return {
    type: TYPES.SET_INSPECTOR_SIZE,
    width: width
  }
}