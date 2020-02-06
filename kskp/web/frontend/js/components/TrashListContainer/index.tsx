

import React from 'react'

import { Loader } from 'Shared/Base'
import { CommonListRow, CommonListHeader} from 'Components/shared/ListRow'
import { API } from 'Modules/api/index'

import { LibraryModel } from 'Model/index'

import style from './style.scss'

type Props = {
}

type State = {
  trash?: LibraryModel
  isLoading: boolean
}

const headers = ['名前', '作成者', '作成日時']
const hrefs = undefined

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

      await API.request.doGet.trashes({url:'api/v0/library'})
        .then((response) => {
          console.log(response)
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

    return <React.Fragment>
      {this.renderListHeader()}
      {this.renderListRow()}
      {this.renderButtons()}
    </React.Fragment>
  }

  renderListHeader() {
    return <CommonListHeader headers={headers} />
  }

  renderListRow() {
    return null
  }

  renderButtons() {
    return null
  }

  renderInspector() {

  }

  render() {

    return <div className={style.container}>
      <Loader center={true} absolute={true} visible={this.state.isLoading} />
      <div className={style.content}>

      </div>
      <div className={style.inspector}>

      </div>
    </div>
  }
}