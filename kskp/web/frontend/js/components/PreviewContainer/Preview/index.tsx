//@flow
import React from "react";
import Constants from "Constants/index";

import {APIUtil, HttpUtil, ModalUtil, SortUtil} from "Utils/index";
import {VisualizeModel} from "Model/index";
import {ModalManager} from "Shared/Modal";
import Loader from "Shared/Base/Loader";
import NotificationManager from "Shared/Notification/NotificationManager";
import {PreviewProps} from "PreviewContainer/index";
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
      const json = response.data;
      let visualizers = json.data.map((visualize) => {
        return new VisualizeModel(visualize)
      })
      visualizers = SortUtil.getSortedContents(visualizers)
      window.visualizers = visualizers

      const label = "label";

      // vizs
      this.setState({
        is_loading: false
      }, () => {
        let contents: any[] = []
        for (const v of visualizers) {
          let viz = {visualize: v};
          let content: any;
          let frame_uuid = HttpUtil.getURLParam('frame_uuid');
          if (frame_uuid) {
            // データが存在している場合（ライブラリ）
            content = {title: v.label, content: viz, parentProps: this.props, id: frame_uuid};
            viz["frame_uuid"] = frame_uuid;
          } else {
            // データが存在しなくて生成する必要あり（フローエディターからのプレビュー）
            let flow_uuid = HttpUtil.getURLParam('flow_uuid');
            let frame_id = HttpUtil.getURLParam('step_id');
            let step_ids = JSON.parse(atob((HttpUtil.getURLParam('step_ids'))));
            content = {title: v.label, content: viz, parentProps: this.props, id: frame_id};
            viz["frame_uuid"] = frame_uuid;
            viz["flow_uuid"] = flow_uuid;
            viz["stepIds"] = step_ids;
          }
          contents.push(content);
        }
        console.log(contents);

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
      <ModalManager
        notify={notify}
        dissmissNotify={dissmissNotify}
      />
      <NotificationManager />
    </div>
  }
}
