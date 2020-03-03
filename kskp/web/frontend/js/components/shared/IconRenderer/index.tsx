import React from 'react'
import * as Icon from './icon/index'
import Constants from 'Constants/index';

type Props = {
  type: string
}

export default class IconRenderer extends React.Component<Props> {

  renderIcon(type: string) {
    let result: any = Icon.warning

    switch (type) {
      case Constants.library.type.database:
        result = Icon.database
        break;
      case Constants.library.type.remoteFolder:
        result = Icon.remoteFolder
        break;
      case Constants.library.type.flow:
        result = Icon.flow
        break;
      case Constants.library.type.frame:
        result = Icon.frame
        break;
      case Constants.library.type.folder:
        result = Icon.folder
        break;
      case Constants.library.type.document:
        result = Icon.document
        break;
      case "project":
        result = Icon.project
        break;
      case "asc":
        result = Icon.arrow_drop_up
        break;
      case "desc":
        result = Icon.arrow_drop_down
        break;
      case "remove":
        result = Icon.remove
        break;

      default:
        result = Icon.warning
        break;
    }

    return result
  }

  render() {
    const { type } = this.props

    return <React.Fragment>
      {this.renderIcon(type)}
    </React.Fragment>
  }
}
