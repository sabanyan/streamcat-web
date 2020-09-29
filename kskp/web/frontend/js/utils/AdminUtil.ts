export default class AdminUtil {
    static getUserStatus = (status: string): string => {
        switch (status) {
            case 'active':
                return '登録済';
            case 'tmp':
                return '仮登録';
            case 'inactive':
                return '削除済';
        }
        return '';
    };

    static replaceAsterisk = (length: number): string => {
        const asteriskStr = [...Array(length)].map((index) => {return "*"});
        return asteriskStr.toString().replace(/,/g, '')
    }
}
