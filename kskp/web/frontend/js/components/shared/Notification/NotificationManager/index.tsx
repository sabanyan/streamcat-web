//@flow
import * as React from "react";

import NotificationsSystem from "reapop";
import theme from "./NotificationTheme";


const NotificationManager = () => {
    return (
        <div>
            <NotificationsSystem theme={theme} />
        </div>
    );
};

export {NotificationManager};
