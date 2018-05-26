// @flow
import React from 'react'
import DataSourceModel from '../../../../model/DataSourceModel'
import Constants from '../../../../constants/index'
import ModalUtil from '../../../../utils/ModalUtil'
import DataTable from '../../../shared/DataTable/index'
import OperatorModel from '../../../../model/OperatorModel'
import Inspector from '../Inspector'
import style from '../style.scss'

type Props = {
  selected_step_ids: any[];
  steps: {};
  selectSteps:Function;
  updateStep:Function;
  deleteStep:Function;
  mast: {operators:any[]};
}

type State = {

}

class FlowInspector extends React.Component<Props,State> {

    render() {


        return <Inspector header={"フローの設定"} title={"プロパティ"}>
                    <div className="kskp-form">
                    </div>
          </Inspector>
    }

}

export default FlowInspector