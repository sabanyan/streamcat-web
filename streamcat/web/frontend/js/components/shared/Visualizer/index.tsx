import React from 'react';

import {CommandParamType} from 'Types/index';
import { Api } from 'Api';
import * as style from './style.scss';


import {EmptyState, Loader} from 'Shared/Base';
import { PreviewInspector} from 'Shared/Inspector';
import { ActivityType, VCommand } from 'Model/Library';


type Props = {
    index: number;
    visualize: VCommand;
    flowUuid: string;
    nodeIds: (string | null | undefined)[];
    frameUuid: string | null;
    lockUuid?: string;
    result: {
        args: {},
        html: any
    };
    headers: string[];
    afterViz: () => void;
    onSaveResult: Function;
    notify: (title:string, message:string) => string;
    dismissNotify: (id:string) => void;
}

type State = {
    headers: string[];
    html?: any;
    args: {};
    isLoading: boolean;
}

export default class Visualizer extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
        const initialArgs = this.initArgs(props.visualize, {});

        this.state = {
            headers: props.headers,
            html: null,
            args: initialArgs,
            isLoading: (props.result) ? false : true
        };
    }

    initArgs(visualize: VCommand, args: {}) {
        let result = {};
        try {
            const command = {...visualize};
            if (!command) throw "command is undefined in Visualizer";
            if (!command.params) throw "command.params is undefined in Visualizer";
            // const params = StateUtil.deepCopy(command.params);
            const rules = (command.rules) ? command.rules : {};

            command.params.map((param: CommandParamType) => {
                // 1.ルールの適用
                const rule = rules[param.name];
                // rule: 必須項目で空白（""）が許される場合
                if (rule && rule["presence"] && ["presence"]["allowEmpty"] === true) result[param.name] = "";
                // 2.default値の適用
                if (param.default) result[param.name] = param.default;
                // 3.保存されたユーザー入力値の適用
                if (args[param.name]) result[param.name] = args[param.name];
            });
        } catch (e) {
            console.log(e);
        }

        return result;
    }

    // 入力必須の引数に値が入力されているかチェックする
    requiredArgsIsEmpty(visualize: VCommand, args: {}) {
        const command = {...visualize};
        const rules = (command.rules) ? command.rules : {};

        return !!command.params.find((param:CommandParamType) => {
            // コマンド引数の入力規則を取得する
            const rule = rules[param.name];
            // 必須入力(allowEmpty=false)、かつ引数に値が入力されていない場合、そのparamを返す
            if(rule && rule["presence"] && !rule["presence"]["allowEmpty"] && !args[param.name]){
                console.log(param.name);
                return param;
            }
        });
    }

    componentWillMount() {
        this.onLoad();
    }

    onLoad() {
        const {index, result, visualize, onSaveResult} = this.props;

        this.setState({
            isLoading: true
        },
        () => {
            // 保存された結果がある場合、
            if (result) {
                this.setState({
                    html: result.html,
                    args: result.args,
                    isLoading: false
                });
            } else {
                // 保存された結果がない場合、
                this.setState({
                    html: null,
                    args: this.initArgs(visualize, {})
                },
                () => {
                    if(this.requiredArgsIsEmpty(visualize, this.state.args)){
                        // 入力必須の引数に値が入力されていない場合
                        const result = {
                            html: null,
                            args: this.state.args
                        };
                        onSaveResult(index, result, []);
                        this.setState(result);
                    }else{
                        this.selectApi().then(() => {
                            this.setState({
                                isLoading: false
                            });
                        });
                    }
                });
            }
        });
    }

    // GET /framesでの取得はWebブラウザでのキャッシュを期待できる
    selectApi() {
        const {frameUuid, visualize} = this.props;

        if(frameUuid && visualize.id == 'csvtohtmltable'){
            // Frameファイルのプレビューする
            return this.getFrame()
        }else{
            // フローを実行してプレビューする
            return this.postActivity()
        }
    }

    getFrame() {
        const {index, frameUuid} = this.props;
        const {onSaveResult, notify} = this.props;

        if(!frameUuid){
            return new Promise<void>((resolve, reject) => {})
        }

        // 取得するFrameの取得開始行と取得行数を取得する
        const offset: number = this.state.args['offset'] || 0;
        const limit: number = this.state.args['limit'] || 100;

        // GET /frames?contents=on を発行する
        return Api.findFrame(frameUuid, true, offset, limit).then(frame => {
            const headers = frame.args!.column_names;
            const contents = frame.contents;
            const result = {
                html: contents,
                args: this.state.args
            };
            onSaveResult(index, result, headers);
            this.setState(result);
        }).catch((e) => {
            if (e.message !== "VisualizeInitException") {
                notify(e.title, e.message);
            }
            const result = {
                html: null,
                args: this.state.args
            };
            onSaveResult(index, result, []);
            this.setState(result);
        }).then(() => {
            const {afterViz} = this.props;
            if (afterViz) afterViz();
        });
    }

    postActivity() {
        const {index, flowUuid, frameUuid, lockUuid, visualize} = this.props;
        const {onSaveResult, notify} = this.props;
        let nodeIds = this.props.nodeIds;
        
        if(!nodeIds){
            // datasourceによるプレビューでは対象Pointのidは'd'である
            nodeIds = ['d'];
        }

        // nodeIdのリストから、nodeIdをプロパティに持つオブジェクトへ変換する
        const nodeIdsArgs = nodeIds.reduce((nodeIdObj, nodeId) => {
            if(nodeId){
                nodeIdObj[nodeId] = {
                    command_id: visualize.id,
                    args: this.state.args
                };
            }
            return nodeIdObj;
        }, {});

        let promise: Promise<ActivityType>;
        if(frameUuid){
            // POST /vizsを発行する
            promise = Api.createFrameVis(
                frameUuid,
                {   // プレビュー実行はキャッシュの作成を許可する
                    use_cache: true,
                    vis: nodeIdsArgs
                }
            )
        }else{
            // POST /vizsを発行する
            promise = Api.createFlowVis(
                flowUuid,
                {   // プレビュー実行はキャッシュの作成を許可する
                    use_cache: true,
                    vis: nodeIdsArgs
                },
                lockUuid
            )
        }
        
        return promise.then(activity => {
            // TODO: 将来はModel
            const headers = activity.outs[0].args.column_names;
            const contents = activity.outs[0].contents;
            const args = this.state.args;
            const result = {
                html: contents,
                args: args
            };
            onSaveResult(index, result, headers);
            this.setState({args: args, html: contents});
        }).catch(e => {
            if (e.message !== "VisualizeInitException") {
                notify(e.title, e.message);
            }
            const result = {
                html: null,
                args: this.state.args
            };
            onSaveResult(index, result, []);
            this.setState(result);
        }).then(() => {
            const {afterViz} = this.props;
            if (afterViz) afterViz();
        });
    }

    /**
     * csvtothmlttableのときのみlimitをつける
     * @param id
     * @returns {string}
     */
    getLimitWhenCsvToHTMLTable(id: string) {
        if (id === 'csvtohtmltable') {
            return '&limit=1000';
        }
        return '';
    }

    apply(args: {}) {
        this.setState({args: args, isLoading: true}, () => {
            this.selectApi()
                .then(() => {
                    this.setState({isLoading: false});
                });
        });
    }

    componentDidUpdate() {
        //visualizeRequestで取得したhtml内のscriptがrenderされた後にscriptを再取得
        const element = document.getElementById('visualize-component');
        if (element) {
            const scripts = element.getElementsByTagName('script');
            if(scripts.length > 0){
                //再度appendし直してjsを実行させる
                this.innerHTMLScriptReLaunch(scripts[0]);
            }
        }
    }

    /**
     * innerHTMLのscriptをappendし直して実行させる
     * @param script
     */
    innerHTMLScriptReLaunch(script) {
        const s = document.createElement('script');
        script.src ? (s.src = script.src) : (s.innerHTML = script.innerHTML);
        s.async = false;
        document.head.append(s);
        s.remove();
    }

    onBoleanArgsChange(e, param, value) {
        if (!this || !this.state || !param) {
            return;
        }
        let args = this.state.args;
        args[param.name] = value;
        this.setState({args: args});
    }

    renderContents() {
        let result;
        if(this.state.html){
            result = <div className={style.visualizeContainer}>
                <div dangerouslySetInnerHTML={{__html: this.state.html}}></div>
            </div>;
            // <table>を<div>で囲むと、テーブルヘッダを固定できない
            if(this.props.visualize.id!=='csvtohtmltable'){
                result = <div className="modal-body">{result}</div>
            }
        }else{
            result = <EmptyState title={'表示することができません'} description={'条件を変更して表示ボタンを押してください'} icon={'cloud_off'} />;
        }

        return result;
    }

    render() {
        const {visualize} = this.props;

        if (this.state.isLoading) return <Loader center={true} visible={this.state.isLoading} />;

        return <>
            {this.renderContents()}
            <PreviewInspector headers={this.state.headers}
                              onApply={(args: {}) => this.apply(args)}
                              params={visualize.params}
                              args={this.state.args}
                              groups={visualize.groups}
                              label={visualize.label} />
        </>;
    }
}
