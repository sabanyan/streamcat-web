//@flow
import * as React from 'react'
import style from './style.scss'
import classnames from 'classnames'
import type { BreadCrumbHistoryType } from '../../../types'

type Props = {
  history?:[BreadCrumbHistoryType]
}

export default class BreadCrumb extends React.Component<Props> {
  constructor (props:Props){
    super(props)
  }

  render(){
    const {history} = this.props

    if(!history)return null

    const breadCrumbElements = history.map((h:BreadCrumbHistoryType)=>{
      if(h.url && !h.current){
        return <li><a href={h.url}>{h.label}</a></li>
      }
      return <li><span>{h.label}</span></li>
    })

    return <ul className={style.breadCrumb}>{breadCrumbElements}</ul>
  }
}