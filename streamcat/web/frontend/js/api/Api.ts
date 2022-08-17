import { DatumApi } from './DatumApi';
import { LockApi } from './LockApi';
import { UserApi } from './UserApi';
import { SelfUserApi } from './SelfUserApi';

export const Api = {
    ...DatumApi,
    ...LockApi,
    ...UserApi,
    ...SelfUserApi
};
