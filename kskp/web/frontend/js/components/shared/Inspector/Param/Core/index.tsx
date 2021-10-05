//@flow
import React from 'react';

type Props = {
    param: {
        label: string;
        name : string;
    }
}

const Param = (props: Props) => {
    const getLabel = () => {
        const {param} = props;
        return (param.label) ? param.label : param.name;
    };
};

export default Param;
