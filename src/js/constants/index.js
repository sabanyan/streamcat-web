const Constants = {
  paperWidth: 600,
  paperHeight: 600,
  spacing: 20,
  api:{
    host: window.location.host
  },
  color: {
    datasource: "#6AD0FB",
    operator: "#F99D39"
  },
  paper: {
    padding: {
      right: 40,
      bottom: 120,
    },
  },
  modal: {
    ADD_OPERATOR: "add_operator",
    SHOW_MESSAGE: "show_message_modal",
    property: {
        title: "title",
        message: "message"
    },
  },
  preview: {
    DATASOURCE: "datasource_preview"
  },
  event: {
    MODAL_EVENT: "ModalEvent",
    MODAL_ON_CLICK_OK: "ModalOnClickDone",
    MODAL_ON_CLICK_DONE: "ModalOnClickDone",
    MODAL_ON_CLICK_CANCEL: "ModalOnClickCancel"
  },
  chart: {
    bar: "bar",
    bubble: "bubble",
    doughnut: "doughnut",
    horizontalBar: "horizontalBar",
    line: "line",
    pie: "pie",
    polar: "polar",
    radar: "radar",
    scatter: "scatter"
  }

}
export default Constants
