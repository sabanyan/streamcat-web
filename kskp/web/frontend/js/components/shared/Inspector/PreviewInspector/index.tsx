//@flow
import * as React from "react";
import {useState} from "react";
import {BaseInspector, ParamsForm, Resizer} from "Shared/Inspector";
import style from "./style.scss";
import {Button} from "Shared/Input";
import classnames from "classnames";
import {FlowEditorProps} from "FlowEditorContainer/index";

interface Props extends FlowEditorProps {
    children: React.ReactNode,
    label: string,
    params: [],
    args: {},
    headers: [],
    groups: [],
    // event
    onApply: Function
}


const PreviewInspector = (props: Props) => {

    const [args, setArgs] = useState<any>(props.args);

    const onArgsChange = (e, param, value) => {
        try {
            const argKey = param.name;
            const _args = {...args};
            _args[argKey] = value;
            if (!value) delete _args[argKey];
            setArgs(_args);
        } catch (e) {
            console.log(e);
        }
    };

    const onClickApply = () => {
        try {
            const {onApply} = props;
            //プレビューリクエスト
            onApply(args);
        } catch (e) {
            console.log(e);
        }
    };

    const {params, groups, label, headers} = props;
    const content = <div>
        <div>
            <div className={style.full_hr} />
            <Button onClick={() => onClickApply()}>表示</Button>
            <div>
                <div className="kskp-form"/>
                <ParamsForm
                    key={label}
                    headers={headers} params={params} args={args}
                    invalids={{}} groups={groups}
                    onChange={(e, param, value) => onArgsChange(e, param, value)} />
            </div>
        </div>
        <div className={style.full_hr} />
    </div>;

    const property_class = classnames(style.property, style.in);

    return <Resizer>
        <div className={property_class}>
            <BaseInspector key={0} header={""} label={label} subLabel={""} disabled={false}>
                {content}
            </BaseInspector>
        </div>
    </Resizer>;
};
export {PreviewInspector};


