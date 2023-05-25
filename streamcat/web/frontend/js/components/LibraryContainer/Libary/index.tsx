import React from 'react';
import {useAsyncResource, resourceCache, AsyncResourceContent} from 'use-async-resource';
import { EmptyState, Spacer } from 'Shared/Base';
import { Flex } from 'Shared/Base/Layouts/Flex';
import { NotificationManager, useStreamCatNotifications } from 'Shared/Notification';
import Constants from 'Constants/index';
import { Api } from 'Api';
import { ErrorUtil,
        HttpUtil,
        ReactDomUtil} from 'Utils/index';
import { DatumType,
        ParentProjectType,
        ParentFolderType,
        ParentTrashType,
        ProjectType,
        FolderType,
        DatabaseType,
        RemoteFolderType,
        FlowType,
        FrameType,
        ActivityType,
        ScheduleType,
        TrashType } from 'Model/Library';
import { FileListTable } from 'LibraryContainer/FileListTable';
import { BreadCrumb, IBreadCrumbsLink } from 'LibraryContainer/BreadCrumb';
import { TrashMenuList } from 'LibraryContainer/TrashMenuList';
import { ApplyMenuList } from 'Components/LibraryContainer/ApplyMenuList';
import { MenuList } from 'LibraryContainer/MenuList';
import { VisualizeModel, VisualizeModelProps } from 'Model/index';
import { ProjectDrawer } from 'Shared/Drawer/ProjectDrawer';
import { FolderDrawer } from 'Shared/Drawer/FolderDrawer';
import { DatabaseDrawer } from 'Shared/Drawer/DatabaseDrawer';
import { RemoteFolderDrawer } from 'Shared/Drawer/RemoteFolderDrawer';
import { SystemFolderDrawer } from 'Shared/Drawer/SystemFolderDrawer';
import { TrashFolderDrawer } from 'Shared/Drawer/TrashFolderDrawer';
import { FlowDrawer } from 'Shared/Drawer/FlowDrawer';
import { FrameDrawer } from 'Shared/Drawer/FrameDrawer';
import { TrashDrawer } from 'Shared/Drawer/TrashDrawer'
import { ActivityDrawer } from 'Shared/Drawer/ActivityDrawer';
import { ScheduleDrawer } from 'Shared/Drawer/ScheduleDrawer';
import { MultiDataDrawer } from 'Shared/Drawer/MultiDataDrawer';
import { UnkownDrawer } from 'Shared/Drawer/UnkownDrawer';

/**
 * ライブラリ画面に表示するDatumの表示行
 */
export type DatumEntryType = DatumType & {
    selected: boolean;
    clickable: boolean;
};

const getParentFolder = () => {
    if(inject_folder_uuid){
        if(inject_is_project){
            // プロジェクトを表示する場合
            return Api.findProject(inject_folder_uuid);
        }else{
            // フォルダを表示する場合
            return Api.findFolder(inject_folder_uuid);
        }
    }else if(inject_is_trash) {
        // ゴミ箱を表示する場合
        return Api.findTrash();
    }else{
        // ルートフォルダを表示する場合
        return Api.findLibrary();
    }
};

const getProjects = (members:boolean) => {
    if(inject_folder_uuid || inject_is_trash){
        // ルートフォルダ以外の場合は何もしない
        return Api.findEmpty();
    }else{
        // ルートフォルダを表示する場合
        return Api.findProjects(true, false, members);
    }
};

