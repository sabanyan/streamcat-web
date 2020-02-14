import React from 'react'
import style from '../style.scss'
import { Button } from 'Shared/Input'
import { BaseInspector } from 'Shared/Inspector'
import Resizer from '../Resizer'

type Props = {
  group: {};
  onClickDelete: Function;
}

class GroupInspector extends React.Component<Props> {
  constructor (props) {
    super(props)
    this.state = {
      selected_tab_id: 0,
    }
  }

  onClickTab (e, tab_id) {
    this.setState({selected_tab_id: tab_id})
  }

  nullInspector () {
    return <Resizer>
      <BaseInspector />
    </Resizer>
  }

  render () {    
    const {group} = this.props
    
    if (!group) {
      return this.nullInspector()
    }
    let content = null
    const id = group.id
    const name = group.name
    const creator_name = group.creator_name
    const created_at = group.created_at    
    const selected_tab_id = this.state.selected_tab_id
    
    console.log('GROUP:', group.id)

    content = <div>
      <div className={style.actions}>
        <Button danger={true}
                onClick={() => this.props.onClickDelete(id)}>削除する</Button>
      </div>
      <div className={style.full_hr} />
      <div>
        <div><label>グループ名</label></div>
        <div>{name}</div>

        <div><label>作成者</label></div>
        <div>{creator_name}</div>

        <div><label>作成日時</label></div>
        <div>{created_at}</div>
      </div>
    </div>

    return <Resizer>
      <BaseInspector
        key={id + '_' + name}
        label={name}
        onBlurTitle={(e) => this.props.onBlurTitle(e, group)}
      >
        {content}
      </BaseInspector>
    </Resizer>
  }

}

export default GroupInspector