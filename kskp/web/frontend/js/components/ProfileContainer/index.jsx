//@flow
import React from 'react'
import style from './style.scss'
import { HttpUtil } from 'Utils/index'
import { ModalManager } from 'Shared/Modal'
import Constants from 'Constants/index'
import { Form, Loader, Tab, TabBar, TabList, TabPanel } from 'Shared/Base'
import { Button, TextField } from 'Shared/Input'
/**
 * ======================================================
 *                      NOT USE REDUX
 * ======================================================
 */

type State = {
  is_loading: boolean;
  is_finished: boolean;
  profile: {
    name: string;
    email: string;
    grafana_id: string;
    grafana_password: string;
    grafana_url: string;
  };
  selected_tab_id: number;
}

type Props = {}

export default class ProfileContainer extends React.Component<Props, State> {

  constructor (props: Props) {
    super(props)
    this.state = {
      is_loading: false,
      is_finished: false,
      profile: {},
      selected_tab_id: 0
    }
  }

  componentDidMount () {
    this.getProfile()
  }

  getProfile () {
    const self = this
    this.setState({is_loading: true})

    // user_idはナビゲーションモデルから取得できない
    // APIをたたかないと取得できないため、injectされたuser_idを使う

    HttpUtil.get('profile/' + inject_user_id).then((response) => {
      const json = response.data
      this.setState(
        {is_loading: false, is_finished: true, profile: json.data})
    }).catch((error) => {
      this.setState(
        {is_loading: false, is_finished: true, profile: {}})
    })
  }

  onClickSave () {
    //ON_SUBMIT_FORMを呼び出すと、Fromコンポーネントの現在のステートを含むSubmitイベントが呼ばれる
    window.emitter.emit(Constants.event.ON_SUBMIT_FORM)
  }

  onClickTab (e, tab_id) {
    this.setState({selected_tab_id: tab_id})
  }

  onSubmit (formState) {
    console.log(formState)
    this.setState({is_loading: true})

    const body = {
      'profile': {
        name: formState['name'],
        email: formState['email'],
        current_password: formState['current_password'],
        new_password: formState['new_password'],
      },
      'extension_tools': {
        'grafana': {
          id: formState['grafana_id'],
          password: formState['grafana_password'],
          url: formState['grafana_url'],
        }
      }
    }

    HttpUtil.put('profile/' + inject_user_id, body).then((response) => {
      const json = response.data
      console.log(json)
      this.setState(
        {is_loading: false})
    }).catch((error) => {
      this.setState(
        {is_loading: false})
    })
  }

  render () {
    if (!this.state.is_finished) return <div className={'container mt-40px'}>
      <Loader center={true} absolute={true} visible={this.state.is_loading} />
    </div>

    const {selected_tab_id, profile} = this.state

    return <div className={'container mt-40px'}>
      <div className={style.page_title}>
        プロフィール設定
      </div>
      <div className={style.property_body}>
        <div className={style.card}>
          <Form onSubmit={(formState) => this.onSubmit(formState)}>
            <TabBar className={style.tabbar}>
              <TabList>
                <Tab className={style.tab} activeClassName={style.active} tab_id={0} selected_tab_id={selected_tab_id}
                     onClickTab={(e, tab_id) => this.onClickTab(e, tab_id)}>プロフィール</Tab>
                <Tab className={style.tab} activeClassName={style.active} tab_id={1} selected_tab_id={selected_tab_id}
                     onClickTab={(e, tab_id) => this.onClickTab(e, tab_id)}>Grafana</Tab>
              </TabList>
            </TabBar>
            <TabPanel tab_id={0} selected_tab_id={selected_tab_id}>
              <div className={'mb-8px'}>
                <label>ユーザ名</label>
                <TextField placeholder={'ユーザ名'} defaultValue={profile.name} useForm={true} formKey={'name'} />
              </div>
              <div className={'mb-8px'}>
                <label>メールアドレス</label>
                <TextField placeholder={'メールアドレス'} defaultValue={profile.email} type={'email'} useForm={true}
                           formKey={'email'} />
              </div>
              <div className={'mb-8px'}>
                <label>パスワード</label>
                <TextField placeholder={'現在のパスワード'} type={'password'} useForm={true} formKey={'current_password'} />
              </div>
              <div className={'mb-8px'}>
                <label>新しいパスワード</label>
                <TextField placeholder={'新しいパスワード'} type={'password'} useForm={true} formKey={'new_password'} />
              </div>
              <div className={'text-right mt-20px'}>
                <Button className={'mr-0'} onClick={this.onClickSave}>保存する</Button>
              </div>
            </TabPanel>
            <TabPanel tab_id={1} selected_tab_id={selected_tab_id}>
              <div className={'mb-8px'}>
                <label>URL</label>
                <TextField className={'mb-0'} placeholder={'Grafana URL'} defaultValue={profile.grafana_url}
                           useForm={true} formKey={'grafana_url'} />
                <small>grafana.com もしくは ホストしている指定のURLを入力してください</small>
              </div>
              <div className={'mb-8px'}>
                <label>ID</label>
                <TextField placeholder={'ID'} defaultValue={profile.grafana_id} useForm={true} formKey={'grafana_id'} />
              </div>
              <div className={'mb-8px'}>
                <label>パスワード</label>
                <TextField placeholder={'パスワード'} defaultValue={profile.grafana_password} type={'password'}
                           useForm={true} formKey={'grafana_password'} />
              </div>
              <div className={'text-right mt-20px'}>
                <Button className={'mr-0'} onClick={this.onClickSave}>保存する</Button>
              </div>
            </TabPanel>
          </Form>
        </div>
      </div>
      <ModalManager />
    </div>
  }
}