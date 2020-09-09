import React from 'react'
import { Popper } from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { Param as ParamType, Element } from 'Shared/Inspector/ParamsForm/index'
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import { CommandParamType } from 'Types/index'
import Constants from 'Constants/index'
import style from './style.scss'



type Props = {
  label?: string;
  param: CommandParamType;
  disabled?: boolean;
  value?: string;

  // event
  onChange?: Function; // onChange(e, param)
}
type State = {
  labelEl: any;
  inputEl: any;
  tabIndex: number;
  focusedParamName: string | null;
}

function renderLabelBalloon(param: ParamType) {
  return <React.Fragment>
    <label>{param.label}:{param.name}</label>
    <p>{param.input_ballon && param.input_ballon.text ? param.input_ballon.text : ""}</p>
  </React.Fragment>
}

type Shortcut = {
  value: string,
  label: string,
  link: string,
  delimiter: string
}

type Data = {
  label: string,
  shortcuts: Shortcut[]
}

function renderShortCuts(shortcuts: Shortcut[]): any {
  let result: any[] = []
  const defaultValue: Shortcut = {
    value: "",
    label: "",
    link: "",
    delimiter: ","
  }

  if (!Array.isArray(shortcuts)) return result

  const onClickShortcut = (event, element, value) => {

  }

  shortcuts.forEach((s, index) => {
    let v = defaultValue;
    v = { ...s }
    result.push(
      <a key={index} className={style.shortcut}
        href={"javascript:void(0)"}>{v.label + " : " + v.link}</a>
    )
  })

  return result
}

function renderDatas(datas: Data[]) {
  let result: any[] = []
  datas.forEach((d, index) => {
    console.log(d)
    result.push(<div key={index} className={style.data}>
      <span>{d.label}</span>
      <div className={style.shortcuts}>
        {renderShortCuts(d.shortcuts)}
      </div>
    </div>)
  })
  return result
}

type Tab = {
  label: string,
  data: Data[]
}

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="TabPanel"
      hidden={value !== index}
      id={`scrollable-auto-tabpanel-${index}`}
      aria-labelledby={`scrollable-auto-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Typography component={'span'} variant={'body2'}>{children}</Typography>
      )}
    </div>
  );
}

function renderTabs(tabs: Tab[], tabIndex: number, setTabIndex) {
  let result: any
  let renderedTabs: any[] = []
  let renderedTabPanels: any[] = []

  tabs.forEach((t, index) => {
    renderedTabs.push(
      <Tab label={t.label} className={style.tab} key={index} />
    )
  })

  tabs.forEach((t, index) => {
    renderedTabPanels.push(
      <TabPanel key={index} value={tabIndex} index={index}>
        {renderDatas(t.data)}
      </TabPanel>
    )
  })

  const handleChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  result = <React.Fragment>
    <AppBar position="static" color="default">
      <Tabs
        value={tabIndex}
        onChange={handleChange}
        indicatorColor="primary"
        textColor="primary"
        variant="scrollable"
        scrollButtons="auto"
        aria-label="scrollable auto tabs example"
      >
        {renderedTabs}
      </Tabs>
    </AppBar>
    {renderedTabPanels}
  </React.Fragment>

  return result
}

function renderHelper(param: ParamType, selectedParamName: string, tabIndex: number = 0, setTabIndex) {
  let result = <React.Fragment></React.Fragment>
  if (param.helper && Object.keys(param.helper).includes(selectedParamName)) {
    let helper: { label: string, tabs: Tab[] } = param.helper[selectedParamName]
    result = <React.Fragment>
      {renderTabs(helper.tabs, tabIndex, setTabIndex)}
    </React.Fragment>
  }

  return result
}


export default class ParamString extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      labelEl: null,
      inputEl: null,
      tabIndex: 0,
      focusedParamName: null
    }
  }

  onChange(e) {
    try {
      const { param, onChange } = this.props
      let value = e.currentTarget.value
      // ParamNumber 対応
      if (param.type === Constants.param.type.number && value !== '') value = parseInt(value)
      if (!value) value = ""
      if (onChange) onChange(e, param, value)
    } catch (e) {
      console.log(e)
    }
  }

  onMouseOverLabel = (e) => {
    this.setState({
      labelEl: e.currentTarget
    })
  }

  onMouseOutLabel = (e) => {
    this.setState({
      //labelEl: null
    })
  }

  onFocusInput(e) {
    this.setState({
      inputEl: e.currentTarget,
      focusedParamName: e.currentTarget.name
    })
  }

  onBlurInput(e) {
    this.setState({
      inputEl: null
    })
  }

  onTabIndexChanged(e, newValue) {
    this.setState({
      tabIndex: newValue
    })
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

  setTabIndex(newValue) {
    this.setState({
      tabIndex: newValue
    })
  }

  //FIXIT: 将来、onBuildが要らなくなったら、onBuildは消した方がいいかも
  render() {
    const { label, param, disabled, value } = this.props
    const { onChange } = this.props
    const { labelEl, inputEl, tabIndex } = this.state


    let isDisabled = (disabled) ? true : false
    let currentValue = (value) ? value : ""

    const openLabelPopper = Boolean(labelEl);
    const openInputPopper = Boolean(inputEl);

    return <div className={style.param}>
      <div className={style.label}>
        <span onMouseOver={this.onMouseOverLabel} onMouseOut={this.onMouseOutLabel}>
          {param.label}
        </span>
        <Popper open={openLabelPopper} anchorEl={labelEl} transition disablePortal={true}
          placement="left"
        >
          <div className={style.labelPopper}>
            <label>{param.label}:{param.name}</label>
            <p>{param.input_ballon && param.input_ballon.text ? param.input_ballon.text : ""}</p>
          </div>
        </Popper>
        <div className={style.description}>
          <p>{param.description}</p>
        </div>
      </div>
      <div className={style.input}>
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
          onBlur={(e) => this.onBlurInput(e)}
        />
        <Popper open={openInputPopper} anchorEl={inputEl} transition placement="right-start">
          {renderHelper(param, param.name, tabIndex, this.setTabIndex.bind(this))}
        </Popper>
      </div>
    </div>
  }
}