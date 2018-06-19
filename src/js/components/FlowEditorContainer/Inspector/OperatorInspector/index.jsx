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
import Button from '../../../shared/Button'
import DropDownList from '../../../shared/DropDownList'

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
        if(window.confirm("このコマンドを削除しますか？")){
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
        let dataSourceOptions = []
        Object.keys(steps).forEach((step_id)=>{
          if (steps[step_id] instanceof DataSourceModel){
            dataSourceOptions.push({value:steps[step_id].id,name:steps[step_id].text,object:steps[step_id]})
          }
        })

        const {selected_in_edges,selected_out_edges} = this.props
        let inEdgeSelect = selected_in_edges.map((edge)=>{
            return <DropDownList key={"in_edge"} onChange={(e)=>this.onChangeInEdge(e)} defaultValue={edge.v} list={dataSourceOptions}></DropDownList>
        })

        if(!inEdgeSelect.length)inEdgeSelect = <DropDownList key={"in_edge"} onChange={(e)=>this.onChangeInEdge(e)} defaultValue={0} list={dataSourceOptions}></DropDownList>

        let outEdgeSelect = selected_out_edges.map((edge)=>{
          return <DropDownList key={"out_edge"} onChange={(e)=>this.onChangeOutEdge(e)} defaultValue={edge.w} list={dataSourceOptions}></DropDownList>
        })

        if(!outEdgeSelect.length)outEdgeSelect = <DropDownList key={"out_edge"} onChange={(e)=>this.onChangeOutEdge(e)} defaultValue={0} list={dataSourceOptions}></DropDownList>

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
                      <br/>
                        <Button onClick={(e) => this.onClickSave(e)}>適用</Button>
                        <Button onClick={(e) => this.onClickDelete(e)} danger={true}>削除</Button>
                    </div>
                </div>
        </Inspector>
    }

}

export default OperatorInspector