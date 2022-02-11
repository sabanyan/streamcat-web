import { BaseStepModel } from "Model/index";
import {BaseModelProps} from "Model/Step/BaseStepModel";

interface DataDstStepModelProps extends BaseModelProps {
    srcs: {};
    dsts: {};
    args: {};
}

export default class DataDstStepModel extends BaseStepModel {
    srcs: {} = {};
    srcsOrder: any[] = [];
    dsts: {} = {};
    args: {} = {};
    
    constructor(props: DataDstStepModelProps) {
        super(props);
        Object.keys(props).forEach((key) => {
            this.initialize(props, key);
        })
    }

    hasData(): boolean {
        return false;
    }

    getLabel(): string {
        return "";
    }

    getCommand = (): any => {
        return this
    }

    getSize() {
        return this.size;
    }

    validate() {

    }
}
