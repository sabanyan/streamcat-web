//@flow
import React from 'react'
import classnames from 'classnames'
import { Tab, TabBar, TabList } from 'Shared/Base'
import { HttpUtil } from 'Utils/index'
import style from '../Core/style.scss'
import Visualizer from 'Shared/Visualizer';
import {Contents} from 'Shared/Inspector'

type Props = {
  id: string;
  title: string;
  contents: Contents[];
  footer: React.ReactNode;
  visible: boolean;
  close_button: Function;
  notify: Function;
  dismissNotify: Function;
}

type State = {
  selected_tab_id: number;
  results: Result[];
  headers: any[];
}

type Result = {
  html: any;
  args: {}
}

export default class PreviewModal extends React.Component<Props, State> {

  constructor (props: Props) {
    super(props)
    this.state = {
      selected_tab_id: 0,
      results: [],
      headers: []
    }
  }

  onClickTab (e: Event, tab_id: number) {
    if (tab_id !== this.state.selected_tab_id) {
      this.setState({selected_tab_id: tab_id})
    }
  }

  saveResults (index: number, result: Result, headers=[]) {
    let results = this.state.results
    results[index] = result
    if (headers.length === 0) {
      this.setState({results: results})
    } else {
      this.setState({results: results, headers: headers})
    }
  }

  loadResults (index: number) {
    let results = this.state.results

    return results[index]
  }

  renderTabContent(index) {
    const {notify, dismissNotify, title} = this.props
    const contents = this.props.contents
    const {flowUuid, stepIds, frameUuid, lockUuid, visualize} = contents[index].content
    const {id, afterViz} = contents[index]

    const result = this.state.results[index]

    if (!title) {
      return null;
    }
      
    return <Visualizer key={id + index}
                       index={index}
                       headers={this.state.headers}
                       flowUuid={flowUuid}
                       frameUuid={frameUuid}
                       lockUuid={lockUuid}
                       stepIds={stepIds}
                       visualize={visualize} 
                       afterViz={afterViz}
                       result={result}
                       onSaveResult={(index, result, headers) => {this.saveResults(index, result, headers)}}
                       notify={notify}
                       dismissNotify={dismissNotify} />
    
  }


  isDialog () {
    return (HttpUtil.getURLParam('dialog'))
  }

  render () {
    const {id, visible, title, footer} = this.props
    let {contents} = this.props
    const className = (this.isDialog()) ? 'modal fade previewDialog top' : 'modal fade preview top';
    const modal_class = classnames(style.previewModal,className, {
      'show in': visible,
      'none-pointer-events': !visible,
    })
  
    const {selected_tab_id} = this.state

    if (!contents) return null

    if (!Array.isArray(contents)) contents = [contents]

    let tabs: Tab[] = []
    
    //順番を維持するためForEachでLoop
    contents.forEach((content,index)=>{
      const tab = <Tab key={"tab_" + index}
                       width={"auto"} 
                       tab_id={index} 
                       selected_tab_id={selected_tab_id} 
                       onClickTab={(e,tab_id)=>this.onClickTab(e,tab_id)}>
        {content.title}
      </Tab>
      tabs.push(tab)
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
