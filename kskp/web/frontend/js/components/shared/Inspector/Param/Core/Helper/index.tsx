import React from 'react'

import { AppBar, Toolbar, IconButton, Tabs, Tab, Card, CardContent } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';

import { Param as ParamType, Element } from 'Shared/Inspector/ParamsForm/index'

import style from './style.scss'

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

type Props = {
  helper: {
    label: string;
    tabs: {
      label: string;
      data: Data[];
    }[];
  };

  onClickShortcut(event, value, delimiter:string): void;
}

export default function Helper(props: Props) {
  const { helper, onClickShortcut } = props;

  console.log(props)
  const [tabIndex, setTabIndex] = React.useState(0);
  const handleChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  let tabs = helper.tabs

  const TabPanel = (props) => {
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

  const renderShortCuts = (shortcuts: Shortcut[]): any => {
    let result: any[] = []
    const defaultValue: Shortcut = {
      value: "",
      label: "",
      link: "",
      delimiter: ","
    }

    if (!Array.isArray(shortcuts)) return result

    shortcuts.forEach((s, index) => {
      let v = defaultValue;
      v = { ...s }
      result.push(
        <div key={index} className={style.shortcut}>
          {v.label + " : "}
          <a href={"javascript:void(0)"}
            onClick={(event) => onClickShortcut(event, v.value, v.delimiter)}
          >
            {v.link}
          </a>
        </div>

      )
    })

    return result
  }

  const renderDatas = (datas: Data[]) => {
    let result: any[] = []
    datas.forEach((d, index) => {
      result.push(<div key={index} className={style.data}>
        <span>{d.label}</span>
        <div className={style.shortcuts}>
          {renderShortCuts(d.shortcuts)}
        </div>
      </div>)
    })
    return result
  }

  let renderedTabs: any[] = []
  let renderedTabPannels: any[] = []

  tabs.forEach((t, index) => {
    renderedTabs.push(
      <Tab label={t.label} key={index} />
    )
  })

  tabs.forEach((t, index) => {
    renderedTabPannels.push(
      <TabPanel key={index} value={tabIndex} index={index}>
        {renderDatas(t.data)}
      </TabPanel>
    )
  })

  return <React.Fragment>
    <AppBar position="static" color="default">
      <Toolbar>
        <IconButton size="small" color="inherit" aria-label="menu">
          <span className="material-icons">close</span>
        </IconButton>
      </Toolbar>
      <Tabs
        value={tabIndex}
        onChange={handleChange}
        indicatorColor="primary"
        textColor="primary"
        variant="scrollable"
        scrollButtons="auto"
      >
        {renderedTabs}
      </Tabs>
    </AppBar>
    <Card variant="outlined">
      <CardContent>
        {renderedTabPannels}
      </CardContent>
    </Card>
  </React.Fragment>
}

