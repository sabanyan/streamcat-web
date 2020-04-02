import React from 'react'
import { CommandParamType } from 'Types/index'
import classnames from 'classnames'
import style from './style.scss'


type Props = {
    label?      :string;
    param       :CommandParamType;
    disabled?   :string;
    value?      :string;
    // event
    onChange?   :Function; // onChange(e, param)
}

export default class ParamTextArea extends React.Component<Props> {
    constructor (props: Props) {
        super(props)
    }

    onChange(e) {
        try {
            const {param, onChange} = this.props
            
            if (onChange) onChange(e, param)
        } catch(e) {
            console.log(e)
        }
    }

    render() {
        const {label,param, disabled, value} = this.props
        const {onChange} = this.props
            
        const isDisabled = (disabled) ? true : false
        const labelContainer = (label) ? <label>{label}</label> : null
        let currentValue = (value) ? value : ''

        return <div>
            {labelContainer}
            <textarea 
               name={param.name} 
               className="form-control" 
               placeholder={param.name}
               defaultValue={currentValue}
               disabled={isDisabled}
               onChange={(e) => this.onChange(e)}>
            </textarea>
        </div>
    }
}