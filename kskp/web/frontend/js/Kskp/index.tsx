import * as React from 'react'
import { connect } from 'react-redux'

import { API } from 'Modules/api/index'
import style from './style.scss'

import { NavigationModel } from 'Model/index';
import { Props as NavigationModelProps } from 'Model/Navigation/NavigationModel'
import NavigationBar from 'Components/shared/Base/NavigationBar/index';

import {
    FlowEditorContainer, FlowListContainer, ProjectListContainer, LibraryListContainer,
    ProfileContainer
} from 'Components/index';

export type Props = {
    viewId: ViewId
}

export type State = {
    nav?: NavigationModel
}

export enum ViewId {
    Flow_Editor,
    Flow_List,
    Library_List,
    Profile,
    Project_List,
    Undefined = -1,
}

export class Kskp extends React.Component<Props, State> {

    constructor(props:Props) {
        super(props)
    }

    componentWillMount() {
        API.REQUEST.GET.NAVIGATION(inject_flow_uuid, inject_project_uuid)
            .then((res) => {
                this.setState({
                   nav: API.PARSE.GET.NAVIGATION(res)
                })
            })       
    }

    renderNavigationBar() {
        let nav: NavigationModelProps | undefined
        if (this.state && this.state.nav) {
            nav = this.state.nav
        } 

        return (
            <div className={style.nav}>
                <NavigationBar navigation={nav}/>
            </div>
        )
    }

    renderView (viewId: ViewId) {
        let viewComponent: any = null        
        switch(viewId) {
            case ViewId.Flow_Editor : viewComponent = <FlowEditorContainer/>
                break;
            case ViewId.Flow_List   : viewComponent = <FlowListContainer/>
                break;
            case ViewId.Library_List: viewComponent = <LibraryListContainer/>
                break;
            case ViewId.Profile     : viewComponent = <ProfileContainer/>
                break;
            case ViewId.Project_List: viewComponent = <ProjectListContainer/>
                break;
            default:
                break;
        }

        return (
            <div className={style.view}>
                {viewComponent}
            </div>
        )
    }

    render() {
        const { viewId } = this.props
        let result: any = null
        try {
            result = <div className={style.kskp}>
                {this.renderNavigationBar()}
                {this.renderView(viewId)}           
            </div>
        } catch(e) {
            console.log(e)
        } finally {
            return result
        } 
    }
}