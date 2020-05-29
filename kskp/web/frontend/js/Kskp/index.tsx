import * as React from 'react'
import { connect } from 'react-redux'

import { API } from 'Modules/api/index'
import style from './style.scss'

import { NavigationModel } from 'Model/index';
import { Props as NavigationModelProps } from 'Model/Navigation/NavigationModel'
import NavigationBar from 'Components/shared/Base/NavigationBar/index';
import { ModalManager } from 'Shared/Modal'
import { addNotification, removeNotification, updateNotification } from 'reapop'

import {
    FlowEditorContainer, FlowListContainer, ProjectListContainer, LibraryListContainer,
    ProfileContainer, TrashListContainer
} from 'Components/index';
import {Content, Inspector} from 'Modules/reducers/common'

export type Props = {
    viewId: ViewId

    // redux state
    content: Content
    inspector: Inspector

    notify: Function;
    dismissNotify: Function;
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
    TrashCan,
    Undefined = -1,
}

class ViewSwitcher extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props)
    }

    componentWillMount() {
        API.request.doGet.navigation({ flowUUID: inject_flow_uuid, projectUUID: inject_project_uuid })
            .then((res) => {
                this.setState({
                    nav: API.response.get.navigation(res)
                })
            }, (err) => {
                console.log(err)
            })
    }

    renderNavigationBar() {
        let nav: NavigationModelProps | undefined
        if (this.state && this.state.nav) {
            nav = this.state.nav
        }

        return (
            <div className={style.nav}>
                <NavigationBar navigation={nav} />
            </div>
        )
    }

    renderView(viewId: ViewId) {
        const {content, inspector, notify, dismissNotify} = this.props
        let viewComponent: any = null
        switch (viewId) {
            case ViewId.Flow_Editor: viewComponent = <FlowEditorContainer />
                break;
            case ViewId.Flow_List: viewComponent = <FlowListContainer />
                break;
            case ViewId.Library_List: viewComponent = <LibraryListContainer />
                break;
            case ViewId.Profile: viewComponent = <ProfileContainer />
                break;
            case ViewId.Project_List: viewComponent = <ProjectListContainer />
                break;
            case ViewId.TrashCan: viewComponent = <TrashListContainer content={content} inspector={inspector} notify={notify} dismissNotify={dismissNotify}/>
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
        const { viewId, notify, dismissNotify } = this.props
        let result: any = null

        try {
            result = <div className={style.kskp}>
                {this.renderNavigationBar()}
                {this.renderView(viewId)}
                <ModalManager
                    notify={notify}
                    dismissNotify={dismissNotify}
                />
            </div>
        } catch (e) {
            console.log(e)
        } finally {
            return result
        }
    }
}

export const Kskp = connect(
    state => {
        return {
            content: state.CommonReducer.content,
            inspector: state.CommonReducer.inspector
        }
    },
    dispatch => {
        return {
            notify(context: {}) {
                return dispatch(addNotification(context))
            },
            updateNotify(context: {}) {
                return dispatch(updateNotification(context))
            },
            dismissNotify(id: string) {
                setTimeout(() => {
                    dispatch(removeNotification(id))
                }, 1000)
            }
        }
    }
)(ViewSwitcher)