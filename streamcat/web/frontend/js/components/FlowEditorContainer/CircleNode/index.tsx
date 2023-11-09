
import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export const CircleNode = (nodeProps: NodeProps<{label:string}>) => {
    const {data, isConnectable} = nodeProps;
    return <div
        key={nodeProps.id}
        style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'solid',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
        <Handle
            type='target'
            position={Position.Top}
            style={{ background: '#555' }}
            onConnect={(params) => console.log('handle onConnect', params)}
            isConnectable={isConnectable} />
        <div>{data.label}</div>
        <Handle
            type='source'
            position={Position.Bottom}
            style={{ background: '#555' }}
            isConnectable={isConnectable}
        />
    </div>;
};
