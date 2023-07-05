import React from 'react';
import { NavigationType, UserType } from 'Model/Navigation/NavigationModel';
import { ProjectType } from 'Model/Library';
import { Api } from 'Api';
import { DialogButton } from 'Shared/Input';
import { EditBox, ExtendedUserType } from 'Shared/Base/EditBox';
import { TextField2, Value } from 'Shared/Input/TextField2';
import { MultiSelect2, Values } from 'Shared/Input/MultiSelect2';

type Props = {
    navigation: NavigationType | null;
    allProjects: ProjectType[];
    onSuccess:(newUser:UserType) => void;
};

/**
 * ユーザの追加ボタン
 * @param props 
 */
export const CreateUserButton = (props:Props) => {
    const { navigation, allProjects, onSuccess } = props;

    // 空の入力値
    const initValue:Value = {value:'', isError:true};
    const initSelectValue:Values<ProjectType> = {value:[], isError:false};

    // テキストボックスの入力値
    const [name, setName] = React.useState(initValue);
    const [email, setEmail] = React.useState(initValue);
    const [projects, setProjects] = React.useState(initSelectValue);

    // 値の初期化処理
    const initValues = () => {
        setName(initValue);
        setEmail(initValue);
        setProjects(initSelectValue);
    };

    // ユーザを新規に作成する
    const create = () => {
        return Api.createUser(email.value, name.value).then(user => {
            // UserをProjectに参加させる
            joinProject(user.uuid, projects.value);
            // EditBoxに渡すためにExtendedUserTypeに変換する
            return {
                label: user.name,
                type: 'user',
                allowlist: {
                    update: !!(navigation && navigation.allowlist && navigation.allowlist.updateUser)
                },
                ...user
            };
        });
    };

    // ユーザをプロジェクトに紐付ける
    const joinProject = (userUUID: string, projects: ProjectType[]) => {
        Promise.all(
            projects.map(project => {
                return project.joinMember({uuid:userUUID, type:'Reader'})
            })
        );
    };

    // 選択肢の比較関数
    const isEaual = (item:ProjectType, value:ProjectType) => item.uuid===value.uuid;

    return <DialogButton label='ユーザーの追加'
                         icon='add'
                         large={true} >{[
        // Contents
        (closeDialog) => [
            <EditBox<ExtendedUserType>
                key='createUser'
                createMode={true}
                values = {[name,email,projects]}
                initValues={initValues}
                create={create}
                onSuccess={newUser => {
                    onSuccess(newUser as UserType);
                    closeDialog();
                }}
                onCancel={closeDialog} >{[
                // ボタン
                () => [],
                // テキストボックス
                (readOnly, onErrorChange, onEnterKeyDown) => [
                    <TextField2 key='name'
                                label='名前'
                                required={true}
                                readOnly={readOnly}
                                autoFocus={true}
                                state={[name, setName]}
                                onErrorChange={onErrorChange}
                                onEnterKeyDown={onEnterKeyDown} />,
                    <TextField2 key='email'
                                label='E-mail'
                                required={true}
                                readOnly={readOnly}
                                state={[email, setEmail]}
                                onErrorChange={onErrorChange}
                                onEnterKeyDown={onEnterKeyDown} />,
                    <MultiSelect2<ProjectType>
                                label='所属プロジェクト'
                                readOnly={readOnly}
                                readOnlyLayout='list'
                                items={allProjects}
                                state={[projects, setProjects]}
                                isEqual={isEaual}
                                getLabel={project=>project.label}/>
                ]
            ]}</EditBox>
        ],
        // Buttons
        ()=>[]
    ]}</DialogButton>;
};
