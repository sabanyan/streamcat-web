//@flow
import Model from '../index'

export type CSVModelProps = {
  data: string;
  uuid: string
}

export default class CSVModel extends Model {
  constructor (props: CSVModelProps) {
    super(props)
    this.initialize(props, 'data')
    this.initialize(props, 'uuid')
  }

  getCSVFileName () {
    return this.uuid + '.csv'
  }

  handleDownload () {
    const blob = new Blob([this.data], {'type': 'text/plain'})
    if (window.navigator.msSaveBlob) {
      window.navigator.msSaveBlob(blob, this.getCSVFileName())
      // msSaveOrOpenBlobの場合はファイルを保存せずに開ける
      window.navigator.msSaveOrOpenBlob(blob, this.getCSVFileName())
    } else {
      let element = document.getElementById('csv_download')
      element.href = window.URL.createObjectURL(blob)
      element.download = this.getCSVFileName()
      document.querySelector('#csv_download').click()
    }
  }

}