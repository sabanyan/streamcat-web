// @flow
import React from 'react'
import Constants from '../../../constants/index'
import ModalUtil from '../../../utils/ModalUtil'
import DataFrameStepModel from '../../../model/DataFrameStepModel'
import style from './style.scss'
import classnames from 'classnames'
import CommandStepModel from '../../../model/CommandStepModel'

type Props = {
    name: string;
    description: string;
    arguments: [{ name: string, caption: string }];
    selected_step_ids: string[];
    outputs: any[];//TODO step type;
    addStep: Function;
    selectSteps: Function;
}

export default class Operator extends React.Component<Props> {
    inputRefs: any[]

    constructor(props: Props) {
        super(props)        //モーダル処理の登録
        this.inputRefs = []
    }

    buildArgumentsContent() {
        const self = this
        this.inputRefs = [] //クリア
        const argument_inputs = this.props.arguments.map((argument) => {
            return <div key={self.props.name + "_" + argument.name} className="mb-8px">
                <label>
                  {argument.caption}
                </label>
                <input type="text" className="form-control" placeholder={argument.name} ref={(element) => {
                    if (element) (self.inputRefs.push({argument: argument, element: element}))
                }} defaultValue={""}></input>
            </div>
        })

        const content = <form onSubmit={this.onSubmitModal}>
            {argument_inputs}
        </form>

        return content
    }

    onSubmitModal(e: Event) {
        e.preventDefault()
        //クリックされたときのEventEmitterを実行
        const id = Constants.modal.ADD_OPERATOR
        window.emitter.emit(Constants.event.MODAL_ON_CLICK_DONE + id, {id: id})
    }


    onClickOperator() {

        const self = this
        let content = this.buildArgumentsContent()

        ModalUtil.registerModal({
            id: Constants.modal.ADD_OPERATOR, onClickDone: () => {

                let args = {}

                //モーダルで入力されたパラメータを取得
                console.log(self.inputRefs)
                self.inputRefs.map((inputRef) => {
                    args[inputRef.argument.name] = inputRef.element.value
                    inputRef.element.value = "" //値をクリア
                })

                //コマンドを追加
                // const add_step = new OperatorModel({
                //     operator: self.props.name,
                //     text: this.props.description,
                //     partameters: parameters
                // })


                const add_step =  new CommandStepModel({
                  id: null,//TODO IDはどうやってつける？
                  type: Constants.step.type.command,
                  name: self.props.name,
                  label: self.props.name,
                  args: args
                })

                const {selected_step_ids} = this.props
                self.props.addStep(add_step, selected_step_ids[0])

                //出力先を追加
                const output_steps = self.props.outputs.map((output_step) => {
                    //TODO 将来的にはコマンドのoutputsを細かくみて制御する
                      return new DataFrameStepModel({
                        id: null,//TODO IDはどうやってつける？
                        type: Constants.step.type.frame,
                        uuid: null,//TODO UUIDをどうやってつける？
                        dataSource: Constants.data.dataSource.csv,
                        srcs: [],
                        dsts: [],
                        asFlowIn: false,
                        asFlowOut: false
                      })
                })

                //出力先の個数に応じてステップを追加する
                output_steps.map((output_step) => {
                    self.props.addStep(output_step, add_step.id)
                })

                //ステップの選択をキャンセル
                self.props.selectSteps()

                //モーダルを閉じる
                ModalUtil.emitModal({id: Constants.modal.ADD_OPERATOR, visible: false})
            }
        })

        ModalUtil.emitModal({
            id: Constants.modal.ADD_OPERATOR,
            visible: true,
            content: content,
            title: this.props.description
        })

    }

    render() {

        const operatorClass = classnames(style.operator,style.operator_no_icon)

        return <div>
            <div className={operatorClass} onClick={() => this.onClickOperator()}>
                {/*<i className="icon material-icons">check_box_outline_blank</i>*/}
                <div className={style.operator_label}>{this.props.description}</div>
            </div>
        </div>
    }
}