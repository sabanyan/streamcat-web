import React from 'react'
import style from '../style.scss'
import { BaseInspector, Resizer } from 'Shared/Inspector'
import { Button} from 'Shared/Input'
import { LibraryChild } from 'Model/index';
import { Allowlist, ProjectInfo } from 'Components/LibraryContainer/Libary/index';

type Props = {
  allowlist:Allowlist;
  selectedDatas: LibraryChild[];
  onClickDelete?: Function;
  onClickMove?: Function;
}

class LibraryMultiInspector extends React.Component<Props> {
  constructor(props: Props) {
    super(props)
  }

  renderButtons(datas: LibraryChild[]) {
    const { allowlist, onClickDelete, onClickMove } = this.props
    let del,move
    let isDeletable, isMoveable

    isDeletable = datas.filter((data) => {
      return !data.allowlist.delete ? true : false
    }).length >= 1 ? false : true

    isMoveable = datas.filter((data) => {
      return !data.allowlist.move ? true : false
    }).length >= 1 ? false : true

    if (allowlist.delete && onClickDelete && isDeletable) del = <Button danger={true} onClick={() => onClickDelete(datas)} icon={"delete"}>削除する</Button>
    if (allowlist.move && onClickMove && isMoveable) move = <Button onClick={(data) => onClickMove(datas)} icon={"open_in_browser"}>移動する</Button>
    return <React.Fragment>
      {move}
      {del}
    </React.Fragment>
  }

  render() {
    const { allowlist, selectedDatas} = this.props
    if(!selectedDatas.length)return;
    const disabled = allowlist && allowlist.update ? false : true
    return <Resizer>
      <BaseInspector key={JSON.stringify(selectedDatas)} label={null} disabled={disabled}>
        <div className={style.inspector}>
          <div className={style.actions}>
            {this.renderButtons(selectedDatas)}
          </div>
          <div className={style.detail}>
          </div>
        </div>
      </BaseInspector>
    </Resizer>
  }

}

export default LibraryMultiInspector
