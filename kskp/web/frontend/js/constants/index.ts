const Constants = {
  default: {
    uuid: {
      v4Format: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
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
      inputPortName: 'i',
      outputPortName: 'i',
    },
    note: {
      width: 88,
      height: (38 + 6 * 2) / 2,
      padding: 15,
      color: {
        yellow: "yellow",
        red: "red",
        green: "green",
      },
      fontSize: {
        max: 40,
        min: 12,
        increase: 2,
        default: 14
      }
    },
    inspector: {
      width: 400,
      closingRatio: 0.3,
      closedWidth: 24,
      maxWidth: 800
    }
  },
  step: {
    type: {
      command: 'command',
      frame: 'frame',
      subflow: 'flow',
      note: 'note'
    }
  },
  param: {
    type: {
      number: 'number',
      string: 'string',
      boolean: 'boolean',
      select: 'select',
      column: 'column',
      list: 'list'
    }
  },
  data: {
    dataSource: {
      csv: 'csv'
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
    ADD_FOLDER: 'add_folder',
    ADD_DOCUMENT: 'add_document',
    ADD_FRAME: 'add_frame',
    ADD_DATABASE: 'add_database',
    ADD_USER: 'add_user',
    ADD_USER_CONFIRM: 'add_user_confirm',
    EDIT_DATABASE: 'edit_database',
    EDIT_ENCODING: 'edit_encoding',
    RUN_FLOW: 'run_flow',
    IMPORT_DATASOURCE: 'import_datasource',
    SHOW_MESSAGE: 'show_message_modal',
    CONFIRM: 'confirm',
    SHOW_RUN_RESULT: 'show_run_result',
    SHOW_RUN_ERROR: 'show_run_error',
    PREVIEW_DATASOURCE: 'preview_datasource',
    RESET_USER_PASSWORD: 'reset_user_password',
    CONFIRM_UPDATE_KSKP_SYSTEM_ADMIN: 'confirm_update_kskp_system_admin',
    CONFIRM_UPDATE_KSKP_USER_ADMIN: 'confirm_update_kskp_user_admin',
    CONFIRM_REMOVE_MY_USER_ADMIN: 'confirm_update_my_user_admin',
    CONFIRM_UNDELETE_USER: 'confirm_undelete_user',
    property: {
      title: 'title',
      message: 'message',
    },
  },
  format: {
    date: 'YYYY-MM-DD',
    dateTime: 'YYYY-MM-DD HH:mm:ss'
  },
  event: {
    ON_LOAD_NAVIGATION: 'onLoadNavigation',
    MODAL_EVENT: 'ModalEvent',
    MODAL_ON_CLICK_OK: 'ModalOnClickDone',
    MODAL_ON_CLICK_DONE: 'ModalOnClickDone',
    MODAL_ON_CLICK_CANCEL: 'ModalOnClickCancel',
    MODAL_ON_CLICK_CLOSE: 'ModalOnClickClose',
    ON_CHANGE_FORM: 'ON_CHANGE_FORM',
    ON_SUBMIT_FORM: 'ON_SUBMIT_FORM'
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
  lang: {
    classification: {
      subflow: 'サブフロー',
      calculation: '項目間の計算',
      col_edit: '列に対する選択・加工',
      data_format: 'フォーマットの整形',
      data_source: 'データソース出力',
      row_edit: '行に対する選択・加工',
      row_sort: '行のソート',
      table_grouping: 'テーブルの集計',
      table_join: 'テーブルの結合',
      table_split: 'テーブルの分割',
      validation: 'データの整合性チェック',
      value_crossing: '行と列に対する加工',
      value_transform: 'セルの値の変換',
      data_mining: 'データマイニング',
      views: 'グラフ描画',
      graphviz: 'グラフ構造の画像への変換',
      classification: '分類',
      clustering: 'クラスタリング',
      postprocess: '機械学習 後処理',
      preprocess: '機械学習 前処理',
      regression: '回帰',
    }
  },
  library: {
    type: {
      document: 'document',
      project: 'project',
      frame: 'frame',
      folder: 'folder',
      database: 'database',
      flow: 'flow',
      remoteFolder: 'remote-folder',
      trash: 'trash'
    },
    mode: {
      frame_select: 'frame_select',
      folder_select: 'folder_select',
      dialog: 'dialog', //選択モード
      list: 'list' //通常モード
    }
  },
  errorMessage: {
    unhandledError: '予期せぬエラーが発生しました'
  },
  encodings: [
    "UNKNOWN",
    "ASCII",
    "UTF-8",
    "SHIFT_JIS",
    "CP932",
    "UTF-8 BOM",
    "UTF-16",
    "UTF-32",
    "EUC-JP",
    "Big5",
    "CP949",
    "EUC-KR",
    "EUC-TW",
    "GB2312",
    "IBM855",
    "IBM866",
    "iso-2022-jp",
    "iso-2022-kr",
    "iso-8859-1",
    "iso-8859-2-hungarian",
    "iso-8859-5-bulgarian",
    "iso-8859-5-cyrillic",
    "iso-8859-6-arabic",
    "iso-8859-7-greek",
    "iso-8859-9-turkish",
    "KOI8-R",
    "MacCyrillic",
    "TIS-620",
    "windows-1250-hungarian",
    "windows-1251-cyrillic",
    "windows-1251-bulgarian",
    "windows-1252",
    "windows-1254-turkish",
    "windows-1255-hebrew",
    "windows-1256-arabic"
  ],
  newlines: [
    "UNKNOWN",
    "CR",
    "LF",
    "CR+LF"
  ],
  admin:{
    systemRole: {
      EVERYONE:"EVERYONE",
      USR_ADMIN:"USR_ADMIN",
      SYS_ADMIN:"SYS_ADMIN"
    },
    userStatus: {
      tmp: "tmp",
      active: "active",
      inactive: "inactive"
    }
  }
}
export default Constants
