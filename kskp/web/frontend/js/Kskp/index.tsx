import * as React from 'react'
import style from './style.scss'
import {FlowEditorContainer, FlowListContainer, ProfileContainer, ProjectListContainer, LibraryListContainer} from 'Components/index';
import NavigationBar from 'Components/shared/Base/NavigationBar/index';
import { Props as NavigationModelProps } from 'Model/Navigation/NavigationModel'
import { connect } from 'react-redux'
import {API} from 'Modules/api/index'
import { NavigationModel} from 'Model/index';

export type Props = {
    viewId  :ViewId
}

export type State = {
    nav?: NavigationModel
}

export enum ViewId {
    FlowEditor,
    FlowList,
    LibraryList,
    Profile,
    ProjectList,
    GroupList,
    Undefined,
}

export class Kskp extends React.Component<Props, State> {

    constructor(props:Props) {
        super(props)
    }

    componentWillMount() {
        API.REQUEST.GET.NAVIGATION(inject_flow_uuid, inject_project_uuid)
            .then((res) => {
                this.setState({
                   nav : API.PARSE.GET.NAVIGATION(res)
                })
            })
       
    }

    renderNav() {
        let nav:NavigationModelProps | undefined
        if (this.state && this.state.nav) {
            nav = this.state.nav
        } 

        return <NavigationBar navigation={nav}/>
    }

    renderView (viewId:ViewId) {
        let viewComponent:any = null
        switch(viewId) {
            case ViewId.FlowEditor : viewComponent = <FlowEditorContainer/>
                break;
            case ViewId.FlowList   : viewComponent = <FlowListContainer/>
                break;
            case ViewId.LibraryList: viewComponent = <LibraryListContainer/>
                break;
            case ViewId.Profile    : viewComponent = <ProfileContainer/>
                break;
            case ViewId.ProjectList: viewComponent = <ProjectListContainer/>
                break;
            case ViewId.GroupList  : viewComponent = <ProjectListContainer/>

                default:
                    break;
        }

        return viewComponent
    }

    render () {
        const {viewId} = this.props
        let result:any = null
        try {
            result = <div className={style.kskp}>
                <div className={style.nav}>
                    {this.renderNav()}
                </div>
                <div className={style.view}>
                    {this.renderView(viewId)}
                </div>
            </div>
        } catch(e) {
            console.log(e)
        } finally {
            return result
        } 
    }
}