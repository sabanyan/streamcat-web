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

  renderButtons(data: LibraryChild[]) {
    const { allowlist, onClickDelete, onClickMove } = this.props
    let del,move
    if (allowlist.delete && onClickDelete) del = <Button danger={true} onClick={() => onClickDelete(data)} icon={"delete"}>削除する</Button>
    if (allowlist.move && onClickMove) move = <Button onClick={(data) => onClickMove(data)} icon={"open_in_browser"}>移動する</Button>
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
      <BaseInspector key={JSON.stringify(selectedDatas)} label={null} onBlurTitle={undefined} disabled={disabled}>
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
