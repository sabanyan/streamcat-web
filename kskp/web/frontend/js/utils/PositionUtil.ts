export class PositionUtil {

  static getLeftTopPosition (htmlElement: string) {
    const selector = document.querySelector(htmlElement);
    return {
      x: selector ? selector.scrollLeft : 0,
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