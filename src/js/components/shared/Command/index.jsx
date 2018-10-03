//@flow
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
import type { CommandModelType, CommandParamType, CommandPortType } from '../../../types'
import WebUtil from '../../../utils/WebUtil'
import ParamString from '../Param/ParamString'
import ParamBoolean from '../Param/ParamBoolean'
import ParamUtil from '../../../utils/ParamUtil'
import SubflowCommandModel from '../../../model/Command/SubflowCommandModel'
import SubFlowIcon from '../Icon/SubFlowIcon'
import SubFlowStepModel from '../../../model/Step/SubFlowStepModel'

type Props = {
    command: CommandModelType;
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

    onBuild(param,element){
      if (element)this.inputRefs.push({param: param, element: element})
    }

    buildParamsContent() {
        const {command} = this.props
        this.inputRefs = [] //クリア
        let paramsInputs = command.params.map((param:CommandParamType) => {
          const onBuild = (param,element) => this.onBuild(param,element)
          let paramElement = ParamUtil.getParamElement(param,onBuild)
            return <div key={command.id + "_" + param.name} className="mb-8px">
              {paramElement}
            </div>
        })

        if(!paramsInputs.length)paramsInputs = <div>このフローには設定可能な変数がありません。</div>

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

    getNewStepWithArgs(command:CommandModelType,args):CommandStepModelProps{
      let node
      let model = {
        id: null,
        name: command.label,
        label: command.label,
        args: args,
      }

      if(command instanceof CommandModel){
        model.type = Constants.step.type.command
        model.commandId = command.id
        node = new CommandStepModel(model)
      }else if(command instanceof SubflowCommandModel){
        model.type = Constants.step.type.subflow
        model.uuid = command.uuid
        node = new SubFlowStepModel(model)
      }
      return node

    }


    onClickCommand(e:Event,command:CommandModel) {

        const self = this
        let content = this.buildParamsContent()

        ModalUtil.registerModal({
            id: Constants.modal.ADD_COMMAND, onClickDone: () => {

                let args = {}

                //モーダルで入力されたパラメータを取得
                args = ParamUtil.getArgsFromInputRefs(self.inputRefs)

                const added_command_step: CommandStepModelProps = this.getNewStepWithArgs(command,args)

                const {selected_step_ids} = this.props

                const output_steps = command.getOutPorts().map((port:CommandPortType) => {
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
                    self.props.addStep(output_step)
                })

                const output_step_ids = output_steps.map(step=>step.id)

                self.props.addStep(added_command_step,selected_step_ids,output_step_ids)

                //ステップの選択をキャンセル
                self.props.selectSteps()

                //モーダルを閉じる
                ModalUtil.closeModal(Constants.modal.ADD_COMMAND)
            }
        })

        ModalUtil.emitModal({
            id: Constants.modal.ADD_COMMAND,
            visible: true,
            content: content,
            title: command.label
        })

    }

    onClickPdf(e:Event,url:string){
      window.open(url)
      e.preventDefault()
      e.stopPropagation()
    }

    render() {

        const {command} = this.props
        const iconClass = classnames(style.command_icon)

        let hasPdfLink = false

        if(command.description){
          hasPdfLink = (command.description.indexOf(".pdf") !== -1)
        }

        let description
        if(hasPdfLink) {
          const url = WebUtil.webURL(command.description)
          description = <a href="#" onClick={(e)=>this.onClickPdf(e,url)} onMouseDown={e => e.stopPropagation()}>PDF</a>
        }else{
          description = command.description
        }

        let icon
        if(command instanceof SubflowCommandModel){
          icon = <SubFlowIcon fillColor={'#8BCD42'} width={16} height={20}/>
        }else{
          icon = <CommandIcon command={command}/>
        }

        return <div className={style.command} onClick={(e) => this.onClickCommand(e,command)}>
            <svg className={iconClass}>
              {icon}
            </svg>
            <div className={style.command_label_container}>
              <div className={style.command_label}>
                {command.label}
                </div>
                <div className={style.command_description}>
                  {description}
                </div>
            </div>
        </div>
    }
}