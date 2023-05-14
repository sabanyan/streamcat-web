/**
 * Lockを格納するオブジェクト型
 */
export type LockType = {
    uuid: string;
    target: string;
    creator: string;
    created_at: string;
    modified_at: string;

    delete: () => Promise<void>;
    extend: () => Promise<void>;
};

