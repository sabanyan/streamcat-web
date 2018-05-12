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
  action: {
    ADD_MASTER_ACTION: "add_master_action",
    ADD_STEP_ACTION: "add_step_action",
    UPDATE_STEP_ACTION: "update_step_action",
    SELECT_STEPS_ACTION: "select_steps_action",
    DELETE_STEP_ACTION: "delete_step_action",
    REFRESH_GRAPH_ACTION: "refresh_graph_action",
    EXECUTE_FLOW_ACTION: "execute_flow_action",
    SORT_FLOW_ACTION: "sort_flow_action",
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
