import * as React from 'react'
import style from './style.scss'
import {FlowEditorContainer, FlowListContainer, ProfileContainer, ProjectListContainer, LibraryListContainer} from 'Components/index';

export type Props = {
    viewId:ViewId
}

export enum ViewId {
    Flow_Editor,
    Flow_List,
    Library_List,
    Profile,
    Project_List
}

function Kskp(props:Props) {
    const {viewId} = props
    let result:any = null

    try {
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
        
        result = <div className={style.kskp}>
            <div className={style.nav}></div>
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

export default Kskp