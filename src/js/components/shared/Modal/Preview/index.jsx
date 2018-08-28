//@flow
import React from 'react'
import classnames from 'classnames'
import TabBar from '../../TabBar'
import TabList from '../../TabBar/TabList'
import Tab from '../../TabBar/Tab'
import TabPanel from '../../TabBar/TabPanel'
import style from '../style.scss'

export default class PreviewModal extends React.Component {

  constructor (props) {
    super(props)
    this.state = {selected_tab_id:0}
  }

  onClickTab(e,tab_id){
    this.setState({selected_tab_id:tab_id})
  }

  render () {

    const {id, contents, close_button, visible, title, footer} = this.props
    const modal_class = classnames('modal fade preview top', {
      'show in': visible,
      'none-pointer-events': !visible,
    })

    const {selected_tab_id} = this.state

    if(!contents)return null


//    let contentsTab
//    if(Array.isArray(contents)){
//
//    }else{
//      const contents =
//      content = {
//        title: title,
//        content: content
//      }
//    }

    return <div className={modal_class} style={{display: 'block'}} id={id}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <div className="modal-title">
              <span>{title}</span>
              <div className={style.preview_content_tab}>
                <TabBar>
                  <TabList>
                    <Tab tab_id={0} selected_tab_id={selected_tab_id} onClickTab={(e,tab_id)=>this.onClickTab(e,tab_id)}>{contents[0].title}</Tab>
                    <Tab tab_id={1} selected_tab_id={selected_tab_id} onClickTab={(e,tab_id)=>this.onClickTab(e,tab_id)}>{contents[1].title}</Tab>
                  </TabList>
                </TabBar>
              </div>
            </div>
            {close_button}
          </div>
          <div className="modal-body">
              <TabPanel tab_id={0} selected_tab_id={selected_tab_id} >
                <div>{contents[0].content}</div>
              </TabPanel>
              <TabPanel tab_id={1} selected_tab_id={selected_tab_id} >
                <div>{contents[1].content}</div>
              </TabPanel>
          </div>
          {footer}
        </div>
      </div>
    </div>
  }

}