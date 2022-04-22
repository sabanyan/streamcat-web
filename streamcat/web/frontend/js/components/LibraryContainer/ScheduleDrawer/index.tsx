import React from 'react';
import dayjs from 'dayjs';
import { FolderType, ScheduleType } from 'Model/Library';
import { TextField2, DatePicker2, TimePicker2, Tabs2, Drawer2 } from 'Components/shared/Input';
import { EditBox } from '../EditBox';
import { Value } from '../FlowLinkField';
import { Value as DateValue } from 'Components/shared/Input/DatePicker2';
import { FlowLinkField } from '../FlowLinkField';
import { MoveButton } from '../MoveButton';
import { DeleteButton } from '../DeleteButton';
import { APIUtil2 } from 'Utils/APIUtil2';
import { useAsyncResource } from 'use-async-resource';
import { CreatorField } from '../CreatorField';

// 日付と時刻を一つにまとめる
const mergeDateAndTime = (date:dayjs.Dayjs|null, time:dayjs.Dayjs|null) => {
    if(!date || !time){
        return null;
    }
    // const ret = date.clone();
    return date.hour(time.hour()).
                minute(time.minute()).
                second(time.second()).
                millisecond(time.millisecond());
};

// 指定した日付に開始時刻を設定する
const beginOfDate = (date:dayjs.Dayjs|null) => {
    return mergeDateAndTime(date, dayjs('00:00:00.000', 'HH:mm:ss.SSS'));
};

// 指定した日付に終了時刻を設定する
const endOfDate = (date:dayjs.Dayjs|null) => {
    return mergeDateAndTime(date, dayjs('23:59:59.999', 'HH:mm:ss.SSS'));
};

// Triggerを作成する
export const makeTrigger = (tabIndex : number,
                            beginDate: dayjs.Dayjs|null,
                            endDate  : dayjs.Dayjs|null,
                            date     : dayjs.Dayjs|null,
                            time     : dayjs.Dayjs|null,
                            seconds  : string) => {
    // 選択されたタブによって起動日時の指定方法を決定する
    switch(tabIndex){
        case 0:
            return {
                type: 'interval',
                start_date: beginOfDate(beginDate)?.toISOString(),
                end_date: endOfDate(endDate)?.toISOString(),
                seconds: parseInt(seconds),
            };
        case 1:
            return {
                type: 'cron',
                start_date: null,
                end_date: null,
                year: null,
                month: null,
                week: null,
                day_of_week: null,
                day: null,
                hour: null,
                minute: null
            };
        case 2:
            return {
                type: 'date',
                date: mergeDateAndTime(date, time)?.toISOString(),
            };
        default:
            throw new Error(`unknown tab index (${tabIndex})`);
    }
};

type Props = {
    createMode: boolean;
    parent: FolderType;
    schedule: ScheduleType;
    onSuccess:(newSchedule:ScheduleType) => void;
};

export const ScheduleDrawer = (props:Props) => {
    const { createMode, parent, schedule, onSuccess } = props;

    // 起動させるフローを取得する
    const [flowReader] = useAsyncResource(APIUtil2.findFlow, schedule.runnableUUID);

    const triggerDate = (datePropertyName:string) => {
        // DatePickerにundefinedを渡すと現在日時が表示されるので、未入力の場合はnullを渡す
        const d = schedule.trigger[datePropertyName] || null;
        return d && dayjs(d);
    };

    const triggerTime = (timePropertyName:string) => {
        const d = schedule.trigger[timePropertyName];
        return d && parseInt(d);
    };

    const tabIndexTable = {
        interval: 0,
        cron: 1,
        date: 2
    };

    // 初期表示値
    const initLabel   = {value:createMode? '': schedule.label, isError:createMode};
    const initFlow    = {value:createMode? null: flowReader(), isError:createMode};
    const initTabIndex = createMode? 0: tabIndexTable[schedule.trigger['type']] || 0;
    const initDate    = {value:createMode? null: triggerDate('date'), isError:!triggerDate('date')};
    const initTime    = {value:createMode? null: triggerDate('date'), isError:!triggerDate('date')};
    const initBeginDate = {value:createMode? null: triggerDate('start_date'), isError:!triggerDate('start_date')};
    const initEndDate = {value:createMode? null: triggerDate('end_date'), isError:!triggerDate('end_date')};
    const initSeconds = {value:createMode? '': triggerTime('seconds'), isError:!triggerTime('seconds')};

    // テキストボックスの値
    const [label, setLabel] = React.useState(initLabel);
    const [flow, setFlow] = React.useState<Value>(initFlow);
    // 起動日時の値
    const [tabIndex, setTabIndex] = React.useState(initTabIndex);
    const [date, setDate] = React.useState<DateValue>(initDate);
    const [time, setTime] = React.useState<DateValue>(initTime);
    const [beginDate, setBeingDate] = React.useState<DateValue>(initBeginDate);
    const [endDate, setEndDate] = React.useState<DateValue>(initEndDate);
    const [seconds, setSeconds] = React.useState(initSeconds);

    // 値の初期化処理
    const initValues = () => {
        setLabel(initLabel);
        setFlow(initFlow);
        setTabIndex(initTabIndex);
        setDate(initDate);
        setTime(initTime);
        setBeingDate(initBeginDate);
        setEndDate(initEndDate);
        setSeconds(initSeconds);
    };

    // Triggerを作成する
    const trigger = makeTrigger(tabIndex, beginDate.value, endDate.value, date.value, time.value, seconds.value);

    // スケジュールの新規追加処理
    const create = () => parent.createSchedule(label.value, flow.value?.uuid || '', {}, {}, trigger);

    // スケジュールの更新処理
    const update = () => schedule.update(label.value, flow.value?.uuid || '', {}, {}, trigger);

    // タブIndexと入力項目の対応テーブル
    const triggerFieldTable = {
        0: [beginDate, endDate, seconds],
        1: [],
        2: [date, time]
    };

    console.log('>> ', dayjs('23:59:59.999', 'HH:mm:ss.SSS'))

    return <Drawer2>
        <EditBox
            key='createSchedule'
            createMode={createMode}
            datum={schedule}
            values = {[label, flow, ...triggerFieldTable[tabIndex]]}
            initValues={initValues}
            create={create}
            update={update}
            onSuccess={datum=>onSuccess(datum as ScheduleType)} >{[
            // ボタン
            [
                <MoveButton key={'move'}
                            parent={parent} 
                            targets={[schedule]}
                            onSuccess={(data)=>onSuccess(data[0] as ScheduleType)} />,
                <DeleteButton key={'del'}
                              targets={[schedule]}
                              onSuccess={(data)=>onSuccess(data[0] as ScheduleType)} />
            ],
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
                </Tabs2>,
                <CreatorField key={'creator'} datum={schedule} />
            ]
        ]}</EditBox>
    </Drawer2>;
};
