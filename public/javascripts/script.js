(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process,global){
/*!
 * async
 * https://github.com/caolan/async
 *
 * Copyright 2010-2014 Caolan McMahon
 * Released under the MIT license
 */
(function () {

    var async = {};
    function noop() {}
    function identity(v) {
        return v;
    }
    function toBool(v) {
        return !!v;
    }
    function notId(v) {
        return !v;
    }

    // global on the server, window in the browser
    var previous_async;

    // Establish the root object, `window` (`self`) in the browser, `global`
    // on the server, or `this` in some virtual machines. We use `self`
    // instead of `window` for `WebWorker` support.
    var root = typeof self === 'object' && self.self === self && self ||
            typeof global === 'object' && global.global === global && global ||
            this;

    if (root != null) {
        previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        return function() {
            if (fn === null) throw new Error("Callback was already called.");
            fn.apply(this, arguments);
            fn = null;
        };
    }

    function _once(fn) {
        return function() {
            if (fn === null) return;
            fn.apply(this, arguments);
            fn = null;
        };
    }

    //// cross-browser compatiblity functions ////

    var _toString = Object.prototype.toString;

    var _isArray = Array.isArray || function (obj) {
        return _toString.call(obj) === '[object Array]';
    };

    function _isArrayLike(arr) {
        return _isArray(arr) || (
            // has a positive integer length property
            typeof arr.length === "number" &&
            arr.length >= 0 &&
            arr.length % 1 === 0
        );
    }

    function _each(coll, iterator) {
        return _isArrayLike(coll) ?
            _arrayEach(coll, iterator) :
            _forEachOf(coll, iterator);
    }

    function _arrayEach(arr, iterator) {
        var index = -1,
            length = arr.length;

        while (++index < length) {
            iterator(arr[index], index, arr);
        }
    }

    function _map(arr, iterator) {
        var index = -1,
            length = arr.length,
            result = Array(length);

        while (++index < length) {
            result[index] = iterator(arr[index], index, arr);
        }
        return result;
    }

    function _range(count) {
        return _map(Array(count), function (v, i) { return i; });
    }

    function _reduce(arr, iterator, memo) {
        _arrayEach(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    }

    function _forEachOf(object, iterator) {
        _arrayEach(_keys(object), function (key) {
            iterator(object[key], key);
        });
    }

    function _indexOf(arr, item) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === item) return i;
        }
        return -1;
    }

    var _keys = Object.keys || function (obj) {
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    function _keyIterator(coll) {
        var i = -1;
        var len;
        var keys;
        if (_isArrayLike(coll)) {
            len = coll.length;
            return function next() {
                i++;
                return i < len ? i : null;
            };
        } else {
            keys = _keys(coll);
            len = keys.length;
            return function next() {
                i++;
                return i < len ? keys[i] : null;
            };
        }
    }

    // Similar to ES6's rest param (http://ariya.ofilabs.com/2013/03/es6-and-rest-parameter.html)
    // This accumulates the arguments passed into an array, after a given index.
    // From underscore.js (https://github.com/jashkenas/underscore/pull/2140).
    function _restParam(func, startIndex) {
        startIndex = startIndex == null ? func.length - 1 : +startIndex;
        return function() {
            var length = Math.max(arguments.length - startIndex, 0);
            var rest = Array(length);
            for (var index = 0; index < length; index++) {
                rest[index] = arguments[index + startIndex];
            }
            switch (startIndex) {
                case 0: return func.call(this, rest);
                case 1: return func.call(this, arguments[0], rest);
                case 2: return func.call(this, arguments[0], arguments[1], rest);
            }
            // Currently unused but handle cases outside of the switch statement:
            // var args = Array(startIndex + 1);
            // for (index = 0; index < startIndex; index++) {
            //     args[index] = arguments[index];
            // }
            // args[startIndex] = rest;
            // return func.apply(this, args);
        };
    }

    function _withoutIndex(iterator) {
        return function (value, index, callback) {
            return iterator(value, callback);
        };
    }

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////

    // capture the global reference to guard against fakeTimer mocks
    var _setImmediate = typeof setImmediate === 'function' && setImmediate;

    var _delay = _setImmediate ? function(fn) {
        // not a direct alias for IE10 compatibility
        _setImmediate(fn);
    } : function(fn) {
        setTimeout(fn, 0);
    };

    if (typeof process === 'object' && typeof process.nextTick === 'function') {
        async.nextTick = process.nextTick;
    } else {
        async.nextTick = _delay;
    }
    async.setImmediate = _setImmediate ? _delay : async.nextTick;


    async.forEach =
    async.each = function (arr, iterator, callback) {
        return async.eachOf(arr, _withoutIndex(iterator), callback);
    };

    async.forEachSeries =
    async.eachSeries = function (arr, iterator, callback) {
        return async.eachOfSeries(arr, _withoutIndex(iterator), callback);
    };


    async.forEachLimit =
    async.eachLimit = function (arr, limit, iterator, callback) {
        return _eachOfLimit(limit)(arr, _withoutIndex(iterator), callback);
    };

    async.forEachOf =
    async.eachOf = function (object, iterator, callback) {
        callback = _once(callback || noop);
        object = object || [];
        var size = _isArrayLike(object) ? object.length : _keys(object).length;
        var completed = 0;
        if (!size) {
            return callback(null);
        }
        _each(object, function (value, key) {
            iterator(object[key], key, only_once(done));
        });
        function done(err) {
            if (err) {
                callback(err);
            }
            else {
                completed += 1;
                if (completed >= size) {
                    callback(null);
                }
            }
        }
    };

    async.forEachOfSeries =
    async.eachOfSeries = function (obj, iterator, callback) {
        callback = _once(callback || noop);
        obj = obj || [];
        var nextKey = _keyIterator(obj);
        var key = nextKey();
        function iterate() {
            var sync = true;
            if (key === null) {
                return callback(null);
            }
            iterator(obj[key], key, only_once(function (err) {
                if (err) {
                    callback(err);
                }
                else {
                    key = nextKey();
                    if (key === null) {
                        return callback(null);
                    } else {
                        if (sync) {
                            async.nextTick(iterate);
                        } else {
                            iterate();
                        }
                    }
                }
            }));
            sync = false;
        }
        iterate();
    };



    async.forEachOfLimit =
    async.eachOfLimit = function (obj, limit, iterator, callback) {
        _eachOfLimit(limit)(obj, iterator, callback);
    };

    function _eachOfLimit(limit) {

        return function (obj, iterator, callback) {
            callback = _once(callback || noop);
            obj = obj || [];
            var nextKey = _keyIterator(obj);
            if (limit <= 0) {
                return callback(null);
            }
            var done = false;
            var running = 0;
            var errored = false;

            (function replenish () {
                if (done && running <= 0) {
                    return callback(null);
                }

                while (running < limit && !errored) {
                    var key = nextKey();
                    if (key === null) {
                        done = true;
                        if (running <= 0) {
                            callback(null);
                        }
                        return;
                    }
                    running += 1;
                    iterator(obj[key], key, only_once(function (err) {
                        running -= 1;
                        if (err) {
                            callback(err);
                            errored = true;
                        }
                        else {
                            replenish();
                        }
                    }));
                }
            })();
        };
    }


    function doParallel(fn) {
        return function (obj, iterator, callback) {
            return fn(async.eachOf, obj, iterator, callback);
        };
    }
    function doParallelLimit(fn) {
        return function (obj, limit, iterator, callback) {
            return fn(_eachOfLimit(limit), obj, iterator, callback);
        };
    }
    function doSeries(fn) {
        return function (obj, iterator, callback) {
            return fn(async.eachOfSeries, obj, iterator, callback);
        };
    }

    function _asyncMap(eachfn, arr, iterator, callback) {
        callback = _once(callback || noop);
        var results = [];
        eachfn(arr, function (value, index, callback) {
            iterator(value, function (err, v) {
                results[index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    }

    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = doParallelLimit(_asyncMap);

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.inject =
    async.foldl =
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachOfSeries(arr, function (x, i, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err || null, memo);
        });
    };

    async.foldr =
    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, identity).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };

    function _filter(eachfn, arr, iterator, callback) {
        var results = [];
        eachfn(arr, function (x, index, callback) {
            iterator(x, function (v) {
                if (v) {
                    results.push({index: index, value: x});
                }
                callback();
            });
        }, function () {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    }

    async.select =
    async.filter = doParallel(_filter);

    async.selectLimit =
    async.filterLimit = doParallelLimit(_filter);

    async.selectSeries =
    async.filterSeries = doSeries(_filter);

    function _reject(eachfn, arr, iterator, callback) {
        _filter(eachfn, arr, function(value, cb) {
            iterator(value, function(v) {
                cb(!v);
            });
        }, callback);
    }
    async.reject = doParallel(_reject);
    async.rejectLimit = doParallelLimit(_reject);
    async.rejectSeries = doSeries(_reject);

    function _createTester(eachfn, check, getResult) {
        return function(arr, limit, iterator, cb) {
            function done() {
                if (cb) cb(getResult(false, void 0));
            }
            function iteratee(x, _, callback) {
                if (!cb) return callback();
                iterator(x, function (v) {
                    if (cb && check(v)) {
                        cb(getResult(true, x));
                        cb = iterator = false;
                    }
                    callback();
                });
            }
            if (arguments.length > 3) {
                eachfn(arr, limit, iteratee, done);
            } else {
                cb = iterator;
                iterator = limit;
                eachfn(arr, iteratee, done);
            }
        };
    }

    async.any =
    async.some = _createTester(async.eachOf, toBool, identity);

    async.someLimit = _createTester(async.eachOfLimit, toBool, identity);

    async.all =
    async.every = _createTester(async.eachOf, notId, notId);

    async.everyLimit = _createTester(async.eachOfLimit, notId, notId);

    function _findGetResult(v, x) {
        return x;
    }
    async.detect = _createTester(async.eachOf, identity, _findGetResult);
    async.detectSeries = _createTester(async.eachOfSeries, identity, _findGetResult);

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                callback(null, _map(results.sort(comparator), function (x) {
                    return x.value;
                }));
            }

        });

        function comparator(left, right) {
            var a = left.criteria, b = right.criteria;
            return a < b ? -1 : a > b ? 1 : 0;
        }
    };

    async.auto = function (tasks, callback) {
        callback = _once(callback || noop);
        var keys = _keys(tasks);
        var remainingTasks = keys.length;
        if (!remainingTasks) {
            return callback(null);
        }

        var results = {};

        var listeners = [];
        function addListener(fn) {
            listeners.unshift(fn);
        }
        function removeListener(fn) {
            var idx = _indexOf(listeners, fn);
            if (idx >= 0) listeners.splice(idx, 1);
        }
        function taskComplete() {
            remainingTasks--;
            _arrayEach(listeners.slice(0), function (fn) {
                fn();
            });
        }

        addListener(function () {
            if (!remainingTasks) {
                callback(null, results);
            }
        });

        _arrayEach(keys, function (k) {
            var task = _isArray(tasks[k]) ? tasks[k]: [tasks[k]];
            var taskCallback = _restParam(function(err, args) {
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _forEachOf(results, function(val, rkey) {
                        safeResults[rkey] = val;
                    });
                    safeResults[k] = args;
                    callback(err, safeResults);
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            });
            var requires = task.slice(0, task.length - 1);
            // prevent dead-locks
            var len = requires.length;
            var dep;
            while (len--) {
                if (!(dep = tasks[requires[len]])) {
                    throw new Error('Has inexistant dependency');
                }
                if (_isArray(dep) && _indexOf(dep, k) >= 0) {
                    throw new Error('Has cyclic dependencies');
                }
            }
            function ready() {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            }
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                addListener(listener);
            }
            function listener() {
                if (ready()) {
                    removeListener(listener);
                    task[task.length - 1](taskCallback, results);
                }
            }
        });
    };



    async.retry = function(times, task, callback) {
        var DEFAULT_TIMES = 5;
        var DEFAULT_INTERVAL = 0;

        var attempts = [];

        var opts = {
            times: DEFAULT_TIMES,
            interval: DEFAULT_INTERVAL
        };

        function parseTimes(acc, t){
            if(typeof t === 'number'){
                acc.times = parseInt(t, 10) || DEFAULT_TIMES;
            } else if(typeof t === 'object'){
                acc.times = parseInt(t.times, 10) || DEFAULT_TIMES;
                acc.interval = parseInt(t.interval, 10) || DEFAULT_INTERVAL;
            } else {
                throw new Error('Unsupported argument type for \'times\': ' + typeof(t));
            }
        }

        var length = arguments.length;
        if (length < 1 || length > 3) {
            throw new Error('Invalid arguments - must be either (task), (task, callback), (times, task) or (times, task, callback)');
        } else if (length <= 2 && typeof times === 'function') {
            callback = task;
            task = times;
        }
        if (typeof times !== 'function') {
            parseTimes(opts, times);
        }
        opts.callback = callback;
        opts.task = task;

        function wrappedTask(wrappedCallback, wrappedResults) {
            function retryAttempt(task, finalAttempt) {
                return function(seriesCallback) {
                    task(function(err, result){
                        seriesCallback(!err || finalAttempt, {err: err, result: result});
                    }, wrappedResults);
                };
            }

            function retryInterval(interval){
                return function(seriesCallback){
                    setTimeout(function(){
                        seriesCallback(null);
                    }, interval);
                };
            }

            while (opts.times) {

                var finalAttempt = !(opts.times-=1);
                attempts.push(retryAttempt(opts.task, finalAttempt));
                if(!finalAttempt && opts.interval > 0){
                    attempts.push(retryInterval(opts.interval));
                }
            }

            async.series(attempts, function(done, data){
                data = data[data.length - 1];
                (wrappedCallback || opts.callback)(data.err, data.result);
            });
        }

        // If a callback is passed, run this as a controll flow
        return opts.callback ? wrappedTask() : wrappedTask;
    };

    async.waterfall = function (tasks, callback) {
        callback = _once(callback || noop);
        if (!_isArray(tasks)) {
            var err = new Error('First argument to waterfall must be an array of functions');
            return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        function wrapIterator(iterator) {
            return _restParam(function (err, args) {
                if (err) {
                    callback.apply(null, [err].concat(args));
                }
                else {
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    ensureAsync(iterator).apply(null, args);
                }
            });
        }
        wrapIterator(async.iterator(tasks))();
    };

    function _parallel(eachfn, tasks, callback) {
        callback = callback || noop;
        var results = _isArrayLike(tasks) ? [] : {};

        eachfn(tasks, function (task, key, callback) {
            task(_restParam(function (err, args) {
                if (args.length <= 1) {
                    args = args[0];
                }
                results[key] = args;
                callback(err);
            }));
        }, function (err) {
            callback(err, results);
        });
    }

    async.parallel = function (tasks, callback) {
        _parallel(async.eachOf, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel(_eachOfLimit(limit), tasks, callback);
    };

    async.series = function(tasks, callback) {
        _parallel(async.eachOfSeries, tasks, callback);
    };

    async.iterator = function (tasks) {
        function makeCallback(index) {
            function fn() {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            }
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        }
        return makeCallback(0);
    };

    async.apply = _restParam(function (fn, args) {
        return _restParam(function (callArgs) {
            return fn.apply(
                null, args.concat(callArgs)
            );
        });
    });

    function _concat(eachfn, arr, fn, callback) {
        var result = [];
        eachfn(arr, function (x, index, cb) {
            fn(x, function (err, y) {
                result = result.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, result);
        });
    }
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        callback = callback || noop;
        if (test()) {
            var next = _restParam(function(err, args) {
                if (err) {
                    callback(err);
                } else if (test.apply(this, args)) {
                    iterator(next);
                } else {
                    callback(null);
                }
            });
            iterator(next);
        } else {
            callback(null);
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        var calls = 0;
        return async.whilst(function() {
            return ++calls <= 1 || test.apply(this, arguments);
        }, iterator, callback);
    };

    async.until = function (test, iterator, callback) {
        return async.whilst(function() {
            return !test.apply(this, arguments);
        }, iterator, callback);
    };

    async.doUntil = function (iterator, test, callback) {
        return async.doWhilst(iterator, function() {
            return !test.apply(this, arguments);
        }, callback);
    };

    async.during = function (test, iterator, callback) {
        callback = callback || noop;

        var next = _restParam(function(err, args) {
            if (err) {
                callback(err);
            } else {
                args.push(check);
                test.apply(this, args);
            }
        });

        var check = function(err, truth) {
            if (err) {
                callback(err);
            } else if (truth) {
                iterator(next);
            } else {
                callback(null);
            }
        };

        test(check);
    };

    async.doDuring = function (iterator, test, callback) {
        var calls = 0;
        async.during(function(next) {
            if (calls++ < 1) {
                next(null, true);
            } else {
                test.apply(this, arguments);
            }
        }, iterator, callback);
    };

    function _queue(worker, concurrency, payload) {
        if (concurrency == null) {
            concurrency = 1;
        }
        else if(concurrency === 0) {
            throw new Error('Concurrency must not be zero');
        }
        function _insert(q, data, pos, callback) {
            if (callback != null && typeof callback !== "function") {
                throw new Error("task callback must be a function");
            }
            q.started = true;
            if (!_isArray(data)) {
                data = [data];
            }
            if(data.length === 0 && q.idle()) {
                // call drain immediately if there are no tasks
                return async.setImmediate(function() {
                    q.drain();
                });
            }
            _arrayEach(data, function(task) {
                var item = {
                    data: task,
                    callback: callback || noop
                };

                if (pos) {
                    q.tasks.unshift(item);
                } else {
                    q.tasks.push(item);
                }

                if (q.tasks.length === q.concurrency) {
                    q.saturated();
                }
            });
            async.setImmediate(q.process);
        }
        function _next(q, tasks) {
            return function(){
                workers -= 1;
                var args = arguments;
                _arrayEach(tasks, function (task) {
                    task.callback.apply(task, args);
                });
                if (q.tasks.length + workers === 0) {
                    q.drain();
                }
                q.process();
            };
        }

        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            payload: payload,
            saturated: noop,
            empty: noop,
            drain: noop,
            started: false,
            paused: false,
            push: function (data, callback) {
                _insert(q, data, false, callback);
            },
            kill: function () {
                q.drain = noop;
                q.tasks = [];
            },
            unshift: function (data, callback) {
                _insert(q, data, true, callback);
            },
            process: function () {
                if (!q.paused && workers < q.concurrency && q.tasks.length) {
                    while(workers < q.concurrency && q.tasks.length){
                        var tasks = q.payload ?
                            q.tasks.splice(0, q.payload) :
                            q.tasks.splice(0, q.tasks.length);

                        var data = _map(tasks, function (task) {
                            return task.data;
                        });

                        if (q.tasks.length === 0) {
                            q.empty();
                        }
                        workers += 1;
                        var cb = only_once(_next(q, tasks));
                        worker(data, cb);
                    }
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            },
            idle: function() {
                return q.tasks.length + workers === 0;
            },
            pause: function () {
                q.paused = true;
            },
            resume: function () {
                if (q.paused === false) { return; }
                q.paused = false;
                var resumeCount = Math.min(q.concurrency, q.tasks.length);
                // Need to call q.process once per concurrent
                // worker to preserve full concurrency after pause
                for (var w = 1; w <= resumeCount; w++) {
                    async.setImmediate(q.process);
                }
            }
        };
        return q;
    }

    async.queue = function (worker, concurrency) {
        var q = _queue(function (items, cb) {
            worker(items[0], cb);
        }, concurrency, 1);

        return q;
    };

    async.priorityQueue = function (worker, concurrency) {

        function _compareTasks(a, b){
            return a.priority - b.priority;
        }

        function _binarySearch(sequence, item, compare) {
            var beg = -1,
                end = sequence.length - 1;
            while (beg < end) {
                var mid = beg + ((end - beg + 1) >>> 1);
                if (compare(item, sequence[mid]) >= 0) {
                    beg = mid;
                } else {
                    end = mid - 1;
                }
            }
            return beg;
        }

        function _insert(q, data, priority, callback) {
            if (callback != null && typeof callback !== "function") {
                throw new Error("task callback must be a function");
            }
            q.started = true;
            if (!_isArray(data)) {
                data = [data];
            }
            if(data.length === 0) {
                // call drain immediately if there are no tasks
                return async.setImmediate(function() {
                    q.drain();
                });
            }
            _arrayEach(data, function(task) {
                var item = {
                    data: task,
                    priority: priority,
                    callback: typeof callback === 'function' ? callback : noop
                };

                q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);

                if (q.tasks.length === q.concurrency) {
                    q.saturated();
                }
                async.setImmediate(q.process);
            });
        }

        // Start with a normal queue
        var q = async.queue(worker, concurrency);

        // Override push to accept second parameter representing priority
        q.push = function (data, priority, callback) {
            _insert(q, data, priority, callback);
        };

        // Remove unshift function
        delete q.unshift;

        return q;
    };

    async.cargo = function (worker, payload) {
        return _queue(worker, 1, payload);
    };

    function _console_fn(name) {
        return _restParam(function (fn, args) {
            fn.apply(null, args.concat([_restParam(function (err, args) {
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _arrayEach(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            })]));
        });
    }
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || identity;
        var memoized = _restParam(function memoized(args) {
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                async.nextTick(function () {
                    callback.apply(null, memo[key]);
                });
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([_restParam(function (args) {
                    memo[key] = args;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                        q[i].apply(null, args);
                    }
                })]));
            }
        });
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
        return function () {
            return (fn.unmemoized || fn).apply(null, arguments);
        };
    };

    function _times(mapper) {
        return function (count, iterator, callback) {
            mapper(_range(count), iterator, callback);
        };
    }

    async.times = _times(async.map);
    async.timesSeries = _times(async.mapSeries);
    async.timesLimit = function (count, limit, iterator, callback) {
        return async.mapLimit(_range(count), limit, iterator, callback);
    };

    async.seq = function (/* functions... */) {
        var fns = arguments;
        return _restParam(function (args) {
            var that = this;

            var callback = args[args.length - 1];
            if (typeof callback == 'function') {
                args.pop();
            } else {
                callback = noop;
            }

            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([_restParam(function (err, nextargs) {
                    cb(err, nextargs);
                })]));
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        });
    };

    async.compose = function (/* functions... */) {
        return async.seq.apply(null, Array.prototype.reverse.call(arguments));
    };


    function _applyEach(eachfn) {
        return _restParam(function(fns, args) {
            var go = _restParam(function(args) {
                var that = this;
                var callback = args.pop();
                return eachfn(fns, function (fn, _, cb) {
                    fn.apply(that, args.concat([cb]));
                },
                callback);
            });
            if (args.length) {
                return go.apply(this, args);
            }
            else {
                return go;
            }
        });
    }

    async.applyEach = _applyEach(async.eachOf);
    async.applyEachSeries = _applyEach(async.eachOfSeries);


    async.forever = function (fn, callback) {
        var done = only_once(callback || noop);
        var task = ensureAsync(fn);
        function next(err) {
            if (err) {
                return done(err);
            }
            task(next);
        }
        next();
    };

    function ensureAsync(fn) {
        return _restParam(function (args) {
            var callback = args.pop();
            args.push(function () {
                var innerArgs = arguments;
                if (sync) {
                    async.setImmediate(function () {
                        callback.apply(null, innerArgs);
                    });
                } else {
                    callback.apply(null, innerArgs);
                }
            });
            var sync = true;
            fn.apply(this, args);
            sync = false;
        });
    }

    async.ensureAsync = ensureAsync;

    async.constant = _restParam(function(values) {
        var args = [null].concat(values);
        return function (callback) {
            return callback.apply(this, args);
        };
    });

    async.wrapSync =
    async.asyncify = function asyncify(func) {
        return _restParam(function (args) {
            var callback = args.pop();
            var result;
            try {
                result = func.apply(this, args);
            } catch (e) {
                return callback(e);
            }
            // if result is Promise object
            if (typeof result !== 'undefined' && typeof result.then === "function") {
                result.then(function(value) {
                    callback(null, value);
                }).catch(function(err) {
                    callback(err.message ? err : new Error(err));
                });
            } else {
                callback(null, result);
            }
        });
    };

    // Node.js
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    // AMD / RequireJS
    else if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":2}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            currentQueue[queueIndex].run();
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
/*!
 * @name JavaScript/NodeJS Merge v1.2.0
 * @author yeikos
 * @repository https://github.com/yeikos/js.merge

 * Copyright 2014 yeikos - MIT license
 * https://raw.github.com/yeikos/js.merge/master/LICENSE
 */

