import Constants from '../constants'

export default class ChartUtil {
  static color (index: number) {
    const colors = [
      '#ff7f7f',
      '#ffff7f',
      '#ffbf7f',
      '#7f7fff',
      '#ff7fff',
      '#7fff7f',
      '#bf7fff',
      '#bfff7f',
      '#7fbfff',
      '#ff7fbf',
      '#7fffff',
      '#7fffbf',
    ]
    return colors[index % 12]
  }

  static jsonToChart (json: {}) {

    let data = json

    let labels = []
    let datasets = []

    labels = Object.keys(data).map((key) => {
      return key
    })

    datasets = Object.keys(data).map((key, index) => {
      return {
        label: key,
        backgroundColor: ChartUtil.color(index),
        borderColor: ChartUtil.color(index),
        borderWidth: 1,
        hoverBackgroundColor: ChartUtil.color(index),
        hoverBorderColor: ChartUtil.color(index),
        data: data[key],
      }
    })

    return {
      datasets: datasets,
      labels: labels,
    }
  }
}

