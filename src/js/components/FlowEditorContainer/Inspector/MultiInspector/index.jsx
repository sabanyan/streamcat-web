// @flow
import React from 'react'
import DataSourceModel from '../../../../model/DataSourceModel'
import Constants from '../../../../constants/index'
import ModalUtil from '../../../../utils/ModalUtil'
import DataTable from '../../../shared/DataTable/index'
import OperatorModel from '../../../../model/OperatorModel'
import Inspector from '../Inspector'
import type {FlowEditorProps} from "../../index";

class MultiInspector extends React.Component<FlowEditorProps> {
    render() {
        return <Inspector header={"複数選択"} title={"プロパティ"}>
               複数選択されています
        </Inspector>
    }

}

export default MultiInspector