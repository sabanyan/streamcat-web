// @flow
import React from 'react'
import Constants from '../../../constants/index'
import ModalUtil from '../../../utils/ModalUtil'
import DataFrameStepModel from '../../../model/Step/DataFrameStepModel'
import style from './style.scss'
import classnames from 'classnames'
import CommandStepModel from '../../../model/Step/CommandStepModel'
import CommandModel from '../../../model/Command/CommandModel'

type Props = {
    command: CommandModel;
    selected_step_ids: string[];
    addStep: Function;
    selectSteps: Function;
}

export default class Command extends React.Component<Props> {
    inputRefs: any[]

    constructor(props: Props) {
        super(props)        //モーダル処理の登録
        this.inputRefs = []
    }

    buildArgumentsContent() {
        const {command} = this.props
        this.inputRefs = [] //クリア
        const argument_inputs = command.params.map((param) => {
            return <div key={command.id + "_" + param.name} className="mb-8px">
                <label>
                  {param.label}
                </label>
                <input type="text" className="form-control" placeholder={param.name} ref={(element) => {
                    if (element) (this.inputRefs.push({params: command.params, element: element}))
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
        const id = Constants.modal.ADD_COMMAND
        window.emitter.emit(Constants.event.MODAL_ON_CLICK_DONE + id, {id: id})
    }


    onClickCommand(command:CommandModel) {

        const self = this
        let content = this.buildArgumentsContent()

        ModalUtil.registerModal({
            id: Constants.modal.ADD_COMMAND, onClickDone: () => {

                let args = {}

                //モーダルで入力されたパラメータを取得
                console.log(self.inputRefs)
                self.inputRefs.map((inputRef) => {
                    args[inputRef.params.name] = inputRef.element.value
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
                  name: command.name,
                  label: command.name,
                  args: args
                })

                const {selected_step_ids} = this.props
                self.props.addStep(add_step, selected_step_ids[0])

                //出力先を追加

                const output_steps = command.getOutPorts().map((port) => {
                    //TODO 将来的にはコマンドのoutputsを細かくみて制御する
                      return new DataFrameStepModel({
                        id: null,//TODO IDはどうやってつける？
                        label:port.name,
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
                ModalUtil.emitModal({id: Constants.modal.ADD_COMMAND, visible: false})
            }
        })

        ModalUtil.emitModal({
            id: Constants.modal.ADD_COMMAND,
            visible: true,
            content: content,
            title: command.label
        })

    }

    render() {

        const {command} = this.props
        const commandClass = classnames(style.command,style.command_no_icon)

        return <div>
            <div className={commandClass} onClick={() => this.onClickCommand(command)}>
                {/*<i className="icon material-icons">check_box_outline_blank</i>*/}
                <div className={style.command_label}>{command.label}</div>
            </div>
        </div>
    }
}