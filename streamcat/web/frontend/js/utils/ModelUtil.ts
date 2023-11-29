//@flow
import { Constants } from 'Constants/index'
import { AllNodeType } from 'Model/Library'
import { ErrorUtil } from 'Utils/index'

export default class ModelUtil {
    /**
     * フロントエンドで発行するUUID
     * "d1,c1,f1" というフォーマットで発行される
     * @returns {string}
     */
    static getNewId (nodes:AllNodeType[], type: string): string {
        let prefix: string = ModelUtil.getTypePrefix(type)
        let Id: string = ModelUtil.getMinimumIDNumberFromNodes(nodes, type)
        return prefix + Id
    }

    static getTypePrefix (type: string): string {
        let prefix: string = ''
        switch (type) {
            case Constants.node.type.frame:
                prefix = 'd'
                break
            case Constants.node.type.subflow:
                prefix = 'f'
                break
            case Constants.node.type.command:
                prefix = 'c'
                break
            case 'datasrc':
                prefix = 'i';
                break;
            case 'datadst':
                prefix = 'o';
                break;
            case Constants.node.type.note:
                prefix = 'n'
                break
            default:
                new ErrorUtil('想定している型とは異なる型が指定されました')
        }
        return prefix
    }

    static getMinimumIDNumberFromNodes (nodes:AllNodeType[], type: string): string {
        const prefix: string = ModelUtil.getTypePrefix(type)
        let idNumber: string = ''
        for (let index = 1; index <= nodes.length; index++) {
            idNumber = index.toString()
            const found = nodes.find((node) => {
                return (node.id === prefix + index)
            })
            if (found) {
            } else {
                return idNumber
            }
        }
        return idNumber
    }
}