;(function(isNode) {

	/**
	 * Merge one or more objects 
	 * @param bool? clone
	 * @param mixed,... arguments
	 * @return object
	 */

	var Public = function(clone) {

		return merge(clone === true, false, arguments);

	}, publicName = 'merge';

	/**
	 * Merge two or more objects recursively 
	 * @param bool? clone
	 * @param mixed,... arguments
	 * @return object
	 */

	Public.recursive = function(clone) {

		return merge(clone === true, true, arguments);

	};

	/**
	 * Clone the input removing any reference
	 * @param mixed input
	 * @return mixed
	 */

	Public.clone = function(input) {

		var output = input,
			type = typeOf(input),
			index, size;

		if (type === 'array') {

			output = [];
			size = input.length;

			for (index=0;index<size;++index)

				output[index] = Public.clone(input[index]);

		} else if (type === 'object') {

			output = {};

			for (index in input)

				output[index] = Public.clone(input[index]);

		}

		return output;

	};

	/**
	 * Merge two objects recursively
	 * @param mixed input
	 * @param mixed extend
	 * @return mixed
	 */

	function merge_recursive(base, extend) {

		if (typeOf(base) !== 'object')

			return extend;

		for (var key in extend) {

			if (typeOf(base[key]) === 'object' && typeOf(extend[key]) === 'object') {

				base[key] = merge_recursive(base[key], extend[key]);

			} else {

				base[key] = extend[key];

			}

		}

		return base;

	}

	/**
	 * Merge two or more objects
	 * @param bool clone
	 * @param bool recursive
	 * @param array argv
	 * @return object
	 */

	function merge(clone, recursive, argv) {

		var result = argv[0],
			size = argv.length;

		if (clone || typeOf(result) !== 'object')

			result = {};

		for (var index=0;index<size;++index) {

			var item = argv[index],

				type = typeOf(item);

			if (type !== 'object') continue;

			for (var key in item) {

				var sitem = clone ? Public.clone(item[key]) : item[key];

				if (recursive) {

					result[key] = merge_recursive(result[key], sitem);

				} else {

					result[key] = sitem;

				}

			}

		}

		return result;

	}

	/**
	 * Get type of variable
	 * @param mixed input
	 * @return string
	 *
	 * @see http://jsperf.com/typeofvar
	 */

	function typeOf(input) {

		return ({}).toString.call(input).slice(8, -1).toLowerCase();

	}

	if (isNode) {

		module.exports = Public;

	} else {

		window[publicName] = Public;

	}

})(typeof module === 'object' && module && typeof module.exports === 'object' && module.exports);
},{}],4:[function(require,module,exports){
// Generated by CoffeeScript 1.9.3
(function() {
  var AuthController,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  AuthController = (function() {
    function AuthController($scope, $http) {
      this.$scope = $scope;
      this.$http = $http;
      this._setToken = bind(this._setToken, this);
      this._init = bind(this._init, this);
      this.$scope.message = null;
      this.$scope.sandbox = {
        token: null,
        username: null
      };
      this.$scope.production = {
        token: null,
        username: null
      };
      this.$scope.setToken = this._setToken;
      this._init();
    }

    AuthController.prototype._init = function() {
      return this.$http.get('/auth/token').error((function(_this) {
        return function(data) {
          throw new Error(data);
        };
      })(this)).success((function(_this) {
        return function(data) {
          _this.$scope.production = data;
          return _this.$http.post('/auth/token', {
            sandbox: true
          }).error(function(data) {
            throw new Error(data);
          }).success(function(data) {
            return _this.$scope.sandbox = data;
          });
        };
      })(this));
    };

    AuthController.prototype._setToken = function(sandbox) {
      var token;
      token = prompt("Input developer token (" + (sandbox ? 'sandbox' : 'production') + ")");
      if (!token) {
        return;
      }
      return this.$http.post('/auth/token', {
        sandbox: sandbox,
        token: token
      }).success((function(_this) {
        return function(data) {
          if (sandbox) {
            _this.$scope.sandbox = data;
          } else {
            _this.$scope.production = data;
          }
          if (!data) {
            return alert('Token is invalid.');
          }
        };
      })(this)).error((function(_this) {
        return function(data) {
          return callback('Set token failed.');
        };
      })(this));
    };

    return AuthController;

  })();

  app.controller('AuthController', ['$scope', '$http', AuthController]);

  module.exports = AuthController;

}).call(this);



},{}],5:[function(require,module,exports){
// Generated by CoffeeScript 1.9.3
(function() {
  var Controller, async,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  async = require('async');

  Controller = (function() {
    function Controller($scope, $rootScope, $http, progress, noteFilter) {
      this.$scope = $scope;
      this.$rootScope = $rootScope;
      this.$http = $http;
      this.progress = progress;
      this.noteFilter = noteFilter;
      this.reload = bind(this.reload, this);
      this.$rootScope.user = null;
      this.$rootScope.persons = {};
      this.$rootScope.notebooks = {};
      this.$rootScope.stacks = [];
      this.$rootScope.notes = {};
      this.$rootScope.timeLogs = {};
      this.$rootScope.profitLogs = {};
      this.$scope.reload = this.reload;
      this.reload((function(_this) {
        return function() {};
      })(this));
    }

    Controller.prototype.reload = function(callback) {
      var noteCount, query;
      if (!callback) {
        callback = (function(_this) {
          return function() {};
        })(this);
      }
      query = this.noteFilter.query();
      noteCount = 0;
      this.progress.open();
      return async.series([
        (function(_this) {
          return function(callback) {
            if (_this.$rootScope.user) {
              return callback();
            }
            _this.progress.set('Getting user data.', 0);
            return _this.$http.get('/user').success(function(data) {
              _this.$rootScope.user = data;
              return callback();
            }).error(function() {
              return callback('Error $http request');
            });
          };
        })(this), (function(_this) {
          return function(callback) {
            _this.progress.set('Syncing remote server.', 0);
            return _this.$http.get('/sync').success(function() {
              return callback();
            }).error(function() {
              return callback('Error $http request');
            });
          };
        })(this), (function(_this) {
          return function(callback) {
            _this.progress.set('Getting persons data.', 10);
            return _this.$http.get('/persons').success(function(data) {
              var i, len, person;
              _this.$rootScope.persons = {};
              for (i = 0, len = data.length; i < len; i++) {
                person = data[i];
                _this.$rootScope.persons[person] = person;
              }
              return callback();
            }).error(function() {
              return callback('Error $http request');
            });
          };
        })(this), (function(_this) {
          return function(callback) {
            _this.progress.set('Getting notebooks data.', 20);
            return _this.$http.get('/notebooks').success(function(data) {
              var i, len, notebook, stackHash;
              _this.$rootScope.notebooks = {};
              stackHash = {};
              for (i = 0, len = data.length; i < len; i++) {
                notebook = data[i];
                _this.$rootScope.notebooks[notebook.guid] = notebook;
                if (notebook.stack) {
                  stackHash[notebook.stack] = true;
                }
              }
              _this.$rootScope.stacks = Object.keys(stackHash);
              return callback();
            }).error(function() {
              return callback('Error $http request');
            });
          };
        })(this), (function(_this) {
          return function(callback) {
            _this.progress.set('Getting notes count.', 30);
            return _this.$http.get('/notes/count', {
              params: {
                query: query
              }
            }).success(function(data) {
              noteCount = data;
              if (noteCount > 100) {
                if (window.confirm("Current query find " + noteCount + " notes. It is too many. Continue anyway?")) {
                  return callback();
                } else {
                  return callback('User Canceled');
                }
              } else {
                return callback();
              }
            }).error(function() {
              return callback('Error $http request');
            });
          };
        })(this), (function(_this) {
          return function(callback) {
            _this.progress.set('Request remote contents.', 40);
            return _this.$http.get('/notes/get-content', {
              params: {
                query: query
              }
            }).success(function() {
              return callback();
            }).error(function() {
              return callback('Error $http request');
            });
          };
        })(this), (function(_this) {
          return function(callback) {
            _this.progress.set('Getting notes.', 60);
            return _this.$http.get('/notes', {
              params: {
                query: query,
                content: false
              }
            }).success(function(data) {
              var i, len, note;
              _this.$rootScope.notes = {};
              for (i = 0, len = data.length; i < len; i++) {
                note = data[i];
                _this.$rootScope.notes[note.guid] = note;
              }
              return callback();
            }).error(function() {
              return callback('Error $http request');
            });
          };
        })(this), (function(_this) {
          return function(callback) {
            var guids, note, noteGuid;
            _this.progress.set('Getting time logs.', 80);
            guids = (function() {
              var ref, results;
              ref = this.$rootScope.notes;
              results = [];
              for (noteGuid in ref) {
                note = ref[noteGuid];
                results.push(note.guid);
              }
              return results;
            }).call(_this);
            return _this.$http.post('/time-logs', {
              query: {
                noteGuid: {
                  $in: guids
                }
              }
            }).success(function(data) {
              var base, i, len, name, timeLog;
              _this.$rootScope.timeLogs = {};
              for (i = 0, len = data.length; i < len; i++) {
                timeLog = data[i];
                if ((base = _this.$rootScope.timeLogs)[name = timeLog.noteGuid] == null) {
                  base[name] = {};
                }
                _this.$rootScope.timeLogs[timeLog.noteGuid][timeLog._id] = timeLog;
              }
              return callback();
            }).error(function() {
              return callback('Error $http request');
            });
          };
        })(this), (function(_this) {
          return function(callback) {
            var guids, note, noteGuid;
            _this.progress.set('Getting profit logs.', 90);
            guids = (function() {
              var ref, results;
              ref = this.$rootScope.notes;
              results = [];
              for (noteGuid in ref) {
                note = ref[noteGuid];
                results.push(note.guid);
              }
              return results;
            }).call(_this);
            return _this.$http.post('/profit-logs', {
              query: {
                noteGuid: {
                  $in: guids
                }
              }
            }).success(function(data) {
              var base, i, len, name, profitLog;
              for (i = 0, len = data.length; i < len; i++) {
                profitLog = data[i];
                if ((base = _this.$rootScope.profitLogs)[name = profitLog.noteGuid] == null) {
                  base[name] = {};
                }
                _this.$rootScope.profitLogs[profitLog.noteGuid][profitLog._id] = profitLog;
              }
              return callback();
            }).error(function() {
              return callback('Error $http request');
            });
          };
        })(this)
      ], (function(_this) {
        return function(err) {
          _this.progress.set('Done.', 100);
          _this.progress.close();
          if (err) {
            throw new Error(err);
          }
          return callback(err);
        };
      })(this));
    };

    return Controller;

  })();

  app.controller('Controller', ['$scope', '$rootScope', '$http', 'progress', 'noteFilter', Controller]);

  module.exports = Controller;

}).call(this);



},{"async":1}],6:[function(require,module,exports){
// Generated by CoffeeScript 1.9.3
(function() {
  var MenuController,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  MenuController = (function() {
    function MenuController($scope, $http, noteFilter) {
      this.$scope = $scope;
      this.$http = $http;
      this.noteFilter = noteFilter;
      this._onWatchNoteFilter = bind(this._onWatchNoteFilter, this);
      this.$scope.noteFilter = this.noteFilter;
      this.$scope.$watchGroup(['noteFilter.updated', 'noteFilter.notebooks', 'noteFilter.stacks'], this._onWatchNoteFilter);
    }

    MenuController.prototype._onWatchNoteFilter = function() {
      var query, queryStr;
      query = this.noteFilter.query();
      queryStr = JSON.stringify(query);
      if (this.lastQueryStr === queryStr) {
        return;
      }
      this.lastQueryStr = queryStr;
      return this.$http.get('/notes/count', {
        params: {
          query: query
        }
      }).success((function(_this) {
        return function(data) {
          return _this.noteFilter.count = data;
        };
      })(this)).error((function(_this) {
        return function() {
          return _this.noteFilter.count = null;
        };
      })(this));
    };

    return MenuController;

  })();

  app.controller('MenuController', ['$scope', '$http', 'noteFilter', MenuController]);

  module.exports = MenuController;

}).call(this);



},{}],7:[function(require,module,exports){
// Generated by CoffeeScript 1.9.3
(function() {
  var ModalController;

  ModalController = (function() {
    function ModalController($scope) {
      this.$scope = $scope;
    }

    return ModalController;

  })();

  app.controller('ModalController', ['$scope', ModalController]);

  module.exports = ModalController;

}).call(this);



},{}],8:[function(require,module,exports){
// Generated by CoffeeScript 1.9.3
(function() {
  var NavigationController;

  NavigationController = (function() {
    function NavigationController($scope, $route) {
      this.$scope = $scope;
      this.$route = $route;
      this.$scope.navCollapse = true;
      this.$scope.$route = this.$route;
    }

    return NavigationController;

  })();

  app.controller('NavigationController', ['$scope', '$route', NavigationController]);

  module.exports = NavigationController;

}).call(this);



},{}],9:[function(require,module,exports){
// Generated by CoffeeScript 1.9.3
(function() {
  var NotesController,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  NotesController = (function() {
    function NotesController($scope) {
      this.$scope = $scope;
      this._onWatchProfitLogs = bind(this._onWatchProfitLogs, this);
      this._onWatchTimeLogs = bind(this._onWatchTimeLogs, this);
      this.$scope.notesSpentTimes = {};
      this.$scope.notesProfits = {};
      this.$scope.existPersons = [];
      this.$scope.$watchCollection('timeLogs', this._onWatchTimeLogs);
      this.$scope.$watchCollection('profitLogs', this._onWatchProfitLogs);
    }

    NotesController.prototype._onWatchTimeLogs = function(timeLogs) {
      var base, base1, base2, base3, base4, base5, name, name1, name2, noteGuid, noteTimeLog, persons, timeLog, timeLog_id;
      this.$scope.notesSpentTimes = {};
      persons = {};
      for (noteGuid in timeLogs) {
        noteTimeLog = timeLogs[noteGuid];
        for (timeLog_id in noteTimeLog) {
          timeLog = noteTimeLog[timeLog_id];
          if ((base = this.$scope.notesSpentTimes)[name = timeLog.noteGuid] == null) {
            base[name] = {};
          }
          if ((base1 = this.$scope.notesSpentTimes[timeLog.noteGuid])['$total'] == null) {
            base1['$total'] = 0;
          }
          this.$scope.notesSpentTimes[timeLog.noteGuid]['$total'] += timeLog.spentTime;
          if ((base2 = this.$scope.notesSpentTimes[timeLog.noteGuid])[name1 = timeLog.person] == null) {
            base2[name1] = 0;
          }
          this.$scope.notesSpentTimes[timeLog.noteGuid][timeLog.person] += timeLog.spentTime;
          if ((base3 = this.$scope.notesSpentTimes)['$total'] == null) {
            base3['$total'] = {};
          }
          if ((base4 = this.$scope.notesSpentTimes['$total'])['$total'] == null) {
            base4['$total'] = 0;
          }
          this.$scope.notesSpentTimes['$total']['$total'] += timeLog.spentTime;
          if ((base5 = this.$scope.notesSpentTimes['$total'])[name2 = timeLog.person] == null) {
            base5[name2] = 0;
          }
          this.$scope.notesSpentTimes['$total'][timeLog.person] += timeLog.spentTime;
          if (timeLog.spentTime > 0) {
            persons[timeLog.person] = true;
          }
        }
      }
      return this.$scope.existPersons = Object.keys(persons);
    };

    NotesController.prototype._onWatchProfitLogs = function(profitLogs) {
      var base, base1, base2, base3, calc, name, noteGuid, noteProfitLog, person, profitLog, profitLog_id, results;
      calc = (function(_this) {
        return function(noteGuid, person) {
          var ref, ref1;
          if (!((ref = _this.$scope.notesSpentTimes[noteGuid]) != null ? ref[person] : void 0)) {
            return null;
          }
          if (!((ref1 = _this.$scope.notesSpentTimes[noteGuid]) != null ? ref1['$total'] : void 0)) {
            return null;
          }
          return Math.round(_this.$scope.notesProfits[noteGuid]['$total'] * _this.$scope.notesSpentTimes[noteGuid][person] / _this.$scope.notesSpentTimes[noteGuid]['$total']);
        };
      })(this);
      this.$scope.notesProfits = {};
      results = [];
      for (noteGuid in profitLogs) {
        noteProfitLog = profitLogs[noteGuid];
        for (profitLog_id in noteProfitLog) {
          profitLog = noteProfitLog[profitLog_id];
          if ((base = this.$scope.notesProfits)[name = profitLog.noteGuid] == null) {
            base[name] = {};
          }
          if ((base1 = this.$scope.notesProfits[profitLog.noteGuid])['$total'] == null) {
            base1['$total'] = 0;
          }
          this.$scope.notesProfits[profitLog.noteGuid]['$total'] += profitLog.profit;
          if ((base2 = this.$scope.notesProfits)['$total'] == null) {
            base2['$total'] = {};
          }
          if ((base3 = this.$scope.notesProfits['$total'])['$total'] == null) {
            base3['$total'] = 0;
          }
          this.$scope.notesProfits['$total']['$total'] += profitLog.profit;
        }
        results.push((function() {
          var i, len, ref, results1;
          ref = this.$scope.existPersons;
          results1 = [];
          for (i = 0, len = ref.length; i < len; i++) {
            person = ref[i];
            results1.push(this.$scope.notesProfits[noteGuid][person] = calc(noteGuid, person));
          }
          return results1;
        }).call(this));
      }
      return results;
    };

    return NotesController;

  })();

  app.controller('NotesController', ['$scope', NotesController]);

  module.exports = NotesController;

}).call(this);



},{}],10:[function(require,module,exports){
// Generated by CoffeeScript 1.9.3
(function() {
  var ModalController, ProgressModalController,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ModalController = require('./modal-controller');

  ProgressModalController = (function(superClass) {
    extend(ProgressModalController, superClass);

    function ProgressModalController($scope, progress) {
      this.$scope = $scope;
      this.progress = progress;
      this.$scope.progress = this.progress;
    }

    return ProgressModalController;

  })(ModalController);

  app.controller('ProgressModalController', ['$scope', 'progress', ProgressModalController]);

  module.exports = ProgressModalController;

}).call(this);



},{"./modal-controller":7}],11:[function(require,module,exports){
// Generated by CoffeeScript 1.9.3
(function() {
  var SettingsController,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  SettingsController = (function() {
    SettingsController.prototype.lastQueryStr = null;

    function SettingsController($scope) {
      this.$scope = $scope;
      this._onWatchPersons = bind(this._onWatchPersons, this);
      this._add = bind(this._add, this);
      this._remove = bind(this._remove, this);
      this._down = bind(this._down, this);
      this._up = bind(this._up, this);
      this.$scope.up = this._up;
      this.$scope.down = this._down;
      this.$scope.remove = this._remove;
      this.$scope.add = this._add;
      this.$scope.submit = this._submit;
      this.$scope.$watchCollection('persons', this._onWatchPersons);
    }

    SettingsController.prototype._up = function(index) {
      if (index === 0) {
        return;
      }
      return this.$scope.editPersons.splice(index - 1, 2, this.$scope.editPersons[index], this.$scope.editPersons[index - 1]);
    };

    SettingsController.prototype._down = function(index) {
      if (index >= this.$scope.editPersons.length - 1) {
        return;
      }
      return this.$scope.editPersons.splice(index, 2, this.$scope.editPersons[index + 1], this.$scope.editPersons[index]);
    };

    SettingsController.prototype._remove = function(index) {
      return this.$scope.editPersons.splice(index, 1);
    };

    SettingsController.prototype._add = function() {
      return this.$scope.editPersons.push("Person " + (this.$scope.editPersons.length + 1));
    };

    SettingsController.prototype._onWatchPersons = function() {
      return this.$scope.editPersons = Object.keys(this.$scope.persons);
    };

    return SettingsController;

  })();

  app.controller('SettingsController', ['$scope', SettingsController]);

  module.exports = SettingsController;

}).call(this);



},{}],12:[function(require,module,exports){
// Generated by CoffeeScript 1.9.3
(function() {
  var TimelineController,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  TimelineController = (function() {
    function TimelineController($scope, $filter) {
      var container, options;
      this.$scope = $scope;
      this.$filter = $filter;
      this._onResize = bind(this._onResize, this);
      this._onWatchProfitLogs = bind(this._onWatchProfitLogs, this);
      this._onWatchNotes = bind(this._onWatchNotes, this);
      this._onWatchPersons = bind(this._onWatchPersons, this);
      this.$scope.timelineItems = new vis.DataSet();
      this.$scope.timelineGroups = new vis.DataSet();
      container = document.getElementById('timeline');
      options = {
        margin: {
          item: 5
        },
        height: window.innerHeight - 80,
        orientation: {
          axis: 'both',
          item: 'top'
        },
        start: moment().startOf('day'),
        end: moment().endOf('day'),
        hiddenDates: [
          {
            start: moment().subtract(1, 'days').startOf('day').hour(20),
            end: moment().startOf('day').hour(8),
            repeat: 'daily'
          }
        ],
        order: function(a, b) {
          return a.start - b.start;
        }
      };
      this.$scope.timeline = new vis.Timeline(container, this.$scope.timelineItems, this.$scope.timelineGroups, options);
      this.$scope.$watchCollection('persons', this._onWatchPersons);
      this.$scope.$watchCollection('notes', this._onWatchNotes);
      this.$scope.$watchCollection('timeLogs', this._onWatchNotes);
      this.$scope.$watchCollection('profitLogs', this._onWatchProfitLogs);
      this.$scope.$on('resize::resize', this._onResize);
    }

    TimelineController.prototype._onWatchPersons = function() {
      var key, person, ref;
      this.$scope.timelineGroups.clear();
      ref = this.$scope.persons;
      for (key in ref) {
        person = ref[key];
        this.$scope.timelineGroups.add({
          id: key,
          content: person
        });
      }
      return this.$scope.timelineGroups.add({
        id: 'updated',
        content: 'Update'
      });
    };

    TimelineController.prototype._onWatchNotes = function() {
      var note, noteGuid, noteTimeLog, ref, ref1, results, timeLog, timeLogs_id;
      this.$scope.timelineItems.clear();
      ref = this.$scope.notes;
      for (noteGuid in ref) {
        note = ref[noteGuid];
        this.$scope.timelineItems.add({
          id: note.guid,
          group: 'updated',
          content: "<a href=\"evernote:///view/" + this.$scope.user.id + "/" + this.$scope.user.shardId + "/" + note.guid + "/" + note.guid + "/\" title=\"" + note.title + "\">" + (this.$filter('abbreviate')(note.title, 40)) + "</a>",
          start: new Date(note.updated),
          type: 'point'
        });
      }
      ref1 = this.$scope.timeLogs;
      results = [];
      for (noteGuid in ref1) {
        noteTimeLog = ref1[noteGuid];
        results.push((function() {
          var results1;
          results1 = [];
          for (timeLogs_id in noteTimeLog) {
            timeLog = noteTimeLog[timeLogs_id];
            results1.push(this.$scope.timelineItems.add({
              id: timeLog._id,
              group: timeLog.person,
              content: "<a href=\"evernote:///view/" + this.$scope.user.id + "/" + this.$scope.user.shardId + "/" + timeLog.noteGuid + "/" + timeLog.noteGuid + "/\" title=\"" + this.$scope.notes[timeLog.noteGuid].title + " " + timeLog.comment + "\">" + (this.$filter('abbreviate')(this.$scope.notes[timeLog.noteGuid].title, 20)) + " " + (this.$filter('abbreviate')(timeLog.comment, 20)) + "</a>",
              start: moment(timeLog.date),
              end: timeLog.spentTime ? moment(timeLog.date).add(timeLog.spentTime, 'minutes') : null,
              type: timeLog.spentTime ? 'range' : 'point'
            }));
          }
          return results1;
        }).call(this));
      }
      return results;
    };

    TimelineController.prototype._onWatchProfitLogs = function() {};

    TimelineController.prototype._onResize = function(event) {
      return this.$scope.timeline.setOptions({
        height: window.innerHeight - 90
      });
    };

    return TimelineController;

  })();

  app.controller('TimelineController', ['$scope', '$filter', TimelineController]);

  module.exports = TimelineController;

}).call(this);



},{}],13:[function(require,module,exports){
// Generated by CoffeeScript 1.9.3
(function() {
  app.directive('resize', function($timeout, $rootScope, $window) {
    return {
      link: function() {
        var timer;
        timer = false;
        return angular.element($window).on('load resize', function(event) {
          if (timer) {
            $timeout.cancel(timer);
          }
          return timer = $timeout(function() {
            return $rootScope.$broadcast('resize::resize');
          }, 200);
        });
      }
    };
  });

}).call(this);



},{}],14:[function(require,module,exports){
// Generated by CoffeeScript 1.9.3
(function() {
  var abbreviate;

  abbreviate = function() {
    return function(text, len, truncation) {
      var count, i, j, n, ref, str;
      if (len == null) {
        len = 10;
      }
      if (truncation == null) {
        truncation = '...';
      }
      count = 0;
      str = '';
      for (i = j = 0, ref = text.length - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
        n = escape(text.charAt(i));
        if (n.length < 4) {
          count++;
        } else {
          count += 2;
        }
        if (count > len) {
          return str + truncation;
        }
        str += text.charAt(i);
      }
      return text;
    };
  };

  app.filter('abbreviate', abbreviate);

  module.exports = abbreviate;

}).call(this);



},{}],15:[function(require,module,exports){
// Generated by CoffeeScript 1.9.3
(function() {
  var checkItemMatches, filterByProperty;

  checkItemMatches = (function(_this) {
    return function(item, props) {
      var itemMatches, prop, text;
      itemMatches = false;
      for (prop in props) {
        text = props[prop];
        text = text.toLowerCase();
        if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
          itemMatches = true;
          break;
        }
      }
      return itemMatches;
    };
  })(this);

  filterByProperty = function() {
    return function(items, props) {
      var i, item, itemMatches, key, len, out;
      out = [];
      if (angular.isArray(items)) {
        for (i = 0, len = items.length; i < len; i++) {
          item = items[i];
          itemMatches = checkItemMatches(item, props);
          if (itemMatches) {
            out.push(item);
          }
        }
      } else if (angular.isObject(items)) {
        for (key in items) {
          item = items[key];
          itemMatches = checkItemMatches(item, props);
          if (itemMatches) {
            out.push(item);
          }
        }
      } else {
        out = items;
      }
      return out;
    };
  };

  app.filter('filterByProperty', filterByProperty);

  module.exports = filterByProperty;

}).call(this);



},{}],16:[function(require,module,exports){
// Generated by CoffeeScript 1.9.3
(function() {
  var objectLength;

  objectLength = function() {
    var _objectLength;
    _objectLength = function(input, depth) {
      var key, result, value;
      if (depth == null) {
        depth = 0;
      }
      if (!angular.isObject(input)) {
        throw Error("Usage of non-objects with objectLength filter.");
      }
      if (depth === 0) {
        return Object.keys(input).length;
      } else {
        result = 0;
        for (key in input) {
          value = input[key];
          result += _objectLength(value, depth - 1);
        }
        return result;
      }
    };
    return _objectLength;
  };

  app.filter('objectLength', objectLength);

  module.exports = objectLength;

}).call(this);



},{}],17:[function(require,module,exports){
// Generated by CoffeeScript 1.9.3
(function() {
  var orderObjectBy;

  orderObjectBy = function() {
    return function(items, field, reverse) {
      var filtered, results;
      if (field == null) {
        field = '$value';
      }
      if (reverse == null) {
        reverse = true;
      }
      filtered = [];
      angular.forEach(items, function(item, key) {
        return filtered.push({
          key: key,
          item: item
        });
      });
      filtered.sort(function(a, b) {
        if (field === '$key') {
          if (a.key > b.key) {
            return -1;
          } else {
            return 1;
          }
        }
        if (field === '$value') {
          if (a.item > b.item) {
            return -1;
          } else {
            return 1;
          }
        }
        if (typeof field === 'string') {
          if (a[field] > b[field]) {
            return -1;
          } else {
            return 1;
          }
        }
        if (typeof field === 'function') {
          if (field(a.item, a.key) > field(b.item, b.key)) {
            return -1;
          } else {
            return 1;
          }
        }
      });
      if (reverse) {
        filtered.reverse();
      }
      results = [];
      angular.forEach(filtered, function(item) {
        var result;
        result = item.item;
        result['$key'] = item.key;
        return results.push(result);
      });
      return results;
    };
  };

  app.filter('orderObjectBy', orderObjectBy);

  module.exports = orderObjectBy;

}).call(this);



},{}],18:[function(require,module,exports){
// Generated by CoffeeScript 1.9.3
(function() {
  var spentTime;

  spentTime = function() {
    return function(input) {
      var hour, minute;
      if (input === void 0) {
        return '';
      }
      if (!input) {
        return '0m';
      }
      hour = Math.floor(input / 60);
      minute = input % 60;
      if (hour) {
        return hour + 'h' + minute + 'm';
      }
      return minute + 'm';
    };
  };

  app.filter('spentTime', spentTime);

  module.exports = spentTime;

}).call(this);



},{}],19:[function(require,module,exports){
window.app = angular.module('App', ['ngRoute', 'ui.bootstrap', 'ngSanitize', 'ui.select']);

app.config([
  '$compileProvider', function($compileProvider) {
    return $compileProvider.aHrefSanitizationWhitelist(/^\s*(http|https|mailto|evernote):/);
  }
]);

require('./route');

require('./filters/abbreviate');

require('./filters/filter-by-property');

require('./filters/object-length');

require('./filters/order-object-by');

require('./filters/spent-time');

require('./services/note-filter');

require('./services/progress');

require('./directives/resize');

require('./controllers/controller');

require('./controllers/auth-controller');

require('./controllers/navigation-controller');

require('./controllers/menu-controller');

require('./controllers/timeline-controller');

require('./controllers/notes-controller');

require('./controllers/settings-controller');

require('./controllers/progress-modal-controller');


},{"./controllers/auth-controller":4,"./controllers/controller":5,"./controllers/menu-controller":6,"./controllers/navigation-controller":8,"./controllers/notes-controller":9,"./controllers/progress-modal-controller":10,"./controllers/settings-controller":11,"./controllers/timeline-controller":12,"./directives/resize":13,"./filters/abbreviate":14,"./filters/filter-by-property":15,"./filters/object-length":16,"./filters/order-object-by":17,"./filters/spent-time":18,"./route":20,"./services/note-filter":21,"./services/progress":22}],20:[function(require,module,exports){
// Generated by CoffeeScript 1.9.3
(function() {
  app.config([
    '$routeProvider', function($routeProvider) {
      return $routeProvider.when('/', {
        templateUrl: 'menu'
      }).when('/timeline', {
        templateUrl: 'timeline'
      }).when('/notes', {
        templateUrl: 'notes'
      }).when('/settings', {
        templateUrl: 'settings'
      }).otherwise({
        redirectTo: '/'
      });
    }
  ]);

}).call(this);



},{}],21:[function(require,module,exports){
// Generated by CoffeeScript 1.9.3
(function() {
  var NoteFilterService, merge,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  merge = require('merge');

  NoteFilterService = (function() {
    NoteFilterService.prototype.updated = 3;

    NoteFilterService.prototype.notebooks = null;

    NoteFilterService.prototype.stacks = null;

    NoteFilterService.prototype.count = null;

    function NoteFilterService($rootScope) {
      this.$rootScope = $rootScope;
      this.query = bind(this.query, this);
    }

    NoteFilterService.prototype.query = function() {
      var i, j, len, len1, notebook, notebookGuid, notebooksArray, notebooksHash, ref, ref1, ref2, result, stack;
      result = {};
      if (this.updated) {
        merge(result, {
          updated: {
            $gte: parseInt(moment().startOf('day').subtract(this.updated, 'days').format('x'))
          }
        });
      }
      notebooksHash = {};
      if (this.notebooks && this.notebooks.length > 0) {
        ref = this.notebooks;
        for (i = 0, len = ref.length; i < len; i++) {
          notebookGuid = ref[i];
          notebooksHash[notebookGuid] = true;
        }
      }
      if (this.stacks && this.stacks.length > 0) {
        ref1 = this.stacks;
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          stack = ref1[j];
          ref2 = this.$rootScope.notebooks;
          for (notebookGuid in ref2) {
            notebook = ref2[notebookGuid];
            if (stack === notebook.stack) {
              notebooksHash[notebook.guid] = true;
            }
          }
        }
      }
      notebooksArray = Object.keys(notebooksHash);
      if (notebooksArray.length > 0) {
        merge(result, {
          notebookGuid: {
            $in: notebooksArray
          }
        });
      }
      return result;
    };

    return NoteFilterService;

  })();

  app.service('noteFilter', ['$rootScope', NoteFilterService]);

  module.exports = NoteFilterService;

}).call(this);



},{"merge":3}],22:[function(require,module,exports){
// Generated by CoffeeScript 1.9.3
(function() {
  var ProgressService,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  ProgressService = (function() {
    ProgressService.prototype.modalInstance = null;

    ProgressService.prototype.value = 0;

    ProgressService.prototype.message = '';

    function ProgressService($modal) {
      this.$modal = $modal;
      this.set = bind(this.set, this);
      this.close = bind(this.close, this);
      this.open = bind(this.open, this);
    }

    ProgressService.prototype.open = function() {
      this.message = 'processing...';
      this.value = 0;
      return this.modalInstance = this.$modal.open({
        templateUrl: 'progress-modal',
        controller: 'ProgressModalController',
        backdrop: 'static',
        keyboard: false,
        size: 'sm',
        animation: false
      });
    };

    ProgressService.prototype.close = function() {
      return this.modalInstance.close();
    };

    ProgressService.prototype.set = function(message, value) {
      if (value == null) {
        value = null;
      }
      this.message = message;
      if (value !== null) {
        return this.value = value;
      }
    };

    return ProgressService;

  })();

  app.service('progress', ['$modal', ProgressService]);

  module.exports = ProgressService;

}).call(this);



},{}]},{},[19])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvYXN5bmMvbGliL2FzeW5jLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9tZXJnZS9tZXJnZS5qcyIsInNyYy9jb250cm9sbGVycy9hdXRoLWNvbnRyb2xsZXIuanMiLCJzcmMvY29udHJvbGxlcnMvY29udHJvbGxlci5qcyIsInNyYy9jb250cm9sbGVycy9tZW51LWNvbnRyb2xsZXIuanMiLCJzcmMvY29udHJvbGxlcnMvbW9kYWwtY29udHJvbGxlci5qcyIsInNyYy9jb250cm9sbGVycy9uYXZpZ2F0aW9uLWNvbnRyb2xsZXIuanMiLCJzcmMvY29udHJvbGxlcnMvbm90ZXMtY29udHJvbGxlci5qcyIsInNyYy9jb250cm9sbGVycy9wcm9ncmVzcy1tb2RhbC1jb250cm9sbGVyLmpzIiwic3JjL2NvbnRyb2xsZXJzL3NldHRpbmdzLWNvbnRyb2xsZXIuanMiLCJzcmMvY29udHJvbGxlcnMvdGltZWxpbmUtY29udHJvbGxlci5qcyIsInNyYy9kaXJlY3RpdmVzL3Jlc2l6ZS5qcyIsInNyYy9maWx0ZXJzL2FiYnJldmlhdGUuanMiLCJzcmMvZmlsdGVycy9maWx0ZXItYnktcHJvcGVydHkuanMiLCJzcmMvZmlsdGVycy9vYmplY3QtbGVuZ3RoLmpzIiwic3JjL2ZpbHRlcnMvb3JkZXItb2JqZWN0LWJ5LmpzIiwic3JjL2ZpbHRlcnMvc3BlbnQtdGltZS5qcyIsIkM6XFxVc2Vyc1xcaGlnYXNoaW5ha2F0c3VcXERvY3VtZW50c1xcd29ya3NwYWNlXFxldmVybm90ZS10YXNrbG9nXFxwdWJsaWNcXGphdmFzY3JpcHRzXFxzcmNcXGluZGV4LmNvZmZlZSIsInNyYy9yb3V0ZS5qcyIsInNyYy9zZXJ2aWNlcy9ub3RlLWZpbHRlci5qcyIsInNyYy9zZXJ2aWNlcy9wcm9ncmVzcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDaHNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBLE1BQU0sQ0FBQyxHQUFQLEdBQWEsT0FBTyxDQUFDLE1BQVIsQ0FBZSxLQUFmLEVBQXNCLENBQUMsU0FBRCxFQUFZLGNBQVosRUFBNEIsWUFBNUIsRUFBMEMsV0FBMUMsQ0FBdEI7O0FBRWIsR0FBRyxDQUFDLE1BQUosQ0FBVztFQUFDLGtCQUFELEVBQXFCLFNBQUMsZ0JBQUQ7V0FDOUIsZ0JBQWdCLENBQUMsMEJBQWpCLENBQTRDLG1DQUE1QztFQUQ4QixDQUFyQjtDQUFYOztBQUtBLE9BQUEsQ0FBUSxTQUFSOztBQUdBLE9BQUEsQ0FBUSxzQkFBUjs7QUFDQSxPQUFBLENBQVEsOEJBQVI7O0FBQ0EsT0FBQSxDQUFRLHlCQUFSOztBQUNBLE9BQUEsQ0FBUSwyQkFBUjs7QUFDQSxPQUFBLENBQVEsc0JBQVI7O0FBR0EsT0FBQSxDQUFRLHdCQUFSOztBQUNBLE9BQUEsQ0FBUSxxQkFBUjs7QUFHQSxPQUFBLENBQVEscUJBQVI7O0FBR0EsT0FBQSxDQUFRLDBCQUFSOztBQUNBLE9BQUEsQ0FBUSwrQkFBUjs7QUFDQSxPQUFBLENBQVEscUNBQVI7O0FBQ0EsT0FBQSxDQUFRLCtCQUFSOztBQUNBLE9BQUEsQ0FBUSxtQ0FBUjs7QUFDQSxPQUFBLENBQVEsZ0NBQVI7O0FBQ0EsT0FBQSxDQUFRLG1DQUFSOztBQUNBLE9BQUEsQ0FBUSx5Q0FBUjs7OztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiFcbiAqIGFzeW5jXG4gKiBodHRwczovL2dpdGh1Yi5jb20vY2FvbGFuL2FzeW5jXG4gKlxuICogQ29weXJpZ2h0IDIwMTAtMjAxNCBDYW9sYW4gTWNNYWhvblxuICogUmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgYXN5bmMgPSB7fTtcbiAgICBmdW5jdGlvbiBub29wKCkge31cbiAgICBmdW5jdGlvbiBpZGVudGl0eSh2KSB7XG4gICAgICAgIHJldHVybiB2O1xuICAgIH1cbiAgICBmdW5jdGlvbiB0b0Jvb2wodikge1xuICAgICAgICByZXR1cm4gISF2O1xuICAgIH1cbiAgICBmdW5jdGlvbiBub3RJZCh2KSB7XG4gICAgICAgIHJldHVybiAhdjtcbiAgICB9XG5cbiAgICAvLyBnbG9iYWwgb24gdGhlIHNlcnZlciwgd2luZG93IGluIHRoZSBicm93c2VyXG4gICAgdmFyIHByZXZpb3VzX2FzeW5jO1xuXG4gICAgLy8gRXN0YWJsaXNoIHRoZSByb290IG9iamVjdCwgYHdpbmRvd2AgKGBzZWxmYCkgaW4gdGhlIGJyb3dzZXIsIGBnbG9iYWxgXG4gICAgLy8gb24gdGhlIHNlcnZlciwgb3IgYHRoaXNgIGluIHNvbWUgdmlydHVhbCBtYWNoaW5lcy4gV2UgdXNlIGBzZWxmYFxuICAgIC8vIGluc3RlYWQgb2YgYHdpbmRvd2AgZm9yIGBXZWJXb3JrZXJgIHN1cHBvcnQuXG4gICAgdmFyIHJvb3QgPSB0eXBlb2Ygc2VsZiA9PT0gJ29iamVjdCcgJiYgc2VsZi5zZWxmID09PSBzZWxmICYmIHNlbGYgfHxcbiAgICAgICAgICAgIHR5cGVvZiBnbG9iYWwgPT09ICdvYmplY3QnICYmIGdsb2JhbC5nbG9iYWwgPT09IGdsb2JhbCAmJiBnbG9iYWwgfHxcbiAgICAgICAgICAgIHRoaXM7XG5cbiAgICBpZiAocm9vdCAhPSBudWxsKSB7XG4gICAgICAgIHByZXZpb3VzX2FzeW5jID0gcm9vdC5hc3luYztcbiAgICB9XG5cbiAgICBhc3luYy5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByb290LmFzeW5jID0gcHJldmlvdXNfYXN5bmM7XG4gICAgICAgIHJldHVybiBhc3luYztcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gb25seV9vbmNlKGZuKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChmbiA9PT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKFwiQ2FsbGJhY2sgd2FzIGFscmVhZHkgY2FsbGVkLlwiKTtcbiAgICAgICAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICBmbiA9IG51bGw7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX29uY2UoZm4pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKGZuID09PSBudWxsKSByZXR1cm47XG4gICAgICAgICAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgZm4gPSBudWxsO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vLy8gY3Jvc3MtYnJvd3NlciBjb21wYXRpYmxpdHkgZnVuY3Rpb25zIC8vLy9cblxuICAgIHZhciBfdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4gICAgdmFyIF9pc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHJldHVybiBfdG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBBcnJheV0nO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBfaXNBcnJheUxpa2UoYXJyKSB7XG4gICAgICAgIHJldHVybiBfaXNBcnJheShhcnIpIHx8IChcbiAgICAgICAgICAgIC8vIGhhcyBhIHBvc2l0aXZlIGludGVnZXIgbGVuZ3RoIHByb3BlcnR5XG4gICAgICAgICAgICB0eXBlb2YgYXJyLmxlbmd0aCA9PT0gXCJudW1iZXJcIiAmJlxuICAgICAgICAgICAgYXJyLmxlbmd0aCA+PSAwICYmXG4gICAgICAgICAgICBhcnIubGVuZ3RoICUgMSA9PT0gMFxuICAgICAgICApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9lYWNoKGNvbGwsIGl0ZXJhdG9yKSB7XG4gICAgICAgIHJldHVybiBfaXNBcnJheUxpa2UoY29sbCkgP1xuICAgICAgICAgICAgX2FycmF5RWFjaChjb2xsLCBpdGVyYXRvcikgOlxuICAgICAgICAgICAgX2ZvckVhY2hPZihjb2xsLCBpdGVyYXRvcik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2FycmF5RWFjaChhcnIsIGl0ZXJhdG9yKSB7XG4gICAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgICAgbGVuZ3RoID0gYXJyLmxlbmd0aDtcblxuICAgICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgaXRlcmF0b3IoYXJyW2luZGV4XSwgaW5kZXgsIGFycik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfbWFwKGFyciwgaXRlcmF0b3IpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgICBsZW5ndGggPSBhcnIubGVuZ3RoLFxuICAgICAgICAgICAgcmVzdWx0ID0gQXJyYXkobGVuZ3RoKTtcblxuICAgICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgcmVzdWx0W2luZGV4XSA9IGl0ZXJhdG9yKGFycltpbmRleF0sIGluZGV4LCBhcnIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3JhbmdlKGNvdW50KSB7XG4gICAgICAgIHJldHVybiBfbWFwKEFycmF5KGNvdW50KSwgZnVuY3Rpb24gKHYsIGkpIHsgcmV0dXJuIGk7IH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9yZWR1Y2UoYXJyLCBpdGVyYXRvciwgbWVtbykge1xuICAgICAgICBfYXJyYXlFYWNoKGFyciwgZnVuY3Rpb24gKHgsIGksIGEpIHtcbiAgICAgICAgICAgIG1lbW8gPSBpdGVyYXRvcihtZW1vLCB4LCBpLCBhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBtZW1vO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9mb3JFYWNoT2Yob2JqZWN0LCBpdGVyYXRvcikge1xuICAgICAgICBfYXJyYXlFYWNoKF9rZXlzKG9iamVjdCksIGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKG9iamVjdFtrZXldLCBrZXkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfaW5kZXhPZihhcnIsIGl0ZW0pIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChhcnJbaV0gPT09IGl0ZW0pIHJldHVybiBpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG5cbiAgICB2YXIgX2tleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHZhciBrZXlzID0gW107XG4gICAgICAgIGZvciAodmFyIGsgaW4gb2JqKSB7XG4gICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGspKSB7XG4gICAgICAgICAgICAgICAga2V5cy5wdXNoKGspO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBrZXlzO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBfa2V5SXRlcmF0b3IoY29sbCkge1xuICAgICAgICB2YXIgaSA9IC0xO1xuICAgICAgICB2YXIgbGVuO1xuICAgICAgICB2YXIga2V5cztcbiAgICAgICAgaWYgKF9pc0FycmF5TGlrZShjb2xsKSkge1xuICAgICAgICAgICAgbGVuID0gY29sbC5sZW5ndGg7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dCgpIHtcbiAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGkgPCBsZW4gPyBpIDogbnVsbDtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBrZXlzID0gX2tleXMoY29sbCk7XG4gICAgICAgICAgICBsZW4gPSBrZXlzLmxlbmd0aDtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0KCkge1xuICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICByZXR1cm4gaSA8IGxlbiA/IGtleXNbaV0gOiBudWxsO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFNpbWlsYXIgdG8gRVM2J3MgcmVzdCBwYXJhbSAoaHR0cDovL2FyaXlhLm9maWxhYnMuY29tLzIwMTMvMDMvZXM2LWFuZC1yZXN0LXBhcmFtZXRlci5odG1sKVxuICAgIC8vIFRoaXMgYWNjdW11bGF0ZXMgdGhlIGFyZ3VtZW50cyBwYXNzZWQgaW50byBhbiBhcnJheSwgYWZ0ZXIgYSBnaXZlbiBpbmRleC5cbiAgICAvLyBGcm9tIHVuZGVyc2NvcmUuanMgKGh0dHBzOi8vZ2l0aHViLmNvbS9qYXNoa2VuYXMvdW5kZXJzY29yZS9wdWxsLzIxNDApLlxuICAgIGZ1bmN0aW9uIF9yZXN0UGFyYW0oZnVuYywgc3RhcnRJbmRleCkge1xuICAgICAgICBzdGFydEluZGV4ID0gc3RhcnRJbmRleCA9PSBudWxsID8gZnVuYy5sZW5ndGggLSAxIDogK3N0YXJ0SW5kZXg7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBsZW5ndGggPSBNYXRoLm1heChhcmd1bWVudHMubGVuZ3RoIC0gc3RhcnRJbmRleCwgMCk7XG4gICAgICAgICAgICB2YXIgcmVzdCA9IEFycmF5KGxlbmd0aCk7XG4gICAgICAgICAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICAgICAgcmVzdFtpbmRleF0gPSBhcmd1bWVudHNbaW5kZXggKyBzdGFydEluZGV4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN3aXRjaCAoc3RhcnRJbmRleCkge1xuICAgICAgICAgICAgICAgIGNhc2UgMDogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCByZXN0KTtcbiAgICAgICAgICAgICAgICBjYXNlIDE6IHJldHVybiBmdW5jLmNhbGwodGhpcywgYXJndW1lbnRzWzBdLCByZXN0KTtcbiAgICAgICAgICAgICAgICBjYXNlIDI6IHJldHVybiBmdW5jLmNhbGwodGhpcywgYXJndW1lbnRzWzBdLCBhcmd1bWVudHNbMV0sIHJlc3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gQ3VycmVudGx5IHVudXNlZCBidXQgaGFuZGxlIGNhc2VzIG91dHNpZGUgb2YgdGhlIHN3aXRjaCBzdGF0ZW1lbnQ6XG4gICAgICAgICAgICAvLyB2YXIgYXJncyA9IEFycmF5KHN0YXJ0SW5kZXggKyAxKTtcbiAgICAgICAgICAgIC8vIGZvciAoaW5kZXggPSAwOyBpbmRleCA8IHN0YXJ0SW5kZXg7IGluZGV4KyspIHtcbiAgICAgICAgICAgIC8vICAgICBhcmdzW2luZGV4XSA9IGFyZ3VtZW50c1tpbmRleF07XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAvLyBhcmdzW3N0YXJ0SW5kZXhdID0gcmVzdDtcbiAgICAgICAgICAgIC8vIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF93aXRob3V0SW5kZXgoaXRlcmF0b3IpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gaXRlcmF0b3IodmFsdWUsIGNhbGxiYWNrKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLy8vIGV4cG9ydGVkIGFzeW5jIG1vZHVsZSBmdW5jdGlvbnMgLy8vL1xuXG4gICAgLy8vLyBuZXh0VGljayBpbXBsZW1lbnRhdGlvbiB3aXRoIGJyb3dzZXItY29tcGF0aWJsZSBmYWxsYmFjayAvLy8vXG5cbiAgICAvLyBjYXB0dXJlIHRoZSBnbG9iYWwgcmVmZXJlbmNlIHRvIGd1YXJkIGFnYWluc3QgZmFrZVRpbWVyIG1vY2tzXG4gICAgdmFyIF9zZXRJbW1lZGlhdGUgPSB0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSAnZnVuY3Rpb24nICYmIHNldEltbWVkaWF0ZTtcblxuICAgIHZhciBfZGVsYXkgPSBfc2V0SW1tZWRpYXRlID8gZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgLy8gbm90IGEgZGlyZWN0IGFsaWFzIGZvciBJRTEwIGNvbXBhdGliaWxpdHlcbiAgICAgICAgX3NldEltbWVkaWF0ZShmbik7XG4gICAgfSA6IGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG5cbiAgICBpZiAodHlwZW9mIHByb2Nlc3MgPT09ICdvYmplY3QnICYmIHR5cGVvZiBwcm9jZXNzLm5leHRUaWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGFzeW5jLm5leHRUaWNrID0gcHJvY2Vzcy5uZXh0VGljaztcbiAgICB9IGVsc2Uge1xuICAgICAgICBhc3luYy5uZXh0VGljayA9IF9kZWxheTtcbiAgICB9XG4gICAgYXN5bmMuc2V0SW1tZWRpYXRlID0gX3NldEltbWVkaWF0ZSA/IF9kZWxheSA6IGFzeW5jLm5leHRUaWNrO1xuXG5cbiAgICBhc3luYy5mb3JFYWNoID1cbiAgICBhc3luYy5lYWNoID0gZnVuY3Rpb24gKGFyciwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiBhc3luYy5lYWNoT2YoYXJyLCBfd2l0aG91dEluZGV4KGl0ZXJhdG9yKSwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy5mb3JFYWNoU2VyaWVzID1cbiAgICBhc3luYy5lYWNoU2VyaWVzID0gZnVuY3Rpb24gKGFyciwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiBhc3luYy5lYWNoT2ZTZXJpZXMoYXJyLCBfd2l0aG91dEluZGV4KGl0ZXJhdG9yKSwgY2FsbGJhY2spO1xuICAgIH07XG5cblxuICAgIGFzeW5jLmZvckVhY2hMaW1pdCA9XG4gICAgYXN5bmMuZWFjaExpbWl0ID0gZnVuY3Rpb24gKGFyciwgbGltaXQsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gX2VhY2hPZkxpbWl0KGxpbWl0KShhcnIsIF93aXRob3V0SW5kZXgoaXRlcmF0b3IpLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLmZvckVhY2hPZiA9XG4gICAgYXN5bmMuZWFjaE9mID0gZnVuY3Rpb24gKG9iamVjdCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gX29uY2UoY2FsbGJhY2sgfHwgbm9vcCk7XG4gICAgICAgIG9iamVjdCA9IG9iamVjdCB8fCBbXTtcbiAgICAgICAgdmFyIHNpemUgPSBfaXNBcnJheUxpa2Uob2JqZWN0KSA/IG9iamVjdC5sZW5ndGggOiBfa2V5cyhvYmplY3QpLmxlbmd0aDtcbiAgICAgICAgdmFyIGNvbXBsZXRlZCA9IDA7XG4gICAgICAgIGlmICghc2l6ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIF9lYWNoKG9iamVjdCwgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKG9iamVjdFtrZXldLCBrZXksIG9ubHlfb25jZShkb25lKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBmdW5jdGlvbiBkb25lKGVycikge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb21wbGV0ZWQgKz0gMTtcbiAgICAgICAgICAgICAgICBpZiAoY29tcGxldGVkID49IHNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGFzeW5jLmZvckVhY2hPZlNlcmllcyA9XG4gICAgYXN5bmMuZWFjaE9mU2VyaWVzID0gZnVuY3Rpb24gKG9iaiwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gX29uY2UoY2FsbGJhY2sgfHwgbm9vcCk7XG4gICAgICAgIG9iaiA9IG9iaiB8fCBbXTtcbiAgICAgICAgdmFyIG5leHRLZXkgPSBfa2V5SXRlcmF0b3Iob2JqKTtcbiAgICAgICAgdmFyIGtleSA9IG5leHRLZXkoKTtcbiAgICAgICAgZnVuY3Rpb24gaXRlcmF0ZSgpIHtcbiAgICAgICAgICAgIHZhciBzeW5jID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChrZXkgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpdGVyYXRvcihvYmpba2V5XSwga2V5LCBvbmx5X29uY2UoZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGtleSA9IG5leHRLZXkoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN5bmMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3luYy5uZXh0VGljayhpdGVyYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlcmF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgc3luYyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGl0ZXJhdGUoKTtcbiAgICB9O1xuXG5cblxuICAgIGFzeW5jLmZvckVhY2hPZkxpbWl0ID1cbiAgICBhc3luYy5lYWNoT2ZMaW1pdCA9IGZ1bmN0aW9uIChvYmosIGxpbWl0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgX2VhY2hPZkxpbWl0KGxpbWl0KShvYmosIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIF9lYWNoT2ZMaW1pdChsaW1pdCkge1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAob2JqLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gX29uY2UoY2FsbGJhY2sgfHwgbm9vcCk7XG4gICAgICAgICAgICBvYmogPSBvYmogfHwgW107XG4gICAgICAgICAgICB2YXIgbmV4dEtleSA9IF9rZXlJdGVyYXRvcihvYmopO1xuICAgICAgICAgICAgaWYgKGxpbWl0IDw9IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgZG9uZSA9IGZhbHNlO1xuICAgICAgICAgICAgdmFyIHJ1bm5pbmcgPSAwO1xuICAgICAgICAgICAgdmFyIGVycm9yZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgKGZ1bmN0aW9uIHJlcGxlbmlzaCAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRvbmUgJiYgcnVubmluZyA8PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB3aGlsZSAocnVubmluZyA8IGxpbWl0ICYmICFlcnJvcmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBrZXkgPSBuZXh0S2V5KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvbmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJ1bm5pbmcgPD0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJ1bm5pbmcgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgaXRlcmF0b3Iob2JqW2tleV0sIGtleSwgb25seV9vbmNlKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bm5pbmcgLT0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVwbGVuaXNoKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSgpO1xuICAgICAgICB9O1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gZG9QYXJhbGxlbChmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9iaiwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gZm4oYXN5bmMuZWFjaE9mLCBvYmosIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGRvUGFyYWxsZWxMaW1pdChmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9iaiwgbGltaXQsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGZuKF9lYWNoT2ZMaW1pdChsaW1pdCksIG9iaiwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZG9TZXJpZXMoZm4pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChvYmosIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGZuKGFzeW5jLmVhY2hPZlNlcmllcywgb2JqLCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9hc3luY01hcChlYWNoZm4sIGFyciwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gX29uY2UoY2FsbGJhY2sgfHwgbm9vcCk7XG4gICAgICAgIHZhciByZXN1bHRzID0gW107XG4gICAgICAgIGVhY2hmbihhcnIsIGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpdGVyYXRvcih2YWx1ZSwgZnVuY3Rpb24gKGVyciwgdikge1xuICAgICAgICAgICAgICAgIHJlc3VsdHNbaW5kZXhdID0gdjtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgcmVzdWx0cyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jLm1hcCA9IGRvUGFyYWxsZWwoX2FzeW5jTWFwKTtcbiAgICBhc3luYy5tYXBTZXJpZXMgPSBkb1NlcmllcyhfYXN5bmNNYXApO1xuICAgIGFzeW5jLm1hcExpbWl0ID0gZG9QYXJhbGxlbExpbWl0KF9hc3luY01hcCk7XG5cbiAgICAvLyByZWR1Y2Ugb25seSBoYXMgYSBzZXJpZXMgdmVyc2lvbiwgYXMgZG9pbmcgcmVkdWNlIGluIHBhcmFsbGVsIHdvbid0XG4gICAgLy8gd29yayBpbiBtYW55IHNpdHVhdGlvbnMuXG4gICAgYXN5bmMuaW5qZWN0ID1cbiAgICBhc3luYy5mb2xkbCA9XG4gICAgYXN5bmMucmVkdWNlID0gZnVuY3Rpb24gKGFyciwgbWVtbywgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGFzeW5jLmVhY2hPZlNlcmllcyhhcnIsIGZ1bmN0aW9uICh4LCBpLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgaXRlcmF0b3IobWVtbywgeCwgZnVuY3Rpb24gKGVyciwgdikge1xuICAgICAgICAgICAgICAgIG1lbW8gPSB2O1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgY2FsbGJhY2soZXJyIHx8IG51bGwsIG1lbW8pO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgYXN5bmMuZm9sZHIgPVxuICAgIGFzeW5jLnJlZHVjZVJpZ2h0ID0gZnVuY3Rpb24gKGFyciwgbWVtbywgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciByZXZlcnNlZCA9IF9tYXAoYXJyLCBpZGVudGl0eSkucmV2ZXJzZSgpO1xuICAgICAgICBhc3luYy5yZWR1Y2UocmV2ZXJzZWQsIG1lbW8sIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIF9maWx0ZXIoZWFjaGZuLCBhcnIsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgICAgICBlYWNoZm4oYXJyLCBmdW5jdGlvbiAoeCwgaW5kZXgsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpdGVyYXRvcih4LCBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgIGlmICh2KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7aW5kZXg6IGluZGV4LCB2YWx1ZTogeH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKF9tYXAocmVzdWx0cy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGEuaW5kZXggLSBiLmluZGV4O1xuICAgICAgICAgICAgfSksIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHgudmFsdWU7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jLnNlbGVjdCA9XG4gICAgYXN5bmMuZmlsdGVyID0gZG9QYXJhbGxlbChfZmlsdGVyKTtcblxuICAgIGFzeW5jLnNlbGVjdExpbWl0ID1cbiAgICBhc3luYy5maWx0ZXJMaW1pdCA9IGRvUGFyYWxsZWxMaW1pdChfZmlsdGVyKTtcblxuICAgIGFzeW5jLnNlbGVjdFNlcmllcyA9XG4gICAgYXN5bmMuZmlsdGVyU2VyaWVzID0gZG9TZXJpZXMoX2ZpbHRlcik7XG5cbiAgICBmdW5jdGlvbiBfcmVqZWN0KGVhY2hmbiwgYXJyLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgX2ZpbHRlcihlYWNoZm4sIGFyciwgZnVuY3Rpb24odmFsdWUsIGNiKSB7XG4gICAgICAgICAgICBpdGVyYXRvcih2YWx1ZSwgZnVuY3Rpb24odikge1xuICAgICAgICAgICAgICAgIGNiKCF2KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBjYWxsYmFjayk7XG4gICAgfVxuICAgIGFzeW5jLnJlamVjdCA9IGRvUGFyYWxsZWwoX3JlamVjdCk7XG4gICAgYXN5bmMucmVqZWN0TGltaXQgPSBkb1BhcmFsbGVsTGltaXQoX3JlamVjdCk7XG4gICAgYXN5bmMucmVqZWN0U2VyaWVzID0gZG9TZXJpZXMoX3JlamVjdCk7XG5cbiAgICBmdW5jdGlvbiBfY3JlYXRlVGVzdGVyKGVhY2hmbiwgY2hlY2ssIGdldFJlc3VsdCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oYXJyLCBsaW1pdCwgaXRlcmF0b3IsIGNiKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiBkb25lKCkge1xuICAgICAgICAgICAgICAgIGlmIChjYikgY2IoZ2V0UmVzdWx0KGZhbHNlLCB2b2lkIDApKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZ1bmN0aW9uIGl0ZXJhdGVlKHgsIF8sIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFjYikgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgaXRlcmF0b3IoeCwgZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNiICYmIGNoZWNrKHYpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYihnZXRSZXN1bHQodHJ1ZSwgeCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2IgPSBpdGVyYXRvciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDMpIHtcbiAgICAgICAgICAgICAgICBlYWNoZm4oYXJyLCBsaW1pdCwgaXRlcmF0ZWUsIGRvbmUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYiA9IGl0ZXJhdG9yO1xuICAgICAgICAgICAgICAgIGl0ZXJhdG9yID0gbGltaXQ7XG4gICAgICAgICAgICAgICAgZWFjaGZuKGFyciwgaXRlcmF0ZWUsIGRvbmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFzeW5jLmFueSA9XG4gICAgYXN5bmMuc29tZSA9IF9jcmVhdGVUZXN0ZXIoYXN5bmMuZWFjaE9mLCB0b0Jvb2wsIGlkZW50aXR5KTtcblxuICAgIGFzeW5jLnNvbWVMaW1pdCA9IF9jcmVhdGVUZXN0ZXIoYXN5bmMuZWFjaE9mTGltaXQsIHRvQm9vbCwgaWRlbnRpdHkpO1xuXG4gICAgYXN5bmMuYWxsID1cbiAgICBhc3luYy5ldmVyeSA9IF9jcmVhdGVUZXN0ZXIoYXN5bmMuZWFjaE9mLCBub3RJZCwgbm90SWQpO1xuXG4gICAgYXN5bmMuZXZlcnlMaW1pdCA9IF9jcmVhdGVUZXN0ZXIoYXN5bmMuZWFjaE9mTGltaXQsIG5vdElkLCBub3RJZCk7XG5cbiAgICBmdW5jdGlvbiBfZmluZEdldFJlc3VsdCh2LCB4KSB7XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgICBhc3luYy5kZXRlY3QgPSBfY3JlYXRlVGVzdGVyKGFzeW5jLmVhY2hPZiwgaWRlbnRpdHksIF9maW5kR2V0UmVzdWx0KTtcbiAgICBhc3luYy5kZXRlY3RTZXJpZXMgPSBfY3JlYXRlVGVzdGVyKGFzeW5jLmVhY2hPZlNlcmllcywgaWRlbnRpdHksIF9maW5kR2V0UmVzdWx0KTtcblxuICAgIGFzeW5jLnNvcnRCeSA9IGZ1bmN0aW9uIChhcnIsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBhc3luYy5tYXAoYXJyLCBmdW5jdGlvbiAoeCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKHgsIGZ1bmN0aW9uIChlcnIsIGNyaXRlcmlhKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwge3ZhbHVlOiB4LCBjcml0ZXJpYTogY3JpdGVyaWF9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVyciwgcmVzdWx0cykge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgX21hcChyZXN1bHRzLnNvcnQoY29tcGFyYXRvciksIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB4LnZhbHVlO1xuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcblxuICAgICAgICBmdW5jdGlvbiBjb21wYXJhdG9yKGxlZnQsIHJpZ2h0KSB7XG4gICAgICAgICAgICB2YXIgYSA9IGxlZnQuY3JpdGVyaWEsIGIgPSByaWdodC5jcml0ZXJpYTtcbiAgICAgICAgICAgIHJldHVybiBhIDwgYiA/IC0xIDogYSA+IGIgPyAxIDogMDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBhc3luYy5hdXRvID0gZnVuY3Rpb24gKHRhc2tzLCBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IF9vbmNlKGNhbGxiYWNrIHx8IG5vb3ApO1xuICAgICAgICB2YXIga2V5cyA9IF9rZXlzKHRhc2tzKTtcbiAgICAgICAgdmFyIHJlbWFpbmluZ1Rhc2tzID0ga2V5cy5sZW5ndGg7XG4gICAgICAgIGlmICghcmVtYWluaW5nVGFza3MpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZXN1bHRzID0ge307XG5cbiAgICAgICAgdmFyIGxpc3RlbmVycyA9IFtdO1xuICAgICAgICBmdW5jdGlvbiBhZGRMaXN0ZW5lcihmbikge1xuICAgICAgICAgICAgbGlzdGVuZXJzLnVuc2hpZnQoZm4pO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKGZuKSB7XG4gICAgICAgICAgICB2YXIgaWR4ID0gX2luZGV4T2YobGlzdGVuZXJzLCBmbik7XG4gICAgICAgICAgICBpZiAoaWR4ID49IDApIGxpc3RlbmVycy5zcGxpY2UoaWR4LCAxKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiB0YXNrQ29tcGxldGUoKSB7XG4gICAgICAgICAgICByZW1haW5pbmdUYXNrcy0tO1xuICAgICAgICAgICAgX2FycmF5RWFjaChsaXN0ZW5lcnMuc2xpY2UoMCksIGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFkZExpc3RlbmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghcmVtYWluaW5nVGFza3MpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgX2FycmF5RWFjaChrZXlzLCBmdW5jdGlvbiAoaykge1xuICAgICAgICAgICAgdmFyIHRhc2sgPSBfaXNBcnJheSh0YXNrc1trXSkgPyB0YXNrc1trXTogW3Rhc2tzW2tdXTtcbiAgICAgICAgICAgIHZhciB0YXNrQ2FsbGJhY2sgPSBfcmVzdFBhcmFtKGZ1bmN0aW9uKGVyciwgYXJncykge1xuICAgICAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA8PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzYWZlUmVzdWx0cyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBfZm9yRWFjaE9mKHJlc3VsdHMsIGZ1bmN0aW9uKHZhbCwgcmtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2FmZVJlc3VsdHNbcmtleV0gPSB2YWw7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzYWZlUmVzdWx0c1trXSA9IGFyZ3M7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgc2FmZVJlc3VsdHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0c1trXSA9IGFyZ3M7XG4gICAgICAgICAgICAgICAgICAgIGFzeW5jLnNldEltbWVkaWF0ZSh0YXNrQ29tcGxldGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdmFyIHJlcXVpcmVzID0gdGFzay5zbGljZSgwLCB0YXNrLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgLy8gcHJldmVudCBkZWFkLWxvY2tzXG4gICAgICAgICAgICB2YXIgbGVuID0gcmVxdWlyZXMubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIGRlcDtcbiAgICAgICAgICAgIHdoaWxlIChsZW4tLSkge1xuICAgICAgICAgICAgICAgIGlmICghKGRlcCA9IHRhc2tzW3JlcXVpcmVzW2xlbl1dKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0hhcyBpbmV4aXN0YW50IGRlcGVuZGVuY3knKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKF9pc0FycmF5KGRlcCkgJiYgX2luZGV4T2YoZGVwLCBrKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSGFzIGN5Y2xpYyBkZXBlbmRlbmNpZXMnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmdW5jdGlvbiByZWFkeSgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3JlZHVjZShyZXF1aXJlcywgZnVuY3Rpb24gKGEsIHgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChhICYmIHJlc3VsdHMuaGFzT3duUHJvcGVydHkoeCkpO1xuICAgICAgICAgICAgICAgIH0sIHRydWUpICYmICFyZXN1bHRzLmhhc093blByb3BlcnR5KGspO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlYWR5KCkpIHtcbiAgICAgICAgICAgICAgICB0YXNrW3Rhc2subGVuZ3RoIC0gMV0odGFza0NhbGxiYWNrLCByZXN1bHRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZ1bmN0aW9uIGxpc3RlbmVyKCkge1xuICAgICAgICAgICAgICAgIGlmIChyZWFkeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGFza1t0YXNrLmxlbmd0aCAtIDFdKHRhc2tDYWxsYmFjaywgcmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG5cblxuICAgIGFzeW5jLnJldHJ5ID0gZnVuY3Rpb24odGltZXMsIHRhc2ssIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBERUZBVUxUX1RJTUVTID0gNTtcbiAgICAgICAgdmFyIERFRkFVTFRfSU5URVJWQUwgPSAwO1xuXG4gICAgICAgIHZhciBhdHRlbXB0cyA9IFtdO1xuXG4gICAgICAgIHZhciBvcHRzID0ge1xuICAgICAgICAgICAgdGltZXM6IERFRkFVTFRfVElNRVMsXG4gICAgICAgICAgICBpbnRlcnZhbDogREVGQVVMVF9JTlRFUlZBTFxuICAgICAgICB9O1xuXG4gICAgICAgIGZ1bmN0aW9uIHBhcnNlVGltZXMoYWNjLCB0KXtcbiAgICAgICAgICAgIGlmKHR5cGVvZiB0ID09PSAnbnVtYmVyJyl7XG4gICAgICAgICAgICAgICAgYWNjLnRpbWVzID0gcGFyc2VJbnQodCwgMTApIHx8IERFRkFVTFRfVElNRVM7XG4gICAgICAgICAgICB9IGVsc2UgaWYodHlwZW9mIHQgPT09ICdvYmplY3QnKXtcbiAgICAgICAgICAgICAgICBhY2MudGltZXMgPSBwYXJzZUludCh0LnRpbWVzLCAxMCkgfHwgREVGQVVMVF9USU1FUztcbiAgICAgICAgICAgICAgICBhY2MuaW50ZXJ2YWwgPSBwYXJzZUludCh0LmludGVydmFsLCAxMCkgfHwgREVGQVVMVF9JTlRFUlZBTDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbnN1cHBvcnRlZCBhcmd1bWVudCB0eXBlIGZvciBcXCd0aW1lc1xcJzogJyArIHR5cGVvZih0KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgaWYgKGxlbmd0aCA8IDEgfHwgbGVuZ3RoID4gMykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGFyZ3VtZW50cyAtIG11c3QgYmUgZWl0aGVyICh0YXNrKSwgKHRhc2ssIGNhbGxiYWNrKSwgKHRpbWVzLCB0YXNrKSBvciAodGltZXMsIHRhc2ssIGNhbGxiYWNrKScpO1xuICAgICAgICB9IGVsc2UgaWYgKGxlbmd0aCA8PSAyICYmIHR5cGVvZiB0aW1lcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FsbGJhY2sgPSB0YXNrO1xuICAgICAgICAgICAgdGFzayA9IHRpbWVzO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgdGltZXMgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHBhcnNlVGltZXMob3B0cywgdGltZXMpO1xuICAgICAgICB9XG4gICAgICAgIG9wdHMuY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgb3B0cy50YXNrID0gdGFzaztcblxuICAgICAgICBmdW5jdGlvbiB3cmFwcGVkVGFzayh3cmFwcGVkQ2FsbGJhY2ssIHdyYXBwZWRSZXN1bHRzKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiByZXRyeUF0dGVtcHQodGFzaywgZmluYWxBdHRlbXB0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHNlcmllc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhc2soZnVuY3Rpb24oZXJyLCByZXN1bHQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VyaWVzQ2FsbGJhY2soIWVyciB8fCBmaW5hbEF0dGVtcHQsIHtlcnI6IGVyciwgcmVzdWx0OiByZXN1bHR9KTtcbiAgICAgICAgICAgICAgICAgICAgfSwgd3JhcHBlZFJlc3VsdHMpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHJldHJ5SW50ZXJ2YWwoaW50ZXJ2YWwpe1xuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbihzZXJpZXNDYWxsYmFjayl7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcmllc0NhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICB9LCBpbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgd2hpbGUgKG9wdHMudGltZXMpIHtcblxuICAgICAgICAgICAgICAgIHZhciBmaW5hbEF0dGVtcHQgPSAhKG9wdHMudGltZXMtPTEpO1xuICAgICAgICAgICAgICAgIGF0dGVtcHRzLnB1c2gocmV0cnlBdHRlbXB0KG9wdHMudGFzaywgZmluYWxBdHRlbXB0KSk7XG4gICAgICAgICAgICAgICAgaWYoIWZpbmFsQXR0ZW1wdCAmJiBvcHRzLmludGVydmFsID4gMCl7XG4gICAgICAgICAgICAgICAgICAgIGF0dGVtcHRzLnB1c2gocmV0cnlJbnRlcnZhbChvcHRzLmludGVydmFsKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhc3luYy5zZXJpZXMoYXR0ZW1wdHMsIGZ1bmN0aW9uKGRvbmUsIGRhdGEpe1xuICAgICAgICAgICAgICAgIGRhdGEgPSBkYXRhW2RhdGEubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgKHdyYXBwZWRDYWxsYmFjayB8fCBvcHRzLmNhbGxiYWNrKShkYXRhLmVyciwgZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBhIGNhbGxiYWNrIGlzIHBhc3NlZCwgcnVuIHRoaXMgYXMgYSBjb250cm9sbCBmbG93XG4gICAgICAgIHJldHVybiBvcHRzLmNhbGxiYWNrID8gd3JhcHBlZFRhc2soKSA6IHdyYXBwZWRUYXNrO1xuICAgIH07XG5cbiAgICBhc3luYy53YXRlcmZhbGwgPSBmdW5jdGlvbiAodGFza3MsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gX29uY2UoY2FsbGJhY2sgfHwgbm9vcCk7XG4gICAgICAgIGlmICghX2lzQXJyYXkodGFza3MpKSB7XG4gICAgICAgICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdGaXJzdCBhcmd1bWVudCB0byB3YXRlcmZhbGwgbXVzdCBiZSBhbiBhcnJheSBvZiBmdW5jdGlvbnMnKTtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGFza3MubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiB3cmFwSXRlcmF0b3IoaXRlcmF0b3IpIHtcbiAgICAgICAgICAgIHJldHVybiBfcmVzdFBhcmFtKGZ1bmN0aW9uIChlcnIsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIFtlcnJdLmNvbmNhdChhcmdzKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmV4dCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5leHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MucHVzaCh3cmFwSXRlcmF0b3IobmV4dCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJncy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbnN1cmVBc3luYyhpdGVyYXRvcikuYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgd3JhcEl0ZXJhdG9yKGFzeW5jLml0ZXJhdG9yKHRhc2tzKSkoKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gX3BhcmFsbGVsKGVhY2hmbiwgdGFza3MsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgbm9vcDtcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBfaXNBcnJheUxpa2UodGFza3MpID8gW10gOiB7fTtcblxuICAgICAgICBlYWNoZm4odGFza3MsIGZ1bmN0aW9uICh0YXNrLCBrZXksIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICB0YXNrKF9yZXN0UGFyYW0oZnVuY3Rpb24gKGVyciwgYXJncykge1xuICAgICAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA8PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXN1bHRzW2tleV0gPSBhcmdzO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgcmVzdWx0cyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jLnBhcmFsbGVsID0gZnVuY3Rpb24gKHRhc2tzLCBjYWxsYmFjaykge1xuICAgICAgICBfcGFyYWxsZWwoYXN5bmMuZWFjaE9mLCB0YXNrcywgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy5wYXJhbGxlbExpbWl0ID0gZnVuY3Rpb24odGFza3MsIGxpbWl0LCBjYWxsYmFjaykge1xuICAgICAgICBfcGFyYWxsZWwoX2VhY2hPZkxpbWl0KGxpbWl0KSwgdGFza3MsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMuc2VyaWVzID0gZnVuY3Rpb24odGFza3MsIGNhbGxiYWNrKSB7XG4gICAgICAgIF9wYXJhbGxlbChhc3luYy5lYWNoT2ZTZXJpZXMsIHRhc2tzLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLml0ZXJhdG9yID0gZnVuY3Rpb24gKHRhc2tzKSB7XG4gICAgICAgIGZ1bmN0aW9uIG1ha2VDYWxsYmFjayhpbmRleCkge1xuICAgICAgICAgICAgZnVuY3Rpb24gZm4oKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRhc2tzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB0YXNrc1tpbmRleF0uYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLm5leHQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZuLm5leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChpbmRleCA8IHRhc2tzLmxlbmd0aCAtIDEpID8gbWFrZUNhbGxiYWNrKGluZGV4ICsgMSk6IG51bGw7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIGZuO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYWtlQ2FsbGJhY2soMCk7XG4gICAgfTtcblxuICAgIGFzeW5jLmFwcGx5ID0gX3Jlc3RQYXJhbShmdW5jdGlvbiAoZm4sIGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIF9yZXN0UGFyYW0oZnVuY3Rpb24gKGNhbGxBcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4gZm4uYXBwbHkoXG4gICAgICAgICAgICAgICAgbnVsbCwgYXJncy5jb25jYXQoY2FsbEFyZ3MpXG4gICAgICAgICAgICApO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIF9jb25jYXQoZWFjaGZuLCBhcnIsIGZuLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgIGVhY2hmbihhcnIsIGZ1bmN0aW9uICh4LCBpbmRleCwgY2IpIHtcbiAgICAgICAgICAgIGZuKHgsIGZ1bmN0aW9uIChlcnIsIHkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0KHkgfHwgW10pO1xuICAgICAgICAgICAgICAgIGNiKGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgY2FsbGJhY2soZXJyLCByZXN1bHQpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMuY29uY2F0ID0gZG9QYXJhbGxlbChfY29uY2F0KTtcbiAgICBhc3luYy5jb25jYXRTZXJpZXMgPSBkb1NlcmllcyhfY29uY2F0KTtcblxuICAgIGFzeW5jLndoaWxzdCA9IGZ1bmN0aW9uICh0ZXN0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBub29wO1xuICAgICAgICBpZiAodGVzdCgpKSB7XG4gICAgICAgICAgICB2YXIgbmV4dCA9IF9yZXN0UGFyYW0oZnVuY3Rpb24oZXJyLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGVzdC5hcHBseSh0aGlzLCBhcmdzKSkge1xuICAgICAgICAgICAgICAgICAgICBpdGVyYXRvcihuZXh0KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGl0ZXJhdG9yKG5leHQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FsbGJhY2sobnVsbCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgYXN5bmMuZG9XaGlsc3QgPSBmdW5jdGlvbiAoaXRlcmF0b3IsIHRlc3QsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBjYWxscyA9IDA7XG4gICAgICAgIHJldHVybiBhc3luYy53aGlsc3QoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gKytjYWxscyA8PSAxIHx8IHRlc3QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfSwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMudW50aWwgPSBmdW5jdGlvbiAodGVzdCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiBhc3luYy53aGlsc3QoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gIXRlc3QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfSwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMuZG9VbnRpbCA9IGZ1bmN0aW9uIChpdGVyYXRvciwgdGVzdCwgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jLmRvV2hpbHN0KGl0ZXJhdG9yLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiAhdGVzdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9LCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLmR1cmluZyA9IGZ1bmN0aW9uICh0ZXN0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBub29wO1xuXG4gICAgICAgIHZhciBuZXh0ID0gX3Jlc3RQYXJhbShmdW5jdGlvbihlcnIsIGFyZ3MpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2goY2hlY2spO1xuICAgICAgICAgICAgICAgIHRlc3QuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBjaGVjayA9IGZ1bmN0aW9uKGVyciwgdHJ1dGgpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0cnV0aCkge1xuICAgICAgICAgICAgICAgIGl0ZXJhdG9yKG5leHQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB0ZXN0KGNoZWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMuZG9EdXJpbmcgPSBmdW5jdGlvbiAoaXRlcmF0b3IsIHRlc3QsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBjYWxscyA9IDA7XG4gICAgICAgIGFzeW5jLmR1cmluZyhmdW5jdGlvbihuZXh0KSB7XG4gICAgICAgICAgICBpZiAoY2FsbHMrKyA8IDEpIHtcbiAgICAgICAgICAgICAgICBuZXh0KG51bGwsIHRydWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0ZXN0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIF9xdWV1ZSh3b3JrZXIsIGNvbmN1cnJlbmN5LCBwYXlsb2FkKSB7XG4gICAgICAgIGlmIChjb25jdXJyZW5jeSA9PSBudWxsKSB7XG4gICAgICAgICAgICBjb25jdXJyZW5jeSA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZihjb25jdXJyZW5jeSA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb25jdXJyZW5jeSBtdXN0IG5vdCBiZSB6ZXJvJyk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gX2luc2VydChxLCBkYXRhLCBwb3MsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2sgIT0gbnVsbCAmJiB0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInRhc2sgY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcS5zdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmICghX2lzQXJyYXkoZGF0YSkpIHtcbiAgICAgICAgICAgICAgICBkYXRhID0gW2RhdGFdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoZGF0YS5sZW5ndGggPT09IDAgJiYgcS5pZGxlKCkpIHtcbiAgICAgICAgICAgICAgICAvLyBjYWxsIGRyYWluIGltbWVkaWF0ZWx5IGlmIHRoZXJlIGFyZSBubyB0YXNrc1xuICAgICAgICAgICAgICAgIHJldHVybiBhc3luYy5zZXRJbW1lZGlhdGUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHEuZHJhaW4oKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF9hcnJheUVhY2goZGF0YSwgZnVuY3Rpb24odGFzaykge1xuICAgICAgICAgICAgICAgIHZhciBpdGVtID0ge1xuICAgICAgICAgICAgICAgICAgICBkYXRhOiB0YXNrLFxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogY2FsbGJhY2sgfHwgbm9vcFxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBpZiAocG9zKSB7XG4gICAgICAgICAgICAgICAgICAgIHEudGFza3MudW5zaGlmdChpdGVtKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBxLnRhc2tzLnB1c2goaXRlbSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHEudGFza3MubGVuZ3RoID09PSBxLmNvbmN1cnJlbmN5KSB7XG4gICAgICAgICAgICAgICAgICAgIHEuc2F0dXJhdGVkKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUocS5wcm9jZXNzKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBfbmV4dChxLCB0YXNrcykge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgd29ya2VycyAtPSAxO1xuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICAgICAgICAgIF9hcnJheUVhY2godGFza3MsIGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhc2suY2FsbGJhY2suYXBwbHkodGFzaywgYXJncyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKHEudGFza3MubGVuZ3RoICsgd29ya2VycyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBxLmRyYWluKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHEucHJvY2VzcygpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB3b3JrZXJzID0gMDtcbiAgICAgICAgdmFyIHEgPSB7XG4gICAgICAgICAgICB0YXNrczogW10sXG4gICAgICAgICAgICBjb25jdXJyZW5jeTogY29uY3VycmVuY3ksXG4gICAgICAgICAgICBwYXlsb2FkOiBwYXlsb2FkLFxuICAgICAgICAgICAgc2F0dXJhdGVkOiBub29wLFxuICAgICAgICAgICAgZW1wdHk6IG5vb3AsXG4gICAgICAgICAgICBkcmFpbjogbm9vcCxcbiAgICAgICAgICAgIHN0YXJ0ZWQ6IGZhbHNlLFxuICAgICAgICAgICAgcGF1c2VkOiBmYWxzZSxcbiAgICAgICAgICAgIHB1c2g6IGZ1bmN0aW9uIChkYXRhLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIF9pbnNlcnQocSwgZGF0YSwgZmFsc2UsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBraWxsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcS5kcmFpbiA9IG5vb3A7XG4gICAgICAgICAgICAgICAgcS50YXNrcyA9IFtdO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVuc2hpZnQ6IGZ1bmN0aW9uIChkYXRhLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIF9pbnNlcnQocSwgZGF0YSwgdHJ1ZSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXEucGF1c2VkICYmIHdvcmtlcnMgPCBxLmNvbmN1cnJlbmN5ICYmIHEudGFza3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlKHdvcmtlcnMgPCBxLmNvbmN1cnJlbmN5ICYmIHEudGFza3MubGVuZ3RoKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YXNrcyA9IHEucGF5bG9hZCA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcS50YXNrcy5zcGxpY2UoMCwgcS5wYXlsb2FkKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcS50YXNrcy5zcGxpY2UoMCwgcS50YXNrcy5sZW5ndGgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IF9tYXAodGFza3MsIGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRhc2suZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocS50YXNrcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBxLmVtcHR5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JrZXJzICs9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2IgPSBvbmx5X29uY2UoX25leHQocSwgdGFza3MpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtlcihkYXRhLCBjYik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGVuZ3RoOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHEudGFza3MubGVuZ3RoO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJ1bm5pbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gd29ya2VycztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpZGxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcS50YXNrcy5sZW5ndGggKyB3b3JrZXJzID09PSAwO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBhdXNlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcS5wYXVzZWQgPSB0cnVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlc3VtZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChxLnBhdXNlZCA9PT0gZmFsc2UpIHsgcmV0dXJuOyB9XG4gICAgICAgICAgICAgICAgcS5wYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdW1lQ291bnQgPSBNYXRoLm1pbihxLmNvbmN1cnJlbmN5LCBxLnRhc2tzLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgLy8gTmVlZCB0byBjYWxsIHEucHJvY2VzcyBvbmNlIHBlciBjb25jdXJyZW50XG4gICAgICAgICAgICAgICAgLy8gd29ya2VyIHRvIHByZXNlcnZlIGZ1bGwgY29uY3VycmVuY3kgYWZ0ZXIgcGF1c2VcbiAgICAgICAgICAgICAgICBmb3IgKHZhciB3ID0gMTsgdyA8PSByZXN1bWVDb3VudDsgdysrKSB7XG4gICAgICAgICAgICAgICAgICAgIGFzeW5jLnNldEltbWVkaWF0ZShxLnByb2Nlc3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHE7XG4gICAgfVxuXG4gICAgYXN5bmMucXVldWUgPSBmdW5jdGlvbiAod29ya2VyLCBjb25jdXJyZW5jeSkge1xuICAgICAgICB2YXIgcSA9IF9xdWV1ZShmdW5jdGlvbiAoaXRlbXMsIGNiKSB7XG4gICAgICAgICAgICB3b3JrZXIoaXRlbXNbMF0sIGNiKTtcbiAgICAgICAgfSwgY29uY3VycmVuY3ksIDEpO1xuXG4gICAgICAgIHJldHVybiBxO1xuICAgIH07XG5cbiAgICBhc3luYy5wcmlvcml0eVF1ZXVlID0gZnVuY3Rpb24gKHdvcmtlciwgY29uY3VycmVuY3kpIHtcblxuICAgICAgICBmdW5jdGlvbiBfY29tcGFyZVRhc2tzKGEsIGIpe1xuICAgICAgICAgICAgcmV0dXJuIGEucHJpb3JpdHkgLSBiLnByaW9yaXR5O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gX2JpbmFyeVNlYXJjaChzZXF1ZW5jZSwgaXRlbSwgY29tcGFyZSkge1xuICAgICAgICAgICAgdmFyIGJlZyA9IC0xLFxuICAgICAgICAgICAgICAgIGVuZCA9IHNlcXVlbmNlLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICB3aGlsZSAoYmVnIDwgZW5kKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1pZCA9IGJlZyArICgoZW5kIC0gYmVnICsgMSkgPj4+IDEpO1xuICAgICAgICAgICAgICAgIGlmIChjb21wYXJlKGl0ZW0sIHNlcXVlbmNlW21pZF0pID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgYmVnID0gbWlkO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGVuZCA9IG1pZCAtIDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGJlZztcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIF9pbnNlcnQocSwgZGF0YSwgcHJpb3JpdHksIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2sgIT0gbnVsbCAmJiB0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInRhc2sgY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcS5zdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmICghX2lzQXJyYXkoZGF0YSkpIHtcbiAgICAgICAgICAgICAgICBkYXRhID0gW2RhdGFdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoZGF0YS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAvLyBjYWxsIGRyYWluIGltbWVkaWF0ZWx5IGlmIHRoZXJlIGFyZSBubyB0YXNrc1xuICAgICAgICAgICAgICAgIHJldHVybiBhc3luYy5zZXRJbW1lZGlhdGUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHEuZHJhaW4oKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF9hcnJheUVhY2goZGF0YSwgZnVuY3Rpb24odGFzaykge1xuICAgICAgICAgICAgICAgIHZhciBpdGVtID0ge1xuICAgICAgICAgICAgICAgICAgICBkYXRhOiB0YXNrLFxuICAgICAgICAgICAgICAgICAgICBwcmlvcml0eTogcHJpb3JpdHksXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiB0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicgPyBjYWxsYmFjayA6IG5vb3BcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgcS50YXNrcy5zcGxpY2UoX2JpbmFyeVNlYXJjaChxLnRhc2tzLCBpdGVtLCBfY29tcGFyZVRhc2tzKSArIDEsIDAsIGl0ZW0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKHEudGFza3MubGVuZ3RoID09PSBxLmNvbmN1cnJlbmN5KSB7XG4gICAgICAgICAgICAgICAgICAgIHEuc2F0dXJhdGVkKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGFzeW5jLnNldEltbWVkaWF0ZShxLnByb2Nlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTdGFydCB3aXRoIGEgbm9ybWFsIHF1ZXVlXG4gICAgICAgIHZhciBxID0gYXN5bmMucXVldWUod29ya2VyLCBjb25jdXJyZW5jeSk7XG5cbiAgICAgICAgLy8gT3ZlcnJpZGUgcHVzaCB0byBhY2NlcHQgc2Vjb25kIHBhcmFtZXRlciByZXByZXNlbnRpbmcgcHJpb3JpdHlcbiAgICAgICAgcS5wdXNoID0gZnVuY3Rpb24gKGRhdGEsIHByaW9yaXR5LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgX2luc2VydChxLCBkYXRhLCBwcmlvcml0eSwgY2FsbGJhY2spO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIFJlbW92ZSB1bnNoaWZ0IGZ1bmN0aW9uXG4gICAgICAgIGRlbGV0ZSBxLnVuc2hpZnQ7XG5cbiAgICAgICAgcmV0dXJuIHE7XG4gICAgfTtcblxuICAgIGFzeW5jLmNhcmdvID0gZnVuY3Rpb24gKHdvcmtlciwgcGF5bG9hZCkge1xuICAgICAgICByZXR1cm4gX3F1ZXVlKHdvcmtlciwgMSwgcGF5bG9hZCk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIF9jb25zb2xlX2ZuKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIF9yZXN0UGFyYW0oZnVuY3Rpb24gKGZuLCBhcmdzKSB7XG4gICAgICAgICAgICBmbi5hcHBseShudWxsLCBhcmdzLmNvbmNhdChbX3Jlc3RQYXJhbShmdW5jdGlvbiAoZXJyLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uc29sZS5lcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChjb25zb2xlW25hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfYXJyYXlFYWNoKGFyZ3MsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZVtuYW1lXSh4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSldKSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYy5sb2cgPSBfY29uc29sZV9mbignbG9nJyk7XG4gICAgYXN5bmMuZGlyID0gX2NvbnNvbGVfZm4oJ2RpcicpO1xuICAgIC8qYXN5bmMuaW5mbyA9IF9jb25zb2xlX2ZuKCdpbmZvJyk7XG4gICAgYXN5bmMud2FybiA9IF9jb25zb2xlX2ZuKCd3YXJuJyk7XG4gICAgYXN5bmMuZXJyb3IgPSBfY29uc29sZV9mbignZXJyb3InKTsqL1xuXG4gICAgYXN5bmMubWVtb2l6ZSA9IGZ1bmN0aW9uIChmbiwgaGFzaGVyKSB7XG4gICAgICAgIHZhciBtZW1vID0ge307XG4gICAgICAgIHZhciBxdWV1ZXMgPSB7fTtcbiAgICAgICAgaGFzaGVyID0gaGFzaGVyIHx8IGlkZW50aXR5O1xuICAgICAgICB2YXIgbWVtb2l6ZWQgPSBfcmVzdFBhcmFtKGZ1bmN0aW9uIG1lbW9pemVkKGFyZ3MpIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3MucG9wKCk7XG4gICAgICAgICAgICB2YXIga2V5ID0gaGFzaGVyLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgICAgICAgaWYgKGtleSBpbiBtZW1vKSB7XG4gICAgICAgICAgICAgICAgYXN5bmMubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseShudWxsLCBtZW1vW2tleV0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5IGluIHF1ZXVlcykge1xuICAgICAgICAgICAgICAgIHF1ZXVlc1trZXldLnB1c2goY2FsbGJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcXVldWVzW2tleV0gPSBbY2FsbGJhY2tdO1xuICAgICAgICAgICAgICAgIGZuLmFwcGx5KG51bGwsIGFyZ3MuY29uY2F0KFtfcmVzdFBhcmFtKGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lbW9ba2V5XSA9IGFyZ3M7XG4gICAgICAgICAgICAgICAgICAgIHZhciBxID0gcXVldWVzW2tleV07XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBxdWV1ZXNba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBxLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcVtpXS5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgbWVtb2l6ZWQubWVtbyA9IG1lbW87XG4gICAgICAgIG1lbW9pemVkLnVubWVtb2l6ZWQgPSBmbjtcbiAgICAgICAgcmV0dXJuIG1lbW9pemVkO1xuICAgIH07XG5cbiAgICBhc3luYy51bm1lbW9pemUgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAoZm4udW5tZW1vaXplZCB8fCBmbikuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gX3RpbWVzKG1hcHBlcikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGNvdW50LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIG1hcHBlcihfcmFuZ2UoY291bnQpLCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFzeW5jLnRpbWVzID0gX3RpbWVzKGFzeW5jLm1hcCk7XG4gICAgYXN5bmMudGltZXNTZXJpZXMgPSBfdGltZXMoYXN5bmMubWFwU2VyaWVzKTtcbiAgICBhc3luYy50aW1lc0xpbWl0ID0gZnVuY3Rpb24gKGNvdW50LCBsaW1pdCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiBhc3luYy5tYXBMaW1pdChfcmFuZ2UoY291bnQpLCBsaW1pdCwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMuc2VxID0gZnVuY3Rpb24gKC8qIGZ1bmN0aW9ucy4uLiAqLykge1xuICAgICAgICB2YXIgZm5zID0gYXJndW1lbnRzO1xuICAgICAgICByZXR1cm4gX3Jlc3RQYXJhbShmdW5jdGlvbiAoYXJncykge1xuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBhcmdzW2FyZ3MubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBhcmdzLnBvcCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayA9IG5vb3A7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGFzeW5jLnJlZHVjZShmbnMsIGFyZ3MsIGZ1bmN0aW9uIChuZXdhcmdzLCBmbiwgY2IpIHtcbiAgICAgICAgICAgICAgICBmbi5hcHBseSh0aGF0LCBuZXdhcmdzLmNvbmNhdChbX3Jlc3RQYXJhbShmdW5jdGlvbiAoZXJyLCBuZXh0YXJncykge1xuICAgICAgICAgICAgICAgICAgICBjYihlcnIsIG5leHRhcmdzKTtcbiAgICAgICAgICAgICAgICB9KV0pKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5jdGlvbiAoZXJyLCByZXN1bHRzKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkodGhhdCwgW2Vycl0uY29uY2F0KHJlc3VsdHMpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgYXN5bmMuY29tcG9zZSA9IGZ1bmN0aW9uICgvKiBmdW5jdGlvbnMuLi4gKi8pIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jLnNlcS5hcHBseShudWxsLCBBcnJheS5wcm90b3R5cGUucmV2ZXJzZS5jYWxsKGFyZ3VtZW50cykpO1xuICAgIH07XG5cblxuICAgIGZ1bmN0aW9uIF9hcHBseUVhY2goZWFjaGZuKSB7XG4gICAgICAgIHJldHVybiBfcmVzdFBhcmFtKGZ1bmN0aW9uKGZucywgYXJncykge1xuICAgICAgICAgICAgdmFyIGdvID0gX3Jlc3RQYXJhbShmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3MucG9wKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVhY2hmbihmbnMsIGZ1bmN0aW9uIChmbiwgXywgY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgZm4uYXBwbHkodGhhdCwgYXJncy5jb25jYXQoW2NiXSkpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgY2FsbGJhY2spO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoYXJncy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ28uYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ287XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jLmFwcGx5RWFjaCA9IF9hcHBseUVhY2goYXN5bmMuZWFjaE9mKTtcbiAgICBhc3luYy5hcHBseUVhY2hTZXJpZXMgPSBfYXBwbHlFYWNoKGFzeW5jLmVhY2hPZlNlcmllcyk7XG5cblxuICAgIGFzeW5jLmZvcmV2ZXIgPSBmdW5jdGlvbiAoZm4sIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBkb25lID0gb25seV9vbmNlKGNhbGxiYWNrIHx8IG5vb3ApO1xuICAgICAgICB2YXIgdGFzayA9IGVuc3VyZUFzeW5jKGZuKTtcbiAgICAgICAgZnVuY3Rpb24gbmV4dChlcnIpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZG9uZShlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGFzayhuZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBuZXh0KCk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGVuc3VyZUFzeW5jKGZuKSB7XG4gICAgICAgIHJldHVybiBfcmVzdFBhcmFtKGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBhcmdzLnBvcCgpO1xuICAgICAgICAgICAgYXJncy5wdXNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5uZXJBcmdzID0gYXJndW1lbnRzO1xuICAgICAgICAgICAgICAgIGlmIChzeW5jKSB7XG4gICAgICAgICAgICAgICAgICAgIGFzeW5jLnNldEltbWVkaWF0ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseShudWxsLCBpbm5lckFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseShudWxsLCBpbm5lckFyZ3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdmFyIHN5bmMgPSB0cnVlO1xuICAgICAgICAgICAgZm4uYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICBzeW5jID0gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jLmVuc3VyZUFzeW5jID0gZW5zdXJlQXN5bmM7XG5cbiAgICBhc3luYy5jb25zdGFudCA9IF9yZXN0UGFyYW0oZnVuY3Rpb24odmFsdWVzKSB7XG4gICAgICAgIHZhciBhcmdzID0gW251bGxdLmNvbmNhdCh2YWx1ZXMpO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2suYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICBhc3luYy53cmFwU3luYyA9XG4gICAgYXN5bmMuYXN5bmNpZnkgPSBmdW5jdGlvbiBhc3luY2lmeShmdW5jKSB7XG4gICAgICAgIHJldHVybiBfcmVzdFBhcmFtKGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBhcmdzLnBvcCgpO1xuICAgICAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBpZiByZXN1bHQgaXMgUHJvbWlzZSBvYmplY3RcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgcmVzdWx0LnRoZW4gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIHJlc3VsdC50aGVuKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyLm1lc3NhZ2UgPyBlcnIgOiBuZXcgRXJyb3IoZXJyKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLyBOb2RlLmpzXG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gYXN5bmM7XG4gICAgfVxuICAgIC8vIEFNRCAvIFJlcXVpcmVKU1xuICAgIGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgIT09ICd1bmRlZmluZWQnICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKFtdLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gYXN5bmM7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvLyBpbmNsdWRlZCBkaXJlY3RseSB2aWEgPHNjcmlwdD4gdGFnXG4gICAgZWxzZSB7XG4gICAgICAgIHJvb3QuYXN5bmMgPSBhc3luYztcbiAgICB9XG5cbn0oKSk7XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIi8qIVxyXG4gKiBAbmFtZSBKYXZhU2NyaXB0L05vZGVKUyBNZXJnZSB2MS4yLjBcclxuICogQGF1dGhvciB5ZWlrb3NcclxuICogQHJlcG9zaXRvcnkgaHR0cHM6Ly9naXRodWIuY29tL3llaWtvcy9qcy5tZXJnZVxyXG5cclxuICogQ29weXJpZ2h0IDIwMTQgeWVpa29zIC0gTUlUIGxpY2Vuc2VcclxuICogaHR0cHM6Ly9yYXcuZ2l0aHViLmNvbS95ZWlrb3MvanMubWVyZ2UvbWFzdGVyL0xJQ0VOU0VcclxuICovXHJcblxyXG47KGZ1bmN0aW9uKGlzTm9kZSkge1xyXG5cclxuXHQvKipcclxuXHQgKiBNZXJnZSBvbmUgb3IgbW9yZSBvYmplY3RzIFxyXG5cdCAqIEBwYXJhbSBib29sPyBjbG9uZVxyXG5cdCAqIEBwYXJhbSBtaXhlZCwuLi4gYXJndW1lbnRzXHJcblx0ICogQHJldHVybiBvYmplY3RcclxuXHQgKi9cclxuXHJcblx0dmFyIFB1YmxpYyA9IGZ1bmN0aW9uKGNsb25lKSB7XHJcblxyXG5cdFx0cmV0dXJuIG1lcmdlKGNsb25lID09PSB0cnVlLCBmYWxzZSwgYXJndW1lbnRzKTtcclxuXHJcblx0fSwgcHVibGljTmFtZSA9ICdtZXJnZSc7XHJcblxyXG5cdC8qKlxyXG5cdCAqIE1lcmdlIHR3byBvciBtb3JlIG9iamVjdHMgcmVjdXJzaXZlbHkgXHJcblx0ICogQHBhcmFtIGJvb2w/IGNsb25lXHJcblx0ICogQHBhcmFtIG1peGVkLC4uLiBhcmd1bWVudHNcclxuXHQgKiBAcmV0dXJuIG9iamVjdFxyXG5cdCAqL1xyXG5cclxuXHRQdWJsaWMucmVjdXJzaXZlID0gZnVuY3Rpb24oY2xvbmUpIHtcclxuXHJcblx0XHRyZXR1cm4gbWVyZ2UoY2xvbmUgPT09IHRydWUsIHRydWUsIGFyZ3VtZW50cyk7XHJcblxyXG5cdH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIENsb25lIHRoZSBpbnB1dCByZW1vdmluZyBhbnkgcmVmZXJlbmNlXHJcblx0ICogQHBhcmFtIG1peGVkIGlucHV0XHJcblx0ICogQHJldHVybiBtaXhlZFxyXG5cdCAqL1xyXG5cclxuXHRQdWJsaWMuY2xvbmUgPSBmdW5jdGlvbihpbnB1dCkge1xyXG5cclxuXHRcdHZhciBvdXRwdXQgPSBpbnB1dCxcclxuXHRcdFx0dHlwZSA9IHR5cGVPZihpbnB1dCksXHJcblx0XHRcdGluZGV4LCBzaXplO1xyXG5cclxuXHRcdGlmICh0eXBlID09PSAnYXJyYXknKSB7XHJcblxyXG5cdFx0XHRvdXRwdXQgPSBbXTtcclxuXHRcdFx0c2l6ZSA9IGlucHV0Lmxlbmd0aDtcclxuXHJcblx0XHRcdGZvciAoaW5kZXg9MDtpbmRleDxzaXplOysraW5kZXgpXHJcblxyXG5cdFx0XHRcdG91dHB1dFtpbmRleF0gPSBQdWJsaWMuY2xvbmUoaW5wdXRbaW5kZXhdKTtcclxuXHJcblx0XHR9IGVsc2UgaWYgKHR5cGUgPT09ICdvYmplY3QnKSB7XHJcblxyXG5cdFx0XHRvdXRwdXQgPSB7fTtcclxuXHJcblx0XHRcdGZvciAoaW5kZXggaW4gaW5wdXQpXHJcblxyXG5cdFx0XHRcdG91dHB1dFtpbmRleF0gPSBQdWJsaWMuY2xvbmUoaW5wdXRbaW5kZXhdKTtcclxuXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIG91dHB1dDtcclxuXHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogTWVyZ2UgdHdvIG9iamVjdHMgcmVjdXJzaXZlbHlcclxuXHQgKiBAcGFyYW0gbWl4ZWQgaW5wdXRcclxuXHQgKiBAcGFyYW0gbWl4ZWQgZXh0ZW5kXHJcblx0ICogQHJldHVybiBtaXhlZFxyXG5cdCAqL1xyXG5cclxuXHRmdW5jdGlvbiBtZXJnZV9yZWN1cnNpdmUoYmFzZSwgZXh0ZW5kKSB7XHJcblxyXG5cdFx0aWYgKHR5cGVPZihiYXNlKSAhPT0gJ29iamVjdCcpXHJcblxyXG5cdFx0XHRyZXR1cm4gZXh0ZW5kO1xyXG5cclxuXHRcdGZvciAodmFyIGtleSBpbiBleHRlbmQpIHtcclxuXHJcblx0XHRcdGlmICh0eXBlT2YoYmFzZVtrZXldKSA9PT0gJ29iamVjdCcgJiYgdHlwZU9mKGV4dGVuZFtrZXldKSA9PT0gJ29iamVjdCcpIHtcclxuXHJcblx0XHRcdFx0YmFzZVtrZXldID0gbWVyZ2VfcmVjdXJzaXZlKGJhc2Vba2V5XSwgZXh0ZW5kW2tleV0pO1xyXG5cclxuXHRcdFx0fSBlbHNlIHtcclxuXHJcblx0XHRcdFx0YmFzZVtrZXldID0gZXh0ZW5kW2tleV07XHJcblxyXG5cdFx0XHR9XHJcblxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBiYXNlO1xyXG5cclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIE1lcmdlIHR3byBvciBtb3JlIG9iamVjdHNcclxuXHQgKiBAcGFyYW0gYm9vbCBjbG9uZVxyXG5cdCAqIEBwYXJhbSBib29sIHJlY3Vyc2l2ZVxyXG5cdCAqIEBwYXJhbSBhcnJheSBhcmd2XHJcblx0ICogQHJldHVybiBvYmplY3RcclxuXHQgKi9cclxuXHJcblx0ZnVuY3Rpb24gbWVyZ2UoY2xvbmUsIHJlY3Vyc2l2ZSwgYXJndikge1xyXG5cclxuXHRcdHZhciByZXN1bHQgPSBhcmd2WzBdLFxyXG5cdFx0XHRzaXplID0gYXJndi5sZW5ndGg7XHJcblxyXG5cdFx0aWYgKGNsb25lIHx8IHR5cGVPZihyZXN1bHQpICE9PSAnb2JqZWN0JylcclxuXHJcblx0XHRcdHJlc3VsdCA9IHt9O1xyXG5cclxuXHRcdGZvciAodmFyIGluZGV4PTA7aW5kZXg8c2l6ZTsrK2luZGV4KSB7XHJcblxyXG5cdFx0XHR2YXIgaXRlbSA9IGFyZ3ZbaW5kZXhdLFxyXG5cclxuXHRcdFx0XHR0eXBlID0gdHlwZU9mKGl0ZW0pO1xyXG5cclxuXHRcdFx0aWYgKHR5cGUgIT09ICdvYmplY3QnKSBjb250aW51ZTtcclxuXHJcblx0XHRcdGZvciAodmFyIGtleSBpbiBpdGVtKSB7XHJcblxyXG5cdFx0XHRcdHZhciBzaXRlbSA9IGNsb25lID8gUHVibGljLmNsb25lKGl0ZW1ba2V5XSkgOiBpdGVtW2tleV07XHJcblxyXG5cdFx0XHRcdGlmIChyZWN1cnNpdmUpIHtcclxuXHJcblx0XHRcdFx0XHRyZXN1bHRba2V5XSA9IG1lcmdlX3JlY3Vyc2l2ZShyZXN1bHRba2V5XSwgc2l0ZW0pO1xyXG5cclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cclxuXHRcdFx0XHRcdHJlc3VsdFtrZXldID0gc2l0ZW07XHJcblxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdH1cclxuXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHJlc3VsdDtcclxuXHJcblx0fVxyXG5cclxuXHQvKipcclxuXHQgKiBHZXQgdHlwZSBvZiB2YXJpYWJsZVxyXG5cdCAqIEBwYXJhbSBtaXhlZCBpbnB1dFxyXG5cdCAqIEByZXR1cm4gc3RyaW5nXHJcblx0ICpcclxuXHQgKiBAc2VlIGh0dHA6Ly9qc3BlcmYuY29tL3R5cGVvZnZhclxyXG5cdCAqL1xyXG5cclxuXHRmdW5jdGlvbiB0eXBlT2YoaW5wdXQpIHtcclxuXHJcblx0XHRyZXR1cm4gKHt9KS50b1N0cmluZy5jYWxsKGlucHV0KS5zbGljZSg4LCAtMSkudG9Mb3dlckNhc2UoKTtcclxuXHJcblx0fVxyXG5cclxuXHRpZiAoaXNOb2RlKSB7XHJcblxyXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBQdWJsaWM7XHJcblxyXG5cdH0gZWxzZSB7XHJcblxyXG5cdFx0d2luZG93W3B1YmxpY05hbWVdID0gUHVibGljO1xyXG5cclxuXHR9XHJcblxyXG59KSh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzID09PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cyk7IiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjkuM1xuKGZ1bmN0aW9uKCkge1xuICB2YXIgQXV0aENvbnRyb2xsZXIsXG4gICAgYmluZCA9IGZ1bmN0aW9uKGZuLCBtZSl7IHJldHVybiBmdW5jdGlvbigpeyByZXR1cm4gZm4uYXBwbHkobWUsIGFyZ3VtZW50cyk7IH07IH07XG5cbiAgQXV0aENvbnRyb2xsZXIgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gQXV0aENvbnRyb2xsZXIoJHNjb3BlLCAkaHR0cCkge1xuICAgICAgdGhpcy4kc2NvcGUgPSAkc2NvcGU7XG4gICAgICB0aGlzLiRodHRwID0gJGh0dHA7XG4gICAgICB0aGlzLl9zZXRUb2tlbiA9IGJpbmQodGhpcy5fc2V0VG9rZW4sIHRoaXMpO1xuICAgICAgdGhpcy5faW5pdCA9IGJpbmQodGhpcy5faW5pdCwgdGhpcyk7XG4gICAgICB0aGlzLiRzY29wZS5tZXNzYWdlID0gbnVsbDtcbiAgICAgIHRoaXMuJHNjb3BlLnNhbmRib3ggPSB7XG4gICAgICAgIHRva2VuOiBudWxsLFxuICAgICAgICB1c2VybmFtZTogbnVsbFxuICAgICAgfTtcbiAgICAgIHRoaXMuJHNjb3BlLnByb2R1Y3Rpb24gPSB7XG4gICAgICAgIHRva2VuOiBudWxsLFxuICAgICAgICB1c2VybmFtZTogbnVsbFxuICAgICAgfTtcbiAgICAgIHRoaXMuJHNjb3BlLnNldFRva2VuID0gdGhpcy5fc2V0VG9rZW47XG4gICAgICB0aGlzLl9pbml0KCk7XG4gICAgfVxuXG4gICAgQXV0aENvbnRyb2xsZXIucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy4kaHR0cC5nZXQoJy9hdXRoL3Rva2VuJykuZXJyb3IoKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGRhdGEpO1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpLnN1Y2Nlc3MoKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgX3RoaXMuJHNjb3BlLnByb2R1Y3Rpb24gPSBkYXRhO1xuICAgICAgICAgIHJldHVybiBfdGhpcy4kaHR0cC5wb3N0KCcvYXV0aC90b2tlbicsIHtcbiAgICAgICAgICAgIHNhbmRib3g6IHRydWVcbiAgICAgICAgICB9KS5lcnJvcihmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZGF0YSk7XG4gICAgICAgICAgfSkuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuJHNjb3BlLnNhbmRib3ggPSBkYXRhO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpO1xuICAgIH07XG5cbiAgICBBdXRoQ29udHJvbGxlci5wcm90b3R5cGUuX3NldFRva2VuID0gZnVuY3Rpb24oc2FuZGJveCkge1xuICAgICAgdmFyIHRva2VuO1xuICAgICAgdG9rZW4gPSBwcm9tcHQoXCJJbnB1dCBkZXZlbG9wZXIgdG9rZW4gKFwiICsgKHNhbmRib3ggPyAnc2FuZGJveCcgOiAncHJvZHVjdGlvbicpICsgXCIpXCIpO1xuICAgICAgaWYgKCF0b2tlbikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy4kaHR0cC5wb3N0KCcvYXV0aC90b2tlbicsIHtcbiAgICAgICAgc2FuZGJveDogc2FuZGJveCxcbiAgICAgICAgdG9rZW46IHRva2VuXG4gICAgICB9KS5zdWNjZXNzKChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgIGlmIChzYW5kYm94KSB7XG4gICAgICAgICAgICBfdGhpcy4kc2NvcGUuc2FuZGJveCA9IGRhdGE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIF90aGlzLiRzY29wZS5wcm9kdWN0aW9uID0gZGF0YTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4gYWxlcnQoJ1Rva2VuIGlzIGludmFsaWQuJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpLmVycm9yKChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgIHJldHVybiBjYWxsYmFjaygnU2V0IHRva2VuIGZhaWxlZC4nKTtcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIEF1dGhDb250cm9sbGVyO1xuXG4gIH0pKCk7XG5cbiAgYXBwLmNvbnRyb2xsZXIoJ0F1dGhDb250cm9sbGVyJywgWyckc2NvcGUnLCAnJGh0dHAnLCBBdXRoQ29udHJvbGxlcl0pO1xuXG4gIG1vZHVsZS5leHBvcnRzID0gQXV0aENvbnRyb2xsZXI7XG5cbn0pLmNhbGwodGhpcyk7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWF1dGgtY29udHJvbGxlci5qcy5tYXBcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS45LjNcbihmdW5jdGlvbigpIHtcbiAgdmFyIENvbnRyb2xsZXIsIGFzeW5jLFxuICAgIGJpbmQgPSBmdW5jdGlvbihmbiwgbWUpeyByZXR1cm4gZnVuY3Rpb24oKXsgcmV0dXJuIGZuLmFwcGx5KG1lLCBhcmd1bWVudHMpOyB9OyB9O1xuXG4gIGFzeW5jID0gcmVxdWlyZSgnYXN5bmMnKTtcblxuICBDb250cm9sbGVyID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIENvbnRyb2xsZXIoJHNjb3BlLCAkcm9vdFNjb3BlLCAkaHR0cCwgcHJvZ3Jlc3MsIG5vdGVGaWx0ZXIpIHtcbiAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xuICAgICAgdGhpcy4kcm9vdFNjb3BlID0gJHJvb3RTY29wZTtcbiAgICAgIHRoaXMuJGh0dHAgPSAkaHR0cDtcbiAgICAgIHRoaXMucHJvZ3Jlc3MgPSBwcm9ncmVzcztcbiAgICAgIHRoaXMubm90ZUZpbHRlciA9IG5vdGVGaWx0ZXI7XG4gICAgICB0aGlzLnJlbG9hZCA9IGJpbmQodGhpcy5yZWxvYWQsIHRoaXMpO1xuICAgICAgdGhpcy4kcm9vdFNjb3BlLnVzZXIgPSBudWxsO1xuICAgICAgdGhpcy4kcm9vdFNjb3BlLnBlcnNvbnMgPSB7fTtcbiAgICAgIHRoaXMuJHJvb3RTY29wZS5ub3RlYm9va3MgPSB7fTtcbiAgICAgIHRoaXMuJHJvb3RTY29wZS5zdGFja3MgPSBbXTtcbiAgICAgIHRoaXMuJHJvb3RTY29wZS5ub3RlcyA9IHt9O1xuICAgICAgdGhpcy4kcm9vdFNjb3BlLnRpbWVMb2dzID0ge307XG4gICAgICB0aGlzLiRyb290U2NvcGUucHJvZml0TG9ncyA9IHt9O1xuICAgICAgdGhpcy4kc2NvcGUucmVsb2FkID0gdGhpcy5yZWxvYWQ7XG4gICAgICB0aGlzLnJlbG9hZCgoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge307XG4gICAgICB9KSh0aGlzKSk7XG4gICAgfVxuXG4gICAgQ29udHJvbGxlci5wcm90b3R5cGUucmVsb2FkID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgIHZhciBub3RlQ291bnQsIHF1ZXJ5O1xuICAgICAgaWYgKCFjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHt9O1xuICAgICAgICB9KSh0aGlzKTtcbiAgICAgIH1cbiAgICAgIHF1ZXJ5ID0gdGhpcy5ub3RlRmlsdGVyLnF1ZXJ5KCk7XG4gICAgICBub3RlQ291bnQgPSAwO1xuICAgICAgdGhpcy5wcm9ncmVzcy5vcGVuKCk7XG4gICAgICByZXR1cm4gYXN5bmMuc2VyaWVzKFtcbiAgICAgICAgKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpZiAoX3RoaXMuJHJvb3RTY29wZS51c2VyKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3Muc2V0KCdHZXR0aW5nIHVzZXIgZGF0YS4nLCAwKTtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy4kaHR0cC5nZXQoJy91c2VyJykuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgIF90aGlzLiRyb290U2NvcGUudXNlciA9IGRhdGE7XG4gICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfSkuZXJyb3IoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygnRXJyb3IgJGh0dHAgcmVxdWVzdCcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSkodGhpcyksIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3Muc2V0KCdTeW5jaW5nIHJlbW90ZSBzZXJ2ZXIuJywgMCk7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuJGh0dHAuZ2V0KCcvc3luYycpLnN1Y2Nlc3MoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfSkuZXJyb3IoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygnRXJyb3IgJGh0dHAgcmVxdWVzdCcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSkodGhpcyksIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3Muc2V0KCdHZXR0aW5nIHBlcnNvbnMgZGF0YS4nLCAxMCk7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuJGh0dHAuZ2V0KCcvcGVyc29ucycpLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICB2YXIgaSwgbGVuLCBwZXJzb247XG4gICAgICAgICAgICAgIF90aGlzLiRyb290U2NvcGUucGVyc29ucyA9IHt9O1xuICAgICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBkYXRhLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcGVyc29uID0gZGF0YVtpXTtcbiAgICAgICAgICAgICAgICBfdGhpcy4kcm9vdFNjb3BlLnBlcnNvbnNbcGVyc29uXSA9IHBlcnNvbjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH0pLmVycm9yKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soJ0Vycm9yICRodHRwIHJlcXVlc3QnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH07XG4gICAgICAgIH0pKHRoaXMpLCAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgIF90aGlzLnByb2dyZXNzLnNldCgnR2V0dGluZyBub3RlYm9va3MgZGF0YS4nLCAyMCk7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuJGh0dHAuZ2V0KCcvbm90ZWJvb2tzJykuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgIHZhciBpLCBsZW4sIG5vdGVib29rLCBzdGFja0hhc2g7XG4gICAgICAgICAgICAgIF90aGlzLiRyb290U2NvcGUubm90ZWJvb2tzID0ge307XG4gICAgICAgICAgICAgIHN0YWNrSGFzaCA9IHt9O1xuICAgICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBkYXRhLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbm90ZWJvb2sgPSBkYXRhW2ldO1xuICAgICAgICAgICAgICAgIF90aGlzLiRyb290U2NvcGUubm90ZWJvb2tzW25vdGVib29rLmd1aWRdID0gbm90ZWJvb2s7XG4gICAgICAgICAgICAgICAgaWYgKG5vdGVib29rLnN0YWNrKSB7XG4gICAgICAgICAgICAgICAgICBzdGFja0hhc2hbbm90ZWJvb2suc3RhY2tdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgX3RoaXMuJHJvb3RTY29wZS5zdGFja3MgPSBPYmplY3Qua2V5cyhzdGFja0hhc2gpO1xuICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH0pLmVycm9yKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soJ0Vycm9yICRodHRwIHJlcXVlc3QnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH07XG4gICAgICAgIH0pKHRoaXMpLCAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgIF90aGlzLnByb2dyZXNzLnNldCgnR2V0dGluZyBub3RlcyBjb3VudC4nLCAzMCk7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuJGh0dHAuZ2V0KCcvbm90ZXMvY291bnQnLCB7XG4gICAgICAgICAgICAgIHBhcmFtczoge1xuICAgICAgICAgICAgICAgIHF1ZXJ5OiBxdWVyeVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgbm90ZUNvdW50ID0gZGF0YTtcbiAgICAgICAgICAgICAgaWYgKG5vdGVDb3VudCA+IDEwMCkge1xuICAgICAgICAgICAgICAgIGlmICh3aW5kb3cuY29uZmlybShcIkN1cnJlbnQgcXVlcnkgZmluZCBcIiArIG5vdGVDb3VudCArIFwiIG5vdGVzLiBJdCBpcyB0b28gbWFueS4gQ29udGludWUgYW55d2F5P1wiKSkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygnVXNlciBDYW5jZWxlZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkuZXJyb3IoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygnRXJyb3IgJGh0dHAgcmVxdWVzdCcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSkodGhpcyksIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3Muc2V0KCdSZXF1ZXN0IHJlbW90ZSBjb250ZW50cy4nLCA0MCk7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuJGh0dHAuZ2V0KCcvbm90ZXMvZ2V0LWNvbnRlbnQnLCB7XG4gICAgICAgICAgICAgIHBhcmFtczoge1xuICAgICAgICAgICAgICAgIHF1ZXJ5OiBxdWVyeVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KS5zdWNjZXNzKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH0pLmVycm9yKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soJ0Vycm9yICRodHRwIHJlcXVlc3QnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH07XG4gICAgICAgIH0pKHRoaXMpLCAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgIF90aGlzLnByb2dyZXNzLnNldCgnR2V0dGluZyBub3Rlcy4nLCA2MCk7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuJGh0dHAuZ2V0KCcvbm90ZXMnLCB7XG4gICAgICAgICAgICAgIHBhcmFtczoge1xuICAgICAgICAgICAgICAgIHF1ZXJ5OiBxdWVyeSxcbiAgICAgICAgICAgICAgICBjb250ZW50OiBmYWxzZVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgdmFyIGksIGxlbiwgbm90ZTtcbiAgICAgICAgICAgICAgX3RoaXMuJHJvb3RTY29wZS5ub3RlcyA9IHt9O1xuICAgICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBkYXRhLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbm90ZSA9IGRhdGFbaV07XG4gICAgICAgICAgICAgICAgX3RoaXMuJHJvb3RTY29wZS5ub3Rlc1tub3RlLmd1aWRdID0gbm90ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH0pLmVycm9yKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soJ0Vycm9yICRodHRwIHJlcXVlc3QnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH07XG4gICAgICAgIH0pKHRoaXMpLCAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBndWlkcywgbm90ZSwgbm90ZUd1aWQ7XG4gICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5zZXQoJ0dldHRpbmcgdGltZSBsb2dzLicsIDgwKTtcbiAgICAgICAgICAgIGd1aWRzID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICB2YXIgcmVmLCByZXN1bHRzO1xuICAgICAgICAgICAgICByZWYgPSB0aGlzLiRyb290U2NvcGUubm90ZXM7XG4gICAgICAgICAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgICAgZm9yIChub3RlR3VpZCBpbiByZWYpIHtcbiAgICAgICAgICAgICAgICBub3RlID0gcmVmW25vdGVHdWlkXTtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gobm90ZS5ndWlkKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgICAgICAgIH0pLmNhbGwoX3RoaXMpO1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzLiRodHRwLnBvc3QoJy90aW1lLWxvZ3MnLCB7XG4gICAgICAgICAgICAgIHF1ZXJ5OiB7XG4gICAgICAgICAgICAgICAgbm90ZUd1aWQ6IHtcbiAgICAgICAgICAgICAgICAgICRpbjogZ3VpZHNcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICB2YXIgYmFzZSwgaSwgbGVuLCBuYW1lLCB0aW1lTG9nO1xuICAgICAgICAgICAgICBfdGhpcy4kcm9vdFNjb3BlLnRpbWVMb2dzID0ge307XG4gICAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aW1lTG9nID0gZGF0YVtpXTtcbiAgICAgICAgICAgICAgICBpZiAoKGJhc2UgPSBfdGhpcy4kcm9vdFNjb3BlLnRpbWVMb2dzKVtuYW1lID0gdGltZUxvZy5ub3RlR3VpZF0gPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgYmFzZVtuYW1lXSA9IHt9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfdGhpcy4kcm9vdFNjb3BlLnRpbWVMb2dzW3RpbWVMb2cubm90ZUd1aWRdW3RpbWVMb2cuX2lkXSA9IHRpbWVMb2c7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9KS5lcnJvcihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCdFcnJvciAkaHR0cCByZXF1ZXN0Jyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9O1xuICAgICAgICB9KSh0aGlzKSwgKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgZ3VpZHMsIG5vdGUsIG5vdGVHdWlkO1xuICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3Muc2V0KCdHZXR0aW5nIHByb2ZpdCBsb2dzLicsIDkwKTtcbiAgICAgICAgICAgIGd1aWRzID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICB2YXIgcmVmLCByZXN1bHRzO1xuICAgICAgICAgICAgICByZWYgPSB0aGlzLiRyb290U2NvcGUubm90ZXM7XG4gICAgICAgICAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgICAgZm9yIChub3RlR3VpZCBpbiByZWYpIHtcbiAgICAgICAgICAgICAgICBub3RlID0gcmVmW25vdGVHdWlkXTtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gobm90ZS5ndWlkKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgICAgICAgIH0pLmNhbGwoX3RoaXMpO1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzLiRodHRwLnBvc3QoJy9wcm9maXQtbG9ncycsIHtcbiAgICAgICAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICAgICAgICBub3RlR3VpZDoge1xuICAgICAgICAgICAgICAgICAgJGluOiBndWlkc1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgIHZhciBiYXNlLCBpLCBsZW4sIG5hbWUsIHByb2ZpdExvZztcbiAgICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuID0gZGF0YS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIHByb2ZpdExvZyA9IGRhdGFbaV07XG4gICAgICAgICAgICAgICAgaWYgKChiYXNlID0gX3RoaXMuJHJvb3RTY29wZS5wcm9maXRMb2dzKVtuYW1lID0gcHJvZml0TG9nLm5vdGVHdWlkXSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICBiYXNlW25hbWVdID0ge307XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF90aGlzLiRyb290U2NvcGUucHJvZml0TG9nc1twcm9maXRMb2cubm90ZUd1aWRdW3Byb2ZpdExvZy5faWRdID0gcHJvZml0TG9nO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfSkuZXJyb3IoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygnRXJyb3IgJGh0dHAgcmVxdWVzdCcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSkodGhpcylcbiAgICAgIF0sIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgX3RoaXMucHJvZ3Jlc3Muc2V0KCdEb25lLicsIDEwMCk7XG4gICAgICAgICAgX3RoaXMucHJvZ3Jlc3MuY2xvc2UoKTtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgfTtcblxuICAgIHJldHVybiBDb250cm9sbGVyO1xuXG4gIH0pKCk7XG5cbiAgYXBwLmNvbnRyb2xsZXIoJ0NvbnRyb2xsZXInLCBbJyRzY29wZScsICckcm9vdFNjb3BlJywgJyRodHRwJywgJ3Byb2dyZXNzJywgJ25vdGVGaWx0ZXInLCBDb250cm9sbGVyXSk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBDb250cm9sbGVyO1xuXG59KS5jYWxsKHRoaXMpO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1jb250cm9sbGVyLmpzLm1hcFxuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjkuM1xuKGZ1bmN0aW9uKCkge1xuICB2YXIgTWVudUNvbnRyb2xsZXIsXG4gICAgYmluZCA9IGZ1bmN0aW9uKGZuLCBtZSl7IHJldHVybiBmdW5jdGlvbigpeyByZXR1cm4gZm4uYXBwbHkobWUsIGFyZ3VtZW50cyk7IH07IH07XG5cbiAgTWVudUNvbnRyb2xsZXIgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gTWVudUNvbnRyb2xsZXIoJHNjb3BlLCAkaHR0cCwgbm90ZUZpbHRlcikge1xuICAgICAgdGhpcy4kc2NvcGUgPSAkc2NvcGU7XG4gICAgICB0aGlzLiRodHRwID0gJGh0dHA7XG4gICAgICB0aGlzLm5vdGVGaWx0ZXIgPSBub3RlRmlsdGVyO1xuICAgICAgdGhpcy5fb25XYXRjaE5vdGVGaWx0ZXIgPSBiaW5kKHRoaXMuX29uV2F0Y2hOb3RlRmlsdGVyLCB0aGlzKTtcbiAgICAgIHRoaXMuJHNjb3BlLm5vdGVGaWx0ZXIgPSB0aGlzLm5vdGVGaWx0ZXI7XG4gICAgICB0aGlzLiRzY29wZS4kd2F0Y2hHcm91cChbJ25vdGVGaWx0ZXIudXBkYXRlZCcsICdub3RlRmlsdGVyLm5vdGVib29rcycsICdub3RlRmlsdGVyLnN0YWNrcyddLCB0aGlzLl9vbldhdGNoTm90ZUZpbHRlcik7XG4gICAgfVxuXG4gICAgTWVudUNvbnRyb2xsZXIucHJvdG90eXBlLl9vbldhdGNoTm90ZUZpbHRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHF1ZXJ5LCBxdWVyeVN0cjtcbiAgICAgIHF1ZXJ5ID0gdGhpcy5ub3RlRmlsdGVyLnF1ZXJ5KCk7XG4gICAgICBxdWVyeVN0ciA9IEpTT04uc3RyaW5naWZ5KHF1ZXJ5KTtcbiAgICAgIGlmICh0aGlzLmxhc3RRdWVyeVN0ciA9PT0gcXVlcnlTdHIpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5sYXN0UXVlcnlTdHIgPSBxdWVyeVN0cjtcbiAgICAgIHJldHVybiB0aGlzLiRodHRwLmdldCgnL25vdGVzL2NvdW50Jywge1xuICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICBxdWVyeTogcXVlcnlcbiAgICAgICAgfVxuICAgICAgfSkuc3VjY2VzcygoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICByZXR1cm4gX3RoaXMubm90ZUZpbHRlci5jb3VudCA9IGRhdGE7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSkuZXJyb3IoKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gX3RoaXMubm90ZUZpbHRlci5jb3VudCA9IG51bGw7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgfTtcblxuICAgIHJldHVybiBNZW51Q29udHJvbGxlcjtcblxuICB9KSgpO1xuXG4gIGFwcC5jb250cm9sbGVyKCdNZW51Q29udHJvbGxlcicsIFsnJHNjb3BlJywgJyRodHRwJywgJ25vdGVGaWx0ZXInLCBNZW51Q29udHJvbGxlcl0pO1xuXG4gIG1vZHVsZS5leHBvcnRzID0gTWVudUNvbnRyb2xsZXI7XG5cbn0pLmNhbGwodGhpcyk7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1lbnUtY29udHJvbGxlci5qcy5tYXBcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS45LjNcbihmdW5jdGlvbigpIHtcbiAgdmFyIE1vZGFsQ29udHJvbGxlcjtcblxuICBNb2RhbENvbnRyb2xsZXIgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gTW9kYWxDb250cm9sbGVyKCRzY29wZSkge1xuICAgICAgdGhpcy4kc2NvcGUgPSAkc2NvcGU7XG4gICAgfVxuXG4gICAgcmV0dXJuIE1vZGFsQ29udHJvbGxlcjtcblxuICB9KSgpO1xuXG4gIGFwcC5jb250cm9sbGVyKCdNb2RhbENvbnRyb2xsZXInLCBbJyRzY29wZScsIE1vZGFsQ29udHJvbGxlcl0pO1xuXG4gIG1vZHVsZS5leHBvcnRzID0gTW9kYWxDb250cm9sbGVyO1xuXG59KS5jYWxsKHRoaXMpO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1tb2RhbC1jb250cm9sbGVyLmpzLm1hcFxuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjkuM1xyXG4oZnVuY3Rpb24oKSB7XHJcbiAgdmFyIE5hdmlnYXRpb25Db250cm9sbGVyO1xyXG5cclxuICBOYXZpZ2F0aW9uQ29udHJvbGxlciA9IChmdW5jdGlvbigpIHtcclxuICAgIGZ1bmN0aW9uIE5hdmlnYXRpb25Db250cm9sbGVyKCRzY29wZSwgJHJvdXRlKSB7XHJcbiAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xyXG4gICAgICB0aGlzLiRyb3V0ZSA9ICRyb3V0ZTtcclxuICAgICAgdGhpcy4kc2NvcGUubmF2Q29sbGFwc2UgPSB0cnVlO1xyXG4gICAgICB0aGlzLiRzY29wZS4kcm91dGUgPSB0aGlzLiRyb3V0ZTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gTmF2aWdhdGlvbkNvbnRyb2xsZXI7XHJcblxyXG4gIH0pKCk7XHJcblxyXG4gIGFwcC5jb250cm9sbGVyKCdOYXZpZ2F0aW9uQ29udHJvbGxlcicsIFsnJHNjb3BlJywgJyRyb3V0ZScsIE5hdmlnYXRpb25Db250cm9sbGVyXSk7XHJcblxyXG4gIG1vZHVsZS5leHBvcnRzID0gTmF2aWdhdGlvbkNvbnRyb2xsZXI7XHJcblxyXG59KS5jYWxsKHRoaXMpO1xyXG5cclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bmF2aWdhdGlvbi1jb250cm9sbGVyLmpzLm1hcFxyXG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuOS4zXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBOb3Rlc0NvbnRyb2xsZXIsXG4gICAgYmluZCA9IGZ1bmN0aW9uKGZuLCBtZSl7IHJldHVybiBmdW5jdGlvbigpeyByZXR1cm4gZm4uYXBwbHkobWUsIGFyZ3VtZW50cyk7IH07IH07XG5cbiAgTm90ZXNDb250cm9sbGVyID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIE5vdGVzQ29udHJvbGxlcigkc2NvcGUpIHtcbiAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xuICAgICAgdGhpcy5fb25XYXRjaFByb2ZpdExvZ3MgPSBiaW5kKHRoaXMuX29uV2F0Y2hQcm9maXRMb2dzLCB0aGlzKTtcbiAgICAgIHRoaXMuX29uV2F0Y2hUaW1lTG9ncyA9IGJpbmQodGhpcy5fb25XYXRjaFRpbWVMb2dzLCB0aGlzKTtcbiAgICAgIHRoaXMuJHNjb3BlLm5vdGVzU3BlbnRUaW1lcyA9IHt9O1xuICAgICAgdGhpcy4kc2NvcGUubm90ZXNQcm9maXRzID0ge307XG4gICAgICB0aGlzLiRzY29wZS5leGlzdFBlcnNvbnMgPSBbXTtcbiAgICAgIHRoaXMuJHNjb3BlLiR3YXRjaENvbGxlY3Rpb24oJ3RpbWVMb2dzJywgdGhpcy5fb25XYXRjaFRpbWVMb2dzKTtcbiAgICAgIHRoaXMuJHNjb3BlLiR3YXRjaENvbGxlY3Rpb24oJ3Byb2ZpdExvZ3MnLCB0aGlzLl9vbldhdGNoUHJvZml0TG9ncyk7XG4gICAgfVxuXG4gICAgTm90ZXNDb250cm9sbGVyLnByb3RvdHlwZS5fb25XYXRjaFRpbWVMb2dzID0gZnVuY3Rpb24odGltZUxvZ3MpIHtcbiAgICAgIHZhciBiYXNlLCBiYXNlMSwgYmFzZTIsIGJhc2UzLCBiYXNlNCwgYmFzZTUsIG5hbWUsIG5hbWUxLCBuYW1lMiwgbm90ZUd1aWQsIG5vdGVUaW1lTG9nLCBwZXJzb25zLCB0aW1lTG9nLCB0aW1lTG9nX2lkO1xuICAgICAgdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzID0ge307XG4gICAgICBwZXJzb25zID0ge307XG4gICAgICBmb3IgKG5vdGVHdWlkIGluIHRpbWVMb2dzKSB7XG4gICAgICAgIG5vdGVUaW1lTG9nID0gdGltZUxvZ3Nbbm90ZUd1aWRdO1xuICAgICAgICBmb3IgKHRpbWVMb2dfaWQgaW4gbm90ZVRpbWVMb2cpIHtcbiAgICAgICAgICB0aW1lTG9nID0gbm90ZVRpbWVMb2dbdGltZUxvZ19pZF07XG4gICAgICAgICAgaWYgKChiYXNlID0gdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzKVtuYW1lID0gdGltZUxvZy5ub3RlR3VpZF0gPT0gbnVsbCkge1xuICAgICAgICAgICAgYmFzZVtuYW1lXSA9IHt9O1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoKGJhc2UxID0gdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzW3RpbWVMb2cubm90ZUd1aWRdKVsnJHRvdGFsJ10gPT0gbnVsbCkge1xuICAgICAgICAgICAgYmFzZTFbJyR0b3RhbCddID0gMDtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzW3RpbWVMb2cubm90ZUd1aWRdWyckdG90YWwnXSArPSB0aW1lTG9nLnNwZW50VGltZTtcbiAgICAgICAgICBpZiAoKGJhc2UyID0gdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzW3RpbWVMb2cubm90ZUd1aWRdKVtuYW1lMSA9IHRpbWVMb2cucGVyc29uXSA9PSBudWxsKSB7XG4gICAgICAgICAgICBiYXNlMltuYW1lMV0gPSAwO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLiRzY29wZS5ub3Rlc1NwZW50VGltZXNbdGltZUxvZy5ub3RlR3VpZF1bdGltZUxvZy5wZXJzb25dICs9IHRpbWVMb2cuc3BlbnRUaW1lO1xuICAgICAgICAgIGlmICgoYmFzZTMgPSB0aGlzLiRzY29wZS5ub3Rlc1NwZW50VGltZXMpWyckdG90YWwnXSA9PSBudWxsKSB7XG4gICAgICAgICAgICBiYXNlM1snJHRvdGFsJ10gPSB7fTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKChiYXNlNCA9IHRoaXMuJHNjb3BlLm5vdGVzU3BlbnRUaW1lc1snJHRvdGFsJ10pWyckdG90YWwnXSA9PSBudWxsKSB7XG4gICAgICAgICAgICBiYXNlNFsnJHRvdGFsJ10gPSAwO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLiRzY29wZS5ub3Rlc1NwZW50VGltZXNbJyR0b3RhbCddWyckdG90YWwnXSArPSB0aW1lTG9nLnNwZW50VGltZTtcbiAgICAgICAgICBpZiAoKGJhc2U1ID0gdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzWyckdG90YWwnXSlbbmFtZTIgPSB0aW1lTG9nLnBlcnNvbl0gPT0gbnVsbCkge1xuICAgICAgICAgICAgYmFzZTVbbmFtZTJdID0gMDtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzWyckdG90YWwnXVt0aW1lTG9nLnBlcnNvbl0gKz0gdGltZUxvZy5zcGVudFRpbWU7XG4gICAgICAgICAgaWYgKHRpbWVMb2cuc3BlbnRUaW1lID4gMCkge1xuICAgICAgICAgICAgcGVyc29uc1t0aW1lTG9nLnBlcnNvbl0gPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuJHNjb3BlLmV4aXN0UGVyc29ucyA9IE9iamVjdC5rZXlzKHBlcnNvbnMpO1xuICAgIH07XG5cbiAgICBOb3Rlc0NvbnRyb2xsZXIucHJvdG90eXBlLl9vbldhdGNoUHJvZml0TG9ncyA9IGZ1bmN0aW9uKHByb2ZpdExvZ3MpIHtcbiAgICAgIHZhciBiYXNlLCBiYXNlMSwgYmFzZTIsIGJhc2UzLCBjYWxjLCBuYW1lLCBub3RlR3VpZCwgbm90ZVByb2ZpdExvZywgcGVyc29uLCBwcm9maXRMb2csIHByb2ZpdExvZ19pZCwgcmVzdWx0cztcbiAgICAgIGNhbGMgPSAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKG5vdGVHdWlkLCBwZXJzb24pIHtcbiAgICAgICAgICB2YXIgcmVmLCByZWYxO1xuICAgICAgICAgIGlmICghKChyZWYgPSBfdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzW25vdGVHdWlkXSkgIT0gbnVsbCA/IHJlZltwZXJzb25dIDogdm9pZCAwKSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghKChyZWYxID0gX3RoaXMuJHNjb3BlLm5vdGVzU3BlbnRUaW1lc1tub3RlR3VpZF0pICE9IG51bGwgPyByZWYxWyckdG90YWwnXSA6IHZvaWQgMCkpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZChfdGhpcy4kc2NvcGUubm90ZXNQcm9maXRzW25vdGVHdWlkXVsnJHRvdGFsJ10gKiBfdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzW25vdGVHdWlkXVtwZXJzb25dIC8gX3RoaXMuJHNjb3BlLm5vdGVzU3BlbnRUaW1lc1tub3RlR3VpZF1bJyR0b3RhbCddKTtcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpO1xuICAgICAgdGhpcy4kc2NvcGUubm90ZXNQcm9maXRzID0ge307XG4gICAgICByZXN1bHRzID0gW107XG4gICAgICBmb3IgKG5vdGVHdWlkIGluIHByb2ZpdExvZ3MpIHtcbiAgICAgICAgbm90ZVByb2ZpdExvZyA9IHByb2ZpdExvZ3Nbbm90ZUd1aWRdO1xuICAgICAgICBmb3IgKHByb2ZpdExvZ19pZCBpbiBub3RlUHJvZml0TG9nKSB7XG4gICAgICAgICAgcHJvZml0TG9nID0gbm90ZVByb2ZpdExvZ1twcm9maXRMb2dfaWRdO1xuICAgICAgICAgIGlmICgoYmFzZSA9IHRoaXMuJHNjb3BlLm5vdGVzUHJvZml0cylbbmFtZSA9IHByb2ZpdExvZy5ub3RlR3VpZF0gPT0gbnVsbCkge1xuICAgICAgICAgICAgYmFzZVtuYW1lXSA9IHt9O1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoKGJhc2UxID0gdGhpcy4kc2NvcGUubm90ZXNQcm9maXRzW3Byb2ZpdExvZy5ub3RlR3VpZF0pWyckdG90YWwnXSA9PSBudWxsKSB7XG4gICAgICAgICAgICBiYXNlMVsnJHRvdGFsJ10gPSAwO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLiRzY29wZS5ub3Rlc1Byb2ZpdHNbcHJvZml0TG9nLm5vdGVHdWlkXVsnJHRvdGFsJ10gKz0gcHJvZml0TG9nLnByb2ZpdDtcbiAgICAgICAgICBpZiAoKGJhc2UyID0gdGhpcy4kc2NvcGUubm90ZXNQcm9maXRzKVsnJHRvdGFsJ10gPT0gbnVsbCkge1xuICAgICAgICAgICAgYmFzZTJbJyR0b3RhbCddID0ge307XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICgoYmFzZTMgPSB0aGlzLiRzY29wZS5ub3Rlc1Byb2ZpdHNbJyR0b3RhbCddKVsnJHRvdGFsJ10gPT0gbnVsbCkge1xuICAgICAgICAgICAgYmFzZTNbJyR0b3RhbCddID0gMDtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy4kc2NvcGUubm90ZXNQcm9maXRzWyckdG90YWwnXVsnJHRvdGFsJ10gKz0gcHJvZml0TG9nLnByb2ZpdDtcbiAgICAgICAgfVxuICAgICAgICByZXN1bHRzLnB1c2goKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBpLCBsZW4sIHJlZiwgcmVzdWx0czE7XG4gICAgICAgICAgcmVmID0gdGhpcy4kc2NvcGUuZXhpc3RQZXJzb25zO1xuICAgICAgICAgIHJlc3VsdHMxID0gW107XG4gICAgICAgICAgZm9yIChpID0gMCwgbGVuID0gcmVmLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBwZXJzb24gPSByZWZbaV07XG4gICAgICAgICAgICByZXN1bHRzMS5wdXNoKHRoaXMuJHNjb3BlLm5vdGVzUHJvZml0c1tub3RlR3VpZF1bcGVyc29uXSA9IGNhbGMobm90ZUd1aWQsIHBlcnNvbikpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmVzdWx0czE7XG4gICAgICAgIH0pLmNhbGwodGhpcykpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfTtcblxuICAgIHJldHVybiBOb3Rlc0NvbnRyb2xsZXI7XG5cbiAgfSkoKTtcblxuICBhcHAuY29udHJvbGxlcignTm90ZXNDb250cm9sbGVyJywgWyckc2NvcGUnLCBOb3Rlc0NvbnRyb2xsZXJdKTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IE5vdGVzQ29udHJvbGxlcjtcblxufSkuY2FsbCh0aGlzKTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bm90ZXMtY29udHJvbGxlci5qcy5tYXBcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS45LjNcbihmdW5jdGlvbigpIHtcbiAgdmFyIE1vZGFsQ29udHJvbGxlciwgUHJvZ3Jlc3NNb2RhbENvbnRyb2xsZXIsXG4gICAgZXh0ZW5kID0gZnVuY3Rpb24oY2hpbGQsIHBhcmVudCkgeyBmb3IgKHZhciBrZXkgaW4gcGFyZW50KSB7IGlmIChoYXNQcm9wLmNhbGwocGFyZW50LCBrZXkpKSBjaGlsZFtrZXldID0gcGFyZW50W2tleV07IH0gZnVuY3Rpb24gY3RvcigpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGNoaWxkOyB9IGN0b3IucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTsgY2hpbGQucHJvdG90eXBlID0gbmV3IGN0b3IoKTsgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTsgcmV0dXJuIGNoaWxkOyB9LFxuICAgIGhhc1Byb3AgPSB7fS5oYXNPd25Qcm9wZXJ0eTtcblxuICBNb2RhbENvbnRyb2xsZXIgPSByZXF1aXJlKCcuL21vZGFsLWNvbnRyb2xsZXInKTtcblxuICBQcm9ncmVzc01vZGFsQ29udHJvbGxlciA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gICAgZXh0ZW5kKFByb2dyZXNzTW9kYWxDb250cm9sbGVyLCBzdXBlckNsYXNzKTtcblxuICAgIGZ1bmN0aW9uIFByb2dyZXNzTW9kYWxDb250cm9sbGVyKCRzY29wZSwgcHJvZ3Jlc3MpIHtcbiAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xuICAgICAgdGhpcy5wcm9ncmVzcyA9IHByb2dyZXNzO1xuICAgICAgdGhpcy4kc2NvcGUucHJvZ3Jlc3MgPSB0aGlzLnByb2dyZXNzO1xuICAgIH1cblxuICAgIHJldHVybiBQcm9ncmVzc01vZGFsQ29udHJvbGxlcjtcblxuICB9KShNb2RhbENvbnRyb2xsZXIpO1xuXG4gIGFwcC5jb250cm9sbGVyKCdQcm9ncmVzc01vZGFsQ29udHJvbGxlcicsIFsnJHNjb3BlJywgJ3Byb2dyZXNzJywgUHJvZ3Jlc3NNb2RhbENvbnRyb2xsZXJdKTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IFByb2dyZXNzTW9kYWxDb250cm9sbGVyO1xuXG59KS5jYWxsKHRoaXMpO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1wcm9ncmVzcy1tb2RhbC1jb250cm9sbGVyLmpzLm1hcFxuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjkuM1xuKGZ1bmN0aW9uKCkge1xuICB2YXIgU2V0dGluZ3NDb250cm9sbGVyLFxuICAgIGJpbmQgPSBmdW5jdGlvbihmbiwgbWUpeyByZXR1cm4gZnVuY3Rpb24oKXsgcmV0dXJuIGZuLmFwcGx5KG1lLCBhcmd1bWVudHMpOyB9OyB9O1xuXG4gIFNldHRpbmdzQ29udHJvbGxlciA9IChmdW5jdGlvbigpIHtcbiAgICBTZXR0aW5nc0NvbnRyb2xsZXIucHJvdG90eXBlLmxhc3RRdWVyeVN0ciA9IG51bGw7XG5cbiAgICBmdW5jdGlvbiBTZXR0aW5nc0NvbnRyb2xsZXIoJHNjb3BlKSB7XG4gICAgICB0aGlzLiRzY29wZSA9ICRzY29wZTtcbiAgICAgIHRoaXMuX29uV2F0Y2hQZXJzb25zID0gYmluZCh0aGlzLl9vbldhdGNoUGVyc29ucywgdGhpcyk7XG4gICAgICB0aGlzLl9hZGQgPSBiaW5kKHRoaXMuX2FkZCwgdGhpcyk7XG4gICAgICB0aGlzLl9yZW1vdmUgPSBiaW5kKHRoaXMuX3JlbW92ZSwgdGhpcyk7XG4gICAgICB0aGlzLl9kb3duID0gYmluZCh0aGlzLl9kb3duLCB0aGlzKTtcbiAgICAgIHRoaXMuX3VwID0gYmluZCh0aGlzLl91cCwgdGhpcyk7XG4gICAgICB0aGlzLiRzY29wZS51cCA9IHRoaXMuX3VwO1xuICAgICAgdGhpcy4kc2NvcGUuZG93biA9IHRoaXMuX2Rvd247XG4gICAgICB0aGlzLiRzY29wZS5yZW1vdmUgPSB0aGlzLl9yZW1vdmU7XG4gICAgICB0aGlzLiRzY29wZS5hZGQgPSB0aGlzLl9hZGQ7XG4gICAgICB0aGlzLiRzY29wZS5zdWJtaXQgPSB0aGlzLl9zdWJtaXQ7XG4gICAgICB0aGlzLiRzY29wZS4kd2F0Y2hDb2xsZWN0aW9uKCdwZXJzb25zJywgdGhpcy5fb25XYXRjaFBlcnNvbnMpO1xuICAgIH1cblxuICAgIFNldHRpbmdzQ29udHJvbGxlci5wcm90b3R5cGUuX3VwID0gZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgIGlmIChpbmRleCA9PT0gMCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy4kc2NvcGUuZWRpdFBlcnNvbnMuc3BsaWNlKGluZGV4IC0gMSwgMiwgdGhpcy4kc2NvcGUuZWRpdFBlcnNvbnNbaW5kZXhdLCB0aGlzLiRzY29wZS5lZGl0UGVyc29uc1tpbmRleCAtIDFdKTtcbiAgICB9O1xuXG4gICAgU2V0dGluZ3NDb250cm9sbGVyLnByb3RvdHlwZS5fZG93biA9IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICBpZiAoaW5kZXggPj0gdGhpcy4kc2NvcGUuZWRpdFBlcnNvbnMubGVuZ3RoIC0gMSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy4kc2NvcGUuZWRpdFBlcnNvbnMuc3BsaWNlKGluZGV4LCAyLCB0aGlzLiRzY29wZS5lZGl0UGVyc29uc1tpbmRleCArIDFdLCB0aGlzLiRzY29wZS5lZGl0UGVyc29uc1tpbmRleF0pO1xuICAgIH07XG5cbiAgICBTZXR0aW5nc0NvbnRyb2xsZXIucHJvdG90eXBlLl9yZW1vdmUgPSBmdW5jdGlvbihpbmRleCkge1xuICAgICAgcmV0dXJuIHRoaXMuJHNjb3BlLmVkaXRQZXJzb25zLnNwbGljZShpbmRleCwgMSk7XG4gICAgfTtcblxuICAgIFNldHRpbmdzQ29udHJvbGxlci5wcm90b3R5cGUuX2FkZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuJHNjb3BlLmVkaXRQZXJzb25zLnB1c2goXCJQZXJzb24gXCIgKyAodGhpcy4kc2NvcGUuZWRpdFBlcnNvbnMubGVuZ3RoICsgMSkpO1xuICAgIH07XG5cbiAgICBTZXR0aW5nc0NvbnRyb2xsZXIucHJvdG90eXBlLl9vbldhdGNoUGVyc29ucyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuJHNjb3BlLmVkaXRQZXJzb25zID0gT2JqZWN0LmtleXModGhpcy4kc2NvcGUucGVyc29ucyk7XG4gICAgfTtcblxuICAgIHJldHVybiBTZXR0aW5nc0NvbnRyb2xsZXI7XG5cbiAgfSkoKTtcblxuICBhcHAuY29udHJvbGxlcignU2V0dGluZ3NDb250cm9sbGVyJywgWyckc2NvcGUnLCBTZXR0aW5nc0NvbnRyb2xsZXJdKTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IFNldHRpbmdzQ29udHJvbGxlcjtcblxufSkuY2FsbCh0aGlzKTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c2V0dGluZ3MtY29udHJvbGxlci5qcy5tYXBcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS45LjNcbihmdW5jdGlvbigpIHtcbiAgdmFyIFRpbWVsaW5lQ29udHJvbGxlcixcbiAgICBiaW5kID0gZnVuY3Rpb24oZm4sIG1lKXsgcmV0dXJuIGZ1bmN0aW9uKCl7IHJldHVybiBmbi5hcHBseShtZSwgYXJndW1lbnRzKTsgfTsgfTtcblxuICBUaW1lbGluZUNvbnRyb2xsZXIgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gVGltZWxpbmVDb250cm9sbGVyKCRzY29wZSwgJGZpbHRlcikge1xuICAgICAgdmFyIGNvbnRhaW5lciwgb3B0aW9ucztcbiAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xuICAgICAgdGhpcy4kZmlsdGVyID0gJGZpbHRlcjtcbiAgICAgIHRoaXMuX29uUmVzaXplID0gYmluZCh0aGlzLl9vblJlc2l6ZSwgdGhpcyk7XG4gICAgICB0aGlzLl9vbldhdGNoUHJvZml0TG9ncyA9IGJpbmQodGhpcy5fb25XYXRjaFByb2ZpdExvZ3MsIHRoaXMpO1xuICAgICAgdGhpcy5fb25XYXRjaE5vdGVzID0gYmluZCh0aGlzLl9vbldhdGNoTm90ZXMsIHRoaXMpO1xuICAgICAgdGhpcy5fb25XYXRjaFBlcnNvbnMgPSBiaW5kKHRoaXMuX29uV2F0Y2hQZXJzb25zLCB0aGlzKTtcbiAgICAgIHRoaXMuJHNjb3BlLnRpbWVsaW5lSXRlbXMgPSBuZXcgdmlzLkRhdGFTZXQoKTtcbiAgICAgIHRoaXMuJHNjb3BlLnRpbWVsaW5lR3JvdXBzID0gbmV3IHZpcy5EYXRhU2V0KCk7XG4gICAgICBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGltZWxpbmUnKTtcbiAgICAgIG9wdGlvbnMgPSB7XG4gICAgICAgIG1hcmdpbjoge1xuICAgICAgICAgIGl0ZW06IDVcbiAgICAgICAgfSxcbiAgICAgICAgaGVpZ2h0OiB3aW5kb3cuaW5uZXJIZWlnaHQgLSA4MCxcbiAgICAgICAgb3JpZW50YXRpb246IHtcbiAgICAgICAgICBheGlzOiAnYm90aCcsXG4gICAgICAgICAgaXRlbTogJ3RvcCdcbiAgICAgICAgfSxcbiAgICAgICAgc3RhcnQ6IG1vbWVudCgpLnN0YXJ0T2YoJ2RheScpLFxuICAgICAgICBlbmQ6IG1vbWVudCgpLmVuZE9mKCdkYXknKSxcbiAgICAgICAgaGlkZGVuRGF0ZXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdGFydDogbW9tZW50KCkuc3VidHJhY3QoMSwgJ2RheXMnKS5zdGFydE9mKCdkYXknKS5ob3VyKDIwKSxcbiAgICAgICAgICAgIGVuZDogbW9tZW50KCkuc3RhcnRPZignZGF5JykuaG91cig4KSxcbiAgICAgICAgICAgIHJlcGVhdDogJ2RhaWx5J1xuICAgICAgICAgIH1cbiAgICAgICAgXSxcbiAgICAgICAgb3JkZXI6IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICByZXR1cm4gYS5zdGFydCAtIGIuc3RhcnQ7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICB0aGlzLiRzY29wZS50aW1lbGluZSA9IG5ldyB2aXMuVGltZWxpbmUoY29udGFpbmVyLCB0aGlzLiRzY29wZS50aW1lbGluZUl0ZW1zLCB0aGlzLiRzY29wZS50aW1lbGluZUdyb3Vwcywgb3B0aW9ucyk7XG4gICAgICB0aGlzLiRzY29wZS4kd2F0Y2hDb2xsZWN0aW9uKCdwZXJzb25zJywgdGhpcy5fb25XYXRjaFBlcnNvbnMpO1xuICAgICAgdGhpcy4kc2NvcGUuJHdhdGNoQ29sbGVjdGlvbignbm90ZXMnLCB0aGlzLl9vbldhdGNoTm90ZXMpO1xuICAgICAgdGhpcy4kc2NvcGUuJHdhdGNoQ29sbGVjdGlvbigndGltZUxvZ3MnLCB0aGlzLl9vbldhdGNoTm90ZXMpO1xuICAgICAgdGhpcy4kc2NvcGUuJHdhdGNoQ29sbGVjdGlvbigncHJvZml0TG9ncycsIHRoaXMuX29uV2F0Y2hQcm9maXRMb2dzKTtcbiAgICAgIHRoaXMuJHNjb3BlLiRvbigncmVzaXplOjpyZXNpemUnLCB0aGlzLl9vblJlc2l6ZSk7XG4gICAgfVxuXG4gICAgVGltZWxpbmVDb250cm9sbGVyLnByb3RvdHlwZS5fb25XYXRjaFBlcnNvbnMgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBrZXksIHBlcnNvbiwgcmVmO1xuICAgICAgdGhpcy4kc2NvcGUudGltZWxpbmVHcm91cHMuY2xlYXIoKTtcbiAgICAgIHJlZiA9IHRoaXMuJHNjb3BlLnBlcnNvbnM7XG4gICAgICBmb3IgKGtleSBpbiByZWYpIHtcbiAgICAgICAgcGVyc29uID0gcmVmW2tleV07XG4gICAgICAgIHRoaXMuJHNjb3BlLnRpbWVsaW5lR3JvdXBzLmFkZCh7XG4gICAgICAgICAgaWQ6IGtleSxcbiAgICAgICAgICBjb250ZW50OiBwZXJzb25cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy4kc2NvcGUudGltZWxpbmVHcm91cHMuYWRkKHtcbiAgICAgICAgaWQ6ICd1cGRhdGVkJyxcbiAgICAgICAgY29udGVudDogJ1VwZGF0ZSdcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBUaW1lbGluZUNvbnRyb2xsZXIucHJvdG90eXBlLl9vbldhdGNoTm90ZXMgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBub3RlLCBub3RlR3VpZCwgbm90ZVRpbWVMb2csIHJlZiwgcmVmMSwgcmVzdWx0cywgdGltZUxvZywgdGltZUxvZ3NfaWQ7XG4gICAgICB0aGlzLiRzY29wZS50aW1lbGluZUl0ZW1zLmNsZWFyKCk7XG4gICAgICByZWYgPSB0aGlzLiRzY29wZS5ub3RlcztcbiAgICAgIGZvciAobm90ZUd1aWQgaW4gcmVmKSB7XG4gICAgICAgIG5vdGUgPSByZWZbbm90ZUd1aWRdO1xuICAgICAgICB0aGlzLiRzY29wZS50aW1lbGluZUl0ZW1zLmFkZCh7XG4gICAgICAgICAgaWQ6IG5vdGUuZ3VpZCxcbiAgICAgICAgICBncm91cDogJ3VwZGF0ZWQnLFxuICAgICAgICAgIGNvbnRlbnQ6IFwiPGEgaHJlZj1cXFwiZXZlcm5vdGU6Ly8vdmlldy9cIiArIHRoaXMuJHNjb3BlLnVzZXIuaWQgKyBcIi9cIiArIHRoaXMuJHNjb3BlLnVzZXIuc2hhcmRJZCArIFwiL1wiICsgbm90ZS5ndWlkICsgXCIvXCIgKyBub3RlLmd1aWQgKyBcIi9cXFwiIHRpdGxlPVxcXCJcIiArIG5vdGUudGl0bGUgKyBcIlxcXCI+XCIgKyAodGhpcy4kZmlsdGVyKCdhYmJyZXZpYXRlJykobm90ZS50aXRsZSwgNDApKSArIFwiPC9hPlwiLFxuICAgICAgICAgIHN0YXJ0OiBuZXcgRGF0ZShub3RlLnVwZGF0ZWQpLFxuICAgICAgICAgIHR5cGU6ICdwb2ludCdcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZWYxID0gdGhpcy4kc2NvcGUudGltZUxvZ3M7XG4gICAgICByZXN1bHRzID0gW107XG4gICAgICBmb3IgKG5vdGVHdWlkIGluIHJlZjEpIHtcbiAgICAgICAgbm90ZVRpbWVMb2cgPSByZWYxW25vdGVHdWlkXTtcbiAgICAgICAgcmVzdWx0cy5wdXNoKChmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgcmVzdWx0czE7XG4gICAgICAgICAgcmVzdWx0czEgPSBbXTtcbiAgICAgICAgICBmb3IgKHRpbWVMb2dzX2lkIGluIG5vdGVUaW1lTG9nKSB7XG4gICAgICAgICAgICB0aW1lTG9nID0gbm90ZVRpbWVMb2dbdGltZUxvZ3NfaWRdO1xuICAgICAgICAgICAgcmVzdWx0czEucHVzaCh0aGlzLiRzY29wZS50aW1lbGluZUl0ZW1zLmFkZCh7XG4gICAgICAgICAgICAgIGlkOiB0aW1lTG9nLl9pZCxcbiAgICAgICAgICAgICAgZ3JvdXA6IHRpbWVMb2cucGVyc29uLFxuICAgICAgICAgICAgICBjb250ZW50OiBcIjxhIGhyZWY9XFxcImV2ZXJub3RlOi8vL3ZpZXcvXCIgKyB0aGlzLiRzY29wZS51c2VyLmlkICsgXCIvXCIgKyB0aGlzLiRzY29wZS51c2VyLnNoYXJkSWQgKyBcIi9cIiArIHRpbWVMb2cubm90ZUd1aWQgKyBcIi9cIiArIHRpbWVMb2cubm90ZUd1aWQgKyBcIi9cXFwiIHRpdGxlPVxcXCJcIiArIHRoaXMuJHNjb3BlLm5vdGVzW3RpbWVMb2cubm90ZUd1aWRdLnRpdGxlICsgXCIgXCIgKyB0aW1lTG9nLmNvbW1lbnQgKyBcIlxcXCI+XCIgKyAodGhpcy4kZmlsdGVyKCdhYmJyZXZpYXRlJykodGhpcy4kc2NvcGUubm90ZXNbdGltZUxvZy5ub3RlR3VpZF0udGl0bGUsIDIwKSkgKyBcIiBcIiArICh0aGlzLiRmaWx0ZXIoJ2FiYnJldmlhdGUnKSh0aW1lTG9nLmNvbW1lbnQsIDIwKSkgKyBcIjwvYT5cIixcbiAgICAgICAgICAgICAgc3RhcnQ6IG1vbWVudCh0aW1lTG9nLmRhdGUpLFxuICAgICAgICAgICAgICBlbmQ6IHRpbWVMb2cuc3BlbnRUaW1lID8gbW9tZW50KHRpbWVMb2cuZGF0ZSkuYWRkKHRpbWVMb2cuc3BlbnRUaW1lLCAnbWludXRlcycpIDogbnVsbCxcbiAgICAgICAgICAgICAgdHlwZTogdGltZUxvZy5zcGVudFRpbWUgPyAncmFuZ2UnIDogJ3BvaW50J1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmVzdWx0czE7XG4gICAgICAgIH0pLmNhbGwodGhpcykpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfTtcblxuICAgIFRpbWVsaW5lQ29udHJvbGxlci5wcm90b3R5cGUuX29uV2F0Y2hQcm9maXRMb2dzID0gZnVuY3Rpb24oKSB7fTtcblxuICAgIFRpbWVsaW5lQ29udHJvbGxlci5wcm90b3R5cGUuX29uUmVzaXplID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIHJldHVybiB0aGlzLiRzY29wZS50aW1lbGluZS5zZXRPcHRpb25zKHtcbiAgICAgICAgaGVpZ2h0OiB3aW5kb3cuaW5uZXJIZWlnaHQgLSA5MFxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiBUaW1lbGluZUNvbnRyb2xsZXI7XG5cbiAgfSkoKTtcblxuICBhcHAuY29udHJvbGxlcignVGltZWxpbmVDb250cm9sbGVyJywgWyckc2NvcGUnLCAnJGZpbHRlcicsIFRpbWVsaW5lQ29udHJvbGxlcl0pO1xuXG4gIG1vZHVsZS5leHBvcnRzID0gVGltZWxpbmVDb250cm9sbGVyO1xuXG59KS5jYWxsKHRoaXMpO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD10aW1lbGluZS1jb250cm9sbGVyLmpzLm1hcFxuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjkuM1xuKGZ1bmN0aW9uKCkge1xuICBhcHAuZGlyZWN0aXZlKCdyZXNpemUnLCBmdW5jdGlvbigkdGltZW91dCwgJHJvb3RTY29wZSwgJHdpbmRvdykge1xuICAgIHJldHVybiB7XG4gICAgICBsaW5rOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRpbWVyO1xuICAgICAgICB0aW1lciA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gYW5ndWxhci5lbGVtZW50KCR3aW5kb3cpLm9uKCdsb2FkIHJlc2l6ZScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgaWYgKHRpbWVyKSB7XG4gICAgICAgICAgICAkdGltZW91dC5jYW5jZWwodGltZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdGltZXIgPSAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3Jlc2l6ZTo6cmVzaXplJyk7XG4gICAgICAgICAgfSwgMjAwKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcbiAgfSk7XG5cbn0pLmNhbGwodGhpcyk7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXJlc2l6ZS5qcy5tYXBcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS45LjNcbihmdW5jdGlvbigpIHtcbiAgdmFyIGFiYnJldmlhdGU7XG5cbiAgYWJicmV2aWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jdGlvbih0ZXh0LCBsZW4sIHRydW5jYXRpb24pIHtcbiAgICAgIHZhciBjb3VudCwgaSwgaiwgbiwgcmVmLCBzdHI7XG4gICAgICBpZiAobGVuID09IG51bGwpIHtcbiAgICAgICAgbGVuID0gMTA7XG4gICAgICB9XG4gICAgICBpZiAodHJ1bmNhdGlvbiA9PSBudWxsKSB7XG4gICAgICAgIHRydW5jYXRpb24gPSAnLi4uJztcbiAgICAgIH1cbiAgICAgIGNvdW50ID0gMDtcbiAgICAgIHN0ciA9ICcnO1xuICAgICAgZm9yIChpID0gaiA9IDAsIHJlZiA9IHRleHQubGVuZ3RoIC0gMTsgMCA8PSByZWYgPyBqIDw9IHJlZiA6IGogPj0gcmVmOyBpID0gMCA8PSByZWYgPyArK2ogOiAtLWopIHtcbiAgICAgICAgbiA9IGVzY2FwZSh0ZXh0LmNoYXJBdChpKSk7XG4gICAgICAgIGlmIChuLmxlbmd0aCA8IDQpIHtcbiAgICAgICAgICBjb3VudCsrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvdW50ICs9IDI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvdW50ID4gbGVuKSB7XG4gICAgICAgICAgcmV0dXJuIHN0ciArIHRydW5jYXRpb247XG4gICAgICAgIH1cbiAgICAgICAgc3RyICs9IHRleHQuY2hhckF0KGkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRleHQ7XG4gICAgfTtcbiAgfTtcblxuICBhcHAuZmlsdGVyKCdhYmJyZXZpYXRlJywgYWJicmV2aWF0ZSk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBhYmJyZXZpYXRlO1xuXG59KS5jYWxsKHRoaXMpO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hYmJyZXZpYXRlLmpzLm1hcFxuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjkuM1xyXG4oZnVuY3Rpb24oKSB7XHJcbiAgdmFyIGNoZWNrSXRlbU1hdGNoZXMsIGZpbHRlckJ5UHJvcGVydHk7XHJcblxyXG4gIGNoZWNrSXRlbU1hdGNoZXMgPSAoZnVuY3Rpb24oX3RoaXMpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbihpdGVtLCBwcm9wcykge1xyXG4gICAgICB2YXIgaXRlbU1hdGNoZXMsIHByb3AsIHRleHQ7XHJcbiAgICAgIGl0ZW1NYXRjaGVzID0gZmFsc2U7XHJcbiAgICAgIGZvciAocHJvcCBpbiBwcm9wcykge1xyXG4gICAgICAgIHRleHQgPSBwcm9wc1twcm9wXTtcclxuICAgICAgICB0ZXh0ID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgIGlmIChpdGVtW3Byb3BdLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKS5pbmRleE9mKHRleHQpICE9PSAtMSkge1xyXG4gICAgICAgICAgaXRlbU1hdGNoZXMgPSB0cnVlO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBpdGVtTWF0Y2hlcztcclxuICAgIH07XHJcbiAgfSkodGhpcyk7XHJcblxyXG4gIGZpbHRlckJ5UHJvcGVydHkgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbihpdGVtcywgcHJvcHMpIHtcclxuICAgICAgdmFyIGksIGl0ZW0sIGl0ZW1NYXRjaGVzLCBrZXksIGxlbiwgb3V0O1xyXG4gICAgICBvdXQgPSBbXTtcclxuICAgICAgaWYgKGFuZ3VsYXIuaXNBcnJheShpdGVtcykpIHtcclxuICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBpdGVtcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgICAgaXRlbSA9IGl0ZW1zW2ldO1xyXG4gICAgICAgICAgaXRlbU1hdGNoZXMgPSBjaGVja0l0ZW1NYXRjaGVzKGl0ZW0sIHByb3BzKTtcclxuICAgICAgICAgIGlmIChpdGVtTWF0Y2hlcykge1xyXG4gICAgICAgICAgICBvdXQucHVzaChpdGVtKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSBpZiAoYW5ndWxhci5pc09iamVjdChpdGVtcykpIHtcclxuICAgICAgICBmb3IgKGtleSBpbiBpdGVtcykge1xyXG4gICAgICAgICAgaXRlbSA9IGl0ZW1zW2tleV07XHJcbiAgICAgICAgICBpdGVtTWF0Y2hlcyA9IGNoZWNrSXRlbU1hdGNoZXMoaXRlbSwgcHJvcHMpO1xyXG4gICAgICAgICAgaWYgKGl0ZW1NYXRjaGVzKSB7XHJcbiAgICAgICAgICAgIG91dC5wdXNoKGl0ZW0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBvdXQgPSBpdGVtcztcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gb3V0O1xyXG4gICAgfTtcclxuICB9O1xyXG5cclxuICBhcHAuZmlsdGVyKCdmaWx0ZXJCeVByb3BlcnR5JywgZmlsdGVyQnlQcm9wZXJ0eSk7XHJcblxyXG4gIG1vZHVsZS5leHBvcnRzID0gZmlsdGVyQnlQcm9wZXJ0eTtcclxuXHJcbn0pLmNhbGwodGhpcyk7XHJcblxyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1maWx0ZXItYnktcHJvcGVydHkuanMubWFwXHJcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS45LjNcbihmdW5jdGlvbigpIHtcbiAgdmFyIG9iamVjdExlbmd0aDtcblxuICBvYmplY3RMZW5ndGggPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgX29iamVjdExlbmd0aDtcbiAgICBfb2JqZWN0TGVuZ3RoID0gZnVuY3Rpb24oaW5wdXQsIGRlcHRoKSB7XG4gICAgICB2YXIga2V5LCByZXN1bHQsIHZhbHVlO1xuICAgICAgaWYgKGRlcHRoID09IG51bGwpIHtcbiAgICAgICAgZGVwdGggPSAwO1xuICAgICAgfVxuICAgICAgaWYgKCFhbmd1bGFyLmlzT2JqZWN0KGlucHV0KSkge1xuICAgICAgICB0aHJvdyBFcnJvcihcIlVzYWdlIG9mIG5vbi1vYmplY3RzIHdpdGggb2JqZWN0TGVuZ3RoIGZpbHRlci5cIik7XG4gICAgICB9XG4gICAgICBpZiAoZGVwdGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKGlucHV0KS5sZW5ndGg7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHQgPSAwO1xuICAgICAgICBmb3IgKGtleSBpbiBpbnB1dCkge1xuICAgICAgICAgIHZhbHVlID0gaW5wdXRba2V5XTtcbiAgICAgICAgICByZXN1bHQgKz0gX29iamVjdExlbmd0aCh2YWx1ZSwgZGVwdGggLSAxKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIF9vYmplY3RMZW5ndGg7XG4gIH07XG5cbiAgYXBwLmZpbHRlcignb2JqZWN0TGVuZ3RoJywgb2JqZWN0TGVuZ3RoKTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IG9iamVjdExlbmd0aDtcblxufSkuY2FsbCh0aGlzKTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9b2JqZWN0LWxlbmd0aC5qcy5tYXBcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS45LjNcclxuKGZ1bmN0aW9uKCkge1xyXG4gIHZhciBvcmRlck9iamVjdEJ5O1xyXG5cclxuICBvcmRlck9iamVjdEJ5ID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oaXRlbXMsIGZpZWxkLCByZXZlcnNlKSB7XHJcbiAgICAgIHZhciBmaWx0ZXJlZCwgcmVzdWx0cztcclxuICAgICAgaWYgKGZpZWxkID09IG51bGwpIHtcclxuICAgICAgICBmaWVsZCA9ICckdmFsdWUnO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChyZXZlcnNlID09IG51bGwpIHtcclxuICAgICAgICByZXZlcnNlID0gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgICBmaWx0ZXJlZCA9IFtdO1xyXG4gICAgICBhbmd1bGFyLmZvckVhY2goaXRlbXMsIGZ1bmN0aW9uKGl0ZW0sIGtleSkge1xyXG4gICAgICAgIHJldHVybiBmaWx0ZXJlZC5wdXNoKHtcclxuICAgICAgICAgIGtleToga2V5LFxyXG4gICAgICAgICAgaXRlbTogaXRlbVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuICAgICAgZmlsdGVyZWQuc29ydChmdW5jdGlvbihhLCBiKSB7XHJcbiAgICAgICAgaWYgKGZpZWxkID09PSAnJGtleScpIHtcclxuICAgICAgICAgIGlmIChhLmtleSA+IGIua2V5KSB7XHJcbiAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZmllbGQgPT09ICckdmFsdWUnKSB7XHJcbiAgICAgICAgICBpZiAoYS5pdGVtID4gYi5pdGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mIGZpZWxkID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgaWYgKGFbZmllbGRdID4gYltmaWVsZF0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIDE7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2YgZmllbGQgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgIGlmIChmaWVsZChhLml0ZW0sIGEua2V5KSA+IGZpZWxkKGIuaXRlbSwgYi5rZXkpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICAgIGlmIChyZXZlcnNlKSB7XHJcbiAgICAgICAgZmlsdGVyZWQucmV2ZXJzZSgpO1xyXG4gICAgICB9XHJcbiAgICAgIHJlc3VsdHMgPSBbXTtcclxuICAgICAgYW5ndWxhci5mb3JFYWNoKGZpbHRlcmVkLCBmdW5jdGlvbihpdGVtKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdDtcclxuICAgICAgICByZXN1bHQgPSBpdGVtLml0ZW07XHJcbiAgICAgICAgcmVzdWx0Wycka2V5J10gPSBpdGVtLmtleTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0cy5wdXNoKHJlc3VsdCk7XHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm4gcmVzdWx0cztcclxuICAgIH07XHJcbiAgfTtcclxuXHJcbiAgYXBwLmZpbHRlcignb3JkZXJPYmplY3RCeScsIG9yZGVyT2JqZWN0QnkpO1xyXG5cclxuICBtb2R1bGUuZXhwb3J0cyA9IG9yZGVyT2JqZWN0Qnk7XHJcblxyXG59KS5jYWxsKHRoaXMpO1xyXG5cclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9b3JkZXItb2JqZWN0LWJ5LmpzLm1hcFxyXG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuOS4zXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBzcGVudFRpbWU7XG5cbiAgc3BlbnRUaW1lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICB2YXIgaG91ciwgbWludXRlO1xuICAgICAgaWYgKGlucHV0ID09PSB2b2lkIDApIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgICAgfVxuICAgICAgaWYgKCFpbnB1dCkge1xuICAgICAgICByZXR1cm4gJzBtJztcbiAgICAgIH1cbiAgICAgIGhvdXIgPSBNYXRoLmZsb29yKGlucHV0IC8gNjApO1xuICAgICAgbWludXRlID0gaW5wdXQgJSA2MDtcbiAgICAgIGlmIChob3VyKSB7XG4gICAgICAgIHJldHVybiBob3VyICsgJ2gnICsgbWludXRlICsgJ20nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1pbnV0ZSArICdtJztcbiAgICB9O1xuICB9O1xuXG4gIGFwcC5maWx0ZXIoJ3NwZW50VGltZScsIHNwZW50VGltZSk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBzcGVudFRpbWU7XG5cbn0pLmNhbGwodGhpcyk7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNwZW50LXRpbWUuanMubWFwXG4iLCIjIGFuZ3VsYXIuanMgc2V0dGluZ1xyXG53aW5kb3cuYXBwID0gYW5ndWxhci5tb2R1bGUoJ0FwcCcsIFsnbmdSb3V0ZScsICd1aS5ib290c3RyYXAnLCAnbmdTYW5pdGl6ZScsICd1aS5zZWxlY3QnXSlcclxuXHJcbmFwcC5jb25maWcgWyckY29tcGlsZVByb3ZpZGVyJywgKCRjb21waWxlUHJvdmlkZXIpIC0+XHJcbiAgJGNvbXBpbGVQcm92aWRlci5hSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCgvXlxccyooaHR0cHxodHRwc3xtYWlsdG98ZXZlcm5vdGUpOi8pO1xyXG5dXHJcblxyXG4jIHJvdXRlIHNldHRpbmdzXHJcbnJlcXVpcmUgJy4vcm91dGUnXHJcblxyXG4jIGFuZ3VsYXIuanMgZmlsdGVyc1xyXG5yZXF1aXJlICcuL2ZpbHRlcnMvYWJicmV2aWF0ZSdcclxucmVxdWlyZSAnLi9maWx0ZXJzL2ZpbHRlci1ieS1wcm9wZXJ0eSdcclxucmVxdWlyZSAnLi9maWx0ZXJzL29iamVjdC1sZW5ndGgnXHJcbnJlcXVpcmUgJy4vZmlsdGVycy9vcmRlci1vYmplY3QtYnknXHJcbnJlcXVpcmUgJy4vZmlsdGVycy9zcGVudC10aW1lJ1xyXG5cclxuIyBhbmd1bGFyLmpzIHNlcnZpY2VzXHJcbnJlcXVpcmUgJy4vc2VydmljZXMvbm90ZS1maWx0ZXInXHJcbnJlcXVpcmUgJy4vc2VydmljZXMvcHJvZ3Jlc3MnXHJcblxyXG4jIGFuZ3VsYXIuanMgZGlyZWN0aXZlc1xyXG5yZXF1aXJlICcuL2RpcmVjdGl2ZXMvcmVzaXplJ1xyXG5cclxuIyBhbmd1bGFyLmpzIGNvbnRyb2xsZXJzXHJcbnJlcXVpcmUgJy4vY29udHJvbGxlcnMvY29udHJvbGxlcidcclxucmVxdWlyZSAnLi9jb250cm9sbGVycy9hdXRoLWNvbnRyb2xsZXInXHJcbnJlcXVpcmUgJy4vY29udHJvbGxlcnMvbmF2aWdhdGlvbi1jb250cm9sbGVyJ1xyXG5yZXF1aXJlICcuL2NvbnRyb2xsZXJzL21lbnUtY29udHJvbGxlcidcclxucmVxdWlyZSAnLi9jb250cm9sbGVycy90aW1lbGluZS1jb250cm9sbGVyJ1xyXG5yZXF1aXJlICcuL2NvbnRyb2xsZXJzL25vdGVzLWNvbnRyb2xsZXInXHJcbnJlcXVpcmUgJy4vY29udHJvbGxlcnMvc2V0dGluZ3MtY29udHJvbGxlcidcclxucmVxdWlyZSAnLi9jb250cm9sbGVycy9wcm9ncmVzcy1tb2RhbC1jb250cm9sbGVyJ1xyXG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuOS4zXG4oZnVuY3Rpb24oKSB7XG4gIGFwcC5jb25maWcoW1xuICAgICckcm91dGVQcm92aWRlcicsIGZ1bmN0aW9uKCRyb3V0ZVByb3ZpZGVyKSB7XG4gICAgICByZXR1cm4gJHJvdXRlUHJvdmlkZXIud2hlbignLycsIHtcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdtZW51J1xuICAgICAgfSkud2hlbignL3RpbWVsaW5lJywge1xuICAgICAgICB0ZW1wbGF0ZVVybDogJ3RpbWVsaW5lJ1xuICAgICAgfSkud2hlbignL25vdGVzJywge1xuICAgICAgICB0ZW1wbGF0ZVVybDogJ25vdGVzJ1xuICAgICAgfSkud2hlbignL3NldHRpbmdzJywge1xuICAgICAgICB0ZW1wbGF0ZVVybDogJ3NldHRpbmdzJ1xuICAgICAgfSkub3RoZXJ3aXNlKHtcbiAgICAgICAgcmVkaXJlY3RUbzogJy8nXG4gICAgICB9KTtcbiAgICB9XG4gIF0pO1xuXG59KS5jYWxsKHRoaXMpO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1yb3V0ZS5qcy5tYXBcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS45LjNcbihmdW5jdGlvbigpIHtcbiAgdmFyIE5vdGVGaWx0ZXJTZXJ2aWNlLCBtZXJnZSxcbiAgICBiaW5kID0gZnVuY3Rpb24oZm4sIG1lKXsgcmV0dXJuIGZ1bmN0aW9uKCl7IHJldHVybiBmbi5hcHBseShtZSwgYXJndW1lbnRzKTsgfTsgfTtcblxuICBtZXJnZSA9IHJlcXVpcmUoJ21lcmdlJyk7XG5cbiAgTm90ZUZpbHRlclNlcnZpY2UgPSAoZnVuY3Rpb24oKSB7XG4gICAgTm90ZUZpbHRlclNlcnZpY2UucHJvdG90eXBlLnVwZGF0ZWQgPSAzO1xuXG4gICAgTm90ZUZpbHRlclNlcnZpY2UucHJvdG90eXBlLm5vdGVib29rcyA9IG51bGw7XG5cbiAgICBOb3RlRmlsdGVyU2VydmljZS5wcm90b3R5cGUuc3RhY2tzID0gbnVsbDtcblxuICAgIE5vdGVGaWx0ZXJTZXJ2aWNlLnByb3RvdHlwZS5jb3VudCA9IG51bGw7XG5cbiAgICBmdW5jdGlvbiBOb3RlRmlsdGVyU2VydmljZSgkcm9vdFNjb3BlKSB7XG4gICAgICB0aGlzLiRyb290U2NvcGUgPSAkcm9vdFNjb3BlO1xuICAgICAgdGhpcy5xdWVyeSA9IGJpbmQodGhpcy5xdWVyeSwgdGhpcyk7XG4gICAgfVxuXG4gICAgTm90ZUZpbHRlclNlcnZpY2UucHJvdG90eXBlLnF1ZXJ5ID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaSwgaiwgbGVuLCBsZW4xLCBub3RlYm9vaywgbm90ZWJvb2tHdWlkLCBub3RlYm9va3NBcnJheSwgbm90ZWJvb2tzSGFzaCwgcmVmLCByZWYxLCByZWYyLCByZXN1bHQsIHN0YWNrO1xuICAgICAgcmVzdWx0ID0ge307XG4gICAgICBpZiAodGhpcy51cGRhdGVkKSB7XG4gICAgICAgIG1lcmdlKHJlc3VsdCwge1xuICAgICAgICAgIHVwZGF0ZWQ6IHtcbiAgICAgICAgICAgICRndGU6IHBhcnNlSW50KG1vbWVudCgpLnN0YXJ0T2YoJ2RheScpLnN1YnRyYWN0KHRoaXMudXBkYXRlZCwgJ2RheXMnKS5mb3JtYXQoJ3gnKSlcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgbm90ZWJvb2tzSGFzaCA9IHt9O1xuICAgICAgaWYgKHRoaXMubm90ZWJvb2tzICYmIHRoaXMubm90ZWJvb2tzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmVmID0gdGhpcy5ub3RlYm9va3M7XG4gICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IHJlZi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgIG5vdGVib29rR3VpZCA9IHJlZltpXTtcbiAgICAgICAgICBub3RlYm9va3NIYXNoW25vdGVib29rR3VpZF0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5zdGFja3MgJiYgdGhpcy5zdGFja3MubGVuZ3RoID4gMCkge1xuICAgICAgICByZWYxID0gdGhpcy5zdGFja3M7XG4gICAgICAgIGZvciAoaiA9IDAsIGxlbjEgPSByZWYxLmxlbmd0aDsgaiA8IGxlbjE7IGorKykge1xuICAgICAgICAgIHN0YWNrID0gcmVmMVtqXTtcbiAgICAgICAgICByZWYyID0gdGhpcy4kcm9vdFNjb3BlLm5vdGVib29rcztcbiAgICAgICAgICBmb3IgKG5vdGVib29rR3VpZCBpbiByZWYyKSB7XG4gICAgICAgICAgICBub3RlYm9vayA9IHJlZjJbbm90ZWJvb2tHdWlkXTtcbiAgICAgICAgICAgIGlmIChzdGFjayA9PT0gbm90ZWJvb2suc3RhY2spIHtcbiAgICAgICAgICAgICAgbm90ZWJvb2tzSGFzaFtub3RlYm9vay5ndWlkXSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBub3RlYm9va3NBcnJheSA9IE9iamVjdC5rZXlzKG5vdGVib29rc0hhc2gpO1xuICAgICAgaWYgKG5vdGVib29rc0FycmF5Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgbWVyZ2UocmVzdWx0LCB7XG4gICAgICAgICAgbm90ZWJvb2tHdWlkOiB7XG4gICAgICAgICAgICAkaW46IG5vdGVib29rc0FycmF5XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcblxuICAgIHJldHVybiBOb3RlRmlsdGVyU2VydmljZTtcblxuICB9KSgpO1xuXG4gIGFwcC5zZXJ2aWNlKCdub3RlRmlsdGVyJywgWyckcm9vdFNjb3BlJywgTm90ZUZpbHRlclNlcnZpY2VdKTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IE5vdGVGaWx0ZXJTZXJ2aWNlO1xuXG59KS5jYWxsKHRoaXMpO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1ub3RlLWZpbHRlci5qcy5tYXBcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS45LjNcbihmdW5jdGlvbigpIHtcbiAgdmFyIFByb2dyZXNzU2VydmljZSxcbiAgICBiaW5kID0gZnVuY3Rpb24oZm4sIG1lKXsgcmV0dXJuIGZ1bmN0aW9uKCl7IHJldHVybiBmbi5hcHBseShtZSwgYXJndW1lbnRzKTsgfTsgfTtcblxuICBQcm9ncmVzc1NlcnZpY2UgPSAoZnVuY3Rpb24oKSB7XG4gICAgUHJvZ3Jlc3NTZXJ2aWNlLnByb3RvdHlwZS5tb2RhbEluc3RhbmNlID0gbnVsbDtcblxuICAgIFByb2dyZXNzU2VydmljZS5wcm90b3R5cGUudmFsdWUgPSAwO1xuXG4gICAgUHJvZ3Jlc3NTZXJ2aWNlLnByb3RvdHlwZS5tZXNzYWdlID0gJyc7XG5cbiAgICBmdW5jdGlvbiBQcm9ncmVzc1NlcnZpY2UoJG1vZGFsKSB7XG4gICAgICB0aGlzLiRtb2RhbCA9ICRtb2RhbDtcbiAgICAgIHRoaXMuc2V0ID0gYmluZCh0aGlzLnNldCwgdGhpcyk7XG4gICAgICB0aGlzLmNsb3NlID0gYmluZCh0aGlzLmNsb3NlLCB0aGlzKTtcbiAgICAgIHRoaXMub3BlbiA9IGJpbmQodGhpcy5vcGVuLCB0aGlzKTtcbiAgICB9XG5cbiAgICBQcm9ncmVzc1NlcnZpY2UucHJvdG90eXBlLm9wZW4gPSBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMubWVzc2FnZSA9ICdwcm9jZXNzaW5nLi4uJztcbiAgICAgIHRoaXMudmFsdWUgPSAwO1xuICAgICAgcmV0dXJuIHRoaXMubW9kYWxJbnN0YW5jZSA9IHRoaXMuJG1vZGFsLm9wZW4oe1xuICAgICAgICB0ZW1wbGF0ZVVybDogJ3Byb2dyZXNzLW1vZGFsJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1Byb2dyZXNzTW9kYWxDb250cm9sbGVyJyxcbiAgICAgICAgYmFja2Ryb3A6ICdzdGF0aWMnLFxuICAgICAgICBrZXlib2FyZDogZmFsc2UsXG4gICAgICAgIHNpemU6ICdzbScsXG4gICAgICAgIGFuaW1hdGlvbjogZmFsc2VcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBQcm9ncmVzc1NlcnZpY2UucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5tb2RhbEluc3RhbmNlLmNsb3NlKCk7XG4gICAgfTtcblxuICAgIFByb2dyZXNzU2VydmljZS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24obWVzc2FnZSwgdmFsdWUpIHtcbiAgICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICAgIHZhbHVlID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICBpZiAodmFsdWUgIT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIFByb2dyZXNzU2VydmljZTtcblxuICB9KSgpO1xuXG4gIGFwcC5zZXJ2aWNlKCdwcm9ncmVzcycsIFsnJG1vZGFsJywgUHJvZ3Jlc3NTZXJ2aWNlXSk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBQcm9ncmVzc1NlcnZpY2U7XG5cbn0pLmNhbGwodGhpcyk7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXByb2dyZXNzLmpzLm1hcFxuIl19
