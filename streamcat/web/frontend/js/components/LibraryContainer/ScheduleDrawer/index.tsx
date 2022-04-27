import React from 'react';
import dayjs from 'dayjs';
import { useAsyncResource } from 'use-async-resource';
import { FolderType, ScheduleType } from 'Model/Library';
import { APIUtil2 } from 'Utils/APIUtil2';
import { TextField2, DatePicker2, TimePicker2, Tabs2, Drawer2 } from 'Components/shared/Input';
import { Value as DateValue } from 'Components/shared/Input/DatePicker2';
import { Value } from '../FlowLinkField';
import { EditBox } from '../EditBox';
import { FlowLinkField } from '../FlowLinkField';
import { MoveButton } from '../MoveButton';
import { DeleteButton } from '../DeleteButton';
import { CreatorField } from '../CreatorField';
import { MultiSelect2 } from "Components/shared/Input";

export type SelectItem = {
    label: string;
    value: number|null;
};

const dayOfWeeks = {
    0: '日',
    1: '月',
    2: '火',
    3: '水',
    4: '木',
    5: '金',
    6: '土'
};

// 
// 数値からSelectItemに変換する
// 
const convToMonthItem = (month:number|null):SelectItem => {
    if(month===null || month<0){
        return {
            label: '毎月',
            value: null
        };
    }else{
        return {
            label: `${month+1}月`,
            value: month+1
        };
    };
};

const convToDayItem = (day:number|null):SelectItem => {
    if(day===null || day<0){
        return {
            label: '毎日',
            value: null
        };
    }else{
        return {
            label: `${day+1}日`,
            value: day+1
        };
    };
};

const convToDayOfWeekItem = (dayOfWeek:number|null):SelectItem => {
    if(dayOfWeek===null){
        return {
            label: '毎曜日',
            value: null
        };
    }else{
        return {
            label: `${dayOfWeeks[dayOfWeek]}曜`,
            value: dayOfWeek
        };
    };
};

const convToHourItem = (hour:number|null):SelectItem => {
    if(hour===null){
        return {
            label: '毎時',
            value: null
        };
    }else{
        return {
            label: `${hour}時`,
            value: hour
        };
    };
};

const convToMinuteItem = (minute:number|null):SelectItem => {
    if(minute===null){
        return {
            label: '毎分',
            value: null
        };
    }else{
        return {
            label: `${minute}分`,
            value: minute
        };
    };
};

// 全ての選択日時を作成する
const allMonths  = [null, ...Array(12).keys()].map(convToMonthItem);
const allDays    = [null, ...Array(31).keys()].map(convToDayItem);
const allDayOfWeeks = [null, ...Array(7).keys()].map(convToDayOfWeekItem);
const allHours   = [null, ...Array(24).keys()].map(convToHourItem);
const allMinutes = [null, ...Array(60).keys()].map(convToMinuteItem);

// 日付と時刻を一つにまとめる
const mergeDateAndTime = (date:dayjs.Dayjs|null, time:dayjs.Dayjs|null) => {
    if(!date || !time){
        return null;
    }
    return date.hour(time.hour()).
                minute(time.minute()).
                second(time.second()).
                millisecond(time.millisecond());
};

const convToListStr = (selectedItems:SelectItem[]) => {
    // 未選択の場合はnullを返す
    if(selectedItems.length===0){
        return null;
    }
    // 毎日時が選択されている場合はnullを返す
    const everyDatetimeIsSelected = selectedItems.findIndex(item => item.value===null) >= 0;
    if(everyDatetimeIsSelected){
        return null;
    }
    // 選択された日時をカンマ区切りで返す
    return selectedItems.map(item => item.value).join(',');
};

