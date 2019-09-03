//@flow

type dataSetType = {
  label: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number,
  hoverBackgroundColor: string;
  hoverBorderColor: string;
  data: any;
}

export default class ChartUtil {
  static color (index: number): string {
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

  static jsonToChart (json: {}): { datasets: [], labels: [] } {

    let data: {} = json

    let labels: [] = []
    let datasets: [] = []

    labels = Object.keys(data).map((key: string, index: number): string => {
      return key
    })

    datasets = Object.keys(data).map((key: string, index: number): dataSetType => {
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

    console.log(datasets)

    return {
      datasets: datasets,
      labels: labels,
    }

    //
    //
    // let data:{} = json
    //
    // let labels:[] = []
    // let datasets:[] = []
    //
    // labels = Object.keys(data).map((key:string):string => {
    //   return key
    // })
    //
    //
    // let max_row = 0
    // Object.keys(data).forEach((key:string)=>{
    //   max_row = Math.max(max_row,data[key].length)
    // })
    //
    // console.log(max_row)
    //
    // for(let index=0; index < max_row;index++){
    //   const graphData = Object.keys(data).map((key:string):string => {
    //     return data[key][index]
    //   })
    //
    //   datasets.push({
    //     label: "",
    //     backgroundColor: ChartUtil.color(index),
    //     borderColor: ChartUtil.color(index),
    //     borderWidth: 1,
    //     hoverBackgroundColor: ChartUtil.color(index),
    //     hoverBorderColor: ChartUtil.color(index),
    //     data: graphData,
    //   })
    // }
    //
    // console.log(datasets)
    //
    // return {
    //   datasets: datasets,
    //   labels: labels,
    // }

  }
}

