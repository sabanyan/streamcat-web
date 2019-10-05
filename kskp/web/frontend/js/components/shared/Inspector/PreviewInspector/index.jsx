//@flow
import * as React from 'react'
import { BaseInspector, ParamsForm } from 'Shared/Inspector'
import type { FlowEditorProps } from 'FlowEditorContainer/index'
import style from './style.scss'
import { Button } from 'Shared/Input'
import FlowModel from 'Model/Flow/FlowModel'
import { ParamUtil } from 'Utils/index'
import classnames from 'classnames'

type PreviewInspectorProps = {
  ...FlowEditorProps,
  children?: React.Node,
  label: string,
  params: [],
  args: {},
  headers: [],
  onBuild: Function,
  onSave: Function
}

class PreviewInspector extends React.Component<PreviewInspectorProps> {
  inputRefs: any[]

  selectedSubFlow: FlowModel
  loaded: boolean = false

  constructor (props: PreviewInspectorProps) {
    super(props)
    this.inputRefs = []
  }

  componentWillMount () {

  }

  updateArgs () {
    const args = ParamUtil.getArgsFromInputRefs(this.inputRefs)
    //プレビューリクエスト
    this.props.onSave(args)
  }

  onBuild (param, element) {
    if (element) this.inputRefs.push({param: param, element: element})
  }

  onClickApply () {
    this.updateArgs()
  }

  render () {
    const {params, args, groups, label, headers, events} = this.props
    let inputForm = []
    let subFlowLink, content, subLabel

    //指定されたステップの元コマンドを取得
    // const command:CommandModel = selected_step.getCommand()
    // //選択されたステップのラベルを取得
    // label = selected_step.label
    // //コマンドのラベルを取得
    // subLabel = command.label
    this.inputRefs = []
    //
    // const params:[CommandParamType] = params
    // const args:{} = args
    const invalids: {} = {}
    inputForm =
      <ParamsForm headers={headers} params={params} args={args} invalids={invalids} command={null} invalids={invalids}
                  onBuild={(param, element) => this.onBuild(param, element)} events={events} groups={groups}/>

    let form

    if (inputForm) {
      form = <div>
        <div className={style.full_hr} />
        <div>
          <div className="kskp-form">
            {inputForm}
          </div>
        </div>
      </div>
    }

    content = <div>
      {form}
      <div className={style.full_hr} />
      <Button onClick={(e) => this.onClickApply(e)}>反映</Button>
    </div>

    const property_class = classnames(style.property, style.in)

    return <div className={property_class}>
      <BaseInspector key={0} header={''} label={label} subLabel={''}>
        {content}
      </BaseInspector>
    </div>
  }

}

export default PreviewInspector