//@flow
import React from 'react'
import ParamUtil from '../../../utils/ParamUtil'
import CommandModel from '../../../model/Command/CommandModel'
import type { CommandParamType } from '../../../types'
import classnames from 'classnames'
import style from './style.scss'

type Props = {
  params:[CommandParamType];//パラメーター定義
  args:{};//入力値
  command: CommandModel;
  invalids: {};
  onBuild: Function;
}

export default class ParamsForm extends React.Component<Props> {

  constructor (props: Props) {
    super(props)
  }

  render () {

    const {params,args,invalids,command,onBuild} = this.props

    const paramsForm = params.map((param,index) =>{
      const value = args[param.name]//入力値
      let isPresence = false
      if(command){
        if(command.rules &&
          command.rules[param.name] &&
          command.rules[param.name]['presence']){
          isPresence = true
        }
      }
      let paramElement = ParamUtil.getParamElement(param,onBuild,value,param.name)//パラメータのエレメント
      const invalidMessageEelement = this.getInvalidMessageElement(invalids[param.name])//入力エラー
      return <div key={index} className={classnames('mb-8px',{[style.presence]:isPresence,[style.invalid]:(invalidMessageEelement)})}>
        {paramElement}
        {invalidMessageEelement}
      </div>
    })

    return paramsForm
  }

  getInvalidMessageElement(invalid:([]|string) ){
    const invalidMessage:([]|string) = invalid
    if(invalidMessage){
      if(Array.isArray(invalidMessage)){
        const arrayMessage = invalidMessage.map(message=>{
          return <div className={style.invalid_message}>
            {message}
          </div>
        })
        return <div>{arrayMessage}</div>
      }
      return <div className={style.invalid_message}>
        {invalidMessage}
      </div>
    }
    return null
  }
}