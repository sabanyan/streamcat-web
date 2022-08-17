import React from 'react';
import {Tab, Tabs, Box} from '@mui/material';

interface Props {
    readOnly?:boolean;
    state?: [number, (value:React.SetStateAction<number>)=>void];
    onTabPanelChange?:(isError:boolean, prevIsError:boolean) => void;
    children?: JSX.Element[];
};

export const Tabs2 = (props:Props) => {
    const {readOnly} = props;
    const [tabIndex, setTabIndex] = props.state || [0, () => {}];
    const children = props.children || [];
    const onTabPanelChange = props.onTabPanelChange || (() => {});

    React.useEffect(() => {
        // タブの切替時に、エラーチェックをする
        // Tabs2は常にisError=falseの扱いなので、prevIsError=falseである
        onTabPanelChange(false, false);
    }, [tabIndex]);

    const onTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabIndex(newValue);
    };

    return <>
        {/* タブヘッダ */}
        <Tabs variant='scrollable'
            scrollButtons={false}
            sx={{ borderBottom:1, borderColor:'divider' }}
            value={tabIndex}
            onChange={onTabChange} >
            {children.map((child, index) =>
                <Tab key={`tab${index}`}
                    label={child.props.label||child.props.title}
                    // readOnlyの場合はタブを選択できないようにする
                    disabled={readOnly && tabIndex!==index}
                    disableRipple={true} />
            )}
        </Tabs>
        {/* タブコンテンツ */}
        {children.map((child, index) =>
            <TabPanel key={`tabpanel${index}`} tabIndex={tabIndex} panelIndex={index}>
                {child}
            </TabPanel>
        )}
    </>;
};

interface TabPanelProps {
    panelIndex: number;
    tabIndex: number;
    children?: React.ReactNode;
};

const TabPanel = (props: TabPanelProps) => {
    const { children, tabIndex, panelIndex } = props;
    return <>{
        // 選択されているタブのコンテンツを表示する
        tabIndex === panelIndex ?
        <Box sx={{p:3}}>{children}</Box>:
        <></>
    }</>;
};
