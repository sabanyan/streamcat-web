import React, { FC } from 'react';
import { useSampleDragLayer } from './hooks';
import { SampleDragLayerPresenter } from './presenter';

// 参考元
// https://qiita.com/s_kido14/items/d506805b40da3eb514ad
// 
export const SampleDragLayer: FC = () => {
    const { isDragging, ...props } = useSampleDragLayer();
    // ドラッグ中じゃない時はプレビューのコンポーネントを返さない
    if (!isDragging) {
        return null;
    }

    return <SampleDragLayerPresenter {...props} />;
};
