import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {AsyncResourceContent} from 'use-async-resource';
import EventEmitter from 'eventemitter3';
import store from 'Modules/store/index';
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
    ReactDOM.render(
        <Provider store={store}>
        <AsyncResourceContent fallback={<p>Loading...</p>}>
            <StreamCat viewId={viewId} />
        </AsyncResourceContent>
        </Provider>,
        document.getElementById(elementId)
    );
}
