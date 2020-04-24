import * as React from "react";
import {ModalManager} from "Shared/Modal";
import {NotificationManager} from "Shared/Notification";
import {BreadCrumb, IBreadCrumbsLink} from "LibraryListContainer/Libary/BreadCrumb";
import {FileListTable} from "LibraryListContainer/Libary/FileListTable";

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

        <ModalManager
            notify={notify}
            dissmissNotify={dissmissNotify}
        />
        <NotificationManager />
    </>;
};

export default Library;
