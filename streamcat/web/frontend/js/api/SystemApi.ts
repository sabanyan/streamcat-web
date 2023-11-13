import {
    download,
    uploadBase
} from './ApiBase';

/**
 * Web APIを発行する関数を纏めるクラス
 */
export const SystemApi = {
    /**
     * GET /dumpを発行してシステムのDumpファイルを取得する
     */
    downloadDump: () => {
        const accept = `application/gzip`;
        return download('/api/v0/dump', accept);
    },

    /**
     * POST /dumpを発行してDumpファイルを復元する
     * @param file 
     */
    restoreDump: (file: File) => {
        return uploadBase('/api/v0/dump', {file:file});
    },
};
