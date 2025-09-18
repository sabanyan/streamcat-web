import React, {JSX} from 'react';
import { Dialog2 } from 'Shared/Base/Dialog2';
import { Checkbox2, Value } from 'Shared/Input/Checkbox2';

type Props = {
    label: string;
    dialogTitle?: string;
    readOnly?: boolean;
    state?: [Value, (value:React.SetStateAction<Value>)=>void];
    // ボタン
    // (DialogButtonにおいてダイアログの開閉状態を制御したいので
    //  子コンポーネントを生成する関数を引数とする)
    children:[
        (closeDialog: ()=>void, value:Value) => JSX.Element[],
        (closeDialog: ()=>void, value:Value) => JSX.Element[]
    ];
};

export const DialogCheckbox = (props:Props) => {
    const {label, readOnly, state} = props;
    const dialogTitle = props.dialogTitle || label;
    const [value, setValue] = state || [{value:false,isError:false}, () => {}];
    const [ contents, buttons ] = props.children;

    // ダイアログを開くボタン
    const checkbox = (openDialog:() => void) =>
        <Checkbox2 label={label}
                    readOnly={readOnly}
                    state={state}
                    onChange={openDialog} />;

    // ダイアログ
    return <Dialog2 dialogTitle={dialogTitle}
                    control={checkbox}>{[
        // Contents
        (closeDialog) => contents(closeDialog, value),
        // Buttons
        (closeDialog) => buttons(closeDialog, value)
    ]}</Dialog2>;
};
