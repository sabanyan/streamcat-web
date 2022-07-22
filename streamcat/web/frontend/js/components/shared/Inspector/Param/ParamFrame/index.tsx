import React from 'react'
import { DatumType } from 'Model/Library';
import { CommandParamType } from 'Types/index'
import { Api } from 'Api';
import { HttpUtil } from 'Utils/index';
import style from './style.scss'

type Props = {
    param: CommandParamType;
    disabled?: boolean;
    value?: string;
    parentUUID?: string;
    // event
    onChange?: Function; // onChange(e, param)
}

type State = {
    path: string;
}

const initialState: State = {
    path: 'ライブラリ上のファイルを選択する'
}


// ライブラリーからフレームを選択する
export class ParamFrame extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = initialState;
    }

    componentDidMount() {
        const { value } = this.props
        if(!value){
            return;
        }
        Api.findFrame(value).then(frame => {
            this.setState({ path: frame.folderPath + '/' + frame.label });
        }).catch(e => {
            this.setState(initialState);
        });
    }

    onClick(e) {
        const { param, onChange, parentUUID } = this.props;

        const getApiPath = (folder:DatumType):string => {
            // Datumのtypeに対応するAPIパスを返す
            if(folder.type==='project'){
                return `projects/${folder.uuid}`;
            }else if(folder.type==='folder'){
                return `folders/${folder.uuid}`;
            }else if(folder.type==='trash'){
                return `trashes`;
            }else{
                // UUIDの指定が無い場合は、ルートフォルダのAPIパスを返す
                return 'library';
            }
        }

        // フレーム選択ダイアログを表示する
        const openSelectDialog = (apiPath:string) => {
            HttpUtil.windowOpen(
                apiPath + '?dialog=true&mode=frame_select',
                selected_frame => {
                    let selected_frame_uuid = 'undefined';
                    if (selected_frame && selected_frame.uuid) {
                        selected_frame_uuid = selected_frame.uuid;
                        // folderPathがnullの場合は、フレームのラベル名のみを表示する
                        let folderPath = '';
                        if(selected_frame.folderPath){
                            folderPath = selected_frame.folderPath + '/';
                        }
                        this.setState({
                            path: folderPath + selected_frame.label
                        })
                    }
                    if(onChange){
                        onChange(e, param, selected_frame_uuid);
                    }
                }
            );
        }

        if(parentUUID){
            // NOTE: GET /foldersはProjectも取得できる(隠し機能)
            Api.findFolder(parentUUID).then(folder => {
                // 入力フレーム選択ダイアログは、編集中フローの親フォルダを初期表示する
                openSelectDialog(getApiPath(folder));
            });
        }else{
            // 親フォルダが無い場合は、ライブラリーを初期表示する
            openSelectDialog('library');
        }
    }

    //FIXIT: 将来、onBuildが要らなくなったら、onBuildは消した方がいいかも
    render() {
        return <React.Fragment>
            <div>
                <a href={"#!"} onClick={(e) => this.onClick(e)} className={style.path}>{this.state.path}</a>
            </div>
        </React.Fragment>
    }
}