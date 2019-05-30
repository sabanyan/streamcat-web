//@flow
import * as React from 'react'

import NotificationsSystem from 'reapop'
import theme from './NotificationTheme'

type Props = {
}
type State = {

}

export default class NotificationManager extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
  }
  render () {

    return (
      <div>
        <NotificationsSystem theme={theme}/>
      </div>
    );

  }
}