//@flow
import * as React from 'react';
import style from './style.scss';
import classnames from 'classnames';

type Props = {
    onMouseDown: React.MouseEventHandler<HTMLDivElement>;
    onMouseMove: React.MouseEventHandler<HTMLDivElement>;
    onMouseUp: React.MouseEventHandler<HTMLDivElement>;
    isClosed: boolean;
}

class InspectorKnob extends React.Component<Props> {

    render() {
        return <div className={classnames(style.inspector_knob, {[style.isClosed]: this.props.isClosed})}
                    onMouseMove={this.props.onMouseMove}
                    onMouseDown={this.props.onMouseDown}
                    onMouseUp={this.props.onMouseUp} />;
    }

}

export default InspectorKnob;
