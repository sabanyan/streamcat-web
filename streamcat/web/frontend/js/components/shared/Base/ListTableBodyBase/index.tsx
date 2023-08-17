import React from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import style from './style.scss';

type Props<TDatumType> = {
    allDatas: TDatumType[];
    selectedDatas: [TDatumType[], (value:React.SetStateAction<TDatumType[]>)=>void];
    createRow: (datum:TDatumType, selected:boolean, trProps:{}) => React.JSX.Element;
    onLoadMore?: (offset:number, limit:number) => Promise<boolean>;
    enableMultiSelect: boolean;
};

// InfiniteScrollが一回で読み込む行数
export const childrenLimit = 32;

export const ListTableBodyBase = <TDatumType extends {uuid:string},>(props: Props<TDatumType>) => {
    const { allDatas, createRow, enableMultiSelect } = props;

    // 既に読み込んだ行数
    const offset = allDatas.length;

    // 選択中の行を保持する
    const [selectedDatas, setSelectedDatas] = props.selectedDatas;
    // さらに読み込み可能な行があるか
    const [hasMore, setHasMore] = React.useState(offset % childrenLimit === 0 && offset > 0);

    // さらに行を読み込む関数
    const onLoadMore = props.onLoadMore || ((offset:number) => new Promise(resolve => resolve(true)));

    // 行のクリックで選択中の行を変更する
    const onClickRow = (selectedDatum: TDatumType, event: React.MouseEvent<HTMLTableRowElement>): void => {
        // リストボディへのクリックイベントを親コンポーネントに伝搬させないことで
        // ListTableBodyの選択状態を維持する
        event.stopPropagation();        

        if (event && (event.metaKey || event.ctrlKey) && enableMultiSelect) {
            // command or ctrl + click
            if (selectedDatas.includes(selectedDatum)) {
                // 既に選択状態の場合は選択を解除する
                setSelectedDatas(
                    selectedDatas.filter(d => d.uuid !== selectedDatum.uuid)
                );
            } else {
                // 選択したDatumを追加する
                setSelectedDatas([
                    ...selectedDatas, selectedDatum
                ])
            }
        } else if (event && event.shiftKey && enableMultiSelect) {
            // shift + click
            if (selectedDatas.length > 0) {
                // 最後に選択したDatum
                const lastSelectedDatum = selectedDatas[0];
                const curr_index = allDatas.findIndex(datum => selectedDatum.uuid===datum.uuid);
                const last_index = allDatas.findIndex(datum => lastSelectedDatum.uuid===datum.uuid);
                // 最後に選択したDatumから現在選択したDatumまでを範囲選択する
                setSelectedDatas(
                    allDatas.slice(Math.min(curr_index, last_index), Math.max(curr_index, last_index) + 1)
                );
            }
        } else {
            // 単一選択
            setSelectedDatas([selectedDatum]);
        }
    };

    // 読み込み可能な行が存在することを示す表示
    const loadingRow = <tr key='loading'><td>. . .</td><td>. . .</td><td>. . .</td></tr>;

    return <InfiniteScroll  // InfiniteScrollの初回レンダリング時にロードしない
                            initialLoad={false}
                            // Windowのスクロールイベントを検知させる
                            useWindow={true}
                            // InfiniteScrollをtbodyタグでレンダリングする
                            element='tbody'
                            className={style.listTableBody}
                            // さらに行を読み込んだ時の処理
                            loadMore={() => {
                                // 読み込んだ行数がlimitの倍数の場合は残りの行が存在する可能性がある
                                if(offset % childrenLimit === 0){
                                    onLoadMore(offset, childrenLimit).then(more => {
                                        setHasMore(more);
                                    });
                                }else{
                                    // 次に読み込み可能な行が無い場合は何もしない
                                    setHasMore(false);
                                }
                            }}
                            // 次に読み込み可能な行があるか
                            hasMore={hasMore}
                            // hasMore=Trueの場合に表示する
                            loader={loadingRow} >{
        allDatas.map((datum, index) => {
            // 選択行の色を変える
            const selected = selectedDatas.some(selectedDatum => selectedDatum.uuid===datum.uuid);
            // 1行出力する
            const trProps = {
                onClick: e => onClickRow(datum,e),
                onMouseDown: (event)=>event.stopPropagation()
            };
            return createRow(datum, selected, trProps);
        })
    }</InfiniteScroll>;
};
