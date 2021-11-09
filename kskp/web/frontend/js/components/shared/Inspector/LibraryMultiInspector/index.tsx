import React from 'react'
import style from '../style.scss'
import { BaseInspector, Resizer } from 'Shared/Inspector'
import { Button} from 'Shared/Input'
import { DatumType } from 'Model/index';

type Props = {
  selectedDatas: DatumType[];
  onClickDelete?: Function;
  onClickMove?: Function;
}

class LibraryMultiInspector extends React.Component<Props> {
  constructor(props: Props) {
    super(props)
  }

  renderButtons(datas: DatumType[]) {
    const {onClickDelete, onClickMove } = this.props
    let del,move
    let isDeletable, isMoveable

    if (onClickDelete) del = <Button danger={true} onClick={() => onClickDelete(datas)} icon={"delete"}>削除する</Button>
    if (onClickMove) move = <Button onClick={(data) => onClickMove(datas)} icon={"open_in_browser"}>移動する</Button>
    return <React.Fragment>
      {move}
      {del}
    </React.Fragment>
  }

  render() {
    const {selectedDatas} = this.props
    if(!selectedDatas.length)return;

    // 選択中の全てのDatumが更新可能の場合にTrue
    const enabled = selectedDatas
                    .map(selectedData => selectedData.allowlist.update)
                    .reduce((prevUpdate, update) => prevUpdate && update);

    return <Resizer>
      <BaseInspector key={JSON.stringify(selectedDatas)} label={undefined} disabled={!enabled}>
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

export {LibraryMultiInspector};
