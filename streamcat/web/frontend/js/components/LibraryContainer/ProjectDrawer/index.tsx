import React from "react"
import { DatumType, FolderType, Member, ProjectType } from "Model/Library";
import { Drawer2, FixedField2, TextField2 } from "Components/shared/Input";
import { DeleteButton } from "../DeleteButton";
import { EditBox } from "../EditBox";
import { DownloadFlowButton } from "../DownloadFlowButton";
import { MembersSelect } from "../MembersSelect";

type Props = {
    createMode: boolean;
    parent: FolderType;
    project: ProjectType;
    onSuccess:(newProject:ProjectType) => void;
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

    // 初期表示値
    const initLabel = {value:createMode? '': project.label, isError:createMode};

    // テキストボックスの値
    const [label, setLabel] = React.useState(initLabel);
    // プロジェクト管理者
    const [owners, setOwners] = React.useState(
        filterByType(project?.members, 'Owner')
    );
    // 編集者
    const [editors, setEditors] = React.useState(
        filterByType(project?.members, 'Writer')
    ); 
    // 閲覧者
    const [readers, setReaders] = React.useState(
        filterByType(project?.members, 'Reader')
    ); 

    // 値の初期化処理
    const initValues = () => {
        setLabel(initLabel);
        setOwners(filterByType(project?.members, 'Owner'));
        setEditors(filterByType(project?.members, 'Writer'));
        setReaders(filterByType(project?.members, 'Reader'));
    };

    // プロジェクトの新規追加処理
    const create = () => parent.createProject(label.value);

    // プロジェクトの更新処理
    const update = () => {
        let promises:Promise<DatumType>[] = [];
        // ラベル名が変更された場合はPromiseを追加する
        if(label.value!==project.label){
            promises.push(
                project.rename(label.value)
            );
        }
        // プロジェクトメンバを更新するPromiseを追加する
        const newOnwers = owners.map(member => ({
            uuid: member.value,
            type: 'Owner' as 'Owner'
        }));
        const newEditors = editors.map(member => ({
            uuid: member.value,
            type: 'Writer' as 'Writer'
        }));
        const newReaders = readers.map(member => ({
            uuid: member.value,
            type: 'Reader' as 'Reader'
        }));
        promises.push(
            project.initMembers(
                [...newOnwers,...newEditors,...newReaders],
                project.modifiedAt
            )
        );
        // 全ての更新処理が完了したら、Projectを返すPromiseを返す
        return Promise.all(promises).then(data => data[0]);
    };

    return <Drawer2>
        <EditBox createMode={createMode}
                 datum={project}
                 values = {[label]}
                 initValues={initValues}
                 create={create}
                 update={update}
                 onSuccess={datum=>onSuccess(datum as ProjectType)} >{[
            // ボタン
            [
                <DeleteButton key={'del'}
                              targets={[project]}
                              onSuccess={(data)=>onSuccess(data[0] as ProjectType)} />,
                <DownloadFlowButton key={'download'}
                                    targets={[project]} />
            ],
            // テキストボックス
            (readOnly, onErrorChange, onEnterKeyPress) => [
                <TextField2 key={'label'}
                            label='ラベル'
                            required={true}
                            readOnly={readOnly}
                            state={[label, setLabel]}
                            onErrorChange={onErrorChange}
                            onEnterKeyPress={onEnterKeyPress} />,
                <MembersSelect  key='members'
                                // プロジェクトメンバの更新権限
                                readOnly={readOnly || !project.allowlist.updateMember}
                                // プロジェクトメンバの表示権限
                                visible={project.allowlist.findMember}
                                ownerState={[owners, setOwners]}
                                editorState={[editors, setEditors]}
                                readerState={[readers, setReaders]} />,
                <FixedField2 key={'creator'}
                             label='作成者'
                             value={project.creator} />,
                <FixedField2 key={'createdAt'}
                             label='作成日時'
                             value={project.createdAt} />,
            ]
        ]}</EditBox>
    </Drawer2>;
};
