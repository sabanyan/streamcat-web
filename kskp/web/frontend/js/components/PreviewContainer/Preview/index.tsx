//@flow
import React from 'react'
import Constants from 'Constants/index'

import {ModalUtil, SortUtil, APIUtil} from "Utils/index";
import { VisualizeModel } from 'Model/index'
import { ModalManager } from 'Shared/Modal'
import Loader from 'Shared/Base/Loader'
import NotificationManager from 'Shared/Notification/NotificationManager'
import { PreviewProps } from 'PreviewContainer/index'
/**
 * ======================================================
 *                      NOT USE REDUX
 * ======================================================
 */

type State = {
  is_loading: boolean;
  visualizers: []
}

type Props = PreviewProps;

export default class PreviewContainer extends React.Component<Props, State> {

  constructor (props: Props) {
    super(props)
    this.state = {
      is_loading: false,
      visualizers: []
    }
    this.getVisualizers();
  }

  getVisualizers(){
    this.setState({is_loading: true});
    APIUtil.get('visualizers').then((response) => {
      const json = response.data
      let visualizers = json.data.map((visualize) => {
        return new VisualizeModel(visualize)
      })
      visualizers = SortUtil.getSortedContents(visualizers)
      window.visualizers = visualizers

      let id = inject_data_uuid;
      const label = "label";

      // vizs
      this.setState({
        is_loading: false
      }, () => {
        let contents: any[] = []
        for (const v of visualizers) {
          let viz = { frame_uuid: id, visualize: v }
          let content: any = { title: v.label, content: viz, parentProps: this.props, id: id }
          contents.push(content)
        }

        ModalUtil.emitModal({
          id: Constants.modal.PREVIEW_DATASOURCE,
          visible: true,
          contents: contents,
          title: label
        })
      })
    }).then((response) => { },
      (error) => { console.log(error) })
  }

  componentDidMount () {

  }


  render () {
    const { notify, dissmissNotify } = this.props

    return <div className={'container mt-40px'}>
      <Loader center={true} absolute={true} visible={this.state.is_loading} />
      hello
      <ModalManager
        notify={notify}
        dissmissNotify={dissmissNotify}
      />
      <NotificationManager />
    </div>
  }
}
