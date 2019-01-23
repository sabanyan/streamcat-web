//@flow
import * as React from 'react'
import classnames from 'classnames'
import TabBar from '../../TabBar'
import TabList from '../../TabBar/TabList'
import Tab from '../../TabBar/Tab'
import TabPanel from '../../TabBar/TabPanel'
import style from '../style.scss'

type Props = {
  id:string;
  contents: [{}];
  close_button: React.Node;
  visible: boolean;
  title: string;
  footer: React.Node
}
type State = {
  selected_tab_id: number
}

export default class PreviewModal extends React.Component<Props,State> {

  constructor (props: Props) {
    super(props)
    this.state = {selected_tab_id:0}
  }

  onClickTab(e:Event,tab_id:number){
    this.setState({selected_tab_id:tab_id})
  }

  render () {

    const {id, close_button, visible, title, footer} = this.props
    let {contents} = this.props
    const modal_class = classnames('modal fade preview top', {
      'show in': visible,
      'none-pointer-events': !visible,
    })

    const {selected_tab_id} = this.state

    if(!contents)return null

    if(!Array.isArray(contents))contents = [contents]

    const tabs = contents.map((content,index)=>{
      return <Tab tab_id={index} selected_tab_id={selected_tab_id} onClickTab={(e,tab_id)=>this.onClickTab(e,tab_id)}>{content.title}</Tab>
    })

    const tabPanels = contents.map((content,index)=>{
      return <TabPanel tab_id={index} selected_tab_id={selected_tab_id} >
      <div>{content.content}</div>
    </TabPanel>
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
            {tabPanels}
          </div>
          {footer}
        </div>
      </div>
    </div>
  }

}