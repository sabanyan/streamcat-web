//@flow
import React from 'react'
import Icon from 'Shared/Icon'

class FileIcon extends React.Component {
  render () {
    return (
      <Icon {...this.props} paddingLeft={9} paddingTop={9}>
        <path
          d="M10,0 L1.7,0 C1.5,0 1.3,0 1.1,0.1 C0.6,0.3 0.2,0.7 0.1,1.1 C0,1.3 0,1.7 0,1.7 L0,18.3 C0,18.3 0,18.7 0.1,18.9 C0.3,19.4 0.6,19.7 1.1,19.9 C1.3,20 1.5,20 1.7,20 C5,20 14,20 14,20 C15.1,20 16,19.1 16,18 L16,6 L10,0 Z M12,16 L8.2,16 L7,16 L4,16 L4,14 L7,14 L7.9,14 L12,14 L12,16 Z M12,12 L9.1,12 L7,12 L4,12 L4,10 L7,10 L9.1,10 L12,10 L12,12 Z M10,6 L10,2.8 L13.2,6 L10,6 Z"
          id="Shape"></path>
      </Icon>
    )
  }
}

export default FileIcon