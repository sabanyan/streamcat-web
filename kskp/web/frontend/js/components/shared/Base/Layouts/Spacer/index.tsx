import React from "react";

type Props = {
    height?: number,
    width?: number
}

export default class Spacer extends React.Component<Props> {
    constructor(props: Props) {
        super(props);
    }
    render() {
        const {width, height} = this.props;
        return <div style={{width: width, height: height, display: (width !== undefined) ? "inline-block" : "block"}} />;
    }
}