export const Library = () => {

     // ここでフォルダの取得を開始する
    const [folderReader] = useAsyncResource(getParentFolder, []);

    // ルートフォルダを表示する場合は
    // ここで全てのプロジェクトのメンバリストを取得する
    // (GET /projects?members=1はSQLが遅いので画面表示用とは別に非同期に取得する)
    const [projectsReader, refreshProjects] = useAsyncResource(getProjects, true);

    const {notifyError} = useStreamCatNotifications();
    const [parentFolder, setParentFolder] = React.useState<ParentFolderType>(folderReader());
    const [sortedDatas, setSortedDatas] = React.useState<DatumType[]>(folderReader().children);
    const [selectedDatas, setSelectedDatas] = React.useState<DatumType[]>([]);
    const [lastSelectedDatum, setLastSelectedDatum] = React.useState<DatumType | null>(null);
    const [visualizers, setVisualizers] = React.useState<VisualizeModel<VisualizeModelProps>[]>([]);
    const [links, setLinks] = React.useState<IBreadCrumbsLink[]>([]);
    const clickedLibraryCell = React.useRef(false);

    React.useEffect(() => {
        // 
        getVisualizers();
        // 
        if (isDialog) {
            const bodyEl = document.querySelector('body');
            if (bodyEl) bodyEl.classList.add('dialog');
        }
    }, []);

    React.useEffect(() => {
        if (!parentFolder) return;
        setLinks(makeBreadCrumbLinks(parentFolder.folderPath));
    }, [parentFolder]);

    const isDialog = (HttpUtil.getURLParam('dialog') === 'true');
    const mode = HttpUtil.getURLParam('mode') ? HttpUtil.getURLParam('mode') : Constants.library.mode.list;

    const getVisualizers = () => {
        Api.findVCommands().then(visualizers => {
            const visualizerModels = visualizers.map(visualizer => new VisualizeModel(visualizer));
            setVisualizers(visualizerModels);
        });
    };

    const makeBreadCrumbLinks = (folderPath: any[] | any): IBreadCrumbsLink[] => {
        const dialogOption = (isDialog) ? '?dialog=true' + ((mode) ? '&mode=' + mode : '') : '';
        return folderPath.map((path, index): IBreadCrumbsLink => {
            const isCurrent = ((folderPath.length - 1) === index);

            // HTML headのtitleにカレントフォルダ名を設定する
            if (isCurrent){
                document.title = path.label;
            }

            if (index === 0) {
                // ルートはライブラリを指定
                return {
                    uuid: path.uuid,
                    label: 'ライブラリ',
                    url: '/library' + dialogOption,
                    current: isCurrent,
                    type: 'folder'
                };
            }

            let url_prefix;
            if (path.type === 'folder') {
                url_prefix = '/folders/';
            } else if (path.type === 'project') {
                url_prefix = '/projects/';
            }

            return {
                uuid: path.uuid,
                label: path.label,
                url: url_prefix + path.uuid + dialogOption,
                current: isCurrent,
                type: path.type
            };
        });
    };

    const clearSelected = () => {
        setSelectedDatas([]);
    };

    const onClickSelectDestination = () => {
        if (window.opener || !window.opener.closed) {
            window.opener.onCallbackApply(parentFolder.uuid);
        }
        window.close();
    };

    const renderEmptyState = () => {
        return <EmptyState
            icon={'inbox'}
            title={'ライブラリが空です'}
            description={'表示できるファイルがありません'} />;
    };

    const renderAll = () => {
        const isEmptyLibraryList = !Array.isArray(parentFolder!.children) || parentFolder!.children.length === 0;

        if (isEmptyLibraryList && mode === Constants.library.mode.dialog){
            return renderEmptyState();
        }

        const onClickBody = () => {
            // FileListBodyをクリックしたら押下フラグをtrueにする
            clickedLibraryCell.current = true;
        };

        const onMouseDownLibrary = () => {
            if (clickedLibraryCell.current) {
                clearSelected();// 選択状態を一旦解除
                setLastSelectedDatum(null);
                clickedLibraryCell.current = false;
            }
        };

        const renderMenuList = () => {
            let menuList;
            if (mode === Constants.library.mode.folder_select) {
                menuList = <ApplyMenuList
                    onClickApply={onClickSelectDestination}
                />;
            } else if (mode===Constants.library.mode.frame_select || mode===Constants.library.mode.flow_select) {
                return null;
            } else {
                if (inject_is_trash) {
                    menuList = <TrashMenuList
                        trashFolder={parentFolder as ParentTrashType}
                        onSuccess={fetchFolder}
                    />;
                } else {
                    menuList = <MenuList
                        parent={parentFolder}
                        allowlist={parentFolder!.allowlist}
                        onSuccess={forceFetchFolder}
                    />;
                }
            }

            return <>
                <Spacer minWidth={40} />
                <Flex flexDirection={'column'} fluid={true} width={280}>
                    <Spacer height={160} />
                    {menuList}
                </Flex>
            </>;
        };

        return <Flex justifyContent={'center'} fluid={true}>
            <Flex flexDirection={'row'} width={1480 + 40 + 40} minHeight={'calc(100vh - 64px)'} fluid={true}
                onMouseDown={onMouseDownLibrary}>
                <Spacer width={40} />
                <Flex flexDirection={'column'} fluid={true} onClick={onClickBody}>
                    <Spacer height={40} />
                    <BreadCrumb links={links} />
                    <Spacer height={8} />
                    <FileListTable
                        bodies={sortedDatas}
                        mode={mode}
                        minWidth={800}
                        selectedDatas={[selectedDatas, setSelectedDatas]}
                        lastSelectedDatum={[lastSelectedDatum, setLastSelectedDatum]}
                    />
                    <Spacer height={80} />
                </Flex>
                {renderMenuList()}
                <Spacer width={40} />
            </Flex>
        </Flex>;
    };

    const isSystemFolder = (datum:DatumType) => {
        const cacheFolderUuid = 'cc9f050d-b007-414e-a6e0-6d31a9c13395';
        const activityFolderUuid = 'aa2799ba-798e-4fa3-984c-b3fad92fd162';
        return datum.uuid===cacheFolderUuid || datum.uuid===activityFolderUuid;
    };

    const fetchFolder = () => {
        return getParentFolder().then(response => {
            // 取得したフォルダ等を状態変数に格納する
            setParentFolder(response);
            setSortedDatas(response.children);
            return response;
        }).catch(e => {
            notifyError('フォルダ取得エラー', ReactDomUtil.renderToString(ErrorUtil.getErrorBody(e)));
        });
    };

    const forceFetchFolder = (datum) => {
        // useAsyncResourceが保持するプロジェクトのキャッシュを削除する
        resourceCache(getProjects).clear();
        // ルートフォルダ直下の全てのプロジェクトを再取得する
        refreshProjects(true);
        // フォルダを再取得する
        fetchFolder();
    };

    const refreshLibrary = (datum:DatumType) => {
        // フォルダを再取得する
        fetchFolder();
        // 状態変数を更新する
        setSelectedDatas([datum]);
    };

    const getProject = (project:DatumType|null) => {
        if(!project){
            return null;
        }
        const projectUuid = project.uuid;
        // ルートフォルダ直下の全てのプロジェクトから、指定されたプロジェクトを取得する
        const ret = projectsReader().find(child => child.uuid===projectUuid) as ParentProjectType;
        if(!ret){
            return null;
        }
        return ret;
    };

    const getProjectDrawer = (datum:ProjectType|null) => {
        const project = getProject(datum);
        if(project){
            return <ProjectDrawer
                        createMode={false} 
                        parent={parentFolder}
                        project={project}
                        onSuccess={forceFetchFolder} />;
        }else{
            // プロジェクトが見つからない場合はペインを表示しない
            return <></>;
        }
    };

    const getTrashDrawer = (datum:DatumType|null) => {
        if(datum){
            return <TrashDrawer 
                        trashFolder={parentFolder as ParentTrashType}
                        datum={datum}
                        onSuccess={data=>refreshLibrary(data[0])} />;
        }else{
            // Datumをゴミ箱から戻した直後にselectedDatas[0]がundefinedになるため、
            return <></>;
        }
    };

    // Datum型とペイン種別の対応テーブル
    const drawersTable = {
        project:    getProjectDrawer(selectedDatas[0] as ProjectType),
        folder:     <FolderDrawer
                        createMode={false} 
                        parent={parentFolder}
                        folder={selectedDatas[0] as FolderType}
                        onSuccess={refreshLibrary} />,
        rfolder:    <RemoteFolderDrawer
                        createMode={false}
                        parent={parentFolder}
                        remoteFolder={selectedDatas[0] as RemoteFolderType}
                        onSuccess={refreshLibrary} />,
        database:   <DatabaseDrawer
                        createMode={false}
                        parent={parentFolder}
                        datum={selectedDatas[0] as DatabaseType}
                        onSuccess={refreshLibrary} />,
        flow:       <FlowDrawer
                        createMode={false} 
                        parent={parentFolder}
                        flow={selectedDatas[0] as FlowType}
                        onSuccess={refreshLibrary} />,
        frame:      <FrameDrawer
                        createMode={false}
                        parent={parentFolder}
                        frame={selectedDatas[0] as FrameType}
                        onSuccess={refreshLibrary} />,
        schedule:   <ScheduleDrawer
                        createMode={false}
                        parent={parentFolder}
                        schedule={selectedDatas[0] as ScheduleType}
                        onSuccess={refreshLibrary} />,
        activity:   <ActivityDrawer activity={selectedDatas[0] as ActivityType} />,
        trash:      <TrashFolderDrawer
                        trashFolder={selectedDatas[0] as TrashType} />,

    };

    const systemFolderDrawer = <SystemFolderDrawer folder={selectedDatas[0] as FolderType} />;

    const unkownDrawer = <UnkownDrawer
                            parent={parentFolder}
                            datum={selectedDatas[0]}
                            onSuccess={data => refreshLibrary(data[0])} />;

    const Drawer = (props:{selectedDatas:DatumType[]}) => {
        const {selectedDatas} = props;
        if(selectedDatas.length===0){
            // Datumが選択されていない場合は、ペインを表示しない
            return <></>;
        }else if(selectedDatas.length===1){
            // Datumが1つ選択されている場合は、そのDatumに対応するペインを表示する
            if(isSystemFolder(selectedDatas[0])){
                // システムフォルダの場合は、システムフォルダペインを表示する
                return systemFolderDrawer;
            }else if(parentFolder.type==='trash'){
                // ゴミ箱の場合は、ゴミ箱ペインを表示する
                return getTrashDrawer(selectedDatas[0]);
            }else{
                // それ以外の場合は、Datum.typeに対応するペインを表示する
                return drawersTable[selectedDatas[0].type] || unkownDrawer;
            }
        }else{
            // Datumが2つ以上選択されている場合
            if(mode === Constants.library.mode.list) {
                // リストモードの場合は、MultiDataDrawerを表示する
                return <MultiDataDrawer parent={parentFolder} data={selectedDatas} onSuccess={fetchFolder}/>;
            }else{
                // それ以外のモードの場合は、ペインを表示しない
                return <></>;
            }
        }
    };

    return <>
        {renderAll()}
        <AsyncResourceContent fallback={<p>Loading...</p>}>
            <Drawer selectedDatas={selectedDatas} />
        </AsyncResourceContent>
        <NotificationManager />
    </>;

};
