// @flow
import * as React from 'react'
import DataSourceModel from '../../../../model/DataSourceModel'
import Constants from '../../../../constants/index'
import ModalUtil from '../../../../utils/ModalUtil'
import DataTable from '../../../shared/DataTable/index'
import OperatorModel from '../../../../model/OperatorModel'
import Inspector from '../Inspector'
import type {FlowEditorProps} from "../../index";
import style from '../style.scss'

type OperatorInspectorProps = {
    ...FlowEditorProps,
    children?:React.Node
}

class OperatorInspector extends React.Component<OperatorInspectorProps> {

    onClickSave(e:Event) {
        let {selected_step_ids,steps} = this.props
        let selected_step = steps[selected_step_ids[0]]

        //パラメーターを更新
        Object.keys(this.refs).map((key)=>{
              selected_step.parameters[key] = this.refs[key].value
        })

        this.props.updateStep(selected_step)
        this.props.selectSteps()
    }

    onClickDelete(e:Event) {
        if(window.confirm("このオペレーターを削除しますか？")){
          let {selected_step_ids,steps} = this.props
          let selected_step = steps[selected_step_ids[0]]
          this.props.deleteSteps([selected_step.id])
          this.props.selectSteps()
        }
    }

    getOperator(operator_name:string){
        let operator = null;
        this.props.mast.operators.map((op)=>{
            if(operator_name === op.name){
                operator = op
            }
        })
        return operator
    }

    getOperatorArgument(argument_name:string,operator:?{arguments:any[]}){
        let argument = {};
        if(operator && operator.arguments){
            operator.arguments.map((arg)=>{
                if(arg.name == argument_name){
                  argument = arg
                }
            })
        }
        return argument
    }

    onChangeInEdge(e){

    }

    onChangeOutEdge(e){

    }

    render() {

        const self = this
        let {selected_step_ids,steps} = this.props
        const selected_step = steps[selected_step_ids[0]]

        let inputForm

        inputForm = Object.keys(selected_step.parameters).map((key:string,index:number)=>{
            const parameter = selected_step.parameters[key]
            const operator_name:string = selected_step.operator
            const operator = self.getOperator(operator_name)
            const argument:{caption?:string} = self.getOperatorArgument(key,operator)

            const argument_name = key
            return <div key={index}>
                <label>{argument.caption}</label>
                <input type="text" className="form-control mb-12px" defaultValue={parameter} placeholder={argument_name} ref={argument_name}/>
                {/*<div key={self.props.name + "_" + argument.name} className="mb-8px">*/}
                    {/*<label>*/}
                      {/*{argument.caption}*/}
                    {/*</label>*/}
                    {/*<input type="text" className="form-control" placeholder={argument.name} ref={(element)=>{self.inputRefs.push({argument:argument,element:element})}} defaultValue={""}></input>*/}
                {/*</div>*/}
            </div>
        })


        //入出力
        let dataSourceOptions = Object.keys(steps).map((step_id,index)=>{
          if (steps[step_id] instanceof DataSourceModel){
              return <option key={index + 1} value={steps[step_id].id}>{steps[step_id].text}</option>
          }
        })
        dataSourceOptions.unshift(<option key={0} value={0}>選択してください</option>)

        const {selected_in_edges,selected_out_edges} = this.props
        let inEdgeSelect = selected_in_edges.map((edge)=>{
            return <select key={"in_edge"} onChange={(e)=>this.onChangeInEdge(e)} className="custom-select" defaultValue={edge.v}>{dataSourceOptions}</select>
        })
        if(!inEdgeSelect.length)inEdgeSelect = <select className="custom-select" defaultValue={0}>{dataSourceOptions}</select>

        let outEdgeSelect = selected_out_edges.map((edge)=>{
            return <select key={"out_edge"} onChange={(e)=>this.onChangeOutEdge(e)} className="custom-select" defaultValue={edge.w}>{dataSourceOptions}</select>
        })
        if(!outEdgeSelect.length)outEdgeSelect = <select className="custom-select" defaultValue={0}>{dataSourceOptions}</select>

        return <Inspector key={selected_step.id} header={selected_step.text} title={"プロパティ"}>
                <div className="kskp-property-body">
                  <div className="kskp-form">
                      <div className={style.property_title}>
                        入出力
                      </div>
                      <label>入力</label>
                        {inEdgeSelect}
                      <label>出力</label>
                        {outEdgeSelect}
                  </div>
                  <div className={style.hr}/>
                    <div className="kskp-form">
                        {/*<label>f</label>*/}
                        {/*<input type="text" className="form-control mb-12px" defaultValue={f} ref="f"/>*/}
                        {inputForm}
                        <div className="btn btn-primary btn-block py-8px text-14px"
                             onClick={(e) => this.onClickSave(e)}>
                            確定する
                        </div>
                        <div className="btn btn-danger btn-block py-8px text-14px"
                             onClick={(e) => this.onClickDelete(e)}>
                            削除する
                        </div>
                    </div>
                </div>
        </Inspector>
    }

}

export default OperatorInspector