
import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export const RectNode = (nodeProps: NodeProps<{label:string, iPortLabels:string[], oPortLabels:string[]}>) => {
    const {data, isConnectable} = nodeProps;

    // Portラベル
    const renderPortLabel = (label:string, isOport=false) => <div
        style={{
            position: 'absolute',
            background: 'transparent',
            padding: 0,
            // color: '#ff5050',
            fontSize: 12,
            fontWeight: 700,
            translate: isOport? '-50% 20%': '-50% -100%'
        }}
        className="nodrag nopan">{label}
    </div>;

    // 入力Port
    const renderIPorts = () => data.iPortLabels.map(iPortLabel =>
        <Handle
            key='i'
            type='target'
            position={Position.Top}
            style={{ background: '#555' }}
            onConnect={(params) => console.log('handle onConnect', params)}
            isConnectable={isConnectable} >{renderPortLabel(iPortLabel)}
        </Handle>
    );

    // 出力Port
    const renderOPorts = () => data.oPortLabels.map(oPortLabel => 
        <Handle
            key='o'
            type='source'
            position={Position.Bottom}
            style={{ background: '#555' }}
            isConnectable={isConnectable} >{renderPortLabel(oPortLabel, true)}
        </Handle>
    );

    return <div
        key={nodeProps.id}
        style={{
            width: '144px',
            height: '48px',
            borderRadius: '5%',
            border: 'solid',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
        {renderIPorts()}
        <div>{data.label}</div>
        {renderOPorts()}
    </div>;
};
