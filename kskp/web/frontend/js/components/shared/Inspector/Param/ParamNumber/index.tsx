import React from 'react'
import { Popper } from '@material-ui/core';

import { CommandParamType } from 'Types/index'
import { Helper } from 'Shared/Inspector'

import Constants from 'Constants/index'

import style from './style.scss'

type Props = {
  label?: string;
  param: CommandParamType;
  disabled?: boolean;
  value?: string;
  helperTargetedInput?: any;

  helper: any;
  setHelperTargetedInput?: Function;
  // event
  onChange?: Function; // onChange(e, param)
}

type State = {
  helperTargetedInput: any;
}

export default class ParamNumber extends React.Component<Props, State> {
  inputRef:any = null;

  constructor(props: Props) {
    super(props)
    this.state = {
      helperTargetedInput: null,
    };
    this.inputRef = React.createRef()
  }

  onChange(e) {
    try {
      const { param, onChange } = this.props;
      let value = e.currentTarget.value;
      // ParamNumber 対応
      if (param.type === Constants.param.type.number && value !== '') value = parseInt(value);
      if (!value) value = "";
      if (onChange) onChange(e, param, value);
    } catch (e) {
      console.log(e)
    }
  }

  onFocusInput(e) {
    const { setHelperTargetedInput } = this.props;

    if (setHelperTargetedInput) {
      setHelperTargetedInput(e.currentTarget);
    }
  }

  onClickShortcut(e, value, delimiter) {
    const { helperTargetedInput, setHelperTargetedInput, param, onChange } = this.props;

    let currentValue = helperTargetedInput.value;
    let newValue;

    if (currentValue == "") {
      newValue = value;
    } else {
      newValue = currentValue + delimiter + value;
    }

    if (onChange) onChange(e, param, newValue);
  }

  onClickCloseHelper(e) {
    const { helperTargetedInput, setHelperTargetedInput } = this.props;

    if (setHelperTargetedInput) setHelperTargetedInput(null);
  }

  renderDescription() {
    let result = undefined
    try {
      const { param } = this.props
      if (param.description) {
        result = param.description
      }
    } catch (e) {
      console.log(e)
    }

    return <p className={style.description}>
      {result}
    </p>
  }

  //FIXIT: 将来、onBuildが要らなくなったら、onBuildは消した方がいいかも
  render() {
    const { label, param, helper, disabled, value, helperTargetedInput } = this.props
    const { onChange } = this.props

    let isDisabled = (disabled) ? true : false
    let currentValue = (value) ? value : ""
    let openHelper: boolean = Boolean(helperTargetedInput)

    return <React.Fragment>
      <input
        name={param.name}
        type="text"
        className="form-control"
        data-paramtype={param.type}
        placeholder={param.name}
        value={currentValue}
        disabled={isDisabled}
        onChange={(e) => this.onChange(e)}
        onFocus={(e) => this.onFocusInput(e)}
        ref={this.inputRef}
      />
      {
        helper && helper[param.name] && this.inputRef.current === helperTargetedInput ?
          <Popper className={style.popper} open={openHelper} anchorEl={helperTargetedInput} transition placement="right-start">
            <Helper
              helper={helper[param.name]}
              onClickShortcut={this.onClickShortcut.bind(this)}
              onClickCloseHelper={this.onClickCloseHelper.bind(this)}
            />
          </Popper>
          : null
      }
    </React.Fragment>
  }
}