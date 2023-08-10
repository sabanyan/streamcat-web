//@flow
import React from 'react';
import NotificationsSystem, {setUpNotifications, useNotifications, wyboTheme} from 'reapop'
import { StringUtil, ReactDomUtil } from 'Utils/index';

// reapopの初期値を設定する
setUpNotifications({
    defaultProps: {
        position: 'top-right',
        // 通知ダイアログのクリックで閉じる
        dismissible: true,
        // 通知ダイアログが消えるまでの時間 (0:消えない)
        dismissAfter: 0,
        // 通知ダイアログにHTMLの記述を許可しない
        // TODO: HTMLを用いたメッセージがあるので暫定的に許可する
        allowHTML: true,
        // 閉じるボタンを表示しない
        closeButton: false
    }
});

const NotificationManager = () => {
    // 1. Retrieve the notifications to display, and the function used to dismiss a notification.
    const {notifications, dismissNotification} = useNotifications();
    return <>
        <NotificationsSystem
            // 2. Pass the notifications you want Reapop to display.
            notifications={notifications}
            // 3. Pass the function used to dismiss a notification.
            dismissNotification={(id) => dismissNotification(id)}
            // 4. Pass a builtIn theme or a custom theme.
            theme={wyboTheme}
        />
    </>;
};

/**
 * 通知ダイアログを表示する関数を取得する
 */
const useStreamCatNotifications = () => {
    const {notify, dismissNotification, dismissNotifications} = useNotifications();
    return {
        // 処理完了通知ダイアログを表示する
        notifySuccess: (title:string, message:string='') => {
            return notify({
                title: title,
                message: message,
                allowHTML: false,
                status: 'success',
                dismissAfter: 2000
            }).id;
        },
        // 処理中ダイアログを表示する
        notifyLoading: (title:string, message:string='') => {
            return notify({
                title: title,
                message: message,
                allowHTML: false,
                status: 'loading'
            }).id;
        },
        // 警告通知ダイアログを表示する
        notifyWarning: (title:string, message:string='') => {
            return notify({
                title: title,
                message: message,
                allowHTML: false,
                status: 'warning'
            }).id;
        },
        // エラー通知ダイアログを表示する
        notifyError: (title:string, message:string='') => {
            return notify({
                title: title,
                message: message,
                allowHTML: false,
                status: 'error'
            }).id;
        },
        // 通知ダイアログを閉じる
        dismissNotify: (id:string) => {
            setTimeout(() => {
                dismissNotification(id);
            }, 1000);
        },
        // 全ての通知ダイアログを閉じる
        dismissAllNotify: () => {
            setTimeout(() => {
                dismissNotifications();
            }, 1000);
        }
    };
};

/**
 * フロー実行完了通知ダイアログを表示する関数を取得する
 */
const useStreamCatFlowNotification = () => {
    const {notify} = useNotifications();
    return {
        // 処理完了通知ダイアログを表示する
        notifyComplete: (title:string, outLabels:string[], parentFolderUUID:string|null) => {
            // outsのidをエスケープ処理する
            const outItems = outLabels.map(outId =>
                <li>{StringUtil.stripHtmlToText(outId)}</li>
            );
            // outsをHTMLのリストで一覧表示する
            const message = <>
                ライブラリにフローの実行結果が追加されました
                <ul>{outItems}</ul>
            </>;

            return notify({
                title: title,
                message: ReactDomUtil.renderToString(message),
                // メッセージをHTMLで表示する
                allowHTML: true,
                status: 'success',
                dismissAfter: 0,
                buttons: [{
                    name: '開く',
                    primary: true,
                    onClick: () => {
                        window.open('/folders/' + parentFolderUUID, '_blank');
                    }
                }]
            }).id;
        },
        // 別名保存通知ダイアログを表示する
        notifySaveAs: (title:string, message:string, onClickSaveAs:()=>boolean, onClickReload:()=>boolean) => {
            return notify({
                title: title,
                message: message,
                allowHTML: false,
                status: 'warning',
                dismissible: false,
                buttons: [{
                    name: "別名保存",
                    primary: true,
                    onClick: onClickSaveAs
                }, {
                    name: "再読込",
                    primary: true,
                    onClick: onClickReload
                }]
            }).id;
        }
    };
};

export {NotificationManager, useStreamCatNotifications, useStreamCatFlowNotification};
