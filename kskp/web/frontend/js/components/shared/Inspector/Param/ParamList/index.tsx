import * as React from 'react'
import { CommandParamType } from 'Types/index'
import { AddButton, Button} from 'Shared/Input'
import { ParamString2 as ParamString } from 'Shared/Inspector'
import Constants from 'Constants/index'
import { ParamUtil, ModalUtil, StateUtil } from 'Utils/index'
import style from './style.scss'
import { SortableContainer, SortableElement } from 'react-sortable-hoc'
import arrayMove from 'array-move'
import classnames from 'classnames'

type Props = {
    param: CommandParamType;
    arg:Array<CommandParamType>;

    onUpdate(newStep:Function):void
}

const SortableItem = SortableElement(({value}) => <li>{value}</li>);
const SortableList = SortableContainer(
    ({items}) => {
        return (
            <ul>
                {items.map((value, index) => (
                    <SortableItem
                        key={`item-${index}`}
                        index={index} value={value} />
                ))}
            </ul>
        );
});
    
export default class ParamList extends  React.Component<Props>{
    currentArg:Array<any>;

    constructor(props:Props) {
        super(props)
        this.currentArg = props.arg
    }

    onSortEnd({oldIndex, newIndex, collection, isKeySorting}, e, param, arg, onUpdate) {
        if (!onUpdate || !arg) {
            return
        }
        let newArg = arrayMove(arg, oldIndex, newIndex)
        onUpdate((step) => {
            step.args[param.name] = newArg

            return step
        })
    }

    onDeleteElement(e, param, argIndex) {
        e.preventDefault()
        const {onUpdate} = this.props
        if(!onUpdate) {
            return
        }
        
        ModalUtil.registerModal({
            id: Constants.modal.CONFIRM, 
            onClickDone: () => {
                onUpdate((step) => {
                    if (step.args[param.name].length > 1) {
                        const args = step.args[param.name].filter((value, filterIndex) => {
                            return (filterIndex !== argIndex)
                        })
                        step.args[param.name] = args
                        step.invalidMessage = [""]
                    }
                    return step
                })
                ModalUtil.closeModal(Constants.modal.CONFIRM)
            },
        })
        ModalUtil.emitModal({
            id: Constants.modal.CONFIRM,
            visible: true,
            done: '削除する',
            danger: true,
            content: <div>
              削除しますか？
            </div>,
        })
    }

    onChangeContent(e, param:CommandParamType, element:CommandParamType, argIndex:number) {
        const {onUpdate} = this.props
       
        if(!onUpdate) {
            return
        }
        onUpdate((step) => {
            if (step.args) {
                if (!(step.args[param.name])) {
                    step.args[param.name] = [{}]
                }
                step.args[param.name][argIndex][element.name] = e.currentTarget.value
            }
            return step
        })
    }

    renderInput(param:CommandParamType, classname:string, onChange:any, value?:string, disabled?:boolean) {
        return <input 
          name={param.name} 
          type="text" 
          className="form-control" 
          placeholder={param.name}
          onChange={onChange}
          value={value}
          disabled={disabled}
        ></input>
    }

    renderElement(param:CommandParamType, argIndex:number, arg:Array<CommandParamType>):JSX.Element {
        let elements:Array<JSX.Element> = []
        if (!(param.elements) || !(Array.isArray(param.elements))) {
            return <div>
                {elements}
            </div>
        }
        const {onUpdate} = this.props

        param.elements.forEach((element:CommandParamType, index:number) => {
            let ele:JSX.Element
            let value
            if(arg && arg[argIndex]) {
                value = arg[argIndex][element.name]
            } 
            ele = 
                <div key={argIndex + element.name + index}>
                    <ParamString
                        param={element}
                        value={value}
                        onUpdate={onUpdate}
                        onChange={(e) => {this.onChangeContent(e, param, element, argIndex)}}
                    ></ParamString>
                </div>

            elements.push(ele)
        })
    
        return <React.Fragment>
            {elements}
            <Button danger={true} onClick={(e) => {this.onDeleteElement(e, param, argIndex)}}>削除</Button>
        </React.Fragment>
    }    

    renderElements(param:CommandParamType, arg:Array<any>, onUpdate:Function):JSX.Element | null {
        let paramElements:Array<JSX.Element> = []
        let labels:Array<JSX.Element> = []

        if (!(param) || param.type !== Constants.param.type.list) {
            return null
        }
        
        if (!(param.elements) || !(Array.isArray(param.elements))) {
            return null
        }

        // renderLabels
        param.elements.forEach((element:CommandParamType, index:number) => {
            let label = (element.label) ? element.label : element.name
            labels.push(<label key={label + index}>{label}</label>)
        })

        arg.forEach((element, index) => {
            let paramElement = this.renderElement(param, index, arg)
            paramElements.push(<div key={element.name + index} className={style.paramElement}>
                {paramElement}
            </div>)
        })
        
        return <div>
            <label>{param.label}</label>
            <div className={style.labelContainer}>
            {labels}
            </div>
            <SortableList
            //pressDelay={100}
            items={paramElements}
            onSortEnd={(value, e) => this.onSortEnd(value, e, param, arg, onUpdate)}/>
        </div>
    }

    onAddElement(e,param,arg,onUpdate) {
        if(!onUpdate) {
            return
        }
        if(!param || !(param.elements)) {
            return
        }

        if(arg && Array.isArray(arg)) {
            arg.push(param.default[0])
        }
        onUpdate((step) => {
            if (step.args) {
                step.args[param.name] = arg
            }
            return step
        })
    }

    addButton(param, arg, onUpdate):JSX.Element {
        return <AddButton onClick={(e) => this.onAddElement(e,param,arg,onUpdate)}></AddButton>
    }

    render() {
        const {param,arg,onUpdate} = this.props
        let currentArg = StateUtil.deepCopy(arg)
        const listElements = this.renderElements(param, currentArg, onUpdate)
        const addButton = this.addButton(param,currentArg,onUpdate)
       
        return <div key={param.name} className={style.paramElements}>
            {listElements}
            {addButton}
        </div>
    }
}
