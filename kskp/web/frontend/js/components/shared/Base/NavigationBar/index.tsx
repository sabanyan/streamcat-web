//@flow
import React from 'react'
import { Props as NavigationModelProps } from 'Model/Navigation/NavigationModel'
import { HttpUtil, WebUtil } from 'Utils/index'

type Props = {
  navigation?: NavigationModelProps
}

const baseUrl = "/front_static/"
export default class NavigationBar extends React.Component<Props> {
  isLogin: boolean = false
  hasProject: boolean = false
  hasFlow: boolean = false

  constructor (props: Props) {
    super(props)

  }

  componentWillMount () {
 
  }


  componentDidMount () {
    /*
    if (this.isDialog()) {
      document.body.classList.add('dialog')
    }
    */
  }

  renderProjectNavigationItem () {
    //const {baseUrl} = this.props
    if (!this.isLogin) return null
    return <li className="nav-item list">
      <a className="nav-link" href="/projects">
        <img className="icon" src={baseUrl + 'images/icon/list.svg'} />
        プロジェクト
      </a>
    </li>
  }

  renderProjectListNavigationItem () {
    const {navigation} = this.props
    if (!this.hasProject || !navigation) return null
    return <li className="nav-item project">
      <a className="nav-link" href={'/flows?project=' + navigation.project_uuid}>
        <img className="icon" src={baseUrl + 'images/icon/folder.svg'} />
        {navigation.project_name}
      </a>
    </li>
  }

  renderFlowListNavigationItem () {
    const {navigation} = this.props
    if (!this.hasFlow || !navigation) return null
    return <li className="nav-item flow">
      <a className="nav-link" href={'/flows/' + navigation.flow_uuid}>
        <img className="icon" src={baseUrl + 'images/icon/flow.svg'} />
        {navigation.flow_name}
      </a>
    </li>
  }

  renderLibraryNavigationItem () {
    const {navigation} = this.props
    if (!this.hasFlow || !navigation) return null
    return <li className="nav-item designer">
      <a className="nav-link" href={'/flows/' + navigation.flow_uuid}>
        <img className="icon" src={baseUrl + 'images/icon/designer.svg'} />フローデザイナー
      </a>
    </li>
  }

  renderFlowDesignerNavigationItem () {
    const {navigation} = this.props
    //if (!this.hasProject) return null
    return <li className="nav-item library">
      <a className="nav-link" href={'/library'}>
        <img className="icon" src={baseUrl + 'images/icon/library.svg'} />ライブラリ
      </a>
    </li>
  }

  onClickLogout (e) {
    let logoutParam = '?session=off'
    if (location.href.indexOf('?') !== -1) {
      logoutParam = logoutParam.replace('?', '&')
    }
    const url = location.href + logoutParam
    WebUtil.navigateURL(url)
    e.preventDefault()
  }

  renderUserNavigationItem () {
    const {navigation} = this.props
    if (!this.isLogin || !navigation) return null
    return <li className="nav-item dropdown user">
      <a className="nav-link dropdown-toggle" href="#" id="navbarDropdownMenuLink" data-toggle="dropdown"
         aria-haspopup="true" aria-expanded="false">
        <img className="icon" src={baseUrl + 'images/icon/user.svg'} />
        {navigation.user_name}
      </a>
      <div className="dropdown-menu dropdown-menu-right" aria-labelledby="navbarDropdownMenuLink">
        {/*<a href="/profile" className="dropdown-item">プロフィール設定</a>*/}
        {/*<div className="dropdown-divider"></div>*/}
        <a href="#" className="dropdown-item" onClick={(e) => this.onClickLogout(e)}>ログアウト</a>
      </div>
    </li>

  }

  isDialog () {
    return (HttpUtil.getURLParam('dialog'))
  }

  render () {
    if (this.isDialog()) return null
    //const {baseUrl} = this.props

    const props = this.props
    if (props.navigation) {
      if (props.navigation.user_id && props.navigation.user_name) {
        this.isLogin = true
      }
      if (props.navigation.project_uuid && props.navigation.project_name) {
        this.hasProject = true
      }
      if (props.navigation.flow_uuid && props.navigation.flow_name) {
        this.hasFlow = true
      }
    }

    return <nav className="navbar navbar-expand navbar-dark fixed-top">
      <a className="navbar-brand" href="#">
        <img src={baseUrl + 'images/logo.png'} height="30" className="d-inline-block align-top"
             alt="" />
      </a>
      <div className="collapse navbar-collapse breadcrumb-navbar">
        <ul className="navbar-nav mr-auto">
          {this.renderProjectNavigationItem()}
          {this.renderProjectListNavigationItem()}
          {this.renderFlowListNavigationItem()}
        </ul>
      </div>
      <div className="menu-navbar">
        <ul className="navbar-nav">
          {/*{this.renderLibraryNavigationItem()}*/}
          {this.renderFlowDesignerNavigationItem()}
          {this.renderUserNavigationItem()}
        </ul>
      </div>
    </nav>
  }

}