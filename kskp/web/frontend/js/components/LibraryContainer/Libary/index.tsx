import * as React from "react";
import {ModalManager} from "Shared/Modal";
import {NotificationManager} from "Shared/Notification";
import {Button} from "Shared/Input";
import {FileListTable} from "Components/LibraryContainer/Libary/FileListTable";
import {BreadCrumb, IBreadCrumbsLink} from "Components/LibraryContainer/Libary/BreadCrumb";

interface ContainerProps {
    notify: any;
    dissmissNotify: any;
}

interface Props extends ContainerProps {

}

const Library = (props: Props) => {
    const {notify, dissmissNotify} = props;
    const links: IBreadCrumbsLink[] = [{
        name: "ライブラリ",
        url: "/"
    }, {
        name: "project_test",
        url: "/"
    }];

    return <>
        <BreadCrumb links={links} />
        <FileListTable onClickBody={()=>{}} onClickHeader={()=>{}}/>
        <Button>フローの新規作成</Button>
        <ModalManager
            notify={notify}
            dissmissNotify={dissmissNotify}
        />
        <NotificationManager />
    </>;

};

export default Library;
