import * as ALD from "abstract-leveldown";
import { Buffer } from "buffer";
export interface ReactNativeLeveldownWriteOptions {
    sync?: boolean;
}
declare class ReactNativeLeveldownIterator<K extends string | Buffer, V extends string | Buffer> extends ALD.AbstractIterator<K, V> {
    private static iteratorHandleCounter;
    keyQueue: string[] | null;
    valueQueue: string[] | null;
    queueLength: number;
    isExhausted: boolean;
    iteratorHandle: number;
    isInImmediate: boolean;
    keyAsBuffer: boolean;
    valueAsBuffer: boolean;
    constructor(db: ALD.AbstractLevelDOWN, dbHandle: number, options: ALD.AbstractIteratorOptions);
    _next(callback: ALD.ErrorKeyValueCallback<K | undefined, V | undefined>): Promise<void>;
    _seek(target: string | Buffer): void;
    _end(callback: ALD.ErrorCallback): void;
}
export default class ReactNativeLeveldown extends ALD.AbstractLevelDOWN {
    private static dbHandleCounter;
    private databaseName;
    private databaseHandle;
    constructor(databaseName: string);
    _open(options: ALD.AbstractOpenOptions, callback: ALD.ErrorCallback): void;
    _put(key: string | Buffer, value: string, options: ReactNativeLeveldownWriteOptions, callback: ALD.ErrorCallback): void;
    _get<V extends string | Buffer>(key: string | Buffer, options: {
        asBuffer: boolean;
    }, callback: ALD.ErrorValueCallback<V>): void;
    _del<V>(key: string | Buffer, options: ReactNativeLeveldownWriteOptions, callback: ALD.ErrorCallback): void;
    _close(callback: ALD.ErrorCallback): void;
    _batch(operations: ReadonlyArray<ALD.AbstractBatch>, options: {}, callback: ALD.ErrorCallback): Promise<void>;
    _iterator<K extends string | Buffer, V extends string | Buffer>(options: ALD.AbstractIteratorOptions): ReactNativeLeveldownIterator<K, V>;
}
export {};
//# sourceMappingURL=index.d.ts.map