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
      nodeSeparator: 88,
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
        width: 38,
        height: 38,
        padding: 16,
      },
    },
  },
  step:{
    type:{
      command:"command",
      frame:"frame",
      subflow:"flow"
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
    DATASOURCE: 'datasource_preview',
  },
  event: {
    ON_LOAD_NAVIGATION: 'onLoadNavigation',
    MODAL_EVENT: 'ModalEvent',
    MODAL_ON_CLICK_OK: 'ModalOnClickDone',
    MODAL_ON_CLICK_DONE: 'ModalOnClickDone',
    MODAL_ON_CLICK_CANCEL: 'ModalOnClickCancel',
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

}
export default Constants
