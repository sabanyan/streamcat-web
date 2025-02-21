import React from 'react'
import { DatumType, FolderType, Member, ProjectType } from 'Model/Library';
import { Drawer2, TextField2 } from 'Shared/Input';
import { DeleteButton } from 'Shared/Button/DeleteButton';
import { EditBox } from 'Shared/Base/EditBox';
import { DuplicateButton } from 'Shared/Button/DuplicateButton';
import { DownloadFlowButton } from 'Shared/Button/DownloadFlowButton';
import { MembersSelect } from 'Shared/Input/MembersSelect';
import { CreatorField } from 'Shared/Input/CreatorField';
import { Api } from 'Api';

type Props = {
    createMode: boolean;
    parent: FolderType;
    project: ProjectType;
    onSuccess:(newProject:ProjectType) => void;
};

type MemberType = {
    label: string;
    value: string;
};

export const ProjectDrawer = (props:Props) => {
    const { createMode, parent, project, onSuccess } = props;

    // Membersから指定したTypeのメンバーを抽出する
    const filterByType = (members:Member[]|undefined, type:'Owner'|'Writer'|'Reader') => {
        if(!members) return [];
        return members.filter(member => member.type===type).map(member => ({
            label: member.name,
            value: member.uuid
    }))};

    // 二つのプロジェクトメンバ配列が同じメンバを持つかどうかを判定する
    // TODO: メンバの並び順が異なるだけの場合はfalseと判定される
    const isSemiEqualMembers = (members1:MemberType[], members2:MemberType[]) => (
        members1.length===members2.length &&
        members1.every((member, i) => member.value===members2[i].value)
    );

    // 初期表示値
    const initLabel = {value:createMode? '': project.label, isError:createMode};
    const initOwners = {value:filterByType(project.members, 'Owner'), isError:createMode};
    const initEditors = {value:filterByType(project.members, 'Writer'), isError:false};
    const initReaders = {value:filterByType(project.members, 'Reader'), isError:false};

    // テキストボックスの値
    const [label, setLabel] = React.useState(initLabel);
    // プロジェクト管理者
    const [owners, setOwners] = React.useState(initOwners);
    // 編集者
    const [editors, setEditors] = React.useState(initEditors);
    // 閲覧者
    const [readers, setReaders] = React.useState(initReaders);

    // 値の初期化処理
    const initValues = () => {
        setLabel(initLabel);
        setOwners(initOwners);
        setEditors(initEditors);
        setReaders(initReaders);
    };

    // プロジェクトの新規追加処理
    const create = () => parent.createProject(label.value);

    // プロジェクトの更新処理
    const update = () => {
        let newLabel:string = '';
        let newMembers:{uuid:string, type:'Owner'|'Writer'|'Reader'}[] = [];
        // ラベル名が変更された場合はPromiseを追加する
        if(label.value!==project.label){
            newLabel = label.value;
        }
        // プロジェクトメンバが変更された場合はPromiseを追加する
        if( !isSemiEqualMembers(owners.value, initOwners.value)  ||
            !isSemiEqualMembers(editors.value, initEditors.value)||
            !isSemiEqualMembers(readers.value, initReaders.value)){
            // プロジェクトメンバを更新するPromiseを追加する
            const newOnwers = owners.value.map(member => ({
                uuid: member.value,
                type: 'Owner' as 'Owner'
            }));
            const newEditors = editors.value.map(member => ({
                uuid: member.value,
                type: 'Writer' as 'Writer'
            }));
            const newReaders = readers.value.map(member => ({
                uuid: member.value,
                type: 'Reader' as 'Reader'
            }));
            newMembers = [...newOnwers, ...newEditors, ...newReaders];
        }
        // Projectを返すPromiseを返す
        if(newLabel && newMembers.length > 0){
            // ラベル名とプロジェクトメンバが変更された場合
            return project.update(newLabel, newMembers, project.modifiedAt);
        }else if(newLabel){
            // ラベル名だけが変更された場合
            return project.rename(newLabel);
        }else if(newMembers.length > 0){
            // プロジェクトメンバだけが変更された場合
            return project.initMembers(newMembers, project.modifiedAt);
        }else{
            // 何も変更されなかった場合
            return Promise.resolve(undefined);
        }
    };

    return <Drawer2>
        <EditBox createMode={createMode}
                 datum={project}
                 values = {[label,owners]}
                 initValues={initValues}
                 create={create}
                 update={update}
                 onSuccess={datum=>onSuccess(datum as ProjectType)} >{[
            // ボタン
            (readonly) => readonly? [
                <DeleteButton key='del'
                              targets={[project]}
                              onSuccess={(data)=>onSuccess(data[0] as ProjectType)} />,
                <DuplicateButton key='duplicate'
                                 targets={[project]}
                                 onSuccess={(data)=>onSuccess(data[0] as ProjectType)} />,
                <DownloadFlowButton key='download'
                                    targets={[project]} />
            ]: [],
            // テキストボックス
            (readOnly, onErrorChange, onEnterKeyDown) => [
                <TextField2 key='label'
                            label='ラベル'
                            required={true}
                            readOnly={readOnly}
                            state={[label, setLabel]}
                            onErrorChange={onErrorChange}
                            onEnterKeyDown={onEnterKeyDown} />,
                <MembersSelect  key='members'
                                // プロジェクトメンバの更新権限
                                readOnly={readOnly || !project.allowlist.updateMember}
                                // プロジェクトメンバの表示権限
                                visible={project.allowlist.findMember}
                                ownerState={[owners, setOwners]}
                                editorState={[editors, setEditors]}
                                readerState={[readers, setReaders]}
                                onErrorChange={onErrorChange} />,
                <CreatorField key='creator' datum={project} />
            ]
        ]}</EditBox>
    </Drawer2>;
};
