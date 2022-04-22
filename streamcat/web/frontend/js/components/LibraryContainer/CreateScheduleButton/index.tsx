import React from 'react';
import dayjs from 'dayjs';
import { FolderType, ScheduleType } from 'Model/Library';
import { DialogButton, TextField2, DatePicker2, TimePicker2, Tabs2 } from 'Components/shared/Input';
import { EditBox } from '../EditBox';
import { Value } from '../FlowLinkField';
import { Value as DateValue } from 'Components/shared/Input/DatePicker2';
import { FlowLinkField } from '../FlowLinkField';
import { makeTrigger } from '../ScheduleDrawer';

type Props = {
    parent:FolderType;
    onSuccess:(newSchedule:ScheduleType) => void;
};

/**
 * スケジュールの追加ボタン
 * @param props 
 */
export const CreateScheduleButton = (props:Props) => {
    const { parent, onSuccess } = props;

    // 初期表示値
    const initLabel = {value:'', isError:true};
    const initFlow = {value:null, isError:true};
    const initDate = {value:null, isError:true};
    const initSeconds = {value:'', isError:true};

    // テキストボックスの値
    const [label, setLabel] = React.useState(initLabel);
    const [flow, setFlow] = React.useState<Value>(initFlow);
    // 起動日時の値
    const [tabIndex, setTabIndex] = React.useState(0);
    const [date, setDate] = React.useState<DateValue>(initDate);
    const [time, setTime] = React.useState<DateValue>(initDate);
    const [beginDate, setBeingDate] = React.useState<DateValue>(initDate);
    const [endDate, setEndDate] = React.useState<DateValue>(initDate);
    const [seconds, setSeconds] = React.useState(initSeconds);

    // 値の初期化処理
    const initValues = () => {
        setLabel(initLabel);
        setFlow(initFlow);
        setTabIndex(0);
        setDate(initDate);
        setTime(initDate);
        setBeingDate(initDate);
        setEndDate(initDate);
        setSeconds(initSeconds);
    };

    // Triggerを作成する
    const trigger = makeTrigger(tabIndex, beginDate.value, endDate.value, date.value, time.value, seconds.value);

    // スケジュールの新規追加処理
    const create = () => parent.createSchedule(label.value, flow.value?.uuid || '', {}, {}, trigger);

    // タブIndexと入力項目の対応テーブル
    const triggerFieldTable = {
        0: [beginDate, endDate, seconds],
        1: [],
        2: [date, time]
    };

    return <DialogButton label={'スケジュールの追加'}
                         icon='add'
                         large={true} >{[
        // Contents
        (closeDialog) => [
            <EditBox
                key='createSchedule'
                createMode={true}
                values = {[label, flow, ...triggerFieldTable[tabIndex]]}
                initValues={initValues}
                create={create}
                onSuccess={newSchedule => {
                    onSuccess(newSchedule as ScheduleType);
                    closeDialog();
                }}
                onCancel={closeDialog} >{[
                // ボタン
                [],
                // テキストボックス
                (readOnly, onErrorChange, onEnterKeyPress) => [
                    <TextField2 key='label'
                                label='ラベル'
                                required={true}
                                readOnly={readOnly}
                                autoFocus={true}
                                state={[label, setLabel]}
                                onErrorChange={onErrorChange}
                                onEnterKeyPress={onEnterKeyPress} />,
                    <FlowLinkField  key='flow'
                                    label={'起動させるフロー'}
                                    required={true}
                                    readOnly={readOnly}
                                    parent={parent}
                                    state={[flow, setFlow]}
                                    onErrorChange={onErrorChange} />,
                    // タブパネル
                    <Tabs2  key='tabs'
                            readOnly={readOnly}
                            state={[tabIndex, setTabIndex]}
                            onTabPanelChange={onErrorChange} >
                        <span title='指定秒間隔で起動'>
                            <DatePicker2 key='beginDate'
                                        label='開始日付'
                                        required={true}
                                        readOnly={readOnly}
                                        minDate={dayjs()}
                                        maxDate={endDate.value || undefined}
                                        state={[beginDate, setBeingDate]}
                                        onErrorChange={onErrorChange} />
                            <DatePicker2 key='endDate'
                                        label='終了日付'
                                        required={true}
                                        readOnly={readOnly}
                                        minDate={beginDate.value || dayjs()}
                                        state={[endDate, setEndDate]}
                                        onErrorChange={onErrorChange} />
                            <TextField2 key={'seconds'}
                                        label='秒数'
                                        type='number'
                                        required={true}
                                        readOnly={readOnly}
                                        state={[seconds, setSeconds]}
                                        onErrorChange={onErrorChange} />
                        </span>
                        <span title='指定日時毎に起動'>
                        </span>
                        <span title='一度だけ起動'>
                            <DatePicker2 key='date'
                                        label='起動日付'
                                        required={true}
                                        readOnly={readOnly}
                                        minDate={dayjs()}
                                        state={[date, setDate]}
                                        onErrorChange={onErrorChange} />
                            <TimePicker2 key='time'
                                        label='起動時刻'
                                        required={true}
                                        readOnly={readOnly}
                                        state={[time, setTime]}
                                        onErrorChange={onErrorChange} />
                        </span>
                    </Tabs2>
                ]
            ]}</EditBox>
        ],
        // Buttons
        ()=>[]
    ]}</DialogButton>;
};
