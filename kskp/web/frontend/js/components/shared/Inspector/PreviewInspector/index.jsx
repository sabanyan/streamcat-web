//@flow
import * as React from 'react'
import { BaseInspector, ParamsForm } from 'Shared/Inspector'
import { FlowEditorProps } from 'FlowEditorContainer/index'
import style from './style.scss'
import { Button } from 'Shared/Input'
import FlowModel from 'Model/Flow/FlowModel'
import { ParamUtil, StateUtil } from 'Utils/index'
import classnames from 'classnames'

type PreviewInspectorProps = {
  ...FlowEditorProps,
  children?: React.Node,
  label: string,
  params: [],
  args: {},
  headers: [],
  // event
  onApply: Function
}

type State = {
  args: {}
}

class PreviewInspector extends React.Component<PreviewInspectorProps, State> {
  loaded: boolean = false

  constructor (props: PreviewInspectorProps) {
    super(props)
  }

  componentWillMount () {
    try {
      const {args} = this.props
      this.setState({
        args : args
      })
    } catch(e) {
      console.log(e)
    }
  }

  onArgsChange (e, param, value) {
    try {
      const argKey = param.name
      let args = this.state.args
      args[argKey] = value
      this.setState({
        args:args
      }, () => {
        this.forceUpdate()
      })
    } catch (e) {
      console.log(e)
    }
  }

  onClickApply () {
    try {
      const {onApply} = this.props
      const args = this.state.args
      //プレビューリクエスト
      onApply(args)
    } catch(e) {
      console.log(e)
    }    
  }

  render () {
    const {params, args, groups, label, headers} = this.props
    const content = <div>
      <div>
        <div className={style.full_hr} />
        <div>
          <div className="kskp-form"></div>
          <ParamsForm 
             headers={headers} params={params} args={this.state.args} 
             invalids={{}} groups={groups} 
             onChange={(e, param, value) => this.onArgsChange(e, param, value)}/>
        </div>
      </div>
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