import {BaseModelProps} from "Model/Step/BaseStepModel";
import {BaseStepModel} from "Model/index";
import Constants from "Constants/index";

export interface NoteStepModelProps extends BaseModelProps {
    title: string;
    content: string;
    fontSize?: number;
    color?: string;
}

export default class NoteStepModel extends BaseStepModel {
    uuid: string | undefined = undefined;
    title: string | undefined = undefined;
    content: string | undefined = undefined;
    color: string = Constants.default.note.color.green;
    fontSize: number = 10;

    constructor(props: NoteStepModelProps) {
        super(props);
        this.initialize(props, "title");
        this.initialize(props, "content");
        this.initialize(props, "fontSize");
        this.initialize(props, "color");
    }

    hasData(): boolean {
        return !!(this.uuid);
    }

    getLabel(): string {
        return "";
    }

    getSize() {
        return this.size;
    }

    getTitle() {
        return this.title;
    }

    getContent() {
        return this.content;
    }

    getColor() {
        return this.color;
    }

    getFontSize() {
        return this.fontSize;
    }

    validate() {

    }
}
