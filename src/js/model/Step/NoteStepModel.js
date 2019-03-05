import type { BaseModelProps } from './BaseStepModel'
import BaseStepModel from './BaseStepModel'
import Constants from '../../constants';

export type NoteStepModelProps = {
    ...BaseModelProps,
    title: string;
    content: string
}

export default class NoteStepModel extends BaseStepModel {

    constructor (props:NoteStepModelProps) {
        super(props)
        this.initialize(props,"title")
        this.initialize(props,"content")
    }

    hasData():boolean {
        return (this.uuid)
    }

    getLabel():string {
        return ""
    }

    getSize() {
        return this.size
    }

    getTitle() {
        return this.title
    }

    getContent() {
        return this.content
    }

    validate() {
        
    }
}