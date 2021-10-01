import React from 'react';
import renderer from 'react-test-renderer';
import {GraphUtil} from 'Utils/index';
import CommandModel from 'Model/Command/CommandModel';
import {flowEditorReducerInitialState} from 'modules/flowEditor';
import {
    CommandInspector,
    Resizer
} from 'shared/Inspector';

describe('CommandInspector', () => {
    test('renderer', () => {
        // テスト用のフローJSON
        // mnewnumber(c) -> frame(d)
        const flowJson = {
            'label': 'test2', 
            'nodes': [
                {
                    'id': 'c', 
                    'label': 'c', 
                    'type': 'command', 
                    'commandId': 'mnewnumber',
                    'args': {
                        'I': '1', 
                        'S': '1', 
                        'a': 'a', 
                        'l': '10'
                    }, 
                    'srcs': {}, 
                    'dsts': {
                        'o': 'd'
                    }
                },
                {
                    'id': 'd', 
                    'label': 'd', 
                    'type': 'frame', 
                    'dataSource': 'csv'
                }
            ], 
            'ports': [[],[]],
            'params': [], 
            'creator': 'ユーザー管理者', 
            'createdAt': '2021-09-30 15:30:16', 
            'projectId': null, 
            'description': ''
        };

        // テスト用のmnewnumberのコマンドJSON
        const mnewnumber = {
            'id': 'mnewnumber',
            'params': [
                {
                    'name': 'a',
                    'type': 'string',
                    'label': '項目名の設定 (必須)',
                    'description': '複数項目の指定は不可'
                },
                {
                    'name': 'I',
                    'type': 'string',
                    'label': '値の間隔 (必須)',
                    'optional': true,
                    'default': '1',
                    'description': '正の整数で設定する'
                },
                {
                    'name': 'S',
                    'type': 'string',
                    'label': '開始の値 (必須)',
                    'optional': true,
                    'default': '1',
                    'description': '正の整数、または、アルファベット(大文字)で指定する'
                },
                {
                    'name': 'l',
                    'type': 'string',
                    'label': '生成データの行数(必須)',
                    'optional': true,
                    'default': '10',
                    'description': '正の整数で設定する'
                },
                {
                    'name': 'nfn',
                    'type': 'boolean',
                    'label': '入力データの 1 行目を項目名行とみなさない。',
                    'optional': true
                },
                {
                    'name': 'nfno',
                    'type': 'boolean',
                    'label': '出力データに項目名行を出力しない。',
                    'optional': true
                },
                {
                    'name': 'x',
                    'type': 'boolean',
                    'label': '項目名ではなく、項目番号で指定する',
                    'optional': true,
                    'description': '・0始まりの項目番号で指定する\n・Lをつけると、右端起点の項目番号とみなす(例:3L)\n・複数入力可能なOptの場合は、列範囲としての指定も可能(例: 0-5)'
                },
                {
                    'name': 'tmpPath',
                    'type': 'string',
                    'label': '作業ファイル格納パス名',
                    'optional': true
                }
            ],
            'ports': [
                [],
                [
                    {
                        'name': 'o',
                        'type': 'frame'
                    }
                ]
            ],
            'version': '0.7.0',
            'label': '連番データの新規生成',
            'classification': 'data_source',
            'description': '数値、英字の連番で、指定した行数を作成する',
            'url': '',
            'groups': [
                {
                    'name': 'abstract',
                    'label': '連番データの新規生成',
                    'description': '数値、英字の連番で、指定した行数を作成する',
                    'params': []
                },
                {
                    'name': 'cmd_main',
                    'label': '連番データ生成の設定 (必須)',
                    'params': [
                        'a',
                        'l',
                        'S',
                        'I'
                    ]
                },
                {
                    'name': 'cmd_sub',
                    'label': 'その他 (省略可)',
                    'params': [
                        'nfn',
                        'nfno',
                        'x'
                    ]
                },
                {
                    'name': 'system',
                    'label': 'システム管理用設定（作業領域・ログ出力）',
                    'params': [
                        'tmpPath'
                    ]
                }
            ]
        };

        // CommandInspectorに渡すその他のプロパティ値
        const state = flowEditorReducerInitialState;

        // GraphUtil.load()の実行時に参照される
        window.commands = [new CommandModel(mnewnumber)];

        // テスト用のフローJSONを読み込む
        const json = (new GraphUtil()).load(flowJson);

        // CommandInspector.renderer()の実行時に参照される
        window.nodes = json.nodes;

        // CommandInspectorをレンダリングする
        const inspector = renderer.create(
            <React.Fragment>
                <Resizer>
                    <CommandInspector 
                        selected_step_ids={['c']}
                        mast={state.mast}
                        nodes={flowJson.nodes}
                        updateStep={state.updateStep}
                        addHistory={state.addHistory}
                        selectSteps={state.selectSteps}
                        deleteSteps={state.deleteSteps}
                        sortStepSrcEnd={state.sortStepSrcEnd}
                        baseInspectorDisabled={state.baseInspectorDisabled}
                    />
                </Resizer>
            </React.Fragment>
        );

        // レンダリング結果を検証する
        expect(inspector).toMatchSnapshot();
    });
});
