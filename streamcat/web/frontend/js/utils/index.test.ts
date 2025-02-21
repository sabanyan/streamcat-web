import AdminUtil from './AdminUtil';
import { Constants } from '../constants/index';

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

import StringUtil from './StringUtil'

describe('StringUtil', () => {
	test('convertToFileSize', () => {
		expect(
			StringUtil.convertToFileSize(2469879, true)
		).toEqual(
			'2 MB'
		);
	});
});
