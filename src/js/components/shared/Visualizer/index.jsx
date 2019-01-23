//@flow
import React from 'react'
import VisualizeModel from '../../../model/Visualize/VisualizeModel'
import HttpUtil from '../../../utils/HttpUtil'
import EmptyState from '../EmptyState'
import Loader from '../Loader'
//import classnames from 'classnames'
//import style from './style.scss'

type Props = {
  visualize: VisualizeModel,
  params: VisualizeParams;
}

type State = {
  html?: any
}

export default class Visualizer extends React.Component<Props,State> {

  constructor (props: Props) {
    super(props)
    this.state = {
      html: null,
      is_loading:true
    }
  }

  componentWillMount () {
    this.visualizeRequest(this.props.visualize)
  }

  visualizeRequest(visualize:VisualizeModel){
    const body ={ "args": { "limit": "", "offset": "", "columns": ["temperature"], "x_inch": 7, "y_inch": 3, "x_axis": "Time", "time_series_column": ["Time"] }, "inputs": { "i": "f20541d4-8b8f-4787-6ea9-f1e9d3db80a1" } }

    HttpUtil.post("visualizers?from=" + visualize.id,body).then((res)=>{
      console.log(res.data)
      this.setState({html:res.data,is_loading:false})
    }).catch(()=>{
      this.setState({is_loading:false})
    })
  }

  htmlDecode(input){
    var e = document.createElement('div');
    e.innerHTML = input;
    return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
  }

  render () {
    if(this.is_loading)return <Loader center={true}/>
    if(!this.is_loading && !this.state.html)return <EmptyState title={"表示することができません"} description={"選択された表示方法では表示することができません"} icon={"cloud_off"}/>
    return <div>
      <div dangerouslySetInnerHTML={{__html: this.state.html}}></div>
    </div>
  }

}