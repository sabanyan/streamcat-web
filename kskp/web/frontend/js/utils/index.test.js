import AdminUtil from './AdminUtil';
import Constants from '../Constants/index';

describe('AdminUtil', () => {
  test('getUserStatus', () => {
    expect(
      AdminUtil.getUserStatus(Constants.admin.userStatus.active)
    ).toBe(
      '利用中'
    );
  });
});

import SortUtil from './SortUtil';

describe('SortUtil', () => {
  test('defaultCompare', () => {
    const a = {order: 'abc'};
    const b = {order: '012'};
    expect(SortUtil.defaultCompare(a, a)).toBe(0);
    expect(SortUtil.defaultCompare(a, b)).toBe(1);
    expect(SortUtil.defaultCompare(b, a)).toBe(-1);
  });
});
