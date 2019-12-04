import * as React from 'react'
import style from './style.scss'
import {FlowEditorContainer, FlowListContainer, ProfileContainer, ProjectListContainer, LibraryListContainer} from 'Components/index';
import NavigationBar from 'Components/shared/Base/NavigationBar/index';
import { Props as NavigationModelProps } from 'Model/Navigation/NavigationModel'
import { connect } from 'react-redux'
import {API, DataState} from 'Modules/api/index'
import { NavigationModel} from 'Model/index';

export type Props = {
    viewId  :ViewId
    navigation :DataState
    // Function
    GET_NAVI :Function
}

export type State = {
    nav : NavigationModel
}

export enum ViewId {
    Flow_Editor,
    Flow_List,
    Library_List,
    Profile,
    Project_List,
    Undefined,
}

class app extends React.Component<Props, State> {

    constructor(props:Props) {
        super(props)

        this.onNavUpdated.bind(this)
    }

    init() {
        // preload
        
    }

    componentWillMount() {
        const {GET_NAVI} = this.props
        GET_NAVI(inject_flow_uuid, inject_project_uuid, (res, getState) => this.onNavUpdated(res, getState))
    }

    onNavUpdated(res, getState) {
        try {
            this.setState({
                nav : this.props.navigation.lastData
            })
        } catch(e) {
            console.log(e)
        }
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

const mapStateToProps = state => ({
    navigation: state.apiReducer.navigation,
})
const mapDispatchToProps = dispatch => {
    return {
      // dispatching plain actions
      GET_NAVI(flow_uuid, project_uuid, onSuccess?:Function) {
          dispatch(API.GET.Navigation(flow_uuid, project_uuid, onSuccess))
      }
    }
  }

export const Kskp = connect(mapStateToProps, mapDispatchToProps)(app)
