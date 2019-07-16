import { CommandModel } from 'Model/index';
import { CommandModelProps } from './CommandModel';

describe('CommandModel', () => {

    const props:CommandModelProps = {
        classification: 'command',
        description: '',
        id: '',
        label: '' | null,
        params: CommandParamType[],
        ports: [CommandPortType],
        version: string,
        rules: {},
    }

    describe('constructor()', () => {

    })

    describe('getInPorts()', () => {

    })

    describe('getOutPorts()', () => {

    })

    describe('getParams()', () => {

    })

    describe('getLabel()', () => {

    })

    describe('getParam()', () => {

    })
})
