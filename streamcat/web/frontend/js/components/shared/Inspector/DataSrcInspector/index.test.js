import React from 'react';
import renderer from 'react-test-renderer';
import {GraphUtil} from 'Utils/index';
import {flowEditorReducerInitialState} from 'modules/flowEditor';
import {
    DataSrcInspector,
    Resizer
} from 'shared/Inspector';

describe('DataSrcInspector', () => {
    test('renderer', () => {
        // テスト用のフローJSON
        // data_source(i) -> frame(d)
        const flowJson = {
            'label': 'test2', 
            'nodes': [
                {
                    'id': 'i', 
                    'label': 'ライブラリ', 
                    'type': 'flow', 
                    'classification': 'data_source',
                    'args': {
                        'uuid': '54e4b5ce-ae14-4eb8-bac4-3e01e9e8cbe0'
                    },
                    'flow': {
                        'label': 'ライブラリ', 
                        'nodes': [
                            {
                                'id': 's',
                                'label': 'ライブラリ',
                                'type': 'store', 
                                'uuid': 'fe2efc50-681e-4a55-ad33-609a43577399'
                            }, 
                            {
                                'id': 'c1', 
                                'label': 'c1', 
                                'type': 'command', 
                                'commandId': 'loader',
                                'args': {
                                    'uuid': '@[uuid]'
                                },
                                'srcs': {
                                    'folder': 's'
                                }, 
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
                        'ports': [
                            [], 
                            [
                                {
                                    'type': 'frame', 
                                    'label': 'o', 
                                    'nodeId': 'd'
                                }
                            ]
                        ], 
                        'params': [
                            {
                                'name': 'uuid', 
                                'type': 'frame', 
                                'label': 'ファイルを指定する', 
                                'optional': false
                            }
                        ], 
                        'creator': 'ユーザー管理者', 
                        'createdAt': '2021-10-01 13:20:10', 
                        'projectId': null, 
                        'description': ''
                    }, 
                    'srcs': {},
                    'dsts': {
                        'd': 'd'
                    }, 
                }, 
                {
                    'id': 'd',
                    'label': 'd',
                    'type': 'frame'
                }
            ], 
            'ports': [
                [
                    {
                        'type': 'frame', 
                        'label': 'd', 
                        'nodeId': 'd'
                    }
                ], 
                []
            ], 
            'params': [], 
            'creator': 'ユーザー管理者', 
            'createdAt': '2021-09-30 15:30:16', 
            'projectId': null, 
            'description': ''
        };

        // DataSrcInspectorに渡すその他のプロパティ値
        const state = flowEditorReducerInitialState;

        // GraphUtil.load()の実行時に参照される
        window.commands = [];

        // テスト用のフローJSONを読み込む
        const json = (new GraphUtil()).load(flowJson);

        // DataSrcInspector.renderer()の実行時に参照される
        window.nodes = json.nodes;

        // DataSrcInspectorをレンダリングする
        const inspector = renderer.create(
            <React.Fragment>
                <Resizer>
                    <DataSrcInspector
                        nodes={flowJson.nodes}
                        selected_step_ids={['i']}
                        baseInspectorDisabled={state.baseInspectorDisabled}
                        sortStepSrcEnd={state.sortStepSrcEnd}
                        updateStep={state.updateStep}
                        addHistory={state.addHistory}
                        selectSteps={state.selectSteps}
                        deleteSteps={state.deleteSteps}
                    />
                </Resizer>
            </React.Fragment>
        );

        // レンダリング結果を検証する
        expect(inspector).toMatchSnapshot();
    });
});
