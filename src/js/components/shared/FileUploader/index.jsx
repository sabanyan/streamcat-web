//@flow
import React from 'react'
//import classnames from 'classnames'
import style from './style.scss'
import Button from '../Button'

type Props = {
  onChangeFile?: Function;
  accept?: [string];
  defaultLabel?: string;
  disabled?: boolean;
  multiple?: boolean;
}
type State = {
  selectedFiles: ?FileList
}

export default class FileUploader extends React.Component<Props,State> {

  static defaultProps = {
    accept: [],
    defaultLabel: "",
    disabled: false,
    onChangeFile: {},
    multiple: false
  }

  constructor (props: Props) {
    super(props)
    this.state = {
      selectedFiles: null
    }
  }

  onClickButton(e:Event){
    const element:HTMLElement = this.refs.file
    element.click()
  }

  onChangeFile(e){
    const {onChangeFile} = this.props
    if(onChangeFile){
      onChangeFile(e)
      this.setState({selectedFiles:e.target.files})
    }
  }

  getSelectedLabel(){
    const {defaultLabel} = this.props
    const {selectedFiles} = this.state
    if(!selectedFiles)return defaultLabel
    return Array.from(selectedFiles).map((file:File,index:number)=>{
       return <div key={index} className={style.file}>{file.name}</div>
    })
  }

  render () {
    const {accept,defaultLabel,disabled,multiple} = this.props
    const {selectedFiles} = this.state
    return <div>
      <div className={style.text}>{this.getSelectedLabel()}</div>
      <Button onClick={(e)=>this.onClickButton(e)} disabled={disabled} icon={"attachment"} danger={false}>アップロード</Button>
      <input type="file" ref={"file"} accept={accept.join(',')} multiple={multiple} className={style.input_file} onChange={(e)=>this.onChangeFile(e)} />
    </div>
  }
  
}