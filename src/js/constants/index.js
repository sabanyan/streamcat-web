//@flow
const Constants = {
  debug: false,
  default: {
    uuid:{
      v4Format:"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
    },
    node: {
      width: 38,
      height: 38,
    },
    graph: {
      nodeSeparator: 80 + 8 * 2,//ノードのテキスト部分80px+余白8px×2
      rankSeparator: 44,
    },
    datasource: {
      width: 38 + 6 * 2,
      height: 38 + 6 * 2,
    },
    operator: {
      cx: (38 + 6 * 2) / 2,
      cy: (38 + 6 * 2) / 2,
      r: (38 + 6 * 2) / 2,
      width: 38 + 6 * 2,
      height: 38 + 6 * 2,
    },
    step: {
      width: 38 + 6 * 2,
      height: 38 + 6 * 2,
      borderWidth: 2,
      icon: {
        width: 42,
        height: 42,
        padding: 8,
      },
    },
    command: {
      inputPortName:"i",
      outputPortName:"i",
    }
  },
  step:{
    type:{
      command:"command",
      frame:"frame",
      subflow:"flow"
    }
  },
  param:{
    type:{
      string:"string",
      boolean:"boolean"
    }
  },
  data:{
    dataSource:{
      csv:"csv"
    }
  },
  api: {
    host: window.location.host,
  },
  color: {
    datasource: '#6AD0FB',
    operator: '#F99D39',
  },
  paper: {
    padding: {
      right: 40,
      bottom: 120,
    },
  },
  modal: {
    ADD_COMMAND: 'add_command',
    ADD_PROJECT: 'add_project',
    ADD_FLOW: 'add_flow',
    IMPORT_DATASOURCE: 'import_datasource',
    SHOW_MESSAGE: 'show_message_modal',
    CONFIRM: 'confirm',
    SHOW_RUN_RESULT: 'show_run_result',
    SHOW_RUN_ERROR: 'show_run_error',
    property: {
      title: 'title',
      message: 'message',
    },
  },
  format:{
    date: "YYYY-MM-DD",
    dateTime: "YYYY-MM-DD HH:mm:ss"
  },
  preview: {
    DATASOURCE: 'preview_datasource',
  },
  event: {
    ON_LOAD_NAVIGATION: 'onLoadNavigation',
    MODAL_EVENT: 'ModalEvent',
    MODAL_ON_CLICK_OK: 'ModalOnClickDone',
    MODAL_ON_CLICK_DONE: 'ModalOnClickDone',
    MODAL_ON_CLICK_CANCEL: 'ModalOnClickCancel',
    ON_CHANGE_FORM: "ON_CHANGE_FORM",
    ON_SUBMIT_FORM: "ON_SUBMIT_FORM"
  },
  chart: {
    bar: 'bar',
    bubble: 'bubble',
    doughnut: 'doughnut',
    horizontalBar: 'horizontalBar',
    line: 'line',
    pie: 'pie',
    polar: 'polar',
    radar: 'radar',
    scatter: 'scatter',
  },
  lang:{
    classification:{
      subflow:"サブフロー",
      calculation:"項目間の計算",
      col_edit:"列に対する選択・加工",
      data_format:"フォーマットの整形",
      data_source:"データソース出力",
      row_edit:"行に対する選択・加工",
      row_sort:"行のソート",
      table_grouping:"テーブルの集計",
      table_join:"テーブルの結合",
      table_split:"テーブルの分割",
      validation:"データの整合性チェック",
      value_crossing:"行と列に対する加工",
      value_transform:"セルの値の変換",
      data_mining:"データマイニング",
      views:"グラフ描画",
      graphviz:"グラフ構造の画像への変換",
      classification:"分類",
      clustering:"クラスタリング",
      postprocess:"機械学習 後処理",
      preprocess:"機械学習 前処理",
      regression:"回帰",
    }
  },

}
export default Constants
