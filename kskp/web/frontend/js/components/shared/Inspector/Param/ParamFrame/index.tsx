import React from 'react'
import { CommandParamType } from 'Types/index'
import { HttpUtil, APIUtil2 } from 'Utils/index';
import style from './style.scss'

type Props = {
  param: CommandParamType;
  disabled?: boolean;
  value?: string;

  // event
  onChange?: Function; // onChange(e, param)
}

type State = {
  path: string;
}

const initialState: State = {
  path: "ライブラリ上のファイルを選択する"
}


// ライブラリーからフレームを選択する
export class ParamFrame extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props)
    this.state = initialState;
  }

  componentDidMount() {
    const { value } = this.props
    if(!value){
      return;
    }
    APIUtil2.findFrame(value).then(frame => {
      this.setState({ path: frame.folderPath + "/" + frame.label });
    }).catch(e => {
      this.setState(initialState);
    });
  }

  onClick(e) {
    const { param, onChange } = this.props;
    const mode = "frame_select"
    HttpUtil.windowOpen("library?dialog=true&mode=" + mode, (args) => {
      const selected_data: any = args;
      let value = "undefined";
      let path = "undefined";
      if (selected_data && selected_data.uuid) {
        value = selected_data.uuid;
        this.setState({
          path: selected_data.folderPath + "/" + selected_data.label
        })
      }
      if (onChange) onChange(e, param, value);
    });
  }

  //FIXIT: 将来、onBuildが要らなくなったら、onBuildは消した方がいいかも
  render() {
    const { param, value } = this.props
    const { onChange } = this.props


    return <React.Fragment>
      <div>
        <a href={"#!"} target={'_blank'} onClick={(e) => this.onClick(e)} className={style.path}>{this.state.path}</a>
      </div>
    </React.Fragment>
  }
}