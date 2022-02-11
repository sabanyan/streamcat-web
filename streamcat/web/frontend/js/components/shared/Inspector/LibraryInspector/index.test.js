import React from 'react';
import renderer from 'react-test-renderer';
import EventEmitter from 'eventemitter3';
import Constants from 'Constants/index';
import {LibraryInspector} from 'Shared/Inspector/index';

describe('LibraryInspector', () => {
    // 
    window.emitter = new EventEmitter();
    
    // 
    const projectInfo = {};

    // テスト用のAllowlist
    const defaultAllowlist = {
        copy: true,
        createFile: true,
        createFolder: true,
        createProject: true,
        delete: true,
        download: true,
        execute: true,
        findMember: true,
        lock: true,
        move: true,
        read: true,
        update: true,
        updateMember: true,
        upload: true,
        export: true,
        import: true
    };

    test('render with frame type', () => {
        // テスト用の選択データ
        const selectedData = {
            createdAt: '2021-10-04 11:57',
            creator: '(=^ェ^=)',
            label: 'テストフレームファイル',
            type: Constants.library.type.frame,
            uuid: '3f0e40ba-8df7-4662-94ab-5a1d1d88c94a',
            selected: true,
        };

        // LibraryInspectorをレンダリングする
        const inspector = renderer.create(
            <LibraryInspector
                currentProject={projectInfo}
                allowlist={defaultAllowlist}
                selectedData={selectedData}
                onClickCopy={()=>{}}
                onClickDelete={()=>{}}
                onClickApply={()=>{}}
                onClickMove={()=>{}}
                onClickEdit={()=>{}}
                onClickEditEncoding={()=>{}}
                onClickCleanTrash={()=>{}}
                onClickMemberInfo={()=>{}}
                onChangeFlowLock={()=>{}}
                onBlurTitle={()=>{}}
            />
        );

        // レンダリング結果を検証する
        expect(inspector).toMatchSnapshot();
    });

    test('render with flow type', () => {
        // テスト用の選択データ
        const selectedData = {
            createdAt: '2022-01-07 06:30',
            creator: '😿',
            label: '私のフロー',
            type: Constants.library.type.flow,
            uuid: '1c7dd3fe-88b1-4676-a724-dba791165cc5',
            selected: true,
        };

        // LibraryInspectorをレンダリングする
        const inspector = renderer.create(
            <LibraryInspector
                currentProject={projectInfo}
                allowlist={defaultAllowlist}
                selectedData={selectedData}
                onClickCopy={()=>{}}
                onClickDelete={()=>{}}
                onClickApply={()=>{}}
                onClickMove={()=>{}}
                onClickEdit={()=>{}}
                onClickEditEncoding={()=>{}}
                onClickCleanTrash={()=>{}}
                onClickMemberInfo={()=>{}}
                onChangeFlowLock={()=>{}}
                onBlurTitle={()=>{}}
            />
        );

        // レンダリング結果を検証する
        expect(inspector).toMatchSnapshot();
    });
});
