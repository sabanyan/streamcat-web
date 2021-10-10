import {BaseModelProps} from "Model/Step/BaseStepModel";
import {BaseStepModel} from "Model/index";
import {StringUtil} from "Utils/index";
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
        this.setAutoSize();
    }

    private _calcNoteSize () {
        const fontSize = this.getFontSize();
        const width = StringUtil.getTextWidth(this.getTitle(), fontSize);
        const minWidth = Constants.default.note.width;
        const textWidth = width + Constants.default.note.padding;
        let style_width: number;
        const style_height = fontSize + Constants.default.note.padding;
        if (minWidth < textWidth) {
            style_width = textWidth;
        } else {
            style_width = minWidth;
        }
        return {
            width: style_width,
            height: style_height
        };
    }

    setAutoSize(){
        const size = this._calcNoteSize();
        this.setSize(size);
    }

    setTitle(title:string) {
        this.title = title;
        this.setAutoSize();
    }

    setContent(content:string) {
        this.content = content;
    }

    setColor(color:string) {
        this.color = color;
    }

    setFontSize(value:number) {
        this.fontSize = value;
        this.setAutoSize();
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
