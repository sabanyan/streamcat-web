import React from 'react';
import style from "./style.scss";
import { Breadcrumbs, Link } from '@mui/material';
import {Text} from "Shared/Base/Texts/Text";

export type IBreadCrumbsLink = {
    uuid: string | null;
    label: string;
    url: string;
    type: string;
    current: boolean;
};

type Props = {
    links?: IBreadCrumbsLink[]
};

export const BreadCrumb = (props: Props) => {
    const links = props.links || [];

    return <Breadcrumbs aria-label='breadcrumb' className={style.breadCrumb}>
        {
            links.map((link, index) => (
                link.current ?
                // 現在の表示フォルダ
                <Text key='current'>{link.label}</Text>:
                // 先祖フォルダ
                <Link key={index} href={link.url} underline='none'>
                    {link.label}
                </Link>
            ))
        }
    </Breadcrumbs>;
};
