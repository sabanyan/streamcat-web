import { BaseStepModel } from "Model/index";


export default class DataDstStepModel extends BaseStepModel {
    constructor(props: any) {
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
