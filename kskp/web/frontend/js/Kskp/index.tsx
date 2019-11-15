import * as React from 'react'
import style from './style.scss'
import {FlowEditorContainer, FlowListContainer, ProfileContainer, ProjectListContainer, LibraryListContainer} from 'Components/index';
import NavigationBar from 'Components/shared/Base/NavigationBar/index';

export type Props = {
    viewId:ViewId
}

export type State = {
}

export enum ViewId {
    Flow_Editor,
    Flow_List,
    Library_List,
    Profile,
    Project_List,
    Undefined,
}

export class Kskp extends React.Component<Props, State> {

    componentWillMount() {

    }

    renderNav() {

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
        let result:any = null
        try {
            const viewComponent = this.renderView(viewId)

            result = <div className={style.kskp}>
                <div className={style.nav}>
                    
                </div>
                <div className={style.view}>
                    {viewComponent}
                </div>
            </div>
        } catch(e) {
            console.log(e)
        } finally {
            return result
        } 
    }
    
}