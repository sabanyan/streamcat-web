

import React from 'react'

import { Loader } from 'Shared/Base'
import { API } from 'Modules/api/index'

import { LibraryModel } from 'Model/index'

import style from './style.scss'

type Props = {
}

type State = {
  trash?: LibraryModel
  isLoading: boolean
}


export default class TrashList extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props)
    this.state = {
      isLoading: false
    }
  }

  setStateAsync(state) {
    return new Promise((resolve) => {
      this.setState(state, resolve)
    });
  }

  componentDidMount() {
    //this.fetch()
  }

  fetch() {
    return new Promise(async (resolve, reject) => {
      this.setStateAsync({
        isLoading: true
      })

      await API.request.doGet.trashes({})
        .then((response) => {
          if (response.data.data) {
            this.setState({
              trash: new LibraryModel(response.data.data)
            })
          }
        })
      resolve()
    })
      .then(() => {
        this.setState({
          isLoading: false
        })
      })
  }

  renderContent() {

  }

  renderHeader() {

  }

  renderList() {

  }

  renderButtons() {

  }

  renderInspector() {

  }

  render() {

    return <div className={style.container}>
      <div className={style.content}>
        <Loader center={true} absolute={true} visible={this.state.isLoading} />

      </div>
      <div className={style.inspector}>


      </div>
    </div>
  }
}