// Triggerを作成する
export const makeTrigger = (tabIndex : number,
                            beginDate: dayjs.Dayjs|null,
                            endDate  : dayjs.Dayjs|null,
                            date     : dayjs.Dayjs|null,
                            time     : dayjs.Dayjs|null,
                            seconds  : string,
                            months   : SelectItem[],
                            days     : SelectItem[],
                            dayOfWeeks: SelectItem[],
                            hours    : SelectItem[],
                            minutes  : SelectItem[]) => {
    // 選択されたタブによって起動日時の指定方法を決定する
    switch(tabIndex){
        case 0:
            return {
                type: 'interval',
                // 指定した日付の開始時刻を設定する
                start_date: beginDate?.startOf('day').toISOString(),
                // 指定した日付の終了時刻を設定する
                end_date: endDate?.endOf('day').toISOString(),
                seconds: parseInt(seconds),
            };
        case 1:
            return {
                type: 'cron',
                start_date: beginDate?.startOf('day').toISOString(),
                end_date  : endDate?.endOf('day').toISOString(),
                month     : convToListStr(months),
                day_of_week: convToListStr(dayOfWeeks),
                day       : convToListStr(days),
                hour      : convToListStr(hours),
                minute    : convToListStr(minutes)
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
        const t = schedule.trigger[timePropertyName];
        return t && parseInt(t);
    };

    const triggerCron = (cronPropertyName:string) => {
        if(cronPropertyName in schedule.trigger){
            const values:string|null = schedule.trigger[cronPropertyName];
            if(values===null){
                // 毎日時
                return [null];
            }else{
                return values.split(',').map(value => parseInt(value));
            }
        }else{
            // 未設定
            return [];
        }
    };

    const triggerMonth = () => triggerCron('month').map(month => convToMonthItem(month-1));
    const triggerDay = () => triggerCron('day').map(day => convToDayItem(day-1));
    const triggerDayOfWeek = () => triggerCron('day_of_week').map(dayOfWeek => convToDayOfWeekItem(dayOfWeek));
    const triggerHour = () => triggerCron('hour').map(hour => convToHourItem(hour));
    const triggerMinute = () => triggerCron('minute').map(minute => convToMinuteItem(minute));

    const isError = (cronPropertyName:string) => {
        // cron属性が未設定の場合はエラーとする
        return !(cronPropertyName in schedule.trigger);
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
    const initMonths  = {value:createMode? [] : triggerMonth(), isError:isError('month')};
    const initDays    = {value:createMode? [] : triggerDay(), isError:isError('day')};
    const initDayOfWeeks = {value:createMode? [] : triggerDayOfWeek(), isError:isError('day_of_week')};
    const initHours   = {value:createMode? [] : triggerHour(), isError:isError('hour')};
    const initMinutes = {value:createMode? [] : triggerMinute(), isError:isError('minute')};

    // テキストボックスの値
    const [label, setLabel] = React.useState(initLabel);
    const [flow, setFlow] = React.useState<Value>(initFlow);
    const [tabIndex, setTabIndex] = React.useState(initTabIndex);
    // 一度だけ起動
    const [date, setDate] = React.useState<DateValue>(initDate);
    const [time, setTime] = React.useState<DateValue>(initTime);
    // 指定秒間隔で起動
    const [beginDate, setBeingDate] = React.useState<DateValue>(initBeginDate);
    const [endDate, setEndDate] = React.useState<DateValue>(initEndDate);
    const [seconds, setSeconds] = React.useState(initSeconds);
    // 指定日時毎に起動
    const [months, setMonths] = React.useState(initMonths);
    const [days, setDays] = React.useState(initDays);
    const [dayOfWeeks, setDayOfWeeks] = React.useState(initDayOfWeeks);
    const [hours, setHours] = React.useState(initHours);
    const [minutes, setMinutes] = React.useState(initMinutes);

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
        setMonths(initMonths);
        setDays(initDays);
        setDayOfWeeks(initDayOfWeeks);
        setHours(initHours);
        setMinutes(initMinutes);
    };

    // Triggerを作成する
    const trigger = makeTrigger(tabIndex,
                                beginDate.value,
                                endDate.value,
                                date.value,
                                time.value,
                                seconds.value,
                                months.value,
                                days.value,
                                dayOfWeeks.value,
                                hours.value,
                                minutes.value);

    // スケジュールの新規追加処理
    const create = () => parent.createSchedule(label.value, flow.value?.uuid || '', {}, {}, trigger);

    // スケジュールの更新処理
    const update = () => schedule.update(label.value, flow.value?.uuid || '', {}, {}, trigger);

    // タブIndexと入力項目の対応テーブル
    const triggerFieldTable = {
        0: [beginDate, endDate, seconds],
        1: [beginDate, endDate, months, days, dayOfWeeks, hours, minutes],
        2: [date, time]
    };

    // 選択肢の比較関数
    const isEaual = (item:SelectItem, value:SelectItem) => item.value===value.value;

    // 毎日時が選択された場合は他は選択できないこと
    const isDisabledItem = (item:SelectItem, selectedItems:SelectItem[]) => {
        // 未選択の場合は選択肢の制限は無い
        if(selectedItems.length===0){
            return false;
        }
        // 毎日時の選択の有無
        const everyDatetimeIsSelected = selectedItems.findIndex(item => item.value===null) >= 0;
        // 
        if(everyDatetimeIsSelected){
            // 毎日時が選択されている場合は他の選択肢は選択できない
            return item.value!==null;
        }else{
            // 毎日時が選択されていない場合は他の選択肢は選択できる
            return item.value===null;
        }
    };

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
                        <MultiSelect2<SelectItem>
                            label='月'
                            readOnly={readOnly}
                            required={true}
                            items={allMonths}
                            state={[months, setMonths]}
                            isEqual={isEaual}
                            isDisabledItem={item => isDisabledItem(item, months.value)}
                            getLabel={item=>item.label}
                            onErrorChange={onErrorChange}/>
                        <MultiSelect2<SelectItem>
                            label='日'
                            readOnly={readOnly}
                            required={true}
                            items={allDays}
                            state={[days, setDays]}
                            isEqual={isEaual}
                            isDisabledItem={item => isDisabledItem(item, days.value)}
                            getLabel={item=>item.label}
                            onErrorChange={onErrorChange}/>
                        <MultiSelect2<SelectItem>
                            label='曜日'
                            readOnly={readOnly}
                            required={true}
                            items={allDayOfWeeks}
                            state={[dayOfWeeks, setDayOfWeeks]}
                            isEqual={isEaual}
                            isDisabledItem={item => isDisabledItem(item, dayOfWeeks.value)}
                            getLabel={item=>item.label}
                            onErrorChange={onErrorChange}/>
                        <MultiSelect2<SelectItem>
                            label='時'
                            readOnly={readOnly}
                            required={true}
                            items={allHours}
                            state={[hours, setHours]}
                            isEqual={isEaual}
                            isDisabledItem={item => isDisabledItem(item, hours.value)}
                            getLabel={item=>item.label}
                            onErrorChange={onErrorChange}/>
                        <MultiSelect2<SelectItem>
                            label='分'
                            readOnly={readOnly}
                            required={true}
                            items={allMinutes}
                            state={[minutes, setMinutes]}
                            isEqual={isEaual}
                            isDisabledItem={item => isDisabledItem(item, minutes.value)}
                            getLabel={item=>item.label}
                            onErrorChange={onErrorChange}/>
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
