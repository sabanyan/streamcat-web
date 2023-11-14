import {
    ConnectivityType,
    NavigationType
} from 'Model/Navigation/NavigationModel';
import {
    getBase as get,
    download,
    uploadBase
} from './ApiBase';

/**
 * Web APIを発行する関数を纏めるクラス
 */
export const SystemApi = {
    /**
     * GET /navigationを発行してNavigationを取得する
     * @throws {ErrorResponse}
     */
    findNavigation: () => {
        return get<NavigationType>('/api/v0/navigation');
    },

    /**
     * GET /connectables/remote-foldersを発行して
     * RemoteFolderへの接続を確認する
     */
    checkRemoteFolderConnection: (
        protocol: 'smb',
        hostname: string,
        domain: string,
        directory: string,
        userId: string,
        password: string
    ) => {
        const params = {
            protocol: protocol,
            hostname: hostname,
            domain: domain,
            directory: directory,
            userId: userId,
            password: password
        };
        return get<ConnectivityType>('/api/v0/connections/remote-folders', params);
    },

    /**
     * GET /connectables/databasesを発行して
     * Databaseへの接続を確認する
     */
    checkDatabaseConnection: (
        dbms: 'postgresql'|'oracle',
        hostname: string,
        port: number,
        database: string,
        userId: string,
        password: string
    ) => {
        const params = {
            dbms: dbms,
            hostname: hostname,
            port: port,
            database: database,
            userId: userId,
            password: password
        };
        return get<ConnectivityType>('/api/v0/connections/databases', params);
    },

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
