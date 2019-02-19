import type { BaseModelProps } from './BaseStepModel'
import BaseStepModel from './BaseStepModel'

export type CommentStepModelProps = {
    ...BaseModelProps,
    content: string;
}

export default class CommentStepModel extends BaseStepModel {
    
    constructor (props:CommentStepModelProps) {
        super(props)
        this.initialize(props,"content")
    }

    hasData():boolean {
        return (this.uuid)
    }

    validate() {
        
    }
}