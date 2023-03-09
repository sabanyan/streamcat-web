import AdminUtil from './AdminUtil';
import Constants from '../constants/index';

describe('AdminUtil', 
	() => {
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
		const a = {order: 1};
		const b = {order: 4};
		const c = {order: 3};
		const d = {order: 5};
		const e = {order: 2};
		expect(
			SortUtil.getSortedContents([a,b,c,d,e])
		).toEqual(
			[a,e,c,b,d]
		);
	});
});
