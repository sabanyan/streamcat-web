import React from "react";
import { Button2 } from "Shared/Input";

type Props = {
    icon?: 'add'|'upload'|'trash';
    large?: boolean;
    disabled?: boolean;
    onClick: () => Promise<any>;
    children: string;
};

export const AwaitButton = (props:Props) => {
    const {icon, large, disabled, onClick, children} = props;

    // Promiseの処理終了待ち状態
    const [isLoading, setIsLoading] = React.useState(false);
    // onClickの処理が終わるまでボタン押下を禁止する
    const asyncOnClick = () => {
        // ボタン押下を禁止する
        setIsLoading(true);
        onClick().finally(()=>{
            // ボタン押下禁止を解除する
            setIsLoading(false);
        });
    };

    return  <Button2 icon={icon}
                     large={large}
                     disabled={disabled || isLoading}
                     onClick={asyncOnClick}>{children}</Button2>;
};
