import * as React from "react";
import {Fragment} from "react";
import * as style from "./style.scss";
import {Text} from "Shared/Base/Texts/Text";
import {LinkButton} from "Shared/Input";
import classnames from "classnames";
import WebUtil from "Utils/WebUtil";
import Constants from "Constants/index";

export interface IBreadCrumbsLink {
    uuid: string | null;
    label: string;
    url: string;
    type: string;
    current: boolean;
}

interface Props {
    links?: IBreadCrumbsLink[]
}

const BreadCrumb = (props: Props) => {
    const {links} = props;
    if (!links) {
        return <div className={style.breadCrumb}>
            <Text>ライブラリ</Text>
        </div>;
    }
    const linkElements = links.map((link, index) => {
        let icon: React.ReactNode = <i className={classnames("material-icons")}
                                       style={{color: "#606c7a"}}>chevron_right</i>;
        if (index + 1 === links.length) icon = null;

        let url;

        switch (link.type) {
            case Constants.library.type.project:
                url = link.url + "?project=true";
                break;
            default:
                url = link.url;
        }

        return <Fragment key={index}>
            {(link.current) ?
                <>{link.label}</>
                :
                <LinkButton onClick={() => {
                    WebUtil.navigateURL(url);
                }}>{link.label}</LinkButton>
            }
            {icon}
        </Fragment>;
    });
    return <div className={style.breadCrumb}>
        {linkElements}
    </div>;


};

export {BreadCrumb};
