import * as React from 'react';
import {Flex, Text} from 'Shared/Base';

const NotAllowed = () => {
    return <Flex justifyContent={'center'} height={'calc(100vh - 60px)'} alignItems={'center'}>
        <Text>この操作は許可されていません。</Text>
    </Flex>
};

export {NotAllowed};
