import React from 'react'
import PropTypes from 'prop-types'
import DataSourceModel from '../../../model/DataSourceModel'
import Constants from '../../../constants/index'
import ModalUtil from '../../../utils/ModalUtil'
import DataTable from '../../shared/DataTable/index'
import OperatorModel from '../../../model/OperatorModel'

class OperatorProperty extends React.Component {

    onClickSave(e) {
        let {selected_step_ids,steps} = this.props
        let selected_step = steps[selected_step_ids[0]]

        //パラメーターを更新
        Object.keys(this.refs).map((key)=>{
              selected_step.parameters[key] = this.refs[key].value
        })

        this.props.updateStep(selected_step)
        this.props.selectSteps()
    }

    onClickDelete(e) {
        if(window.confirm("このオペレーターを削除しますか？")){
          let {selected_step_ids,steps} = this.props
          let selected_step = steps[selected_step_ids[0]]
          this.props.deleteStep(selected_step)
          this.props.selectSteps()
        }
    }

    getOperator(operator_name){
        let operator
        this.props.mast.operators.map((op)=>{
            if(operator_name === op.name){
                operator = op
            }
        })
        return operator
    }

    getOperatorArgument(argument_name,operator){
        let argument
        if(operator && operator.arguments){
            operator.arguments.map((arg)=>{
                if(arg.name == argument_name){
                  argument = arg
                }
            })
        }
        return argument
    }

    render() {

        const self = this
        let step_text
        let property
        let dataSource
        let {selected_step_ids,steps} = this.props
        let f
        const selected_step = steps[selected_step_ids[0]]

        let inputForm

        inputForm = Object.keys(selected_step.parameters).map((key,index)=>{
            const parameter = selected_step.parameters[key]
            const operator_name = selected_step.operator
            const operator = self.getOperator(operator_name)
            const argument = self.getOperatorArgument(key,operator)
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



        if (selected_step instanceof OperatorModel) {
            f = selected_step.property.f
            step_text = selected_step.text
        }

        return <div key={selected_step.id} className="kskp-property-container">
            <div className="kskp-property-header">
                {step_text}
            </div>
            <div className="kskp-property-body">
                <div className="kskp-property-title">
                    プロパティ
                </div>
                <div className="kskp-property-body">
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
            </div>
        </div>
    }

}

export default OperatorProperty