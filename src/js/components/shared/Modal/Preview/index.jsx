//@flow
import * as React from 'react'
import classnames from 'classnames'
import TabBar from '../../TabBar'
import TabList from '../../TabBar/TabList'
import Tab from '../../TabBar/Tab'
import TabPanel from '../../TabBar/TabPanel'
import style from '../style.scss'

type Props = {
  id: string;
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

export default class PreviewModal extends React.Component<Props, State> {

  constructor (props: Props) {
    super(props)
    this.state = {
      selected_tab_id: 0,
      results: []
    }
  }

  onClickTab (e: Event, tab_id: number) {
    this.setState({selected_tab_id: tab_id})
  }

  saveResults (index: number, result: {}) {
    let results = this.state.results
    results[index] = result
    this.setState({results: results})
  }

  loadResults (index: number) {
    let results = this.state.results

    return results[index]
  }

  componentWillReceiveProps(nextProps){
    this.setState({
      selected_tab_id:0
    })
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

    if (!contents) return null

    if (!Array.isArray(contents)) contents = [contents]

    let tabs = []
    let tabPannels = []

    //順番を維持するためForEachでLoop
    contents.forEach((content, index) => {
      let tab = <Tab key={'tab_' + index} width={'auto'} tab_id={index} selected_tab_id={selected_tab_id}
                     onClickTab={(e, tab_id) => this.onClickTab(e, tab_id)}>{content.title}</Tab>
      let tabPannel = <TabPanel tab_id={index} selected_tab_id={selected_tab_id}>
        <div>{content.content}</div>
      </TabPanel>
      tabs.push(tab)
      tabPannels.push(tabPannel)
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
            {tabPannels}
          </div>
          {footer}
        </div>
      </div>
    </div>
  }

}