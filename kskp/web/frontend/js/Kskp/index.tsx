import * as React from 'react'
import style from './style.scss'
import {FlowEditorContainer, FlowListContainer, ProfileContainer, ProjectListContainer, LibraryListContainer} from 'Components/index';
import NavigationBar from 'Components/shared/Base/NavigationBar/index';
import { Props as NavigationModelProps } from 'Model/Navigation/NavigationModel'
import { connect } from 'react-redux'
import {API} from 'Modules/api/index'
import { NavigationModel} from 'Model/index';
import { ModalManager } from 'Shared/Modal'
import { addNotification, removeNotification, updateNotification } from 'reapop'

export type Props = {
    viewId  :ViewId

    notify : Function;
    dismissNotify : Function;
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
    Undefined,
}

class ViewSwitcher extends React.Component<Props, State> {

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
            case ViewId.Flow_Editor     : viewComponent = <FlowEditorContainer/>
                break;
            case ViewId.Flow_List       : viewComponent = <FlowListContainer/>
                break;
            case ViewId.Library_List    : viewComponent = <LibraryListContainer/>
                break;
            case ViewId.Profile         : viewComponent = <ProfileContainer/>
                break;
            case ViewId.Project_List    : viewComponent = <ProjectListContainer/>
                break;

                default:
                    break;
        }

        return viewComponent
    }

    render () {
        const {viewId} = this.props
        const {notify, dismissNotify} = this.props
        let result:any = null
        try {
            result = <div className={style.kskp}>
                <div className={style.nav}>
                    {this.renderNav()}
                </div>
                <div className={style.view}>
                    {this.renderView(viewId)}
                    <ModalManager
                        notify={notify}
                        dismissNotify={dismissNotify}
                    />
                </div>
            </div>
        } catch(e) {
            console.log(e)
        } finally {
            return result
        } 
    }
}

export const Kskp = connect(
    state => {
        return {}
    },
    dispatch => {
        return {
            notify (context:{}) {
                return dispatch(addNotification(context))
            },
            updateNotify (context:{}) {
                return dispatch(updateNotification(context))
            },
            dismissNotify (id:string) {
                setTimeout(() => {
                    dispatch(removeNotification(id))
                }, 1000)
            }
        }
    }
)(ViewSwitcher)