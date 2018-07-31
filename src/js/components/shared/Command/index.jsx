// @flow
import React from 'react'
import Constants from '../../../constants/index'
import ModalUtil from '../../../utils/ModalUtil'
import DataFrameStepModel from '../../../model/Step/DataFrameStepModel'
import style from './style.scss'
import classnames from 'classnames'
import CommandStepModel from '../../../model/Step/CommandStepModel'
import CommandModel from '../../../model/Command/CommandModel'
import CommandIcon from '../Icon/CommandIcon'
import type { CommandStepModelProps } from '../../../model/Step/CommandStepModel'

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

    buildParamsContent() {
        const {command} = this.props
        this.inputRefs = [] //クリア
        const paramsInputs = command.params.map((param) => {
            return <div key={command.id + "_" + param.name} className="mb-8px">
                <label>
                  {param.label}
                </label>
                <input type="text" className="form-control" placeholder={param.name} ref={(element) => {
                    if (element) (this.inputRefs.push({param: param, element: element}))
                }} defaultValue={""}></input>
            </div>
        })

        const content = <form onSubmit={this.onSubmitModal}>
            {paramsInputs}
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
        let content = this.buildParamsContent()

        ModalUtil.registerModal({
            id: Constants.modal.ADD_COMMAND, onClickDone: () => {

                let args = {}

                //モーダルで入力されたパラメータを取得
                self.inputRefs.map((inputRef) => {
                  console.log( inputRef.param.name)
                  console.log( inputRef.element.value)
                    args[inputRef.param.name] = inputRef.element.value
                    inputRef.element.value = "" //値をクリア
                })

                const add_step: CommandStepModelProps = new CommandStepModel({
                  id: null,
                  type: Constants.step.type.command,
                  name: command.label,
                  label: command.label,
                  args: args,
                  type: Constants.step.type.command,
                  commandId: command.id
                })

                const {selected_step_ids} = this.props
                self.props.addStep(add_step, selected_step_ids[0])

                //出力先を追加

                const output_steps = command.getOutPorts().map((port) => {
                    //TODO 将来的にはコマンドのoutputsを細かくみて制御する
                      return new DataFrameStepModel({
                        id: null,
                        label:port.name,
                        type: Constants.step.type.frame,
                        uuid: null,
                        dataSource: Constants.data.dataSource.csv,
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
        const iconClass = classnames(style.command_icon)

        return <div className={style.command} onClick={() => this.onClickCommand(command)}>
            <svg className={iconClass}>
                <CommandIcon command={command}/>
            </svg>
            <div className={style.command_label_container}>
              <div className={style.command_label}>
                {command.label}
                </div>
                <div className={style.command_description}>
                  {command.description}
                </div>
            </div>
        </div>
    }
}