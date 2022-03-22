//@flow
import React from 'react';
import NotificationsSystem, {useNotifications, wyboTheme} from 'reapop'

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
            const notificationId = Math.random().toString();
            notify({
                id: notificationId,
                title: title,
                message: message,
                status: 'success',
                dismissAfter: 2000
            });
            return notificationId;
        },
        // 処理中ダイアログを表示する
        notifyLoading: (title:string, message:string='') => {
            const notificationId = Math.random().toString();
            notify({
                id: notificationId,
                title: title,
                message: message,
                status: 'loading'
            });
            return notificationId;
        },
        // 警告通知ダイアログを表示する
        notifyWarning: (title:string, message:string='') => {
            const notificationId = Math.random().toString();
            notify({
                id: notificationId,
                title: title,
                message: message,
                status: 'warning'
            });
            return notificationId;
        },
        // エラー通知ダイアログを表示する
        notifyError: (title:string, message:string='') => {
            const notificationId = Math.random().toString();
            notify({
                id: notificationId,
                title: title,
                message: message,
                status: 'error'
            });
            return notificationId;
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
        notifyComplete: (title:string, message:string, parentFolderUUID:string) => {
            const notificationId = Math.random().toString();
            notify({
                id: notificationId,
                title: title,
                message: message,
                status: 'success',
                dismissAfter: 0,
                allowHTML: true,
                buttons: [{
                    name: '開く',
                    primary: true,
                    onClick: () => {
                        window.open('/folders/' + parentFolderUUID, '_blank');
                    }
                }]
            });
            return notificationId;
        },
        // 別名保存通知ダイアログを表示する
        notifySaveAs: (title:string, message:string, onClickSaveAs:()=>boolean, onClickReload:()=>boolean) => {
            const notificationId = Math.random().toString();
            notify({
                id: notificationId,
                title: title,
                message: message,
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
            });
            return notificationId;
        }
    };
};

export {NotificationManager, useStreamCatNotifications, useStreamCatFlowNotification};
