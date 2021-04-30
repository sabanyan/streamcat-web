//@flow
import React from 'react'
import style from './style.scss'
import { TabPanel } from 'Shared/Base'
import classnames from 'classnames'

/*

  <TabBar>
    <TabList>
      <Tab {...this.props}>フローエディター</Tab>
      <Tab {...this.props}>結果</Tab>
    </TabList>
    <TabPanel {...this.props}>
    </TabPanel>
    <TabPanel {...this.props}>
    </TabPanel>
  </TabBar>

 */

export type Props = {
  className?:string
}

export default class TabBar extends React.Component<Props> {
  onChangeBefore () {

  }

  onChange () {

  }

  render () {
    let className = this.props.className ? this.props.className : "";
    let element_cnt = 0
    let children
    /**
     * 自動的に子要素に対して tab_id や key を追加する処理
     */
    if (Array.isArray(this.props.children)) {
      children = this.props.children.map((element:any) => {
        if (element.type === TabPanel) {
          return React.cloneElement(
            element,
            {tab_id: element_cnt++, key: element_cnt},
          )
        }
        return element
      })
    } else {
      children = this.props.children
    }
    return <div className={classnames(style.tabbar, {[className]: (className)})}>
      {children}
    </div>
  }
}

