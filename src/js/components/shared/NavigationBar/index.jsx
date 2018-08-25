//@flow
import React from 'react'
import classnames from 'classnames'
import style from './style.scss'
import type { NavigationModelProps } from '../../../model/Navigation/NavigationModel'
import WebUtil from '../../../utils/WebUtil'

type Props = {
  baseUrl: string,
  logoUrl: string,
  projectUrl: string,
  navigation: NavigationModelProps
}

export default class NavigationBar extends React.Component<Props> {
  isLogin:boolean = false
  hasProject:boolean = false
  hasFlow:boolean = false

  constructor (props: Props) {
    super(props)
    if(this.props.navigation){
      if(props.navigation.user_id && props.navigation.user_name){
        this.isLogin = true
      }
      if(props.navigation.project_uuid && props.navigation.project_name){
        this.hasProject = true
      }
      if(props.navigation.flow_uuid && props.navigation.flow_name){
        this.hasFlow = true
      }
    }
  }

  renderProjectNavigationItem(){
    const {baseUrl} = this.props
    if(!this.isLogin) return null
    return <li className="nav-item list">
      <a className="nav-link" href="/projects">
        <img className="icon" src={baseUrl + 'images/icon/list.svg'} />
        プロジェクト
      </a>
    </li>
  }
  renderProjectListNavigationItem(){
    const {baseUrl,navigation} = this.props
    if(!this.hasProject) return null
    return <li className="nav-item project">
      <a className="nav-link" href={"/flows?project=" + navigation.project_uuid}>
        <img className="icon" src={baseUrl + 'images/icon/folder.svg'} />
        {navigation.project_name}
      </a>
    </li>
  }
  renderFlowListNavigationItem(){
    const {baseUrl,navigation} = this.props
    if(!this.hasFlow) return null
    return <li className="nav-item flow">
      <a className="nav-link" href={"/flows/" + navigation.flow_uuid}>
        <img className="icon" src={baseUrl + 'images/icon/flow.svg'} />
        {navigation.flow_name}
      </a>
    </li>
  }

  renderLibraryNavigationItem(){
    const {baseUrl,navigation} = this.props
    if(!this.hasFlow) return null
    return <li className="nav-item designer">
      <a className="nav-link" href={"/flows/" + navigation.flow_uuid}>
      <img className="icon" src={baseUrl + 'images/icon/designer.svg'} />フローデザイナー
      </a>
    </li>
  }

  renderFlowDesignerNavigationItem() {
    const {baseUrl, navigation} = this.props
    if(!this.hasProject) return null
    return <li className="nav-item library">
      <a className="nav-link" href={"/library?project=" + navigation.project_uuid}>
        <img className="icon" src={baseUrl + 'images/icon/library.svg'} />ライブラリ
      </a>
    </li>
  }

  onClickLogout(e:Event){
    let logoutParam = "?session=off"
    if(location.href.indexOf("?") !== -1){
      logoutParam = logoutParam.replace("?","&")
    }
    const url = location.href + logoutParam
    WebUtil.navigateURL(url)
    e.preventDefault()
  }

  renderUserNavigationItem(){
    const {baseUrl, navigation} = this.props
    if (!this.isLogin) return null
    return <li className="nav-item dropdown user">
      <a className="nav-link dropdown-toggle" href="#" id="navbarDropdownMenuLink" data-toggle="dropdown"
         aria-haspopup="true" aria-expanded="false">
        <img className="icon" src={baseUrl + 'images/icon/user.svg'} />
        {navigation.user_name}
      </a>
      <div className="dropdown-menu" aria-labelledby="navbarDropdownMenuLink">
        <a href="#" className="dropdown-item" onClick={this.onClickLogout}>ログアウト</a>
      </div>
    </li>

  }

  render () {
    const {baseUrl} = this.props
    return <nav className="navbar navbar-expand navbar-dark fixed-top">
      <a className="navbar-brand" href="#">
        <img src={baseUrl+"images/logo.png"} height="30" className="d-inline-block align-top"
             alt=""/>
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
          {this.renderLibraryNavigationItem()}
          {this.renderFlowDesignerNavigationItem()}
          {this.renderUserNavigationItem()}
        </ul>
      </div>
    </nav>

  }

}