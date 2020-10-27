import * as ALD from "abstract-leveldown";
import { Buffer } from "buffer";
import supports from "level-supports";
import { NativeModules } from "react-native";
// @ts-ignore
const setImmediate = global.setImmediate;
function inputAsString(key) {
    if (typeof key === "string") {
        return key;
    }
    else if (Buffer.isBuffer(key)) {
        return key.toString("binary");
    }
    else {
        return key.toString();
    }
}
class ReactNativeLeveldownIterator extends ALD.AbstractIterator {
    constructor(db, dbHandle, options) {
        super(db);
        this.keyQueue = options.keys ? [] : null;
        this.valueQueue = options.values ? [] : null;
        this.queueLength = 0;
        this.isExhausted = false;
        this.iteratorHandle = ReactNativeLeveldownIterator.iteratorHandleCounter++;
        this.isInImmediate = false;
        this.keyAsBuffer = options.keyAsBuffer ?? true;
        this.valueAsBuffer = options.valueAsBuffer ?? true;
        NativeModules.Leveldown.createIterator(dbHandle, this.iteratorHandle, {
            ...options,
            gte: options.gte ?? (options.reverse ? options.end : options.start),
            lte: options.lte ?? (options.reverse ? options.start : options.end),
        });
    }
    async _next(callback) {
        if (this.queueLength === 0 && !this.isExhausted) {
            // Fill the queue.
            try {
                const { keys, values, readCount, } = await NativeModules.Leveldown.readIterator(this.iteratorHandle, 100);
                this.queueLength += readCount;
                this.isExhausted = readCount === 0;
                this.keyQueue = keys ?? null;
                this.valueQueue = values ?? null;
            }
            catch (error) {
                setImmediate(() => callback(error, undefined, undefined));
                return;
            }
        }
        if (this.isExhausted) {
            setImmediate(callback);
        }
        else {
            this.queueLength--;
            const keyString = this.keyQueue?.shift();
            const key = (this.keyAsBuffer
                ? Buffer.from(keyString, "binary")
                : keyString);
            const valueString = this.valueQueue?.shift();
            const value = (this.valueAsBuffer
                ? Buffer.from(valueString, "binary")
                : valueString);
            if (this.isInImmediate) {
                callback(undefined, key, value);
            }
            else {
                setImmediate(() => {
                    this.isInImmediate = true;
                    callback(undefined, key, value);
                    this.isInImmediate = false;
                });
            }
        }
    }
    _seek(target) {
        this.keyQueue = [];
        this.valueQueue = [];
        this.queueLength = 0;
        this.isExhausted = false;
        NativeModules.Leveldown.seekIterator(this.iteratorHandle, inputAsString(target));
    }
    _end(callback) {
        NativeModules.Leveldown.endIterator(this.iteratorHandle)
            .then(() => setImmediate(callback))
            .catch(callback);
    }
}
ReactNativeLeveldownIterator.iteratorHandleCounter = 100;
export default class ReactNativeLeveldown extends ALD.AbstractLevelDOWN {
    constructor(databaseName) {
        super(supports({
            bufferKeys: false,
            snapshots: true,
            permanence: true,
            seek: true,
            clear: true,
            deferredOpen: false,
            openCallback: true,
            promises: true,
            createIfMissing: true,
            errorIfExists: true,
        }));
        this.databaseName = databaseName;
        this.databaseHandle = ReactNativeLeveldown.dbHandleCounter++;
    }
    _open(options, callback) {
        NativeModules.Leveldown.open(this.databaseHandle, this.databaseName, options.createIfMissing, options.errorIfExists)
            .then(() => setImmediate(() => callback(undefined)))
            .catch(callback);
    }
    _put(key, value, options, callback) {
        NativeModules.Leveldown.put(this.databaseHandle, inputAsString(key), inputAsString(value), options.sync ?? false)
            .then(() => setImmediate(callback))
            .catch(callback);
    }
    _get(key, options, callback) {
        NativeModules.Leveldown.get(this.databaseHandle, inputAsString(key))
            .then((value) => setImmediate(() => {
            const result = options.asBuffer ?? true ? Buffer.from(value) : value;
            return callback(undefined, result);
        }))
            .catch(callback);
    }
    _del(key, options, callback) {
        NativeModules.Leveldown.del(this.databaseHandle, inputAsString(key), options.sync ?? false)
            .then(() => setImmediate(callback))
            .catch(callback);
    }
    _close(callback) {
        NativeModules.Leveldown.close(this.databaseHandle)
            .then(() => setImmediate(callback))
            .catch(callback);
    }
    async _batch(operations, options, callback) {
        NativeModules.Leveldown.batch(this.databaseHandle, operations)
            .then(() => setImmediate(callback))
            .catch(callback);
    }
    _iterator(options) {
        return new ReactNativeLeveldownIterator(this, this.databaseHandle, options);
    }
}
ReactNativeLeveldown.dbHandleCounter = 1;
