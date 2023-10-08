import React from 'react';
import { createRoot } from 'react-dom/client';
import {AsyncResourceContent} from 'use-async-resource';
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
    viewId = ViewId.TrashCan
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
        <AsyncResourceContent fallback={<p>Loading...</p>}>
            <StreamCat viewId={viewId} />
        </AsyncResourceContent>
    );
}
