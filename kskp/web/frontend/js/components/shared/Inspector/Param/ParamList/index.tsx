import * as React from 'react'
import { CommandParamType } from 'Types/index'
import { AddButton, Button} from 'Shared/Input'
// 循環参照されるため一個一個Importする（ParamBoolean, ParamString, ParamSelect)
import { default as ParamBoolean } from '../ParamBoolean/index'
import { default as ParamString } from '../ParamString/index'
import { default as ParamSelect } from '../ParamSelect/index'
import Constants from 'Constants/index'
import { ParamUtil, ModalUtil, StateUtil } from 'Utils/index'
import style from './style.scss'
import { SortableContainer, SortableElement } from 'react-sortable-hoc'
import arrayMove from 'array-move'
import classnames from 'classnames'

type Props = {
    param: CommandParamType;
    value:Array<CommandParamType>;

    onChange:Function; // OnChange(e, param, value)
}

type State = {
    currentValue:Array<CommandParamType>;
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
    
export default class ParamList extends  React.Component<Props, State>{

    constructor(props:Props) {
        super(props)
    }

    componentWillMount() {
        this.setState({
            currentValue : this.props.value
        })
    }

    onSortEnd({oldIndex, newIndex, collection, isKeySorting}, e) {
        try {
            const {param, onChange} = this.props
            let newValue = arrayMove(this.state.currentValue, oldIndex, newIndex)
            this.setState({
                currentValue:newValue
            }, () => {
                onChange(e, param, this.state.currentValue)
            })
        } catch(e) {
            console.log(e)
        }
    }

    onDeleteElement(e, param, argIndex) {
        try {
            e.preventDefault()
            const {onChange} = this.props
            if(this.state.currentValue.length <= 1) {
                return
            }
            let newValue = this.state.currentValue.filter((element, index) => {index !== argIndex})
            ModalUtil.registerModal({
                id: Constants.modal.CONFIRM, 
                onClickDone: () => {
                    this.setState({
                        currentValue:newValue
                    }, () => {
                        onChange(e, param, newValue)
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
        } catch(e) {
            console.log(e)
        }
    }

    onChangeContent(e, param:CommandParamType, elementValue:any, element:CommandParamType, argIndex:number) {
        try {
            const {onChange} = this.props
            this.state.currentValue[argIndex][element.name] = elementValue
            this.setState({
                currentValue : this.state.currentValue
            }, () => {
                onChange(e, param, elementValue)
            })
        } catch(e) {
            console.log(e)
        }    
    }

    getParamElement(param:CommandParamType, disabled:boolean=false,label?:string,value?:any, onChange?:Function, headers?:string[]) {
        let paramElement:any
        try {
          switch (param.type) {
            case Constants.param.type.number  :
            case Constants.param.type.string  :
              paramElement = <ParamString label={label} param={param} disabled={disabled} value={value} onChange={onChange} />
              break
            case Constants.param.type.boolean :
              paramElement = <ParamBoolean label={label} param={param} disabled={disabled} value={value} onChange={onChange} />
              break
            case Constants.param.type.select  :
              paramElement = <ParamSelect label={label} param={param} disabled={disabled} value={value} onChange={onChange} />
              break
            case Constants.param.type.column  :
              //カラム情報を付与
              param.options = {
                labels: headers,
                values: headers,
                multiple: (param.options.multiple) ? true : false
              }
              paramElement = <ParamSelect label={label} param={param} disabled={disabled} value={value} onChange={onChange} />
              break
          }
        } catch(e) {
          console.log(e)
        }

        return paramElement
      }

    renderElement(param:CommandParamType, argIndex:number, arg:Array<CommandParamType>):JSX.Element {
        let elements:Array<JSX.Element> = []
        if (!(param.elements) || !(Array.isArray(param.elements))) {
            return <div>
                {elements}
            </div>
        }
        param.elements.forEach((element:CommandParamType, index:number) => {
            let ele:JSX.Element
            let value
            if(arg && arg[argIndex]) {
                value = arg[argIndex][element.name]
            } 
            ele = <div key={argIndex + element.name + index} className={style.paramElementArg}>
                {this.getParamElement(element, false, undefined, value, (e, param, elementValue) => {this.onChangeContent(e, param, elementValue, element, argIndex)})}
            </div>
            elements.push(ele)
        })
       
        return <React.Fragment>
            {elements}
            <Button danger={true} onClick={(e) => {this.onDeleteElement(e, param, argIndex)}}>削除</Button>
        </React.Fragment>
    }    

    renderElements(param:CommandParamType, arg:Array<CommandParamType>, onChange:Function):JSX.Element | null {
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
            paramElements.push(<div key={element.name + index} className={style.paramElements}>
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
            onSortEnd={(value, e) => this.onSortEnd(value, e)}/>
        </div>
    }

    onAddElement(e) {
        try {
            const {param, onChange} = this.props
            let newValue = this.state.currentValue
            newValue.push(StateUtil.deepCopy(param.default[0]))
            this.setState({
                currentValue: newValue
            }, () => {
                onChange(e, param, this.state.currentValue)
            })
        } catch (e) {
            console.log(e)
        }
    }

    addButton():JSX.Element {
        return <AddButton onClick={(e) => this.onAddElement(e)}></AddButton>
    }

    render() {
        const {param, onChange} = this.props
        const listElements = this.renderElements(param, this.state.currentValue, onChange)
        const addButton = this.addButton()

        return <div key={param.name} className={style.paramElements}>
            {listElements}
            {addButton}
        </div>
    }
}
