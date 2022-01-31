// @flow
export default class ZoomUtil {
  static zoom (value: number, zoom: number) {
    const ratio = zoom / 100
    return value * ratio
  }

  static zoomReverse (value: number, zoom: number) {
    const ratio = 100 / zoom
    return value * ratio
  }
}