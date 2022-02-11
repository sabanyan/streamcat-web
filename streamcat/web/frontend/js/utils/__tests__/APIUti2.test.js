import {APIUtil2, Folder} from 'Utils/APIUtil2';

describe('APIUtil2', () => {
    test('Folder', () => {

        Folder.findLibrary().then(folder => {
            console.log(folder);
        });
        console.log('AAAVVV')

        
    });
});
