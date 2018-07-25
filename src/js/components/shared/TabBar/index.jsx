import React from 'react'
import style from './style.scss'
import TabPanel from './TabPanel'

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

export default class TabBar extends React.Component {
  onChangeBefore () {

  }

  onChange () {

  }

  render () {
    let element_cnt = 0

    /**
     * 自動的に子要素に対して tab_id や key を追加する処理
     */
    const children = this.props.children.map((element) => {
      if (element.type === TabPanel) {
        return React.cloneElement(
          element,
          {tab_id: element_cnt++, key: element_cnt},
        )
      }
      return element
    })
    return <div className={style.tabbar}>
      {children}
    </div>
  }
}

