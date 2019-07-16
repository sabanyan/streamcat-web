export default class PositionUtil {

  static getLeftTopPosition (htmlElement: string) {

    return {
      x: document.querySelector(htmlElement).scrollLeft,
      y: window.pageYOffset
    }
  }

  static getCenterPosition (htmlElement: string) {
    let leftTopPosition = PositionUtil.getLeftTopPosition(htmlElement)

    return {
      x: leftTopPosition.x + (window.innerWidth - 400) / 2,
      y: leftTopPosition.y + (window.innerHeight - 60) / 2
    }
  }
}