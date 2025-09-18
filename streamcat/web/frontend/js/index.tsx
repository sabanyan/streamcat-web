import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import EventEmitter from 'eventemitter3';
import {StreamCat, ViewId} from './StreamCat';

window.emitter = new EventEmitter();

let elementId: string | null = null;
let viewId: ViewId = ViewId.Undefined;

if (document.getElementById('base')) {
    elementId = 'base';
}

if (document.getElementById('flow_editor')) {
    elementId = 'flow_editor';
    viewId = ViewId.Flow_Editor;
}

if (document.getElementById('library')) {
    elementId = 'library';
    viewId = ViewId.Library;
}

if (document.getElementById('profile')) {
    elementId = 'profile';
    viewId = ViewId.Profile;
}

if (document.getElementById('preview')) {
    elementId = 'preview';
    viewId = ViewId.Preview;
}

if (document.getElementById('trashcan')) {
    elementId = 'trashcan';
    viewId = ViewId.TrashCan;
}

if (document.getElementById('admin_sys')) {
    elementId = 'admin_sys';
    viewId = ViewId.System;
}

if (document.getElementById('admin_users')) {
    elementId = 'admin_users';
    viewId = ViewId.User_List
}

if (elementId) {
    const root = createRoot(
        document.getElementById(elementId)!
    );
    root.render(
        <Suspense fallback={<p>Loading...</p>}>
            <StreamCat viewId={viewId} />
        </Suspense>
    );
}
