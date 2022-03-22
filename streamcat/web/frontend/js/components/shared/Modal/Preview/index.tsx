//@flow
import React from 'react';
import classnames from 'classnames';
import { Tab, TabBar, TabList } from 'Shared/Base';
import { HttpUtil } from 'Utils/index';
import style from '../Core/style.scss';
import Visualizer from 'Shared/Visualizer';
import {Contents} from 'Shared/Inspector';
import { useStreamCatNotifications } from 'Components/shared/Notification';

type Props = {
    id: string;
    title: string;
    contents: Contents[];
    footer: React.ReactNode;
    visible: boolean;
    close_button: Function;
}

type Result = {
    html: any;
    args: {};
}

const PreviewModal = (props: Props) => {

    const {notifyError, dismissNotify} = useStreamCatNotifications();

    const [selected_tab_id, set_selected_tab_id] = React.useState<number>(0);
    const [results, set_results] = React.useState<Result[]>([]);
    const [headers, set_headers] = React.useState<any[]>([]);

    const onClickTab = (e: Event, tab_id: number) => {
        if (tab_id !== selected_tab_id) {
            set_selected_tab_id(tab_id);
        }
    }

    const saveResults = (selected_tab_id:number, result:Result, headers=[]) => {
        results[selected_tab_id] = result
        if (headers.length === 0) {
            set_results(results)
        } else {
            set_results(results);
            set_headers(headers);
        }
    }

    const renderTabContent = (selected_tab_id) => {
        const {title} = props
        const contents = props.contents
        const {flowUuid, stepIds, frameUuid, lockUuid, visualize} = contents[selected_tab_id].content
        const {id, afterViz} = contents[selected_tab_id]

        const result = results[selected_tab_id]

        if (!title) {
            return null;
        }
        
        return <Visualizer  key={id + selected_tab_id}
                            index={selected_tab_id}
                            headers={headers}
                            flowUuid={flowUuid}
                            frameUuid={frameUuid}
                            lockUuid={lockUuid}
                            stepIds={stepIds}
                            visualize={visualize} 
                            afterViz={afterViz}
                            result={result}
                            onSaveResult={(selected_tab_id, result, headers) => {saveResults(selected_tab_id, result, headers)}}
                            notify={notifyError}
                            dismissNotify={dismissNotify} />;
        
    }


    const isDialog = () => {
        return (HttpUtil.getURLParam('dialog'));
    }

    const {id, visible, title, footer} = props
    let {contents} = props
    const className = (isDialog()) ? 'modal fade previewDialog top' : 'modal fade preview top';
    const modal_class = classnames(style.previewModal,className, {
        'show in': visible,
        'none-pointer-events': !visible,
    })
  
    if (!contents) return null;

    if (!Array.isArray(contents)) contents = [contents];

    let tabs: Tab[] = [];
    
    //順番を維持するためForEachでLoop
    contents.forEach((content,index)=>{
        const tab = <Tab key={"tab_" + index}
                        width={"auto"} 
                        tab_id={index} 
                        selected_tab_id={selected_tab_id} 
                        onClickTab={(e,tab_id)=>onClickTab(e,tab_id)}>
            {content.title}
        </Tab>
        tabs.push(tab)
    });

    return <div className={modal_class} style={{display: 'block'}} id={id}>
        <div className="modal-dialog">
            <div className="modal-content">
                <div className="modal-header">
                    <div className="modal-title">
                        <span>{title}</span>
                        <div className={style.preview_content_tab}>
                            <TabBar>
                                <TabList>{tabs}</TabList>
                            </TabBar>
                        </div>
                    </div>
                </div>
                {/* <div className="modal-body"> */}
                {renderTabContent(selected_tab_id)}
                {/* </div> */}
                {footer}
            </div>
        </div>
    </div>;
}

export default PreviewModal;
