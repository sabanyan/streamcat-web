import type { BaseModelProps } from './BaseStepModel'
import BaseStepModel from './BaseStepModel'
import Constants from '../../constants';

export type CommentStepModelProps = {
    ...BaseModelProps,
    content: string;
}

export default class CommentStepModel extends BaseStepModel {
    size: { width: number, height: number } = {width: Constants.default.note.width, height: Constants.default.note.height}

    constructor (props:CommentStepModelProps) {
        super(props)
        this.initialize(props,"content")
    }

    hasData():boolean {
        return (this.uuid)
    }

    getLabel():string {
        return ""
    }

    validate() {
        
    }
}