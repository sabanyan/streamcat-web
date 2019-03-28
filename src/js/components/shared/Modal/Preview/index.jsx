//@flow
import * as React from 'react'
import classnames from 'classnames'
import TabBar from '../../TabBar'
import TabList from '../../TabBar/TabList'
import Tab from '../../TabBar/Tab'
import TabPanel from '../../TabBar/TabPanel'
import style from '../style.scss'
import Visualizer from '../../Visualizer'

type Props = {
  id:string;
  contents: [{}];
  close_button: React.Node;
  visible: boolean;
  title: string;
  footer: React.Node
}
type State = {
  selected_tab_id: number,
  results: [{}]
}

export default class PreviewModal extends React.Component<Props,State> {

  constructor (props: Props) {
    super(props)
    this.state = {
      selected_tab_id:0,
      results: []
    }
  }

  onClickTab(e:Event,tab_id:number){
    this.setState({selected_tab_id:tab_id})
  }

  saveResults(index:number, result:{}) {
    let results = this.state.results
    results[index] = result
    this.setState({results:results})
  }

  loadResults(index:number) {
    let results = this.state.results

    return results[index]
  }

  renderTabContent(index) {
    const contents = this.props.contents
    const {frame_uuid, headers, params, visualize} = contents[index].content
    const result = this.state.results[index]
  
    return <Visualizer key={frame_uuid + '_' + index} frame_uuid={frame_uuid} visualize={visualize} 
      params={params} headers={headers} onSaveResult={(index, result) => {this.saveResults(index, result)}}
      index={index} result={result} />
  }

  render () {
    const {id, close_button, visible, title, footer} = this.props
    let {contents} = this.props
    const results = this.state.results

    const modal_class = classnames('modal fade preview top', {
      'show in': visible,
      'none-pointer-events': !visible,
    })

    const {selected_tab_id} = this.state

    if(!contents)return null

    if(!Array.isArray(contents))contents = [contents]

    const tabs = contents.map((content,index)=>{
      return <Tab key={"tab_" + index} width={"auto"} tab_id={index} selected_tab_id={selected_tab_id} onClickTab={(e,tab_id)=>this.onClickTab(e,tab_id)}>{content.title}</Tab>
    })

    return <div className={modal_class} style={{display: 'block'}} id={id}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <div className="modal-title">
              <span>{title}</span>
              <div className={style.preview_content_tab}>
                <TabBar>
                  <TabList>
                    {tabs}
                  </TabList>
                </TabBar>
              </div>
            </div>
            {close_button}
          </div>
          <div className="modal-body">
            {this.renderTabContent(selected_tab_id)}
          </div>
          {footer}
        </div>
      </div>
    </div>
  }

}