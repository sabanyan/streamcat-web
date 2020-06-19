//@flow
import Model from "Model/Core";

export type CSVModelProps = {
  data: string;
  uuid: string;
  label: string;
}

export default class CSVModel extends Model {
  label: string = "";
  data: any;
  constructor (props: CSVModelProps) {
    super()
    this.initialize(props, 'data')
    this.initialize(props, 'uuid')
    this.initialize(props, 'label')
  }

  getCSVFileName () {
    return this.label + '.csv'
  }

  handleDownload () {
    const blob = new Blob([this.data], {'type': 'text/plain'})
    if (window.navigator.msSaveBlob) {
      window.navigator.msSaveBlob(blob, this.getCSVFileName())
      // msSaveOrOpenBlobの場合はファイルを保存せずに開ける
      window.navigator.msSaveOrOpenBlob(blob, this.getCSVFileName())
    } else {
      let element: HTMLAnchorElement | null = document.getElementById('csv_download') as HTMLAnchorElement
      if(element){
        element.href = window.URL.createObjectURL(blob)
        element.download = this.getCSVFileName()
        const csvDownLoadEl:HTMLAnchorElement | null = document.querySelector('#csv_download');
        if(csvDownLoadEl)csvDownLoadEl.click()
      }
    }
  }

}
