import AdminUtil from './AdminUtil';
import Constants from '../constants/index';

describe('AdminUtil', () => {
  test('getUserStatus', () => {
    expect(
      AdminUtil.getUserStatus(Constants.admin.userStatus.active)
    ).toEqual(
      '利用中'
    );
  });
});

import SortUtil from './SortUtil';

describe('SortUtil', () => {

  test('getSortedContents', () => {
    const a = {order: '漢字'};
    const b = {order: 'abc'};
    const c = {order: 'ABC'};
    const d = {order: '012'};
    const e = {order: 'いろは'};
    expect(
      SortUtil.getSortedContents([a,b,c,d,e])
    ).toEqual(
      [d,c,b,e,a]
    );
  });

  test('defaultCompare', () => {
    const a = {order: 'abc'};
    const b = {order: '012'};
    expect(SortUtil.defaultCompare(a, a)).toEqual(0);
    expect(SortUtil.defaultCompare(a, b)).toEqual(1);
    expect(SortUtil.defaultCompare(b, a)).toEqual(-1);
  });
});
