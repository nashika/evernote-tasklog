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

    // Ported from underscore.js isObject
    var _isObject = function(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    };

    function _isArrayLike(arr) {
        return _isArray(arr) || (
            // has a positive integer length property
            typeof arr.length === "number" &&
            arr.length >= 0 &&
            arr.length % 1 === 0
        );
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

        var iter = _keyIterator(object);
        var key, completed = 0;

        while ((key = iter()) != null) {
            completed += 1;
            iterator(object[key], key, only_once(done));
        }

        if (completed === 0) callback(null);

        function done(err) {
            completed--;
            if (err) {
                callback(err);
            }
            // Check key is null in case iterator isn't exhausted
            // and done resolved synchronously.
            else if (key === null && completed <= 0) {
                callback(null);
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
                            async.setImmediate(iterate);
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
        arr = arr || [];
        var results = _isArrayLike(arr) ? [] : {};
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
            callback(err, memo);
        });
    };

    async.foldr =
    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, identity).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };

    async.transform = function (arr, memo, iterator, callback) {
        if (arguments.length === 3) {
            callback = iterator;
            iterator = memo;
            memo = _isArray(arr) ? [] : {};
        }

        async.eachOf(arr, function(v, k, cb) {
            iterator(memo, v, k, cb);
        }, function(err) {
            callback(err, memo);
        });
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
    async.detectLimit = _createTester(async.eachOfLimit, identity, _findGetResult);

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

    async.auto = function (tasks, concurrency, callback) {
        if (typeof arguments[1] === 'function') {
            // concurrency is optional, shift the args.
            callback = concurrency;
            concurrency = null;
        }
        callback = _once(callback || noop);
        var keys = _keys(tasks);
        var remainingTasks = keys.length;
        if (!remainingTasks) {
            return callback(null);
        }
        if (!concurrency) {
            concurrency = remainingTasks;
        }

        var results = {};
        var runningTasks = 0;

        var hasError = false;

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
            if (hasError) return;
            var task = _isArray(tasks[k]) ? tasks[k]: [tasks[k]];
            var taskCallback = _restParam(function(err, args) {
                runningTasks--;
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _forEachOf(results, function(val, rkey) {
                        safeResults[rkey] = val;
                    });
                    safeResults[k] = args;
                    hasError = true;

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
                    throw new Error('Has nonexistent dependency in ' + requires.join(', '));
                }
                if (_isArray(dep) && _indexOf(dep, k) >= 0) {
                    throw new Error('Has cyclic dependencies');
                }
            }
            function ready() {
                return runningTasks < concurrency && _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            }
            if (ready()) {
                runningTasks++;
                task[task.length - 1](taskCallback, results);
            }
            else {
                addListener(listener);
            }
            function listener() {
                if (ready()) {
                    runningTasks++;
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
                throw new Error('Unsupported argument type for \'times\': ' + typeof t);
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
                    callback.apply(null, [null].concat(args));
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

                var removed = false;
                var args = arguments;
                _arrayEach(tasks, function (task) {
                    _arrayEach(workersList, function (worker, index) {
                        if (worker === task && !removed) {
                            workersList.splice(index, 1);
                            removed = true;
                        }
                    });

                    task.callback.apply(task, args);
                });
                if (q.tasks.length + workers === 0) {
                    q.drain();
                }
                q.process();
            };
        }

        var workers = 0;
        var workersList = [];
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
                while(!q.paused && workers < q.concurrency && q.tasks.length){

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
                    workersList.push(tasks[0]);
                    var cb = only_once(_next(q, tasks));
                    worker(data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            },
            workersList: function () {
                return workersList;
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
                if (typeof console === 'object') {
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
        var has = Object.prototype.hasOwnProperty;
        hasher = hasher || identity;
        var memoized = _restParam(function memoized(args) {
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (has.call(memo, key)) {   
                async.setImmediate(function () {
                    callback.apply(null, memo[key]);
                });
            }
            else if (has.call(queues, key)) {
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
            if (_isObject(result) && typeof result.then === "function") {
                result.then(function(value) {
                    callback(null, value);
                })["catch"](function(err) {
                    callback(err.message ? err : new Error(err));
                });
            } else {
                callback(null, result);
            }
        });
    };

    // Node.js
    if (typeof module === 'object' && module.exports) {
        module.exports = async;
    }
    // AMD / RequireJS
    else if (typeof define === 'function' && define.amd) {
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

},{"_process":3}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
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
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
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

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
var AuthController = (function () {
    function AuthController($scope, $http) {
        var _this = this;
        this.$scope = $scope;
        this.$http = $http;
        this._init = function () {
            _this.$http.get('/auth/token')
                .error(function (data) {
                throw new Error(data);
            })
                .success(function (data) {
                _this.$scope['production'] = data;
                _this.$http.post('/auth/token', { sandbox: true })
                    .error(function (data) {
                    throw new Error(data);
                })
                    .success(function (data) {
                    _this.$scope['sandbox'] = data;
                });
            });
        };
        this._setToken = function (sandbox) {
            var token = prompt("Input developer token (" + (sandbox ? 'sandbox' : 'production') + ")");
            if (!token)
                return;
            _this.$http.post('/auth/token', { sandbox: sandbox, token: token })
                .success(function (data) {
                if (sandbox)
                    _this.$scope['sandbox'] = data;
                else
                    _this.$scope['production'] = data;
                if (!data)
                    alert('Token is invalid.');
            })
                .error(function (data) {
                alert('Set token failed.');
            });
        };
        this.$scope['message'] = null;
        this.$scope['isDeveloper'] = false;
        this.$scope['sandbox'] = { token: null, username: null };
        this.$scope['production'] = { token: null, username: null };
        this.$scope['setToken'] = this._setToken;
        this._init();
    }
    return AuthController;
})();
angular.module('App').controller('AuthController', ['$scope', '$http', AuthController]);
exports.__esModule = true;
exports["default"] = AuthController;

},{}],5:[function(require,module,exports){
var Controller = (function () {
    function Controller($scope) {
        this.$scope = $scope;
    }
    return Controller;
})();
angular.module('App').controller('Controller', ['$scope', Controller]);
exports.__esModule = true;
exports["default"] = Controller;

},{}],6:[function(require,module,exports){
var MenuController = (function () {
    function MenuController($scope, $http, dataStore, dataTransciever) {
        var _this = this;
        this.$scope = $scope;
        this.$http = $http;
        this.dataStore = dataStore;
        this.dataTransciever = dataTransciever;
        this._onReload = function () {
            _this.dataTransciever.reload();
        };
        this._onWatchFilterParams = function () {
            _this.dataTransciever.countNotes(function (err, count) {
                if (err) {
                    alert(err);
                    return;
                }
                _this.$scope['noteCount'] = count;
            });
        };
        this.$scope['dataStore'] = this.dataStore;
        this.$scope['dataTransciever'] = this.dataTransciever;
        this.$scope['noteCount'] = null;
        this.$scope.$watchGroup(['dataTransciever.filterParams.notebookGuids', 'dataTransciever.filterParams.stacks'], this._onWatchFilterParams);
        this.$scope.$on('event::reload', this._onReload);
    }
    return MenuController;
})();
angular.module('App').controller('MenuController', ['$scope', '$http', 'dataStore', 'dataTransciever', MenuController]);
exports.__esModule = true;
exports["default"] = MenuController;

},{}],7:[function(require,module,exports){
var ModalController = (function () {
    function ModalController($scope) {
        this.$scope = $scope;
    }
    return ModalController;
})();
angular.module('App').controller('ModalController', ['$scope', ModalController]);
exports.__esModule = true;
exports["default"] = ModalController;

},{}],8:[function(require,module,exports){
var NavigationController = (function () {
    function NavigationController($scope, $rootScope, $route) {
        var _this = this;
        this.$scope = $scope;
        this.$rootScope = $rootScope;
        this.$route = $route;
        this._reload = function () {
            _this.$rootScope.$broadcast('event::reload');
        };
        this.$scope['navCollapse'] = true;
        this.$scope['$route'] = this.$route;
        this.$scope['reload'] = this._reload;
    }
    return NavigationController;
})();
angular.module('App').controller('NavigationController', ['$scope', '$rootScope', '$route', NavigationController]);
exports.__esModule = true;
exports["default"] = NavigationController;

},{}],9:[function(require,module,exports){
var NotesController = (function () {
    function NotesController($scope, dataStore) {
        var _this = this;
        this.$scope = $scope;
        this.dataStore = dataStore;
        this._onWatchTimeLogs = function (timeLogs) {
            _this.$scope['notesSpentTimes'] = {};
            var personsHash = {};
            for (var _i = 0; _i < timeLogs.length; _i++) {
                var noteGuid = timeLogs[_i];
                var noteTimeLog = timeLogs[noteGuid];
                for (var timeLogId in noteTimeLog) {
                    var timeLog = noteTimeLog[timeLogId];
                    if (!_this.$scope['notesSpentTimes'][timeLog.noteGuid])
                        _this.$scope['notesSpentTimes'][timeLog.noteGuid] = { $total: 0 };
                    _this.$scope['notesSpentTimes'][timeLog.noteGuid]['$total'] += timeLog.spentTime;
                    if (!_this.$scope['notesSpentTimes'][timeLog.noteGuid][timeLog.person])
                        _this.$scope['notesSpentTimes'][timeLog.noteGuid][timeLog.person] = 0;
                    _this.$scope['notesSpentTimes'][timeLog.noteGuid][timeLog.person] += timeLog.spentTime;
                    if (!_this.$scope['notesSpentTimes']['$total'])
                        _this.$scope['notesSpentTimes']['$total'] = { $total: 0 };
                    _this.$scope['notesSpentTimes']['$total']['$total'] += timeLog.spentTime;
                    if (!_this.$scope['notesSpentTimes']['$total'][timeLog.person])
                        _this.$scope['notesSpentTimes']['$total'][timeLog.person] = 0;
                    _this.$scope['notesSpentTimes']['$total'][timeLog.person] += timeLog.spentTime;
                    if (timeLog.spentTime > 0)
                        personsHash[timeLog.person] = true;
                }
            }
            _this.$scope['existPersons'] = Object.keys(personsHash);
        };
        this._onWatchProfitLogs = function (profitLogs) {
            _this.$scope['notesProfits'] = {};
            for (var noteGuid in profitLogs) {
                var noteProfitLog = profitLogs[noteGuid];
                for (var profitLogId in noteProfitLog) {
                    var profitLog = noteProfitLog[profitLogId];
                    if (!_this.$scope['notesProfits'][profitLog.noteGuid])
                        _this.$scope['notesProfits'][profitLog.noteGuid] = { $total: 0 };
                    _this.$scope['notesProfits'][profitLog.noteGuid]['$total'] += profitLog.profit;
                    if (!_this.$scope['notesProfits']['$total'])
                        _this.$scope['notesProfits']['$total'] = { $total: 0 };
                    _this.$scope['notesProfits']['$total']['$total'] += profitLog.profit;
                    for (var _i = 0, _a = _this.$scope['existPersons']; _i < _a.length; _i++) {
                        var person = _a[_i];
                        if (!_this.$scope['notesSpentTimes'][noteGuid] || !_this.$scope['notesSpentTimes'][noteGuid][person] || !_this.$scope['notesSpentTimes'][noteGuid]['$total'])
                            _this.$scope['notesProfits'][noteGuid][person] = null;
                        else
                            _this.$scope['notesProfits'][noteGuid][person] = Math.round(_this.$scope['notesProfits'][noteGuid]['$total'] * _this.$scope['notesSpentTimes'][noteGuid][person] / _this.$scope['notesSpentTimes'][noteGuid]['$total']);
                    }
                    if (!_this.$scope['notesProfits']['$total'][person])
                        _this.$scope['notesProfits']['$total'][person] = 0;
                    _this.$scope['notesProfits']['$total'][person] += _this.$scope['notesProfits'][noteGuid][person];
                }
            }
        };
        this.$scope['dataStore'] = this.dataStore;
        this.$scope['notesSpentTimes'] = {};
        this.$scope['notesProfits'] = {};
        this.$scope['existPersons'] = [];
        this.$scope.$watchCollection('dataStore.timeLogs', this._onWatchTimeLogs);
        this.$scope.$watchCollection('dataStore.profitLogs', this._onWatchProfitLogs);
    }
    return NotesController;
})();
angular.module('App').controller('NotesController', ['$scope', 'dataStore', NotesController]);
exports.__esModule = true;
exports["default"] = NotesController;

},{}],10:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var modal_controller_1 = require('./modal-controller');
var ProgressModalController = (function (_super) {
    __extends(ProgressModalController, _super);
    function ProgressModalController($scope, progress) {
        _super.call(this, $scope);
        this.$scope = $scope;
        this.progress = progress;
        this.$scope['progress'] = this.progress;
    }
    return ProgressModalController;
})(modal_controller_1["default"]);
angular.module('App').controller('ProgressModalController', ['$scope', 'progress', ProgressModalController]);
exports.__esModule = true;
exports["default"] = ProgressModalController;

},{"./modal-controller":7}],11:[function(require,module,exports){
var async = require('async');
var SettingsController = (function () {
    function SettingsController($scope, $http, dataStore, dataTransciever, progress) {
        var _this = this;
        this.$scope = $scope;
        this.$http = $http;
        this.dataStore = dataStore;
        this.dataTransciever = dataTransciever;
        this.progress = progress;
        this._editStore = {};
        this._up = function (index) {
            if (index == 0)
                return;
            _this._editStore['persons'].splice(index - 1, 2, _this._editStore['persons'][index], _this._editStore['persons'][index - 1]);
        };
        this._down = function (index) {
            if (index >= _this._editStore['persons'].length - 1)
                return;
            _this._editStore['persons'].splice(index, 2, _this._editStore['persons'][index + 1], _this._editStore['persons'][index]);
        };
        this._remove = function (index) {
            _this._editStore['persons'].splice(index, 1);
        };
        this._add = function () {
            if (!_this._editStore['persons'])
                _this._editStore['persons'] = [];
            _this._editStore['persons'].push({ name: "Person " + (_this._editStore['persons'].length + 1) });
        };
        this._submit = function () {
            _this.progress.open(1);
            var count = 0;
            var reParse = false;
            var reload = false;
            async.forEachOfSeries(_this.constructor.FIELDS, function (field, key, callback) {
                if (JSON.stringify(angular.copy(_this._editStore[key])) == JSON.stringify(_this.dataStore.settings[key]))
                    return callback();
                if (field.reParse)
                    reParse = true;
                if (field.reload)
                    reload = true;
                _this.progress.set("Saving " + key + "...", count++ / Object.keys(_this.constructor.FIELDS).length * 100);
                _this.$http.put('/settings/save', { key: key, value: _this._editStore[key] })
                    .success(function () {
                    _this.dataStore.settings[key] = _this._editStore[key];
                    callback();
                })
                    .error(function () {
                    callback(new Error("Error saving " + key));
                });
            }, function (err) {
                if (err)
                    alert(err);
                _this.progress.close();
                async.waterfall([
                    function (callback) {
                        if (reParse)
                            _this.dataTransciever.reParse(callback);
                        else
                            callback();
                    },
                    function (callback) {
                        if (reload)
                            _this.dataTransciever.reload(callback);
                        else
                            callback();
                    }]);
            });
        };
        this._onWatchSetting = function (key) {
            return function () {
                _this._editStore[key] = angular.copy(_this.dataStore.settings[key]);
            };
        };
        this.$scope['dataStore'] = this.dataStore;
        this.$scope['editStore'] = this._editStore;
        this.$scope['fields'] = this.constructor.FIELDS;
        this.$scope['up'] = this._up;
        this.$scope['down'] = this._down;
        this.$scope['remove'] = this._remove;
        this.$scope['add'] = this._add;
        this.$scope['submit'] = this._submit;
        for (var key in this.constructor.FIELDS)
            this.$scope.$watch("dataStore.settings." + key, this._onWatchSetting(key));
    }
    SettingsController.FIELDS = {
        persons: {
            reParse: true,
            reload: true
        },
        startWorkingTime: {
            heading: 'Start Working Time',
            type: 'number'
        },
        endWorkingTime: {
            heading: 'End Working Time',
            type: 'number'
        }
    };
    return SettingsController;
})();
angular.module('App').controller('SettingsController', ['$scope', '$http', 'dataStore', 'dataTransciever', 'progress', SettingsController]);
exports.__esModule = true;
exports["default"] = SettingsController;

},{"async":1}],12:[function(require,module,exports){
var TimelineController = (function () {
    function TimelineController($scope, $filter, $http, dataStore, dataTransciever) {
        var _this = this;
        this.$scope = $scope;
        this.$filter = $filter;
        this.$http = $http;
        this.dataStore = dataStore;
        this.dataTransciever = dataTransciever;
        this._onRangeChanged = function (properties) {
            var currentStart = moment(properties.start).startOf('day');
            var currentEnd = moment(properties.end).endOf('day');
            if (currentStart.isSameOrAfter(_this.$scope['start']) && currentEnd.isSameOrBefore(_this.$scope['end']))
                return;
            if (!_this.$scope['start'] || currentStart.isBefore(_this.$scope['start']))
                _this.$scope['start'] = currentStart;
            if (!_this.$scope['end'] || currentEnd.isAfter(_this.$scope['end']))
                _this.$scope['end'] = currentEnd;
            _this._onReload();
        };
        this._onReload = function () {
            _this.dataTransciever.reload({ start: _this.$scope['start'], end: _this.$scope['end'] }, _this._onReloadEnd);
        };
        this._onReloadEnd = function () {
            _this.$scope['timelineItems'].clear();
            var notes = {};
            for (var noteGuid in _this.dataStore.notes) {
                var note = _this.dataStore.notes[noteGuid];
                notes[note.guid] = note;
                _this.$scope['timelineItems'].add({
                    id: note.guid,
                    group: 'updated',
                    content: "<a href=\"evernote:///view/" + _this.dataStore.user['id'] + "/" + _this.dataStore.user['shardId'] + "/" + note.guid + "/" + note.guid + "/\" title=\"" + note.title + "\">" + _this.$filter('abbreviate')(note.title, 40) + "</a>",
                    start: new Date(note.updated),
                    type: 'point'
                });
            }
            for (var noteGuid in _this.dataStore.timeLogs) {
                var noteTimeLogs = _this.dataStore.timeLogs[noteGuid];
                for (var timeLogId in noteTimeLogs) {
                    var timeLog = noteTimeLogs[timeLogId];
                    var noteTitle = notes[timeLog.noteGuid].title;
                    _this.$scope['timelineItems'].add({
                        id: timeLog._id,
                        group: timeLog.person,
                        content: "<a href=\"evernote:///view/" + _this.dataStore.user['id'] + "/" + _this.dataStore.user['shardId'] + "/" + timeLog.noteGuid + "/" + timeLog.noteGuid + "/\" title=\"" + noteTitle + " " + timeLog.comment + "\">" + _this.$filter('abbreviate')(noteTitle, 20) + " " + _this.$filter('abbreviate')(timeLog.comment, 20) + "</a>",
                        start: moment(timeLog.date),
                        end: timeLog.spentTime ? moment(timeLog.date).add(timeLog.spentTime, 'minutes') : null,
                        type: timeLog.spentTime ? 'range' : 'point'
                    });
                }
            }
        };
        this._onResize = function (event) {
            _this.$scope['timeline'].setOptions({
                height: window.innerHeight - 90
            });
        };
        this.$scope['dataStore'] = this.dataStore;
        this.$scope['timelineItems'] = new vis.DataSet();
        this.$scope['timelineGroups'] = new vis.DataSet();
        this.$scope['start'] = moment().startOf('day');
        this.$scope['end'] = moment().endOf('day');
        this.dataTransciever.reload({ start: this.$scope['start'], end: this.$scope['end'] }, function () {
            var container = document.getElementById('timeline');
            // set working time
            var hiddenDates;
            if (_this.dataStore.settings && _this.dataStore.settings['startWorkingTime'] && _this.dataStore.settings['endWorkingTime'])
                hiddenDates = [{
                        start: moment().subtract(1, 'days').startOf('day').hour(_this.dataStore.settings['endWorkingTime']),
                        end: moment().startOf('day').hour(_this.dataStore.settings['startWorkingTime']),
                        repeat: 'daily'
                    }];
            else
                hiddenDates = {};
            // generate timeline object
            _this.$scope['timeline'] = new vis.Timeline(container, _this.$scope['timelineItems'], _this.$scope['timelineGroups'], {
                margin: { item: 5 },
                height: window.innerHeight - 80,
                orientation: { axis: 'both', item: 'top' },
                start: _this.$scope['start'],
                end: _this.$scope['end'],
                order: function (a, b) {
                    return a.start - b.start;
                },
                hiddenDates: hiddenDates
            });
            // set person data
            if (!_this.dataStore.settings || !_this.dataStore.settings['persons'])
                return;
            for (var _i = 0, _a = _this.dataStore.settings['persons']; _i < _a.length; _i++) {
                var person = _a[_i];
                _this.$scope['timelineGroups'].add({
                    id: person.name,
                    content: person.name
                });
            }
            _this.$scope['timelineGroups'].add({
                id: 'updated',
                content: 'Update'
            });
            // add events
            _this.$scope['timeline'].on('rangechanged', _this._onRangeChanged);
            _this.$scope.$on('resize::resize', _this._onResize);
            _this.$scope.$on('event::reload', _this._onReload);
            // reload
            _this._onReloadEnd();
        });
    }
    return TimelineController;
})();
angular.module('App').controller('TimelineController', ['$scope', '$filter', '$http', 'dataStore', 'dataTransciever', TimelineController]);
exports.__esModule = true;
exports["default"] = TimelineController;

},{}],13:[function(require,module,exports){
angular.module('App').directive('resize', function ($timeout, $rootScope, $window) {
    return {
        link: function () {
            var timer = false;
            angular.element($window).on('load resize', function (event) {
                if (timer)
                    $timeout.cancel(timer);
                timer = $timeout(function () {
                    $rootScope.$broadcast('resize::resize');
                }, 200);
            });
        }
    };
});

},{}],14:[function(require,module,exports){
var abbreviate = function () {
    return function (text, len, truncation) {
        if (len === void 0) { len = 10; }
        if (truncation === void 0) { truncation = '...'; }
        var count = 0;
        var str = '';
        for (var i = 0; i < text.length; i++) {
            var n = encodeURI(text.charAt(i));
            if (n.length < 4)
                count++;
            else
                count += 2;
            if (count > len)
                return str + truncation;
            str += text.charAt(i);
        }
        return text;
    };
};
angular.module('App').filter('abbreviate', abbreviate);
exports.__esModule = true;
exports["default"] = abbreviate;

},{}],15:[function(require,module,exports){
var checkItemMatches = function (item, props) {
    var itemMatches = false;
    for (var prop in props) {
        var text = props[prop];
        text = text.toLowerCase();
        if (item[prop].toString().toLowerCase().indexOf(text) != -1) {
            itemMatches = true;
            break;
        }
    }
    return itemMatches;
};
var filterByProperty = function () {
    return function (items, props) {
        var out = [];
        if (angular.isArray(items))
            for (var item in items) {
                var itemMatches = checkItemMatches(item, props);
                if (itemMatches)
                    out.push(item);
                else if (angular.isObject(items))
                    for (var _i = 0; _i < items.length; _i++) {
                        item = items[_i];
                        itemMatches = checkItemMatches(item, props);
                        if (itemMatches)
                            out.push(item);
                    }
                else
                    out = items;
                return out;
            }
    };
};
angular.module('App').filter('filterByProperty', filterByProperty);
exports.__esModule = true;
exports["default"] = filterByProperty;

},{}],16:[function(require,module,exports){
var objectLength = function () {
    var _objectLength = function (input, depth) {
        if (depth === void 0) { depth = 0; }
        if (!angular.isObject(input))
            throw new Error("Usage of non-objects with objectLength filter.");
        if (depth == 0)
            return Object.keys(input).length;
        else {
            var result = 0;
            for (var _i = 0; _i < input.length; _i++) {
                var value = input[_i];
                result += _objectLength(value, depth - 1);
            }
            return result;
        }
    };
    return _objectLength;
};
angular.module('App').filter('objectLength', objectLength);
exports.__esModule = true;
exports["default"] = objectLength;

},{}],17:[function(require,module,exports){
var orderObjectBy = function () {
    return function (items, field, reverse) {
        if (field === void 0) { field = '$value'; }
        if (reverse === void 0) { reverse = true; }
        var filtered = [];
        angular.forEach(items, function (item, key) {
            filtered.push({
                key: key,
                item: item
            });
        });
        filtered.sort(function (a, b) {
            if (field == '$key')
                return (a.key > b.key) ? -1 : 1;
            if (field == '$value')
                return (a.item > b.item) ? -1 : 1;
            if (typeof field == 'string')
                return (a[field] > b[field]) ? -1 : 1;
            if (typeof field == 'function')
                return (field(a.item, a.key) > field(b.item, b.key)) ? -1 : 1;
        });
        if (reverse)
            filtered.reverse();
        var results = [];
        angular.forEach(filtered, function (item) {
            var result = item.item;
            result['$key'] = item.key;
            results.push(result);
        });
        return results;
    };
};
angular.module('App').filter('orderObjectBy', orderObjectBy);
exports.__esModule = true;
exports["default"] = orderObjectBy;

},{}],18:[function(require,module,exports){
var spentTime = function () {
    return function (input) {
        if (input === undefined)
            return '';
        if (!input)
            return '0m';
        var hour = Math.floor(input / 60);
        var minute = input % 60;
        if (hour)
            return hour + 'h' + minute + 'm';
        return minute + 'm';
    };
};
angular.module('App').filter('spentTime', spentTime);
exports.__esModule = true;
exports["default"] = spentTime;

},{}],19:[function(require,module,exports){
// angular.js setting
angular.module('App', ['ngRoute', 'ui.bootstrap', 'ngSanitize', 'ui.select']);
angular.module('App').config(['$compileProvider', function ($compileProvider) {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(http|https|mailto|evernote):/);
    }]);
// route settings
require('./route');
// angular.js filters
require('./filters/abbreviate');
require('./filters/filter-by-property');
require('./filters/object-length');
require('./filters/order-object-by');
require('./filters/spent-time');
// angular.js services
require('./services/data-store');
require('./services/data-transciever');
require('./services/progress');
// angular.js directives
require('./directives/resize');
// angular.js controllers
require('./controllers/auth-controller');
require('./controllers/controller');
require('./controllers/menu-controller');
require('./controllers/navigation-controller');
require('./controllers/notes-controller');
require('./controllers/progress-modal-controller');
require('./controllers/settings-controller');
require('./controllers/timeline-controller');

},{"./controllers/auth-controller":4,"./controllers/controller":5,"./controllers/menu-controller":6,"./controllers/navigation-controller":8,"./controllers/notes-controller":9,"./controllers/progress-modal-controller":10,"./controllers/settings-controller":11,"./controllers/timeline-controller":12,"./directives/resize":13,"./filters/abbreviate":14,"./filters/filter-by-property":15,"./filters/object-length":16,"./filters/order-object-by":17,"./filters/spent-time":18,"./route":20,"./services/data-store":21,"./services/data-transciever":22,"./services/progress":23}],20:[function(require,module,exports){
angular.module('App').config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/', {
            templateUrl: 'menu'
        })
            .when('/timeline', {
            templateUrl: 'timeline'
        })
            .when('/notes', {
            templateUrl: 'notes'
        })
            .when('/settings', {
            templateUrl: 'settings'
        })
            .otherwise({
            redirectTo: '/'
        });
    }]);

},{}],21:[function(require,module,exports){
var DataStoreService = (function () {
    function DataStoreService() {
        this.user = null;
        this.persons = [];
        this.notebooks = {};
        this.stacks = [];
        this.notes = {};
        this.timeLogs = {};
        this.profitLogs = {};
        this.settings = {};
    }
    return DataStoreService;
})();
angular.module('App').service('dataStore', [DataStoreService]);
exports.__esModule = true;
exports["default"] = DataStoreService;

},{}],22:[function(require,module,exports){
var async = require('async');
var merge = require('merge');
var DataTranscieverService = (function () {
    function DataTranscieverService($http, dataStore, progress) {
        var _this = this;
        this.$http = $http;
        this.dataStore = dataStore;
        this.progress = progress;
        this.filterParams = null;
        this.reload = function (params, callback) {
            if (params === void 0) { params = {}; }
            if (!callback)
                callback = function () {
                };
            var noteQuery = _this._makeNoteQuery(params || {});
            var noteCount = 0;
            _this.progress.open(10);
            async.series([
                // get user
                // get user
                function (callback) {
                    if (_this.dataStore.user)
                        return callback();
                    _this.progress.next('Getting user data.');
                    _this.$http.get('/user')
                        .success(function (data) {
                        _this.dataStore.user = data;
                        callback();
                    })
                        .error(function () {
                        callback(new Error('Error $http request'));
                    });
                },
                // get settings
                // get settings
                function (callback) {
                    _this.progress.next('Getting settings data.');
                    _this.$http.get('/settings')
                        .success(function (data) {
                        _this.dataStore.settings = data;
                        callback();
                    })
                        .error(function () {
                        callback(new Error('Error $http request'));
                    });
                },
                // check settings
                // check settings
                function (callback) {
                    if (!_this.dataStore.settings['persons'] || _this.dataStore.settings['persons'].length == 0)
                        return callback(new Error('This app need persons setting. Please switch "Settings Page" and set your persons data.'));
                    callback();
                },
                // sync
                // sync
                function (callback) {
                    _this.progress.next('Syncing remote server.');
                    _this.$http.get('/sync')
                        .success(function () {
                        callback();
                    })
                        .error(function () {
                        callback(new Error('Error $http request'));
                    });
                },
                // get notebooks
                // get notebooks
                function (callback) {
                    _this.progress.next('Getting notebooks data.');
                    _this.$http.get('/notebooks')
                        .success(function (data) {
                        _this.dataStore.notebooks = {};
                        var stackHash = {};
                        for (var _i = 0; _i < data.length; _i++) {
                            var notebook = data[_i];
                            _this.dataStore.notebooks[notebook.guid] = notebook;
                            if (notebook.stack)
                                stackHash[notebook.stack] = true;
                        }
                        _this.dataStore.stacks = Object.keys(stackHash);
                        callback();
                    })
                        .error(function () {
                        callback(new Error('Error $http request'));
                    });
                },
                function (callback) {
                    _this.progress.next('Getting notes count.');
                    _this.$http.get('/notes/count', { params: { query: noteQuery } })
                        .success(function (data) {
                        noteCount = data;
                        if (noteCount > 100)
                            if (window.confirm("Current query find " + noteCount + " notes. It is too many. Continue anyway?"))
                                callback();
                            else
                                callback(new Error('User Canceled'));
                        else
                            callback();
                    })
                        .error(function () {
                        callback(new Error('Error $http request'));
                    });
                },
                // get notes
                // get notes
                function (callback) {
                    _this.progress.next('Getting notes.');
                    _this.$http.get('/notes', { params: { query: noteQuery } })
                        .success(function (data) {
                        _this.dataStore.notes = {};
                        for (var _i = 0; _i < data.length; _i++) {
                            var note = data[_i];
                            _this.dataStore.notes[note.guid] = note;
                        }
                        callback();
                    })
                        .error(function () {
                        callback(new Error('Error $http request'));
                    });
                },
                // get content from remote
                // get content from remote
                function (callback) {
                    _this.progress.next('Request remote contents.');
                    var count = 0;
                    async.forEachOfSeries(_this.dataStore.notes, function (note, noteGuid, callback) {
                        _this.progress.set("Request remote contents. " + ++count + " / " + Object.keys(_this.dataStore.notes).length);
                        if (!note.hasContent)
                            _this.$http.get('/notes/get-content', { params: { query: { guid: noteGuid } } })
                                .success(function (data) {
                                for (var _i = 0; _i < data.length; _i++) {
                                    note = data[_i];
                                    _this.dataStore.notes[note.guid] = note;
                                }
                                callback();
                            })
                                .error(function () {
                                callback(new Error('Error $http request'));
                            });
                        else
                            callback();
                    }, function (err) {
                        callback(err);
                    });
                },
                // get time logs
                // get time logs
                function (callback) {
                    _this.progress.next('Getting time logs.');
                    var guids = [];
                    for (var noteGuid in _this.dataStore.notes) {
                        var note = _this.dataStore.notes[noteGuid];
                        guids.push(note.guid);
                    }
                    var timeLogQuery = _this._makeTimeLogQuery(merge(true, params, { noteGuids: guids }));
                    _this.$http.post('/time-logs', { query: timeLogQuery })
                        .success(function (data) {
                        _this.dataStore.timeLogs = {};
                        for (var _i = 0; _i < data.length; _i++) {
                            var timeLog = data[_i];
                            if (!_this.dataStore.timeLogs[timeLog.noteGuid])
                                _this.dataStore.timeLogs[timeLog.noteGuid] = {};
                            _this.dataStore.timeLogs[timeLog.noteGuid][timeLog._id] = timeLog;
                        }
                        callback();
                    })
                        .error(function () {
                        callback(new Error('Error $http request'));
                    });
                },
                // get profit logs
                // get profit logs
                function (callback) {
                    _this.progress.next('Getting profit logs.');
                    var guids = [];
                    for (var noteGuid in _this.dataStore.notes) {
                        var note = _this.dataStore.notes[noteGuid];
                        guids.push(note.guid);
                    }
                    _this.$http.post('/profit-logs', { query: { noteGuid: { $in: guids } } })
                        .success(function (data) {
                        _this.dataStore.profitLogs = {};
                        for (var _i = 0; _i < data.length; _i++) {
                            var profitLog = data[_i];
                            if (!_this.dataStore.profitLogs[profitLog.noteGuid])
                                _this.dataStore.profitLogs[profitLog.noteGuid] = {};
                            _this.dataStore.profitLogs[profitLog.noteGuid][profitLog._id] = profitLog;
                        }
                        callback();
                    })
                        .error(function () {
                        callback(new Error('Error $http request'));
                    });
                },
            ], function (err) {
                if (err)
                    alert(err);
                else
                    _this.progress.next('Done.');
                _this.progress.close();
                callback(err);
            });
        };
        this.reParse = function (callback) {
            if (!callback)
                callback = function () {
                };
            _this.progress.open(2);
            _this.progress.next('Re Parse notes...');
            async.waterfall([
                function (callback) {
                    _this.$http.get('/notes/re-parse')
                        .success(function (data) {
                        callback();
                    })
                        .error(function (data) {
                        callback('Error $http request');
                    });
                }], function (err) {
                _this.progress.next('Done.');
                _this.progress.close();
                callback(err);
            });
        };
        this.countNotes = function (callback) {
            var query = _this._makeNoteQuery();
            _this.$http.get('/notes/count', { params: { query: query } })
                .success(function (data) {
                callback(null, data);
            })
                .error(function () {
                callback('Error $http request');
            });
        };
        this.countTimeLogs = function (callback) {
            var query = _this._makeTimeLogQuery();
            _this.$http.get('/time-logs/count', { params: { query: query } })
                .success(function (data) {
                callback(null, data);
            })
                .error(function () {
                callback('Error $http request');
            });
        };
        this._makeNoteQuery = function (params) {
            if (params === void 0) { params = {}; }
            var result = {};
            // set updated query
            if (params.start)
                merge(result, { updated: { $gte: params.start.valueOf() } });
            // check notebooks
            var notebooksHash = {};
            if (_this.filterParams.notebookGuids && _this.filterParams.notebookGuids.length > 0)
                for (var _i = 0, _a = _this.filterParams.notebookGuids; _i < _a.length; _i++) {
                    var notebookGuid = _a[_i];
                    notebooksHash[notebookGuid] = true;
                }
            // check stacks
            if (_this.filterParams.stacks && _this.filterParams.stacks.length > 0)
                for (var _b = 0, _c = _this.filterParams.stacks; _b < _c.length; _b++) {
                    var stack = _c[_b];
                    for (var notebookGuid_1 in _this.dataStore.notebooks) {
                        var notebook = _this.dataStore.notebooks[notebookGuid_1];
                        if (stack == notebook.stack)
                            notebooksHash[notebook.guid] = true;
                    }
                }
            // set notebooks query checked before
            var notebooksArray = Object.keys(notebooksHash);
            if (notebooksArray.length > 0)
                merge(result, { notebookGuid: { $in: notebooksArray } });
            return result;
        };
        this._makeTimeLogQuery = function (params) {
            if (params === void 0) { params = {}; }
            var result = {};
            // set date query
            if (params.start)
                merge.recursive(result, { date: { $gte: params.start.valueOf() } });
            if (params.end)
                merge.recursive(result, { date: { $lte: params.end.valueOf() } });
            // set note guids query
            if (params.noteGuids)
                merge(result, { noteGuid: { $in: params.noteGuids } });
            return result;
        };
        this.filterParams = {
            notebookGuids: [],
            stacks: []
        };
    }
    return DataTranscieverService;
})();
angular.module('App').service('dataTransciever', ['$http', 'dataStore', 'progress', DataTranscieverService]);
exports.__esModule = true;
exports["default"] = DataTranscieverService;

},{"async":1,"merge":2}],23:[function(require,module,exports){
var ProgressService = (function () {
    function ProgressService($modal) {
        var _this = this;
        this.$modal = $modal;
        this.modalInstance = null;
        this.value = 0;
        this.completeCount = 0;
        this.allCount = 0;
        this.message = '';
        this.open = function (allCount) {
            _this.message = 'processing...';
            _this.value = 0;
            _this.completeCount = 0;
            _this.allCount = allCount;
            _this.modalInstance = _this.$modal.open({
                templateUrl: 'progress-modal',
                controller: 'ProgressModalController',
                backdrop: 'static',
                keyboard: false,
                size: 'sm',
                animation: false
            });
        };
        this.close = function () {
            _this.modalInstance.close();
        };
        this.set = function (message, value) {
            if (value === void 0) { value = null; }
            _this.message = message;
            if (value !== null)
                _this.value = value;
        };
        this.next = function (message) {
            _this.completeCount++;
            _this.set(message, _this.completeCount / _this.allCount * 100);
        };
    }
    return ProgressService;
})();
angular.module('App').service('progress', ['$modal', ProgressService]);
exports.__esModule = true;
exports["default"] = ProgressService;

},{}]},{},[19])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvYXN5bmMvbGliL2FzeW5jLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL21lcmdlL21lcmdlLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsInNyYy9jb250cm9sbGVycy9hdXRoLWNvbnRyb2xsZXIuanMiLCJzcmMvY29udHJvbGxlcnMvY29udHJvbGxlci5qcyIsInNyYy9jb250cm9sbGVycy9tZW51LWNvbnRyb2xsZXIuanMiLCJzcmMvY29udHJvbGxlcnMvbW9kYWwtY29udHJvbGxlci5qcyIsInNyYy9jb250cm9sbGVycy9uYXZpZ2F0aW9uLWNvbnRyb2xsZXIuanMiLCJzcmMvY29udHJvbGxlcnMvbm90ZXMtY29udHJvbGxlci5qcyIsInNyYy9jb250cm9sbGVycy9wcm9ncmVzcy1tb2RhbC1jb250cm9sbGVyLmpzIiwic3JjL2NvbnRyb2xsZXJzL3NldHRpbmdzLWNvbnRyb2xsZXIuanMiLCJzcmMvY29udHJvbGxlcnMvdGltZWxpbmUtY29udHJvbGxlci5qcyIsInNyYy9kaXJlY3RpdmVzL3Jlc2l6ZS5qcyIsInNyYy9maWx0ZXJzL2FiYnJldmlhdGUuanMiLCJzcmMvZmlsdGVycy9maWx0ZXItYnktcHJvcGVydHkuanMiLCJzcmMvZmlsdGVycy9vYmplY3QtbGVuZ3RoLmpzIiwic3JjL2ZpbHRlcnMvb3JkZXItb2JqZWN0LWJ5LmpzIiwic3JjL2ZpbHRlcnMvc3BlbnQtdGltZS5qcyIsInNyYy9pbmRleC5qcyIsInNyYy9yb3V0ZS5qcyIsInNyYy9zZXJ2aWNlcy9kYXRhLXN0b3JlLmpzIiwic3JjL3NlcnZpY2VzL2RhdGEtdHJhbnNjaWV2ZXIuanMiLCJzcmMvc2VydmljZXMvcHJvZ3Jlc3MuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDanZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qIVxuICogYXN5bmNcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9jYW9sYW4vYXN5bmNcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMC0yMDE0IENhb2xhbiBNY01haG9uXG4gKiBSZWxlYXNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2VcbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBhc3luYyA9IHt9O1xuICAgIGZ1bmN0aW9uIG5vb3AoKSB7fVxuICAgIGZ1bmN0aW9uIGlkZW50aXR5KHYpIHtcbiAgICAgICAgcmV0dXJuIHY7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHRvQm9vbCh2KSB7XG4gICAgICAgIHJldHVybiAhIXY7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG5vdElkKHYpIHtcbiAgICAgICAgcmV0dXJuICF2O1xuICAgIH1cblxuICAgIC8vIGdsb2JhbCBvbiB0aGUgc2VydmVyLCB3aW5kb3cgaW4gdGhlIGJyb3dzZXJcbiAgICB2YXIgcHJldmlvdXNfYXN5bmM7XG5cbiAgICAvLyBFc3RhYmxpc2ggdGhlIHJvb3Qgb2JqZWN0LCBgd2luZG93YCAoYHNlbGZgKSBpbiB0aGUgYnJvd3NlciwgYGdsb2JhbGBcbiAgICAvLyBvbiB0aGUgc2VydmVyLCBvciBgdGhpc2AgaW4gc29tZSB2aXJ0dWFsIG1hY2hpbmVzLiBXZSB1c2UgYHNlbGZgXG4gICAgLy8gaW5zdGVhZCBvZiBgd2luZG93YCBmb3IgYFdlYldvcmtlcmAgc3VwcG9ydC5cbiAgICB2YXIgcm9vdCA9IHR5cGVvZiBzZWxmID09PSAnb2JqZWN0JyAmJiBzZWxmLnNlbGYgPT09IHNlbGYgJiYgc2VsZiB8fFxuICAgICAgICAgICAgdHlwZW9mIGdsb2JhbCA9PT0gJ29iamVjdCcgJiYgZ2xvYmFsLmdsb2JhbCA9PT0gZ2xvYmFsICYmIGdsb2JhbCB8fFxuICAgICAgICAgICAgdGhpcztcblxuICAgIGlmIChyb290ICE9IG51bGwpIHtcbiAgICAgICAgcHJldmlvdXNfYXN5bmMgPSByb290LmFzeW5jO1xuICAgIH1cblxuICAgIGFzeW5jLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJvb3QuYXN5bmMgPSBwcmV2aW91c19hc3luYztcbiAgICAgICAgcmV0dXJuIGFzeW5jO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBvbmx5X29uY2UoZm4pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKGZuID09PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoXCJDYWxsYmFjayB3YXMgYWxyZWFkeSBjYWxsZWQuXCIpO1xuICAgICAgICAgICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGZuID0gbnVsbDtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfb25jZShmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoZm4gPT09IG51bGwpIHJldHVybjtcbiAgICAgICAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICBmbiA9IG51bGw7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8vLyBjcm9zcy1icm93c2VyIGNvbXBhdGlibGl0eSBmdW5jdGlvbnMgLy8vL1xuXG4gICAgdmFyIF90b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbiAgICB2YXIgX2lzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgcmV0dXJuIF90b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gICAgfTtcblxuICAgIC8vIFBvcnRlZCBmcm9tIHVuZGVyc2NvcmUuanMgaXNPYmplY3RcbiAgICB2YXIgX2lzT2JqZWN0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgIHZhciB0eXBlID0gdHlwZW9mIG9iajtcbiAgICAgICAgcmV0dXJuIHR5cGUgPT09ICdmdW5jdGlvbicgfHwgdHlwZSA9PT0gJ29iamVjdCcgJiYgISFvYmo7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIF9pc0FycmF5TGlrZShhcnIpIHtcbiAgICAgICAgcmV0dXJuIF9pc0FycmF5KGFycikgfHwgKFxuICAgICAgICAgICAgLy8gaGFzIGEgcG9zaXRpdmUgaW50ZWdlciBsZW5ndGggcHJvcGVydHlcbiAgICAgICAgICAgIHR5cGVvZiBhcnIubGVuZ3RoID09PSBcIm51bWJlclwiICYmXG4gICAgICAgICAgICBhcnIubGVuZ3RoID49IDAgJiZcbiAgICAgICAgICAgIGFyci5sZW5ndGggJSAxID09PSAwXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2FycmF5RWFjaChhcnIsIGl0ZXJhdG9yKSB7XG4gICAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgICAgbGVuZ3RoID0gYXJyLmxlbmd0aDtcblxuICAgICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgaXRlcmF0b3IoYXJyW2luZGV4XSwgaW5kZXgsIGFycik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfbWFwKGFyciwgaXRlcmF0b3IpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgICBsZW5ndGggPSBhcnIubGVuZ3RoLFxuICAgICAgICAgICAgcmVzdWx0ID0gQXJyYXkobGVuZ3RoKTtcblxuICAgICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgcmVzdWx0W2luZGV4XSA9IGl0ZXJhdG9yKGFycltpbmRleF0sIGluZGV4LCBhcnIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3JhbmdlKGNvdW50KSB7XG4gICAgICAgIHJldHVybiBfbWFwKEFycmF5KGNvdW50KSwgZnVuY3Rpb24gKHYsIGkpIHsgcmV0dXJuIGk7IH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9yZWR1Y2UoYXJyLCBpdGVyYXRvciwgbWVtbykge1xuICAgICAgICBfYXJyYXlFYWNoKGFyciwgZnVuY3Rpb24gKHgsIGksIGEpIHtcbiAgICAgICAgICAgIG1lbW8gPSBpdGVyYXRvcihtZW1vLCB4LCBpLCBhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBtZW1vO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9mb3JFYWNoT2Yob2JqZWN0LCBpdGVyYXRvcikge1xuICAgICAgICBfYXJyYXlFYWNoKF9rZXlzKG9iamVjdCksIGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKG9iamVjdFtrZXldLCBrZXkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfaW5kZXhPZihhcnIsIGl0ZW0pIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChhcnJbaV0gPT09IGl0ZW0pIHJldHVybiBpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG5cbiAgICB2YXIgX2tleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHZhciBrZXlzID0gW107XG4gICAgICAgIGZvciAodmFyIGsgaW4gb2JqKSB7XG4gICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGspKSB7XG4gICAgICAgICAgICAgICAga2V5cy5wdXNoKGspO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBrZXlzO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBfa2V5SXRlcmF0b3IoY29sbCkge1xuICAgICAgICB2YXIgaSA9IC0xO1xuICAgICAgICB2YXIgbGVuO1xuICAgICAgICB2YXIga2V5cztcbiAgICAgICAgaWYgKF9pc0FycmF5TGlrZShjb2xsKSkge1xuICAgICAgICAgICAgbGVuID0gY29sbC5sZW5ndGg7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dCgpIHtcbiAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGkgPCBsZW4gPyBpIDogbnVsbDtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBrZXlzID0gX2tleXMoY29sbCk7XG4gICAgICAgICAgICBsZW4gPSBrZXlzLmxlbmd0aDtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0KCkge1xuICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICByZXR1cm4gaSA8IGxlbiA/IGtleXNbaV0gOiBudWxsO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFNpbWlsYXIgdG8gRVM2J3MgcmVzdCBwYXJhbSAoaHR0cDovL2FyaXlhLm9maWxhYnMuY29tLzIwMTMvMDMvZXM2LWFuZC1yZXN0LXBhcmFtZXRlci5odG1sKVxuICAgIC8vIFRoaXMgYWNjdW11bGF0ZXMgdGhlIGFyZ3VtZW50cyBwYXNzZWQgaW50byBhbiBhcnJheSwgYWZ0ZXIgYSBnaXZlbiBpbmRleC5cbiAgICAvLyBGcm9tIHVuZGVyc2NvcmUuanMgKGh0dHBzOi8vZ2l0aHViLmNvbS9qYXNoa2VuYXMvdW5kZXJzY29yZS9wdWxsLzIxNDApLlxuICAgIGZ1bmN0aW9uIF9yZXN0UGFyYW0oZnVuYywgc3RhcnRJbmRleCkge1xuICAgICAgICBzdGFydEluZGV4ID0gc3RhcnRJbmRleCA9PSBudWxsID8gZnVuYy5sZW5ndGggLSAxIDogK3N0YXJ0SW5kZXg7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBsZW5ndGggPSBNYXRoLm1heChhcmd1bWVudHMubGVuZ3RoIC0gc3RhcnRJbmRleCwgMCk7XG4gICAgICAgICAgICB2YXIgcmVzdCA9IEFycmF5KGxlbmd0aCk7XG4gICAgICAgICAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICAgICAgcmVzdFtpbmRleF0gPSBhcmd1bWVudHNbaW5kZXggKyBzdGFydEluZGV4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN3aXRjaCAoc3RhcnRJbmRleCkge1xuICAgICAgICAgICAgICAgIGNhc2UgMDogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCByZXN0KTtcbiAgICAgICAgICAgICAgICBjYXNlIDE6IHJldHVybiBmdW5jLmNhbGwodGhpcywgYXJndW1lbnRzWzBdLCByZXN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEN1cnJlbnRseSB1bnVzZWQgYnV0IGhhbmRsZSBjYXNlcyBvdXRzaWRlIG9mIHRoZSBzd2l0Y2ggc3RhdGVtZW50OlxuICAgICAgICAgICAgLy8gdmFyIGFyZ3MgPSBBcnJheShzdGFydEluZGV4ICsgMSk7XG4gICAgICAgICAgICAvLyBmb3IgKGluZGV4ID0gMDsgaW5kZXggPCBzdGFydEluZGV4OyBpbmRleCsrKSB7XG4gICAgICAgICAgICAvLyAgICAgYXJnc1tpbmRleF0gPSBhcmd1bWVudHNbaW5kZXhdO1xuICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgLy8gYXJnc1tzdGFydEluZGV4XSA9IHJlc3Q7XG4gICAgICAgICAgICAvLyByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfd2l0aG91dEluZGV4KGl0ZXJhdG9yKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUsIGluZGV4LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZXJhdG9yKHZhbHVlLCBjYWxsYmFjayk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8vLyBleHBvcnRlZCBhc3luYyBtb2R1bGUgZnVuY3Rpb25zIC8vLy9cblxuICAgIC8vLy8gbmV4dFRpY2sgaW1wbGVtZW50YXRpb24gd2l0aCBicm93c2VyLWNvbXBhdGlibGUgZmFsbGJhY2sgLy8vL1xuXG4gICAgLy8gY2FwdHVyZSB0aGUgZ2xvYmFsIHJlZmVyZW5jZSB0byBndWFyZCBhZ2FpbnN0IGZha2VUaW1lciBtb2Nrc1xuICAgIHZhciBfc2V0SW1tZWRpYXRlID0gdHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gJ2Z1bmN0aW9uJyAmJiBzZXRJbW1lZGlhdGU7XG5cbiAgICB2YXIgX2RlbGF5ID0gX3NldEltbWVkaWF0ZSA/IGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgIC8vIG5vdCBhIGRpcmVjdCBhbGlhcyBmb3IgSUUxMCBjb21wYXRpYmlsaXR5XG4gICAgICAgIF9zZXRJbW1lZGlhdGUoZm4pO1xuICAgIH0gOiBmdW5jdGlvbihmbikge1xuICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9O1xuXG4gICAgaWYgKHR5cGVvZiBwcm9jZXNzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgcHJvY2Vzcy5uZXh0VGljayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBhc3luYy5uZXh0VGljayA9IHByb2Nlc3MubmV4dFRpY2s7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgYXN5bmMubmV4dFRpY2sgPSBfZGVsYXk7XG4gICAgfVxuICAgIGFzeW5jLnNldEltbWVkaWF0ZSA9IF9zZXRJbW1lZGlhdGUgPyBfZGVsYXkgOiBhc3luYy5uZXh0VGljaztcblxuXG4gICAgYXN5bmMuZm9yRWFjaCA9XG4gICAgYXN5bmMuZWFjaCA9IGZ1bmN0aW9uIChhcnIsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gYXN5bmMuZWFjaE9mKGFyciwgX3dpdGhvdXRJbmRleChpdGVyYXRvciksIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMuZm9yRWFjaFNlcmllcyA9XG4gICAgYXN5bmMuZWFjaFNlcmllcyA9IGZ1bmN0aW9uIChhcnIsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gYXN5bmMuZWFjaE9mU2VyaWVzKGFyciwgX3dpdGhvdXRJbmRleChpdGVyYXRvciksIGNhbGxiYWNrKTtcbiAgICB9O1xuXG5cbiAgICBhc3luYy5mb3JFYWNoTGltaXQgPVxuICAgIGFzeW5jLmVhY2hMaW1pdCA9IGZ1bmN0aW9uIChhcnIsIGxpbWl0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIF9lYWNoT2ZMaW1pdChsaW1pdCkoYXJyLCBfd2l0aG91dEluZGV4KGl0ZXJhdG9yKSwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy5mb3JFYWNoT2YgPVxuICAgIGFzeW5jLmVhY2hPZiA9IGZ1bmN0aW9uIChvYmplY3QsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IF9vbmNlKGNhbGxiYWNrIHx8IG5vb3ApO1xuICAgICAgICBvYmplY3QgPSBvYmplY3QgfHwgW107XG5cbiAgICAgICAgdmFyIGl0ZXIgPSBfa2V5SXRlcmF0b3Iob2JqZWN0KTtcbiAgICAgICAgdmFyIGtleSwgY29tcGxldGVkID0gMDtcblxuICAgICAgICB3aGlsZSAoKGtleSA9IGl0ZXIoKSkgIT0gbnVsbCkge1xuICAgICAgICAgICAgY29tcGxldGVkICs9IDE7XG4gICAgICAgICAgICBpdGVyYXRvcihvYmplY3Rba2V5XSwga2V5LCBvbmx5X29uY2UoZG9uZSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbXBsZXRlZCA9PT0gMCkgY2FsbGJhY2sobnVsbCk7XG5cbiAgICAgICAgZnVuY3Rpb24gZG9uZShlcnIpIHtcbiAgICAgICAgICAgIGNvbXBsZXRlZC0tO1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBDaGVjayBrZXkgaXMgbnVsbCBpbiBjYXNlIGl0ZXJhdG9yIGlzbid0IGV4aGF1c3RlZFxuICAgICAgICAgICAgLy8gYW5kIGRvbmUgcmVzb2x2ZWQgc3luY2hyb25vdXNseS5cbiAgICAgICAgICAgIGVsc2UgaWYgKGtleSA9PT0gbnVsbCAmJiBjb21wbGV0ZWQgPD0gMCkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGFzeW5jLmZvckVhY2hPZlNlcmllcyA9XG4gICAgYXN5bmMuZWFjaE9mU2VyaWVzID0gZnVuY3Rpb24gKG9iaiwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gX29uY2UoY2FsbGJhY2sgfHwgbm9vcCk7XG4gICAgICAgIG9iaiA9IG9iaiB8fCBbXTtcbiAgICAgICAgdmFyIG5leHRLZXkgPSBfa2V5SXRlcmF0b3Iob2JqKTtcbiAgICAgICAgdmFyIGtleSA9IG5leHRLZXkoKTtcbiAgICAgICAgZnVuY3Rpb24gaXRlcmF0ZSgpIHtcbiAgICAgICAgICAgIHZhciBzeW5jID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChrZXkgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpdGVyYXRvcihvYmpba2V5XSwga2V5LCBvbmx5X29uY2UoZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGtleSA9IG5leHRLZXkoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN5bmMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUoaXRlcmF0ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZXJhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIHN5bmMgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpdGVyYXRlKCk7XG4gICAgfTtcblxuXG5cbiAgICBhc3luYy5mb3JFYWNoT2ZMaW1pdCA9XG4gICAgYXN5bmMuZWFjaE9mTGltaXQgPSBmdW5jdGlvbiAob2JqLCBsaW1pdCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIF9lYWNoT2ZMaW1pdChsaW1pdCkob2JqLCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBfZWFjaE9mTGltaXQobGltaXQpIHtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9iaiwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IF9vbmNlKGNhbGxiYWNrIHx8IG5vb3ApO1xuICAgICAgICAgICAgb2JqID0gb2JqIHx8IFtdO1xuICAgICAgICAgICAgdmFyIG5leHRLZXkgPSBfa2V5SXRlcmF0b3Iob2JqKTtcbiAgICAgICAgICAgIGlmIChsaW1pdCA8PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGRvbmUgPSBmYWxzZTtcbiAgICAgICAgICAgIHZhciBydW5uaW5nID0gMDtcbiAgICAgICAgICAgIHZhciBlcnJvcmVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgIChmdW5jdGlvbiByZXBsZW5pc2ggKCkge1xuICAgICAgICAgICAgICAgIGlmIChkb25lICYmIHJ1bm5pbmcgPD0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgd2hpbGUgKHJ1bm5pbmcgPCBsaW1pdCAmJiAhZXJyb3JlZCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIga2V5ID0gbmV4dEtleSgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb25lID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChydW5uaW5nIDw9IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBydW5uaW5nICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIGl0ZXJhdG9yKG9ialtrZXldLCBrZXksIG9ubHlfb25jZShmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBydW5uaW5nIC09IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcGxlbmlzaCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkoKTtcbiAgICAgICAgfTtcbiAgICB9XG5cblxuICAgIGZ1bmN0aW9uIGRvUGFyYWxsZWwoZm4pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChvYmosIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGZuKGFzeW5jLmVhY2hPZiwgb2JqLCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBkb1BhcmFsbGVsTGltaXQoZm4pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChvYmosIGxpbWl0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHJldHVybiBmbihfZWFjaE9mTGltaXQobGltaXQpLCBvYmosIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGRvU2VyaWVzKGZuKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAob2JqLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHJldHVybiBmbihhc3luYy5lYWNoT2ZTZXJpZXMsIG9iaiwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfYXN5bmNNYXAoZWFjaGZuLCBhcnIsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IF9vbmNlKGNhbGxiYWNrIHx8IG5vb3ApO1xuICAgICAgICBhcnIgPSBhcnIgfHwgW107XG4gICAgICAgIHZhciByZXN1bHRzID0gX2lzQXJyYXlMaWtlKGFycikgPyBbXSA6IHt9O1xuICAgICAgICBlYWNoZm4oYXJyLCBmdW5jdGlvbiAodmFsdWUsIGluZGV4LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgaXRlcmF0b3IodmFsdWUsIGZ1bmN0aW9uIChlcnIsIHYpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzW2luZGV4XSA9IHY7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnIsIHJlc3VsdHMpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYy5tYXAgPSBkb1BhcmFsbGVsKF9hc3luY01hcCk7XG4gICAgYXN5bmMubWFwU2VyaWVzID0gZG9TZXJpZXMoX2FzeW5jTWFwKTtcbiAgICBhc3luYy5tYXBMaW1pdCA9IGRvUGFyYWxsZWxMaW1pdChfYXN5bmNNYXApO1xuXG4gICAgLy8gcmVkdWNlIG9ubHkgaGFzIGEgc2VyaWVzIHZlcnNpb24sIGFzIGRvaW5nIHJlZHVjZSBpbiBwYXJhbGxlbCB3b24ndFxuICAgIC8vIHdvcmsgaW4gbWFueSBzaXR1YXRpb25zLlxuICAgIGFzeW5jLmluamVjdCA9XG4gICAgYXN5bmMuZm9sZGwgPVxuICAgIGFzeW5jLnJlZHVjZSA9IGZ1bmN0aW9uIChhcnIsIG1lbW8sIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBhc3luYy5lYWNoT2ZTZXJpZXMoYXJyLCBmdW5jdGlvbiAoeCwgaSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKG1lbW8sIHgsIGZ1bmN0aW9uIChlcnIsIHYpIHtcbiAgICAgICAgICAgICAgICBtZW1vID0gdjtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgbWVtbyk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBhc3luYy5mb2xkciA9XG4gICAgYXN5bmMucmVkdWNlUmlnaHQgPSBmdW5jdGlvbiAoYXJyLCBtZW1vLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHJldmVyc2VkID0gX21hcChhcnIsIGlkZW50aXR5KS5yZXZlcnNlKCk7XG4gICAgICAgIGFzeW5jLnJlZHVjZShyZXZlcnNlZCwgbWVtbywgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMudHJhbnNmb3JtID0gZnVuY3Rpb24gKGFyciwgbWVtbywgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAzKSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IGl0ZXJhdG9yO1xuICAgICAgICAgICAgaXRlcmF0b3IgPSBtZW1vO1xuICAgICAgICAgICAgbWVtbyA9IF9pc0FycmF5KGFycikgPyBbXSA6IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgYXN5bmMuZWFjaE9mKGFyciwgZnVuY3Rpb24odiwgaywgY2IpIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKG1lbW8sIHYsIGssIGNiKTtcbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnIsIG1lbW8pO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gX2ZpbHRlcihlYWNoZm4sIGFyciwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciByZXN1bHRzID0gW107XG4gICAgICAgIGVhY2hmbihhcnIsIGZ1bmN0aW9uICh4LCBpbmRleCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKHgsIGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgaWYgKHYpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHtpbmRleDogaW5kZXgsIHZhbHVlOiB4fSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2FsbGJhY2soX21hcChyZXN1bHRzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYS5pbmRleCAtIGIuaW5kZXg7XG4gICAgICAgICAgICB9KSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geC52YWx1ZTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMuc2VsZWN0ID1cbiAgICBhc3luYy5maWx0ZXIgPSBkb1BhcmFsbGVsKF9maWx0ZXIpO1xuXG4gICAgYXN5bmMuc2VsZWN0TGltaXQgPVxuICAgIGFzeW5jLmZpbHRlckxpbWl0ID0gZG9QYXJhbGxlbExpbWl0KF9maWx0ZXIpO1xuXG4gICAgYXN5bmMuc2VsZWN0U2VyaWVzID1cbiAgICBhc3luYy5maWx0ZXJTZXJpZXMgPSBkb1NlcmllcyhfZmlsdGVyKTtcblxuICAgIGZ1bmN0aW9uIF9yZWplY3QoZWFjaGZuLCBhcnIsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBfZmlsdGVyKGVhY2hmbiwgYXJyLCBmdW5jdGlvbih2YWx1ZSwgY2IpIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKHZhbHVlLCBmdW5jdGlvbih2KSB7XG4gICAgICAgICAgICAgICAgY2IoIXYpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGNhbGxiYWNrKTtcbiAgICB9XG4gICAgYXN5bmMucmVqZWN0ID0gZG9QYXJhbGxlbChfcmVqZWN0KTtcbiAgICBhc3luYy5yZWplY3RMaW1pdCA9IGRvUGFyYWxsZWxMaW1pdChfcmVqZWN0KTtcbiAgICBhc3luYy5yZWplY3RTZXJpZXMgPSBkb1NlcmllcyhfcmVqZWN0KTtcblxuICAgIGZ1bmN0aW9uIF9jcmVhdGVUZXN0ZXIoZWFjaGZuLCBjaGVjaywgZ2V0UmVzdWx0KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihhcnIsIGxpbWl0LCBpdGVyYXRvciwgY2IpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGRvbmUoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNiKSBjYihnZXRSZXN1bHQoZmFsc2UsIHZvaWQgMCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnVuY3Rpb24gaXRlcmF0ZWUoeCwgXywgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBpZiAoIWNiKSByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICBpdGVyYXRvcih4LCBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2IgJiYgY2hlY2sodikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNiKGdldFJlc3VsdCh0cnVlLCB4KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYiA9IGl0ZXJhdG9yID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMykge1xuICAgICAgICAgICAgICAgIGVhY2hmbihhcnIsIGxpbWl0LCBpdGVyYXRlZSwgZG9uZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNiID0gaXRlcmF0b3I7XG4gICAgICAgICAgICAgICAgaXRlcmF0b3IgPSBsaW1pdDtcbiAgICAgICAgICAgICAgICBlYWNoZm4oYXJyLCBpdGVyYXRlZSwgZG9uZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYXN5bmMuYW55ID1cbiAgICBhc3luYy5zb21lID0gX2NyZWF0ZVRlc3Rlcihhc3luYy5lYWNoT2YsIHRvQm9vbCwgaWRlbnRpdHkpO1xuXG4gICAgYXN5bmMuc29tZUxpbWl0ID0gX2NyZWF0ZVRlc3Rlcihhc3luYy5lYWNoT2ZMaW1pdCwgdG9Cb29sLCBpZGVudGl0eSk7XG5cbiAgICBhc3luYy5hbGwgPVxuICAgIGFzeW5jLmV2ZXJ5ID0gX2NyZWF0ZVRlc3Rlcihhc3luYy5lYWNoT2YsIG5vdElkLCBub3RJZCk7XG5cbiAgICBhc3luYy5ldmVyeUxpbWl0ID0gX2NyZWF0ZVRlc3Rlcihhc3luYy5lYWNoT2ZMaW1pdCwgbm90SWQsIG5vdElkKTtcblxuICAgIGZ1bmN0aW9uIF9maW5kR2V0UmVzdWx0KHYsIHgpIHtcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICAgIGFzeW5jLmRldGVjdCA9IF9jcmVhdGVUZXN0ZXIoYXN5bmMuZWFjaE9mLCBpZGVudGl0eSwgX2ZpbmRHZXRSZXN1bHQpO1xuICAgIGFzeW5jLmRldGVjdFNlcmllcyA9IF9jcmVhdGVUZXN0ZXIoYXN5bmMuZWFjaE9mU2VyaWVzLCBpZGVudGl0eSwgX2ZpbmRHZXRSZXN1bHQpO1xuICAgIGFzeW5jLmRldGVjdExpbWl0ID0gX2NyZWF0ZVRlc3Rlcihhc3luYy5lYWNoT2ZMaW1pdCwgaWRlbnRpdHksIF9maW5kR2V0UmVzdWx0KTtcblxuICAgIGFzeW5jLnNvcnRCeSA9IGZ1bmN0aW9uIChhcnIsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBhc3luYy5tYXAoYXJyLCBmdW5jdGlvbiAoeCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKHgsIGZ1bmN0aW9uIChlcnIsIGNyaXRlcmlhKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwge3ZhbHVlOiB4LCBjcml0ZXJpYTogY3JpdGVyaWF9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVyciwgcmVzdWx0cykge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgX21hcChyZXN1bHRzLnNvcnQoY29tcGFyYXRvciksIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB4LnZhbHVlO1xuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcblxuICAgICAgICBmdW5jdGlvbiBjb21wYXJhdG9yKGxlZnQsIHJpZ2h0KSB7XG4gICAgICAgICAgICB2YXIgYSA9IGxlZnQuY3JpdGVyaWEsIGIgPSByaWdodC5jcml0ZXJpYTtcbiAgICAgICAgICAgIHJldHVybiBhIDwgYiA/IC0xIDogYSA+IGIgPyAxIDogMDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBhc3luYy5hdXRvID0gZnVuY3Rpb24gKHRhc2tzLCBjb25jdXJyZW5jeSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBhcmd1bWVudHNbMV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIC8vIGNvbmN1cnJlbmN5IGlzIG9wdGlvbmFsLCBzaGlmdCB0aGUgYXJncy5cbiAgICAgICAgICAgIGNhbGxiYWNrID0gY29uY3VycmVuY3k7XG4gICAgICAgICAgICBjb25jdXJyZW5jeSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY2FsbGJhY2sgPSBfb25jZShjYWxsYmFjayB8fCBub29wKTtcbiAgICAgICAgdmFyIGtleXMgPSBfa2V5cyh0YXNrcyk7XG4gICAgICAgIHZhciByZW1haW5pbmdUYXNrcyA9IGtleXMubGVuZ3RoO1xuICAgICAgICBpZiAoIXJlbWFpbmluZ1Rhc2tzKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFjb25jdXJyZW5jeSkge1xuICAgICAgICAgICAgY29uY3VycmVuY3kgPSByZW1haW5pbmdUYXNrcztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZXN1bHRzID0ge307XG4gICAgICAgIHZhciBydW5uaW5nVGFza3MgPSAwO1xuXG4gICAgICAgIHZhciBoYXNFcnJvciA9IGZhbHNlO1xuXG4gICAgICAgIHZhciBsaXN0ZW5lcnMgPSBbXTtcbiAgICAgICAgZnVuY3Rpb24gYWRkTGlzdGVuZXIoZm4pIHtcbiAgICAgICAgICAgIGxpc3RlbmVycy51bnNoaWZ0KGZuKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihmbikge1xuICAgICAgICAgICAgdmFyIGlkeCA9IF9pbmRleE9mKGxpc3RlbmVycywgZm4pO1xuICAgICAgICAgICAgaWYgKGlkeCA+PSAwKSBsaXN0ZW5lcnMuc3BsaWNlKGlkeCwgMSk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gdGFza0NvbXBsZXRlKCkge1xuICAgICAgICAgICAgcmVtYWluaW5nVGFza3MtLTtcbiAgICAgICAgICAgIF9hcnJheUVhY2gobGlzdGVuZXJzLnNsaWNlKDApLCBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBhZGRMaXN0ZW5lcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoIXJlbWFpbmluZ1Rhc2tzKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdWx0cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIF9hcnJheUVhY2goa2V5cywgZnVuY3Rpb24gKGspIHtcbiAgICAgICAgICAgIGlmIChoYXNFcnJvcikgcmV0dXJuO1xuICAgICAgICAgICAgdmFyIHRhc2sgPSBfaXNBcnJheSh0YXNrc1trXSkgPyB0YXNrc1trXTogW3Rhc2tzW2tdXTtcbiAgICAgICAgICAgIHZhciB0YXNrQ2FsbGJhY2sgPSBfcmVzdFBhcmFtKGZ1bmN0aW9uKGVyciwgYXJncykge1xuICAgICAgICAgICAgICAgIHJ1bm5pbmdUYXNrcy0tO1xuICAgICAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA8PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzYWZlUmVzdWx0cyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBfZm9yRWFjaE9mKHJlc3VsdHMsIGZ1bmN0aW9uKHZhbCwgcmtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2FmZVJlc3VsdHNbcmtleV0gPSB2YWw7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzYWZlUmVzdWx0c1trXSA9IGFyZ3M7XG4gICAgICAgICAgICAgICAgICAgIGhhc0Vycm9yID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIsIHNhZmVSZXN1bHRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHNba10gPSBhcmdzO1xuICAgICAgICAgICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUodGFza0NvbXBsZXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciByZXF1aXJlcyA9IHRhc2suc2xpY2UoMCwgdGFzay5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgIC8vIHByZXZlbnQgZGVhZC1sb2Nrc1xuICAgICAgICAgICAgdmFyIGxlbiA9IHJlcXVpcmVzLmxlbmd0aDtcbiAgICAgICAgICAgIHZhciBkZXA7XG4gICAgICAgICAgICB3aGlsZSAobGVuLS0pIHtcbiAgICAgICAgICAgICAgICBpZiAoIShkZXAgPSB0YXNrc1tyZXF1aXJlc1tsZW5dXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdIYXMgbm9uZXhpc3RlbnQgZGVwZW5kZW5jeSBpbiAnICsgcmVxdWlyZXMuam9pbignLCAnKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChfaXNBcnJheShkZXApICYmIF9pbmRleE9mKGRlcCwgaykgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0hhcyBjeWNsaWMgZGVwZW5kZW5jaWVzJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnVuY3Rpb24gcmVhZHkoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bm5pbmdUYXNrcyA8IGNvbmN1cnJlbmN5ICYmIF9yZWR1Y2UocmVxdWlyZXMsIGZ1bmN0aW9uIChhLCB4KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoYSAmJiByZXN1bHRzLmhhc093blByb3BlcnR5KHgpKTtcbiAgICAgICAgICAgICAgICB9LCB0cnVlKSAmJiAhcmVzdWx0cy5oYXNPd25Qcm9wZXJ0eShrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZWFkeSgpKSB7XG4gICAgICAgICAgICAgICAgcnVubmluZ1Rhc2tzKys7XG4gICAgICAgICAgICAgICAgdGFza1t0YXNrLmxlbmd0aCAtIDFdKHRhc2tDYWxsYmFjaywgcmVzdWx0cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBhZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmdW5jdGlvbiBsaXN0ZW5lcigpIHtcbiAgICAgICAgICAgICAgICBpZiAocmVhZHkoKSkge1xuICAgICAgICAgICAgICAgICAgICBydW5uaW5nVGFza3MrKztcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgICAgICB0YXNrW3Rhc2subGVuZ3RoIC0gMV0odGFza0NhbGxiYWNrLCByZXN1bHRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cblxuXG4gICAgYXN5bmMucmV0cnkgPSBmdW5jdGlvbih0aW1lcywgdGFzaywgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIERFRkFVTFRfVElNRVMgPSA1O1xuICAgICAgICB2YXIgREVGQVVMVF9JTlRFUlZBTCA9IDA7XG5cbiAgICAgICAgdmFyIGF0dGVtcHRzID0gW107XG5cbiAgICAgICAgdmFyIG9wdHMgPSB7XG4gICAgICAgICAgICB0aW1lczogREVGQVVMVF9USU1FUyxcbiAgICAgICAgICAgIGludGVydmFsOiBERUZBVUxUX0lOVEVSVkFMXG4gICAgICAgIH07XG5cbiAgICAgICAgZnVuY3Rpb24gcGFyc2VUaW1lcyhhY2MsIHQpe1xuICAgICAgICAgICAgaWYodHlwZW9mIHQgPT09ICdudW1iZXInKXtcbiAgICAgICAgICAgICAgICBhY2MudGltZXMgPSBwYXJzZUludCh0LCAxMCkgfHwgREVGQVVMVF9USU1FUztcbiAgICAgICAgICAgIH0gZWxzZSBpZih0eXBlb2YgdCA9PT0gJ29iamVjdCcpe1xuICAgICAgICAgICAgICAgIGFjYy50aW1lcyA9IHBhcnNlSW50KHQudGltZXMsIDEwKSB8fCBERUZBVUxUX1RJTUVTO1xuICAgICAgICAgICAgICAgIGFjYy5pbnRlcnZhbCA9IHBhcnNlSW50KHQuaW50ZXJ2YWwsIDEwKSB8fCBERUZBVUxUX0lOVEVSVkFMO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vuc3VwcG9ydGVkIGFyZ3VtZW50IHR5cGUgZm9yIFxcJ3RpbWVzXFwnOiAnICsgdHlwZW9mIHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIGlmIChsZW5ndGggPCAxIHx8IGxlbmd0aCA+IDMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBhcmd1bWVudHMgLSBtdXN0IGJlIGVpdGhlciAodGFzayksICh0YXNrLCBjYWxsYmFjayksICh0aW1lcywgdGFzaykgb3IgKHRpbWVzLCB0YXNrLCBjYWxsYmFjayknKTtcbiAgICAgICAgfSBlbHNlIGlmIChsZW5ndGggPD0gMiAmJiB0eXBlb2YgdGltZXMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gdGFzaztcbiAgICAgICAgICAgIHRhc2sgPSB0aW1lcztcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHRpbWVzICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBwYXJzZVRpbWVzKG9wdHMsIHRpbWVzKTtcbiAgICAgICAgfVxuICAgICAgICBvcHRzLmNhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgICAgIG9wdHMudGFzayA9IHRhc2s7XG5cbiAgICAgICAgZnVuY3Rpb24gd3JhcHBlZFRhc2sod3JhcHBlZENhbGxiYWNrLCB3cmFwcGVkUmVzdWx0cykge1xuICAgICAgICAgICAgZnVuY3Rpb24gcmV0cnlBdHRlbXB0KHRhc2ssIGZpbmFsQXR0ZW1wdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbihzZXJpZXNDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICB0YXNrKGZ1bmN0aW9uKGVyciwgcmVzdWx0KXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcmllc0NhbGxiYWNrKCFlcnIgfHwgZmluYWxBdHRlbXB0LCB7ZXJyOiBlcnIsIHJlc3VsdDogcmVzdWx0fSk7XG4gICAgICAgICAgICAgICAgICAgIH0sIHdyYXBwZWRSZXN1bHRzKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiByZXRyeUludGVydmFsKGludGVydmFsKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oc2VyaWVzQ2FsbGJhY2spe1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJpZXNDYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgaW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHdoaWxlIChvcHRzLnRpbWVzKSB7XG5cbiAgICAgICAgICAgICAgICB2YXIgZmluYWxBdHRlbXB0ID0gIShvcHRzLnRpbWVzLT0xKTtcbiAgICAgICAgICAgICAgICBhdHRlbXB0cy5wdXNoKHJldHJ5QXR0ZW1wdChvcHRzLnRhc2ssIGZpbmFsQXR0ZW1wdCkpO1xuICAgICAgICAgICAgICAgIGlmKCFmaW5hbEF0dGVtcHQgJiYgb3B0cy5pbnRlcnZhbCA+IDApe1xuICAgICAgICAgICAgICAgICAgICBhdHRlbXB0cy5wdXNoKHJldHJ5SW50ZXJ2YWwob3B0cy5pbnRlcnZhbCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXN5bmMuc2VyaWVzKGF0dGVtcHRzLCBmdW5jdGlvbihkb25lLCBkYXRhKXtcbiAgICAgICAgICAgICAgICBkYXRhID0gZGF0YVtkYXRhLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgICh3cmFwcGVkQ2FsbGJhY2sgfHwgb3B0cy5jYWxsYmFjaykoZGF0YS5lcnIsIGRhdGEucmVzdWx0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgYSBjYWxsYmFjayBpcyBwYXNzZWQsIHJ1biB0aGlzIGFzIGEgY29udHJvbGwgZmxvd1xuICAgICAgICByZXR1cm4gb3B0cy5jYWxsYmFjayA/IHdyYXBwZWRUYXNrKCkgOiB3cmFwcGVkVGFzaztcbiAgICB9O1xuXG4gICAgYXN5bmMud2F0ZXJmYWxsID0gZnVuY3Rpb24gKHRhc2tzLCBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IF9vbmNlKGNhbGxiYWNrIHx8IG5vb3ApO1xuICAgICAgICBpZiAoIV9pc0FycmF5KHRhc2tzKSkge1xuICAgICAgICAgICAgdmFyIGVyciA9IG5ldyBFcnJvcignRmlyc3QgYXJndW1lbnQgdG8gd2F0ZXJmYWxsIG11c3QgYmUgYW4gYXJyYXkgb2YgZnVuY3Rpb25zJyk7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRhc2tzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gd3JhcEl0ZXJhdG9yKGl0ZXJhdG9yKSB7XG4gICAgICAgICAgICByZXR1cm4gX3Jlc3RQYXJhbShmdW5jdGlvbiAoZXJyLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseShudWxsLCBbZXJyXS5jb25jYXQoYXJncykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5leHQgPSBpdGVyYXRvci5uZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzLnB1c2god3JhcEl0ZXJhdG9yKG5leHQpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MucHVzaChjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZW5zdXJlQXN5bmMoaXRlcmF0b3IpLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHdyYXBJdGVyYXRvcihhc3luYy5pdGVyYXRvcih0YXNrcykpKCk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIF9wYXJhbGxlbChlYWNoZm4sIHRhc2tzLCBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IGNhbGxiYWNrIHx8IG5vb3A7XG4gICAgICAgIHZhciByZXN1bHRzID0gX2lzQXJyYXlMaWtlKHRhc2tzKSA/IFtdIDoge307XG5cbiAgICAgICAgZWFjaGZuKHRhc2tzLCBmdW5jdGlvbiAodGFzaywga2V5LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgdGFzayhfcmVzdFBhcmFtKGZ1bmN0aW9uIChlcnIsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5sZW5ndGggPD0gMSkge1xuICAgICAgICAgICAgICAgICAgICBhcmdzID0gYXJnc1swXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzdWx0c1trZXldID0gYXJncztcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnIsIHJlc3VsdHMpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYy5wYXJhbGxlbCA9IGZ1bmN0aW9uICh0YXNrcywgY2FsbGJhY2spIHtcbiAgICAgICAgX3BhcmFsbGVsKGFzeW5jLmVhY2hPZiwgdGFza3MsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMucGFyYWxsZWxMaW1pdCA9IGZ1bmN0aW9uKHRhc2tzLCBsaW1pdCwgY2FsbGJhY2spIHtcbiAgICAgICAgX3BhcmFsbGVsKF9lYWNoT2ZMaW1pdChsaW1pdCksIHRhc2tzLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLnNlcmllcyA9IGZ1bmN0aW9uKHRhc2tzLCBjYWxsYmFjaykge1xuICAgICAgICBfcGFyYWxsZWwoYXN5bmMuZWFjaE9mU2VyaWVzLCB0YXNrcywgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy5pdGVyYXRvciA9IGZ1bmN0aW9uICh0YXNrcykge1xuICAgICAgICBmdW5jdGlvbiBtYWtlQ2FsbGJhY2soaW5kZXgpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGZuKCkge1xuICAgICAgICAgICAgICAgIGlmICh0YXNrcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGFza3NbaW5kZXhdLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmbi5uZXh0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmbi5uZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoaW5kZXggPCB0YXNrcy5sZW5ndGggLSAxKSA/IG1ha2VDYWxsYmFjayhpbmRleCArIDEpOiBudWxsO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBmbjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWFrZUNhbGxiYWNrKDApO1xuICAgIH07XG5cbiAgICBhc3luYy5hcHBseSA9IF9yZXN0UGFyYW0oZnVuY3Rpb24gKGZuLCBhcmdzKSB7XG4gICAgICAgIHJldHVybiBfcmVzdFBhcmFtKGZ1bmN0aW9uIChjYWxsQXJncykge1xuICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KFxuICAgICAgICAgICAgICAgIG51bGwsIGFyZ3MuY29uY2F0KGNhbGxBcmdzKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBfY29uY2F0KGVhY2hmbiwgYXJyLCBmbiwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICBlYWNoZm4oYXJyLCBmdW5jdGlvbiAoeCwgaW5kZXgsIGNiKSB7XG4gICAgICAgICAgICBmbih4LCBmdW5jdGlvbiAoZXJyLCB5KSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdCh5IHx8IFtdKTtcbiAgICAgICAgICAgICAgICBjYihlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgcmVzdWx0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jLmNvbmNhdCA9IGRvUGFyYWxsZWwoX2NvbmNhdCk7XG4gICAgYXN5bmMuY29uY2F0U2VyaWVzID0gZG9TZXJpZXMoX2NvbmNhdCk7XG5cbiAgICBhc3luYy53aGlsc3QgPSBmdW5jdGlvbiAodGVzdCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgbm9vcDtcbiAgICAgICAgaWYgKHRlc3QoKSkge1xuICAgICAgICAgICAgdmFyIG5leHQgPSBfcmVzdFBhcmFtKGZ1bmN0aW9uKGVyciwgYXJncykge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRlc3QuYXBwbHkodGhpcywgYXJncykpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlcmF0b3IobmV4dCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgW251bGxdLmNvbmNhdChhcmdzKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpdGVyYXRvcihuZXh0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGFzeW5jLmRvV2hpbHN0ID0gZnVuY3Rpb24gKGl0ZXJhdG9yLCB0ZXN0LCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgY2FsbHMgPSAwO1xuICAgICAgICByZXR1cm4gYXN5bmMud2hpbHN0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuICsrY2FsbHMgPD0gMSB8fCB0ZXN0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0sIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLnVudGlsID0gZnVuY3Rpb24gKHRlc3QsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gYXN5bmMud2hpbHN0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuICF0ZXN0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0sIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLmRvVW50aWwgPSBmdW5jdGlvbiAoaXRlcmF0b3IsIHRlc3QsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiBhc3luYy5kb1doaWxzdChpdGVyYXRvciwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gIXRlc3QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfSwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy5kdXJpbmcgPSBmdW5jdGlvbiAodGVzdCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgbm9vcDtcblxuICAgICAgICB2YXIgbmV4dCA9IF9yZXN0UGFyYW0oZnVuY3Rpb24oZXJyLCBhcmdzKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXJncy5wdXNoKGNoZWNrKTtcbiAgICAgICAgICAgICAgICB0ZXN0LmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgY2hlY2sgPSBmdW5jdGlvbihlcnIsIHRydXRoKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHJ1dGgpIHtcbiAgICAgICAgICAgICAgICBpdGVyYXRvcihuZXh0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdGVzdChjaGVjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLmRvRHVyaW5nID0gZnVuY3Rpb24gKGl0ZXJhdG9yLCB0ZXN0LCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgY2FsbHMgPSAwO1xuICAgICAgICBhc3luYy5kdXJpbmcoZnVuY3Rpb24obmV4dCkge1xuICAgICAgICAgICAgaWYgKGNhbGxzKysgPCAxKSB7XG4gICAgICAgICAgICAgICAgbmV4dChudWxsLCB0cnVlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGVzdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBfcXVldWUod29ya2VyLCBjb25jdXJyZW5jeSwgcGF5bG9hZCkge1xuICAgICAgICBpZiAoY29uY3VycmVuY3kgPT0gbnVsbCkge1xuICAgICAgICAgICAgY29uY3VycmVuY3kgPSAxO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYoY29uY3VycmVuY3kgPT09IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ29uY3VycmVuY3kgbXVzdCBub3QgYmUgemVybycpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIF9pbnNlcnQocSwgZGF0YSwgcG9zLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrICE9IG51bGwgJiYgdHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ0YXNrIGNhbGxiYWNrIG11c3QgYmUgYSBmdW5jdGlvblwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHEuc3RhcnRlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAoIV9pc0FycmF5KGRhdGEpKSB7XG4gICAgICAgICAgICAgICAgZGF0YSA9IFtkYXRhXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGRhdGEubGVuZ3RoID09PSAwICYmIHEuaWRsZSgpKSB7XG4gICAgICAgICAgICAgICAgLy8gY2FsbCBkcmFpbiBpbW1lZGlhdGVseSBpZiB0aGVyZSBhcmUgbm8gdGFza3NcbiAgICAgICAgICAgICAgICByZXR1cm4gYXN5bmMuc2V0SW1tZWRpYXRlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBxLmRyYWluKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfYXJyYXlFYWNoKGRhdGEsIGZ1bmN0aW9uKHRhc2spIHtcbiAgICAgICAgICAgICAgICB2YXIgaXRlbSA9IHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogdGFzayxcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrIHx8IG5vb3BcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgaWYgKHBvcykge1xuICAgICAgICAgICAgICAgICAgICBxLnRhc2tzLnVuc2hpZnQoaXRlbSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcS50YXNrcy5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChxLnRhc2tzLmxlbmd0aCA9PT0gcS5jb25jdXJyZW5jeSkge1xuICAgICAgICAgICAgICAgICAgICBxLnNhdHVyYXRlZCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYXN5bmMuc2V0SW1tZWRpYXRlKHEucHJvY2Vzcyk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gX25leHQocSwgdGFza3MpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHdvcmtlcnMgLT0gMTtcblxuICAgICAgICAgICAgICAgIHZhciByZW1vdmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICAgICAgICAgICAgX2FycmF5RWFjaCh0YXNrcywgZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgICAgICAgICAgICAgX2FycmF5RWFjaCh3b3JrZXJzTGlzdCwgZnVuY3Rpb24gKHdvcmtlciwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3b3JrZXIgPT09IHRhc2sgJiYgIXJlbW92ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3b3JrZXJzTGlzdC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICB0YXNrLmNhbGxiYWNrLmFwcGx5KHRhc2ssIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmIChxLnRhc2tzLmxlbmd0aCArIHdvcmtlcnMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcS5kcmFpbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBxLnByb2Nlc3MoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgd29ya2VycyA9IDA7XG4gICAgICAgIHZhciB3b3JrZXJzTGlzdCA9IFtdO1xuICAgICAgICB2YXIgcSA9IHtcbiAgICAgICAgICAgIHRhc2tzOiBbXSxcbiAgICAgICAgICAgIGNvbmN1cnJlbmN5OiBjb25jdXJyZW5jeSxcbiAgICAgICAgICAgIHBheWxvYWQ6IHBheWxvYWQsXG4gICAgICAgICAgICBzYXR1cmF0ZWQ6IG5vb3AsXG4gICAgICAgICAgICBlbXB0eTogbm9vcCxcbiAgICAgICAgICAgIGRyYWluOiBub29wLFxuICAgICAgICAgICAgc3RhcnRlZDogZmFsc2UsXG4gICAgICAgICAgICBwYXVzZWQ6IGZhbHNlLFxuICAgICAgICAgICAgcHVzaDogZnVuY3Rpb24gKGRhdGEsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgX2luc2VydChxLCBkYXRhLCBmYWxzZSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGtpbGw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBxLmRyYWluID0gbm9vcDtcbiAgICAgICAgICAgICAgICBxLnRhc2tzID0gW107XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdW5zaGlmdDogZnVuY3Rpb24gKGRhdGEsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgX2luc2VydChxLCBkYXRhLCB0cnVlLCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHdoaWxlKCFxLnBhdXNlZCAmJiB3b3JrZXJzIDwgcS5jb25jdXJyZW5jeSAmJiBxLnRhc2tzLmxlbmd0aCl7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhc2tzID0gcS5wYXlsb2FkID9cbiAgICAgICAgICAgICAgICAgICAgICAgIHEudGFza3Muc3BsaWNlKDAsIHEucGF5bG9hZCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgcS50YXNrcy5zcGxpY2UoMCwgcS50YXNrcy5sZW5ndGgpO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRhID0gX21hcCh0YXNrcywgZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0YXNrLmRhdGE7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChxLnRhc2tzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcS5lbXB0eSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHdvcmtlcnMgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgd29ya2Vyc0xpc3QucHVzaCh0YXNrc1swXSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjYiA9IG9ubHlfb25jZShfbmV4dChxLCB0YXNrcykpO1xuICAgICAgICAgICAgICAgICAgICB3b3JrZXIoZGF0YSwgY2IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsZW5ndGg6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcS50YXNrcy5sZW5ndGg7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcnVubmluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB3b3JrZXJzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHdvcmtlcnNMaXN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHdvcmtlcnNMaXN0O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlkbGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBxLnRhc2tzLmxlbmd0aCArIHdvcmtlcnMgPT09IDA7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcGF1c2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBxLnBhdXNlZCA9IHRydWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzdW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHEucGF1c2VkID09PSBmYWxzZSkgeyByZXR1cm47IH1cbiAgICAgICAgICAgICAgICBxLnBhdXNlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHZhciByZXN1bWVDb3VudCA9IE1hdGgubWluKHEuY29uY3VycmVuY3ksIHEudGFza3MubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAvLyBOZWVkIHRvIGNhbGwgcS5wcm9jZXNzIG9uY2UgcGVyIGNvbmN1cnJlbnRcbiAgICAgICAgICAgICAgICAvLyB3b3JrZXIgdG8gcHJlc2VydmUgZnVsbCBjb25jdXJyZW5jeSBhZnRlciBwYXVzZVxuICAgICAgICAgICAgICAgIGZvciAodmFyIHcgPSAxOyB3IDw9IHJlc3VtZUNvdW50OyB3KyspIHtcbiAgICAgICAgICAgICAgICAgICAgYXN5bmMuc2V0SW1tZWRpYXRlKHEucHJvY2Vzcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gcTtcbiAgICB9XG5cbiAgICBhc3luYy5xdWV1ZSA9IGZ1bmN0aW9uICh3b3JrZXIsIGNvbmN1cnJlbmN5KSB7XG4gICAgICAgIHZhciBxID0gX3F1ZXVlKGZ1bmN0aW9uIChpdGVtcywgY2IpIHtcbiAgICAgICAgICAgIHdvcmtlcihpdGVtc1swXSwgY2IpO1xuICAgICAgICB9LCBjb25jdXJyZW5jeSwgMSk7XG5cbiAgICAgICAgcmV0dXJuIHE7XG4gICAgfTtcblxuICAgIGFzeW5jLnByaW9yaXR5UXVldWUgPSBmdW5jdGlvbiAod29ya2VyLCBjb25jdXJyZW5jeSkge1xuXG4gICAgICAgIGZ1bmN0aW9uIF9jb21wYXJlVGFza3MoYSwgYil7XG4gICAgICAgICAgICByZXR1cm4gYS5wcmlvcml0eSAtIGIucHJpb3JpdHk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBfYmluYXJ5U2VhcmNoKHNlcXVlbmNlLCBpdGVtLCBjb21wYXJlKSB7XG4gICAgICAgICAgICB2YXIgYmVnID0gLTEsXG4gICAgICAgICAgICAgICAgZW5kID0gc2VxdWVuY2UubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIHdoaWxlIChiZWcgPCBlbmQpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWlkID0gYmVnICsgKChlbmQgLSBiZWcgKyAxKSA+Pj4gMSk7XG4gICAgICAgICAgICAgICAgaWYgKGNvbXBhcmUoaXRlbSwgc2VxdWVuY2VbbWlkXSkgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICBiZWcgPSBtaWQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZW5kID0gbWlkIC0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYmVnO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gX2luc2VydChxLCBkYXRhLCBwcmlvcml0eSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjayAhPSBudWxsICYmIHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidGFzayBjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb25cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBxLnN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKCFfaXNBcnJheShkYXRhKSkge1xuICAgICAgICAgICAgICAgIGRhdGEgPSBbZGF0YV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihkYXRhLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIC8vIGNhbGwgZHJhaW4gaW1tZWRpYXRlbHkgaWYgdGhlcmUgYXJlIG5vIHRhc2tzXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFzeW5jLnNldEltbWVkaWF0ZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgcS5kcmFpbigpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX2FycmF5RWFjaChkYXRhLCBmdW5jdGlvbih0YXNrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGl0ZW0gPSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHRhc2ssXG4gICAgICAgICAgICAgICAgICAgIHByaW9yaXR5OiBwcmlvcml0eSxcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6IHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJyA/IGNhbGxiYWNrIDogbm9vcFxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBxLnRhc2tzLnNwbGljZShfYmluYXJ5U2VhcmNoKHEudGFza3MsIGl0ZW0sIF9jb21wYXJlVGFza3MpICsgMSwgMCwgaXRlbSk7XG5cbiAgICAgICAgICAgICAgICBpZiAocS50YXNrcy5sZW5ndGggPT09IHEuY29uY3VycmVuY3kpIHtcbiAgICAgICAgICAgICAgICAgICAgcS5zYXR1cmF0ZWQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXN5bmMuc2V0SW1tZWRpYXRlKHEucHJvY2Vzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFN0YXJ0IHdpdGggYSBub3JtYWwgcXVldWVcbiAgICAgICAgdmFyIHEgPSBhc3luYy5xdWV1ZSh3b3JrZXIsIGNvbmN1cnJlbmN5KTtcblxuICAgICAgICAvLyBPdmVycmlkZSBwdXNoIHRvIGFjY2VwdCBzZWNvbmQgcGFyYW1ldGVyIHJlcHJlc2VudGluZyBwcmlvcml0eVxuICAgICAgICBxLnB1c2ggPSBmdW5jdGlvbiAoZGF0YSwgcHJpb3JpdHksIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBfaW5zZXJ0KHEsIGRhdGEsIHByaW9yaXR5LCBjYWxsYmFjayk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gUmVtb3ZlIHVuc2hpZnQgZnVuY3Rpb25cbiAgICAgICAgZGVsZXRlIHEudW5zaGlmdDtcblxuICAgICAgICByZXR1cm4gcTtcbiAgICB9O1xuXG4gICAgYXN5bmMuY2FyZ28gPSBmdW5jdGlvbiAod29ya2VyLCBwYXlsb2FkKSB7XG4gICAgICAgIHJldHVybiBfcXVldWUod29ya2VyLCAxLCBwYXlsb2FkKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gX2NvbnNvbGVfZm4obmFtZSkge1xuICAgICAgICByZXR1cm4gX3Jlc3RQYXJhbShmdW5jdGlvbiAoZm4sIGFyZ3MpIHtcbiAgICAgICAgICAgIGZuLmFwcGx5KG51bGwsIGFyZ3MuY29uY2F0KFtfcmVzdFBhcmFtKGZ1bmN0aW9uIChlcnIsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb25zb2xlLmVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGNvbnNvbGVbbmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9hcnJheUVhY2goYXJncywgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlW25hbWVdKHgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KV0pKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jLmxvZyA9IF9jb25zb2xlX2ZuKCdsb2cnKTtcbiAgICBhc3luYy5kaXIgPSBfY29uc29sZV9mbignZGlyJyk7XG4gICAgLyphc3luYy5pbmZvID0gX2NvbnNvbGVfZm4oJ2luZm8nKTtcbiAgICBhc3luYy53YXJuID0gX2NvbnNvbGVfZm4oJ3dhcm4nKTtcbiAgICBhc3luYy5lcnJvciA9IF9jb25zb2xlX2ZuKCdlcnJvcicpOyovXG5cbiAgICBhc3luYy5tZW1vaXplID0gZnVuY3Rpb24gKGZuLCBoYXNoZXIpIHtcbiAgICAgICAgdmFyIG1lbW8gPSB7fTtcbiAgICAgICAgdmFyIHF1ZXVlcyA9IHt9O1xuICAgICAgICB2YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbiAgICAgICAgaGFzaGVyID0gaGFzaGVyIHx8IGlkZW50aXR5O1xuICAgICAgICB2YXIgbWVtb2l6ZWQgPSBfcmVzdFBhcmFtKGZ1bmN0aW9uIG1lbW9pemVkKGFyZ3MpIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3MucG9wKCk7XG4gICAgICAgICAgICB2YXIga2V5ID0gaGFzaGVyLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgICAgICAgaWYgKGhhcy5jYWxsKG1lbW8sIGtleSkpIHsgICBcbiAgICAgICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseShudWxsLCBtZW1vW2tleV0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaGFzLmNhbGwocXVldWVzLCBrZXkpKSB7XG4gICAgICAgICAgICAgICAgcXVldWVzW2tleV0ucHVzaChjYWxsYmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBxdWV1ZXNba2V5XSA9IFtjYWxsYmFja107XG4gICAgICAgICAgICAgICAgZm4uYXBwbHkobnVsbCwgYXJncy5jb25jYXQoW19yZXN0UGFyYW0oZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgbWVtb1trZXldID0gYXJncztcbiAgICAgICAgICAgICAgICAgICAgdmFyIHEgPSBxdWV1ZXNba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHF1ZXVlc1trZXldO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHEubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxW2ldLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSldKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBtZW1vaXplZC5tZW1vID0gbWVtbztcbiAgICAgICAgbWVtb2l6ZWQudW5tZW1vaXplZCA9IGZuO1xuICAgICAgICByZXR1cm4gbWVtb2l6ZWQ7XG4gICAgfTtcblxuICAgIGFzeW5jLnVubWVtb2l6ZSA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIChmbi51bm1lbW9pemVkIHx8IGZuKS5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBfdGltZXMobWFwcGVyKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoY291bnQsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgbWFwcGVyKF9yYW5nZShjb3VudCksIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYXN5bmMudGltZXMgPSBfdGltZXMoYXN5bmMubWFwKTtcbiAgICBhc3luYy50aW1lc1NlcmllcyA9IF90aW1lcyhhc3luYy5tYXBTZXJpZXMpO1xuICAgIGFzeW5jLnRpbWVzTGltaXQgPSBmdW5jdGlvbiAoY291bnQsIGxpbWl0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jLm1hcExpbWl0KF9yYW5nZShjb3VudCksIGxpbWl0LCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy5zZXEgPSBmdW5jdGlvbiAoLyogZnVuY3Rpb25zLi4uICovKSB7XG4gICAgICAgIHZhciBmbnMgPSBhcmd1bWVudHM7XG4gICAgICAgIHJldHVybiBfcmVzdFBhcmFtKGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3NbYXJncy5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGFyZ3MucG9wKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrID0gbm9vcDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXN5bmMucmVkdWNlKGZucywgYXJncywgZnVuY3Rpb24gKG5ld2FyZ3MsIGZuLCBjYikge1xuICAgICAgICAgICAgICAgIGZuLmFwcGx5KHRoYXQsIG5ld2FyZ3MuY29uY2F0KFtfcmVzdFBhcmFtKGZ1bmN0aW9uIChlcnIsIG5leHRhcmdzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNiKGVyciwgbmV4dGFyZ3MpO1xuICAgICAgICAgICAgICAgIH0pXSkpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChlcnIsIHJlc3VsdHMpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseSh0aGF0LCBbZXJyXS5jb25jYXQocmVzdWx0cykpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBhc3luYy5jb21wb3NlID0gZnVuY3Rpb24gKC8qIGZ1bmN0aW9ucy4uLiAqLykge1xuICAgICAgICByZXR1cm4gYXN5bmMuc2VxLmFwcGx5KG51bGwsIEFycmF5LnByb3RvdHlwZS5yZXZlcnNlLmNhbGwoYXJndW1lbnRzKSk7XG4gICAgfTtcblxuXG4gICAgZnVuY3Rpb24gX2FwcGx5RWFjaChlYWNoZm4pIHtcbiAgICAgICAgcmV0dXJuIF9yZXN0UGFyYW0oZnVuY3Rpb24oZm5zLCBhcmdzKSB7XG4gICAgICAgICAgICB2YXIgZ28gPSBfcmVzdFBhcmFtKGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gYXJncy5wb3AoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWFjaGZuKGZucywgZnVuY3Rpb24gKGZuLCBfLCBjYikge1xuICAgICAgICAgICAgICAgICAgICBmbi5hcHBseSh0aGF0LCBhcmdzLmNvbmNhdChbY2JdKSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjYWxsYmFjayk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBnby5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBnbztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMuYXBwbHlFYWNoID0gX2FwcGx5RWFjaChhc3luYy5lYWNoT2YpO1xuICAgIGFzeW5jLmFwcGx5RWFjaFNlcmllcyA9IF9hcHBseUVhY2goYXN5bmMuZWFjaE9mU2VyaWVzKTtcblxuXG4gICAgYXN5bmMuZm9yZXZlciA9IGZ1bmN0aW9uIChmbiwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGRvbmUgPSBvbmx5X29uY2UoY2FsbGJhY2sgfHwgbm9vcCk7XG4gICAgICAgIHZhciB0YXNrID0gZW5zdXJlQXN5bmMoZm4pO1xuICAgICAgICBmdW5jdGlvbiBuZXh0KGVycikge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiBkb25lKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0YXNrKG5leHQpO1xuICAgICAgICB9XG4gICAgICAgIG5leHQoKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gZW5zdXJlQXN5bmMoZm4pIHtcbiAgICAgICAgcmV0dXJuIF9yZXN0UGFyYW0oZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3MucG9wKCk7XG4gICAgICAgICAgICBhcmdzLnB1c2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBpbm5lckFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICAgICAgICAgICAgaWYgKHN5bmMpIHtcbiAgICAgICAgICAgICAgICAgICAgYXN5bmMuc2V0SW1tZWRpYXRlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIGlubmVyQXJncyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIGlubmVyQXJncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YXIgc3luYyA9IHRydWU7XG4gICAgICAgICAgICBmbi5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICAgIHN5bmMgPSBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMuZW5zdXJlQXN5bmMgPSBlbnN1cmVBc3luYztcblxuICAgIGFzeW5jLmNvbnN0YW50ID0gX3Jlc3RQYXJhbShmdW5jdGlvbih2YWx1ZXMpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbbnVsbF0uY29uY2F0KHZhbHVlcyk7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjay5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGFzeW5jLndyYXBTeW5jID1cbiAgICBhc3luYy5hc3luY2lmeSA9IGZ1bmN0aW9uIGFzeW5jaWZ5KGZ1bmMpIHtcbiAgICAgICAgcmV0dXJuIF9yZXN0UGFyYW0oZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3MucG9wKCk7XG4gICAgICAgICAgICB2YXIgcmVzdWx0O1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGlmIHJlc3VsdCBpcyBQcm9taXNlIG9iamVjdFxuICAgICAgICAgICAgaWYgKF9pc09iamVjdChyZXN1bHQpICYmIHR5cGVvZiByZXN1bHQudGhlbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnRoZW4oZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIH0pW1wiY2F0Y2hcIl0oZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVyci5tZXNzYWdlID8gZXJyIDogbmV3IEVycm9yKGVycikpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLy8gTm9kZS5qc1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGFzeW5jO1xuICAgIH1cbiAgICAvLyBBTUQgLyBSZXF1aXJlSlNcbiAgICBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKFtdLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gYXN5bmM7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvLyBpbmNsdWRlZCBkaXJlY3RseSB2aWEgPHNjcmlwdD4gdGFnXG4gICAgZWxzZSB7XG4gICAgICAgIHJvb3QuYXN5bmMgPSBhc3luYztcbiAgICB9XG5cbn0oKSk7XG4iLCIvKiFcclxuICogQG5hbWUgSmF2YVNjcmlwdC9Ob2RlSlMgTWVyZ2UgdjEuMi4wXHJcbiAqIEBhdXRob3IgeWVpa29zXHJcbiAqIEByZXBvc2l0b3J5IGh0dHBzOi8vZ2l0aHViLmNvbS95ZWlrb3MvanMubWVyZ2VcclxuXHJcbiAqIENvcHlyaWdodCAyMDE0IHllaWtvcyAtIE1JVCBsaWNlbnNlXHJcbiAqIGh0dHBzOi8vcmF3LmdpdGh1Yi5jb20veWVpa29zL2pzLm1lcmdlL21hc3Rlci9MSUNFTlNFXHJcbiAqL1xyXG5cclxuOyhmdW5jdGlvbihpc05vZGUpIHtcclxuXHJcblx0LyoqXHJcblx0ICogTWVyZ2Ugb25lIG9yIG1vcmUgb2JqZWN0cyBcclxuXHQgKiBAcGFyYW0gYm9vbD8gY2xvbmVcclxuXHQgKiBAcGFyYW0gbWl4ZWQsLi4uIGFyZ3VtZW50c1xyXG5cdCAqIEByZXR1cm4gb2JqZWN0XHJcblx0ICovXHJcblxyXG5cdHZhciBQdWJsaWMgPSBmdW5jdGlvbihjbG9uZSkge1xyXG5cclxuXHRcdHJldHVybiBtZXJnZShjbG9uZSA9PT0gdHJ1ZSwgZmFsc2UsIGFyZ3VtZW50cyk7XHJcblxyXG5cdH0sIHB1YmxpY05hbWUgPSAnbWVyZ2UnO1xyXG5cclxuXHQvKipcclxuXHQgKiBNZXJnZSB0d28gb3IgbW9yZSBvYmplY3RzIHJlY3Vyc2l2ZWx5IFxyXG5cdCAqIEBwYXJhbSBib29sPyBjbG9uZVxyXG5cdCAqIEBwYXJhbSBtaXhlZCwuLi4gYXJndW1lbnRzXHJcblx0ICogQHJldHVybiBvYmplY3RcclxuXHQgKi9cclxuXHJcblx0UHVibGljLnJlY3Vyc2l2ZSA9IGZ1bmN0aW9uKGNsb25lKSB7XHJcblxyXG5cdFx0cmV0dXJuIG1lcmdlKGNsb25lID09PSB0cnVlLCB0cnVlLCBhcmd1bWVudHMpO1xyXG5cclxuXHR9O1xyXG5cclxuXHQvKipcclxuXHQgKiBDbG9uZSB0aGUgaW5wdXQgcmVtb3ZpbmcgYW55IHJlZmVyZW5jZVxyXG5cdCAqIEBwYXJhbSBtaXhlZCBpbnB1dFxyXG5cdCAqIEByZXR1cm4gbWl4ZWRcclxuXHQgKi9cclxuXHJcblx0UHVibGljLmNsb25lID0gZnVuY3Rpb24oaW5wdXQpIHtcclxuXHJcblx0XHR2YXIgb3V0cHV0ID0gaW5wdXQsXHJcblx0XHRcdHR5cGUgPSB0eXBlT2YoaW5wdXQpLFxyXG5cdFx0XHRpbmRleCwgc2l6ZTtcclxuXHJcblx0XHRpZiAodHlwZSA9PT0gJ2FycmF5Jykge1xyXG5cclxuXHRcdFx0b3V0cHV0ID0gW107XHJcblx0XHRcdHNpemUgPSBpbnB1dC5sZW5ndGg7XHJcblxyXG5cdFx0XHRmb3IgKGluZGV4PTA7aW5kZXg8c2l6ZTsrK2luZGV4KVxyXG5cclxuXHRcdFx0XHRvdXRwdXRbaW5kZXhdID0gUHVibGljLmNsb25lKGlucHV0W2luZGV4XSk7XHJcblxyXG5cdFx0fSBlbHNlIGlmICh0eXBlID09PSAnb2JqZWN0Jykge1xyXG5cclxuXHRcdFx0b3V0cHV0ID0ge307XHJcblxyXG5cdFx0XHRmb3IgKGluZGV4IGluIGlucHV0KVxyXG5cclxuXHRcdFx0XHRvdXRwdXRbaW5kZXhdID0gUHVibGljLmNsb25lKGlucHV0W2luZGV4XSk7XHJcblxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBvdXRwdXQ7XHJcblxyXG5cdH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIE1lcmdlIHR3byBvYmplY3RzIHJlY3Vyc2l2ZWx5XHJcblx0ICogQHBhcmFtIG1peGVkIGlucHV0XHJcblx0ICogQHBhcmFtIG1peGVkIGV4dGVuZFxyXG5cdCAqIEByZXR1cm4gbWl4ZWRcclxuXHQgKi9cclxuXHJcblx0ZnVuY3Rpb24gbWVyZ2VfcmVjdXJzaXZlKGJhc2UsIGV4dGVuZCkge1xyXG5cclxuXHRcdGlmICh0eXBlT2YoYmFzZSkgIT09ICdvYmplY3QnKVxyXG5cclxuXHRcdFx0cmV0dXJuIGV4dGVuZDtcclxuXHJcblx0XHRmb3IgKHZhciBrZXkgaW4gZXh0ZW5kKSB7XHJcblxyXG5cdFx0XHRpZiAodHlwZU9mKGJhc2Vba2V5XSkgPT09ICdvYmplY3QnICYmIHR5cGVPZihleHRlbmRba2V5XSkgPT09ICdvYmplY3QnKSB7XHJcblxyXG5cdFx0XHRcdGJhc2Vba2V5XSA9IG1lcmdlX3JlY3Vyc2l2ZShiYXNlW2tleV0sIGV4dGVuZFtrZXldKTtcclxuXHJcblx0XHRcdH0gZWxzZSB7XHJcblxyXG5cdFx0XHRcdGJhc2Vba2V5XSA9IGV4dGVuZFtrZXldO1xyXG5cclxuXHRcdFx0fVxyXG5cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gYmFzZTtcclxuXHJcblx0fVxyXG5cclxuXHQvKipcclxuXHQgKiBNZXJnZSB0d28gb3IgbW9yZSBvYmplY3RzXHJcblx0ICogQHBhcmFtIGJvb2wgY2xvbmVcclxuXHQgKiBAcGFyYW0gYm9vbCByZWN1cnNpdmVcclxuXHQgKiBAcGFyYW0gYXJyYXkgYXJndlxyXG5cdCAqIEByZXR1cm4gb2JqZWN0XHJcblx0ICovXHJcblxyXG5cdGZ1bmN0aW9uIG1lcmdlKGNsb25lLCByZWN1cnNpdmUsIGFyZ3YpIHtcclxuXHJcblx0XHR2YXIgcmVzdWx0ID0gYXJndlswXSxcclxuXHRcdFx0c2l6ZSA9IGFyZ3YubGVuZ3RoO1xyXG5cclxuXHRcdGlmIChjbG9uZSB8fCB0eXBlT2YocmVzdWx0KSAhPT0gJ29iamVjdCcpXHJcblxyXG5cdFx0XHRyZXN1bHQgPSB7fTtcclxuXHJcblx0XHRmb3IgKHZhciBpbmRleD0wO2luZGV4PHNpemU7KytpbmRleCkge1xyXG5cclxuXHRcdFx0dmFyIGl0ZW0gPSBhcmd2W2luZGV4XSxcclxuXHJcblx0XHRcdFx0dHlwZSA9IHR5cGVPZihpdGVtKTtcclxuXHJcblx0XHRcdGlmICh0eXBlICE9PSAnb2JqZWN0JykgY29udGludWU7XHJcblxyXG5cdFx0XHRmb3IgKHZhciBrZXkgaW4gaXRlbSkge1xyXG5cclxuXHRcdFx0XHR2YXIgc2l0ZW0gPSBjbG9uZSA/IFB1YmxpYy5jbG9uZShpdGVtW2tleV0pIDogaXRlbVtrZXldO1xyXG5cclxuXHRcdFx0XHRpZiAocmVjdXJzaXZlKSB7XHJcblxyXG5cdFx0XHRcdFx0cmVzdWx0W2tleV0gPSBtZXJnZV9yZWN1cnNpdmUocmVzdWx0W2tleV0sIHNpdGVtKTtcclxuXHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHJcblx0XHRcdFx0XHRyZXN1bHRba2V5XSA9IHNpdGVtO1xyXG5cclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHR9XHJcblxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiByZXN1bHQ7XHJcblxyXG5cdH1cclxuXHJcblx0LyoqXHJcblx0ICogR2V0IHR5cGUgb2YgdmFyaWFibGVcclxuXHQgKiBAcGFyYW0gbWl4ZWQgaW5wdXRcclxuXHQgKiBAcmV0dXJuIHN0cmluZ1xyXG5cdCAqXHJcblx0ICogQHNlZSBodHRwOi8vanNwZXJmLmNvbS90eXBlb2Z2YXJcclxuXHQgKi9cclxuXHJcblx0ZnVuY3Rpb24gdHlwZU9mKGlucHV0KSB7XHJcblxyXG5cdFx0cmV0dXJuICh7fSkudG9TdHJpbmcuY2FsbChpbnB1dCkuc2xpY2UoOCwgLTEpLnRvTG93ZXJDYXNlKCk7XHJcblxyXG5cdH1cclxuXHJcblx0aWYgKGlzTm9kZSkge1xyXG5cclxuXHRcdG1vZHVsZS5leHBvcnRzID0gUHVibGljO1xyXG5cclxuXHR9IGVsc2Uge1xyXG5cclxuXHRcdHdpbmRvd1twdWJsaWNOYW1lXSA9IFB1YmxpYztcclxuXHJcblx0fVxyXG5cclxufSkodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgbW9kdWxlICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpOyIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwidmFyIEF1dGhDb250cm9sbGVyID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIEF1dGhDb250cm9sbGVyKCRzY29wZSwgJGh0dHApIHtcclxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xyXG4gICAgICAgIHRoaXMuJGh0dHAgPSAkaHR0cDtcclxuICAgICAgICB0aGlzLl9pbml0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBfdGhpcy4kaHR0cC5nZXQoJy9hdXRoL3Rva2VuJylcclxuICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGRhdGEpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIF90aGlzLiRzY29wZVsncHJvZHVjdGlvbiddID0gZGF0YTtcclxuICAgICAgICAgICAgICAgIF90aGlzLiRodHRwLnBvc3QoJy9hdXRoL3Rva2VuJywgeyBzYW5kYm94OiB0cnVlIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLiRzY29wZVsnc2FuZGJveCddID0gZGF0YTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuX3NldFRva2VuID0gZnVuY3Rpb24gKHNhbmRib3gpIHtcclxuICAgICAgICAgICAgdmFyIHRva2VuID0gcHJvbXB0KFwiSW5wdXQgZGV2ZWxvcGVyIHRva2VuIChcIiArIChzYW5kYm94ID8gJ3NhbmRib3gnIDogJ3Byb2R1Y3Rpb24nKSArIFwiKVwiKTtcclxuICAgICAgICAgICAgaWYgKCF0b2tlbilcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgX3RoaXMuJGh0dHAucG9zdCgnL2F1dGgvdG9rZW4nLCB7IHNhbmRib3g6IHNhbmRib3gsIHRva2VuOiB0b2tlbiB9KVxyXG4gICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzYW5kYm94KVxyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLiRzY29wZVsnc2FuZGJveCddID0gZGF0YTtcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy4kc2NvcGVbJ3Byb2R1Y3Rpb24nXSA9IGRhdGE7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWRhdGEpXHJcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ1Rva2VuIGlzIGludmFsaWQuJyk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIGFsZXJ0KCdTZXQgdG9rZW4gZmFpbGVkLicpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuJHNjb3BlWydtZXNzYWdlJ10gPSBudWxsO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlWydpc0RldmVsb3BlciddID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy4kc2NvcGVbJ3NhbmRib3gnXSA9IHsgdG9rZW46IG51bGwsIHVzZXJuYW1lOiBudWxsIH07XHJcbiAgICAgICAgdGhpcy4kc2NvcGVbJ3Byb2R1Y3Rpb24nXSA9IHsgdG9rZW46IG51bGwsIHVzZXJuYW1lOiBudWxsIH07XHJcbiAgICAgICAgdGhpcy4kc2NvcGVbJ3NldFRva2VuJ10gPSB0aGlzLl9zZXRUb2tlbjtcclxuICAgICAgICB0aGlzLl9pbml0KCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gQXV0aENvbnRyb2xsZXI7XHJcbn0pKCk7XHJcbmFuZ3VsYXIubW9kdWxlKCdBcHAnKS5jb250cm9sbGVyKCdBdXRoQ29udHJvbGxlcicsIFsnJHNjb3BlJywgJyRodHRwJywgQXV0aENvbnRyb2xsZXJdKTtcclxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcclxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBBdXRoQ29udHJvbGxlcjtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXV0aC1jb250cm9sbGVyLmpzLm1hcCIsInZhciBDb250cm9sbGVyID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIENvbnRyb2xsZXIoJHNjb3BlKSB7XHJcbiAgICAgICAgdGhpcy4kc2NvcGUgPSAkc2NvcGU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gQ29udHJvbGxlcjtcclxufSkoKTtcclxuYW5ndWxhci5tb2R1bGUoJ0FwcCcpLmNvbnRyb2xsZXIoJ0NvbnRyb2xsZXInLCBbJyRzY29wZScsIENvbnRyb2xsZXJdKTtcclxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcclxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBDb250cm9sbGVyO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1jb250cm9sbGVyLmpzLm1hcCIsInZhciBNZW51Q29udHJvbGxlciA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBNZW51Q29udHJvbGxlcigkc2NvcGUsICRodHRwLCBkYXRhU3RvcmUsIGRhdGFUcmFuc2NpZXZlcikge1xyXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy4kc2NvcGUgPSAkc2NvcGU7XHJcbiAgICAgICAgdGhpcy4kaHR0cCA9ICRodHRwO1xyXG4gICAgICAgIHRoaXMuZGF0YVN0b3JlID0gZGF0YVN0b3JlO1xyXG4gICAgICAgIHRoaXMuZGF0YVRyYW5zY2lldmVyID0gZGF0YVRyYW5zY2lldmVyO1xyXG4gICAgICAgIHRoaXMuX29uUmVsb2FkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBfdGhpcy5kYXRhVHJhbnNjaWV2ZXIucmVsb2FkKCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLl9vbldhdGNoRmlsdGVyUGFyYW1zID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBfdGhpcy5kYXRhVHJhbnNjaWV2ZXIuY291bnROb3RlcyhmdW5jdGlvbiAoZXJyLCBjb3VudCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KGVycik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgX3RoaXMuJHNjb3BlWydub3RlQ291bnQnXSA9IGNvdW50O1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuJHNjb3BlWydkYXRhU3RvcmUnXSA9IHRoaXMuZGF0YVN0b3JlO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlWydkYXRhVHJhbnNjaWV2ZXInXSA9IHRoaXMuZGF0YVRyYW5zY2lldmVyO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlWydub3RlQ291bnQnXSA9IG51bGw7XHJcbiAgICAgICAgdGhpcy4kc2NvcGUuJHdhdGNoR3JvdXAoWydkYXRhVHJhbnNjaWV2ZXIuZmlsdGVyUGFyYW1zLm5vdGVib29rR3VpZHMnLCAnZGF0YVRyYW5zY2lldmVyLmZpbHRlclBhcmFtcy5zdGFja3MnXSwgdGhpcy5fb25XYXRjaEZpbHRlclBhcmFtcyk7XHJcbiAgICAgICAgdGhpcy4kc2NvcGUuJG9uKCdldmVudDo6cmVsb2FkJywgdGhpcy5fb25SZWxvYWQpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIE1lbnVDb250cm9sbGVyO1xyXG59KSgpO1xyXG5hbmd1bGFyLm1vZHVsZSgnQXBwJykuY29udHJvbGxlcignTWVudUNvbnRyb2xsZXInLCBbJyRzY29wZScsICckaHR0cCcsICdkYXRhU3RvcmUnLCAnZGF0YVRyYW5zY2lldmVyJywgTWVudUNvbnRyb2xsZXJdKTtcclxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcclxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBNZW51Q29udHJvbGxlcjtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bWVudS1jb250cm9sbGVyLmpzLm1hcCIsInZhciBNb2RhbENvbnRyb2xsZXIgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gTW9kYWxDb250cm9sbGVyKCRzY29wZSkge1xyXG4gICAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIE1vZGFsQ29udHJvbGxlcjtcclxufSkoKTtcclxuYW5ndWxhci5tb2R1bGUoJ0FwcCcpLmNvbnRyb2xsZXIoJ01vZGFsQ29udHJvbGxlcicsIFsnJHNjb3BlJywgTW9kYWxDb250cm9sbGVyXSk7XHJcbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XHJcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gTW9kYWxDb250cm9sbGVyO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1tb2RhbC1jb250cm9sbGVyLmpzLm1hcCIsInZhciBOYXZpZ2F0aW9uQ29udHJvbGxlciA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBOYXZpZ2F0aW9uQ29udHJvbGxlcigkc2NvcGUsICRyb290U2NvcGUsICRyb3V0ZSkge1xyXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy4kc2NvcGUgPSAkc2NvcGU7XHJcbiAgICAgICAgdGhpcy4kcm9vdFNjb3BlID0gJHJvb3RTY29wZTtcclxuICAgICAgICB0aGlzLiRyb3V0ZSA9ICRyb3V0ZTtcclxuICAgICAgICB0aGlzLl9yZWxvYWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIF90aGlzLiRyb290U2NvcGUuJGJyb2FkY2FzdCgnZXZlbnQ6OnJlbG9hZCcpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy4kc2NvcGVbJ25hdkNvbGxhcHNlJ10gPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlWyckcm91dGUnXSA9IHRoaXMuJHJvdXRlO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlWydyZWxvYWQnXSA9IHRoaXMuX3JlbG9hZDtcclxuICAgIH1cclxuICAgIHJldHVybiBOYXZpZ2F0aW9uQ29udHJvbGxlcjtcclxufSkoKTtcclxuYW5ndWxhci5tb2R1bGUoJ0FwcCcpLmNvbnRyb2xsZXIoJ05hdmlnYXRpb25Db250cm9sbGVyJywgWyckc2NvcGUnLCAnJHJvb3RTY29wZScsICckcm91dGUnLCBOYXZpZ2F0aW9uQ29udHJvbGxlcl0pO1xyXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xyXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IE5hdmlnYXRpb25Db250cm9sbGVyO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1uYXZpZ2F0aW9uLWNvbnRyb2xsZXIuanMubWFwIiwidmFyIE5vdGVzQ29udHJvbGxlciA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBOb3Rlc0NvbnRyb2xsZXIoJHNjb3BlLCBkYXRhU3RvcmUpIHtcclxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xyXG4gICAgICAgIHRoaXMuZGF0YVN0b3JlID0gZGF0YVN0b3JlO1xyXG4gICAgICAgIHRoaXMuX29uV2F0Y2hUaW1lTG9ncyA9IGZ1bmN0aW9uICh0aW1lTG9ncykge1xyXG4gICAgICAgICAgICBfdGhpcy4kc2NvcGVbJ25vdGVzU3BlbnRUaW1lcyddID0ge307XHJcbiAgICAgICAgICAgIHZhciBwZXJzb25zSGFzaCA9IHt9O1xyXG4gICAgICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgdGltZUxvZ3MubGVuZ3RoOyBfaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbm90ZUd1aWQgPSB0aW1lTG9nc1tfaV07XHJcbiAgICAgICAgICAgICAgICB2YXIgbm90ZVRpbWVMb2cgPSB0aW1lTG9nc1tub3RlR3VpZF07XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciB0aW1lTG9nSWQgaW4gbm90ZVRpbWVMb2cpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGltZUxvZyA9IG5vdGVUaW1lTG9nW3RpbWVMb2dJZF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFfdGhpcy4kc2NvcGVbJ25vdGVzU3BlbnRUaW1lcyddW3RpbWVMb2cubm90ZUd1aWRdKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy4kc2NvcGVbJ25vdGVzU3BlbnRUaW1lcyddW3RpbWVMb2cubm90ZUd1aWRdID0geyAkdG90YWw6IDAgfTtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy4kc2NvcGVbJ25vdGVzU3BlbnRUaW1lcyddW3RpbWVMb2cubm90ZUd1aWRdWyckdG90YWwnXSArPSB0aW1lTG9nLnNwZW50VGltZTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIV90aGlzLiRzY29wZVsnbm90ZXNTcGVudFRpbWVzJ11bdGltZUxvZy5ub3RlR3VpZF1bdGltZUxvZy5wZXJzb25dKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy4kc2NvcGVbJ25vdGVzU3BlbnRUaW1lcyddW3RpbWVMb2cubm90ZUd1aWRdW3RpbWVMb2cucGVyc29uXSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuJHNjb3BlWydub3Rlc1NwZW50VGltZXMnXVt0aW1lTG9nLm5vdGVHdWlkXVt0aW1lTG9nLnBlcnNvbl0gKz0gdGltZUxvZy5zcGVudFRpbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFfdGhpcy4kc2NvcGVbJ25vdGVzU3BlbnRUaW1lcyddWyckdG90YWwnXSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuJHNjb3BlWydub3Rlc1NwZW50VGltZXMnXVsnJHRvdGFsJ10gPSB7ICR0b3RhbDogMCB9O1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLiRzY29wZVsnbm90ZXNTcGVudFRpbWVzJ11bJyR0b3RhbCddWyckdG90YWwnXSArPSB0aW1lTG9nLnNwZW50VGltZTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIV90aGlzLiRzY29wZVsnbm90ZXNTcGVudFRpbWVzJ11bJyR0b3RhbCddW3RpbWVMb2cucGVyc29uXSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuJHNjb3BlWydub3Rlc1NwZW50VGltZXMnXVsnJHRvdGFsJ11bdGltZUxvZy5wZXJzb25dID0gMDtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy4kc2NvcGVbJ25vdGVzU3BlbnRUaW1lcyddWyckdG90YWwnXVt0aW1lTG9nLnBlcnNvbl0gKz0gdGltZUxvZy5zcGVudFRpbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRpbWVMb2cuc3BlbnRUaW1lID4gMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGVyc29uc0hhc2hbdGltZUxvZy5wZXJzb25dID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBfdGhpcy4kc2NvcGVbJ2V4aXN0UGVyc29ucyddID0gT2JqZWN0LmtleXMocGVyc29uc0hhc2gpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5fb25XYXRjaFByb2ZpdExvZ3MgPSBmdW5jdGlvbiAocHJvZml0TG9ncykge1xyXG4gICAgICAgICAgICBfdGhpcy4kc2NvcGVbJ25vdGVzUHJvZml0cyddID0ge307XHJcbiAgICAgICAgICAgIGZvciAodmFyIG5vdGVHdWlkIGluIHByb2ZpdExvZ3MpIHtcclxuICAgICAgICAgICAgICAgIHZhciBub3RlUHJvZml0TG9nID0gcHJvZml0TG9nc1tub3RlR3VpZF07XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9maXRMb2dJZCBpbiBub3RlUHJvZml0TG9nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHByb2ZpdExvZyA9IG5vdGVQcm9maXRMb2dbcHJvZml0TG9nSWRdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghX3RoaXMuJHNjb3BlWydub3Rlc1Byb2ZpdHMnXVtwcm9maXRMb2cubm90ZUd1aWRdKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy4kc2NvcGVbJ25vdGVzUHJvZml0cyddW3Byb2ZpdExvZy5ub3RlR3VpZF0gPSB7ICR0b3RhbDogMCB9O1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLiRzY29wZVsnbm90ZXNQcm9maXRzJ11bcHJvZml0TG9nLm5vdGVHdWlkXVsnJHRvdGFsJ10gKz0gcHJvZml0TG9nLnByb2ZpdDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIV90aGlzLiRzY29wZVsnbm90ZXNQcm9maXRzJ11bJyR0b3RhbCddKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy4kc2NvcGVbJ25vdGVzUHJvZml0cyddWyckdG90YWwnXSA9IHsgJHRvdGFsOiAwIH07XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuJHNjb3BlWydub3Rlc1Byb2ZpdHMnXVsnJHRvdGFsJ11bJyR0b3RhbCddICs9IHByb2ZpdExvZy5wcm9maXQ7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IF90aGlzLiRzY29wZVsnZXhpc3RQZXJzb25zJ107IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwZXJzb24gPSBfYVtfaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghX3RoaXMuJHNjb3BlWydub3Rlc1NwZW50VGltZXMnXVtub3RlR3VpZF0gfHwgIV90aGlzLiRzY29wZVsnbm90ZXNTcGVudFRpbWVzJ11bbm90ZUd1aWRdW3BlcnNvbl0gfHwgIV90aGlzLiRzY29wZVsnbm90ZXNTcGVudFRpbWVzJ11bbm90ZUd1aWRdWyckdG90YWwnXSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLiRzY29wZVsnbm90ZXNQcm9maXRzJ11bbm90ZUd1aWRdW3BlcnNvbl0gPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy4kc2NvcGVbJ25vdGVzUHJvZml0cyddW25vdGVHdWlkXVtwZXJzb25dID0gTWF0aC5yb3VuZChfdGhpcy4kc2NvcGVbJ25vdGVzUHJvZml0cyddW25vdGVHdWlkXVsnJHRvdGFsJ10gKiBfdGhpcy4kc2NvcGVbJ25vdGVzU3BlbnRUaW1lcyddW25vdGVHdWlkXVtwZXJzb25dIC8gX3RoaXMuJHNjb3BlWydub3Rlc1NwZW50VGltZXMnXVtub3RlR3VpZF1bJyR0b3RhbCddKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFfdGhpcy4kc2NvcGVbJ25vdGVzUHJvZml0cyddWyckdG90YWwnXVtwZXJzb25dKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy4kc2NvcGVbJ25vdGVzUHJvZml0cyddWyckdG90YWwnXVtwZXJzb25dID0gMDtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy4kc2NvcGVbJ25vdGVzUHJvZml0cyddWyckdG90YWwnXVtwZXJzb25dICs9IF90aGlzLiRzY29wZVsnbm90ZXNQcm9maXRzJ11bbm90ZUd1aWRdW3BlcnNvbl07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuJHNjb3BlWydkYXRhU3RvcmUnXSA9IHRoaXMuZGF0YVN0b3JlO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlWydub3Rlc1NwZW50VGltZXMnXSA9IHt9O1xyXG4gICAgICAgIHRoaXMuJHNjb3BlWydub3Rlc1Byb2ZpdHMnXSA9IHt9O1xyXG4gICAgICAgIHRoaXMuJHNjb3BlWydleGlzdFBlcnNvbnMnXSA9IFtdO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlLiR3YXRjaENvbGxlY3Rpb24oJ2RhdGFTdG9yZS50aW1lTG9ncycsIHRoaXMuX29uV2F0Y2hUaW1lTG9ncyk7XHJcbiAgICAgICAgdGhpcy4kc2NvcGUuJHdhdGNoQ29sbGVjdGlvbignZGF0YVN0b3JlLnByb2ZpdExvZ3MnLCB0aGlzLl9vbldhdGNoUHJvZml0TG9ncyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gTm90ZXNDb250cm9sbGVyO1xyXG59KSgpO1xyXG5hbmd1bGFyLm1vZHVsZSgnQXBwJykuY29udHJvbGxlcignTm90ZXNDb250cm9sbGVyJywgWyckc2NvcGUnLCAnZGF0YVN0b3JlJywgTm90ZXNDb250cm9sbGVyXSk7XHJcbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XHJcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gTm90ZXNDb250cm9sbGVyO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1ub3Rlcy1jb250cm9sbGVyLmpzLm1hcCIsInZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgZnVuY3Rpb24gKGQsIGIpIHtcclxuICAgIGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdO1xyXG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XHJcbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XHJcbn07XHJcbnZhciBtb2RhbF9jb250cm9sbGVyXzEgPSByZXF1aXJlKCcuL21vZGFsLWNvbnRyb2xsZXInKTtcclxudmFyIFByb2dyZXNzTW9kYWxDb250cm9sbGVyID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcclxuICAgIF9fZXh0ZW5kcyhQcm9ncmVzc01vZGFsQ29udHJvbGxlciwgX3N1cGVyKTtcclxuICAgIGZ1bmN0aW9uIFByb2dyZXNzTW9kYWxDb250cm9sbGVyKCRzY29wZSwgcHJvZ3Jlc3MpIHtcclxuICAgICAgICBfc3VwZXIuY2FsbCh0aGlzLCAkc2NvcGUpO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xyXG4gICAgICAgIHRoaXMucHJvZ3Jlc3MgPSBwcm9ncmVzcztcclxuICAgICAgICB0aGlzLiRzY29wZVsncHJvZ3Jlc3MnXSA9IHRoaXMucHJvZ3Jlc3M7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gUHJvZ3Jlc3NNb2RhbENvbnRyb2xsZXI7XHJcbn0pKG1vZGFsX2NvbnRyb2xsZXJfMVtcImRlZmF1bHRcIl0pO1xyXG5hbmd1bGFyLm1vZHVsZSgnQXBwJykuY29udHJvbGxlcignUHJvZ3Jlc3NNb2RhbENvbnRyb2xsZXInLCBbJyRzY29wZScsICdwcm9ncmVzcycsIFByb2dyZXNzTW9kYWxDb250cm9sbGVyXSk7XHJcbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XHJcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gUHJvZ3Jlc3NNb2RhbENvbnRyb2xsZXI7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXByb2dyZXNzLW1vZGFsLWNvbnRyb2xsZXIuanMubWFwIiwidmFyIGFzeW5jID0gcmVxdWlyZSgnYXN5bmMnKTtcclxudmFyIFNldHRpbmdzQ29udHJvbGxlciA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBTZXR0aW5nc0NvbnRyb2xsZXIoJHNjb3BlLCAkaHR0cCwgZGF0YVN0b3JlLCBkYXRhVHJhbnNjaWV2ZXIsIHByb2dyZXNzKSB7XHJcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICB0aGlzLiRzY29wZSA9ICRzY29wZTtcclxuICAgICAgICB0aGlzLiRodHRwID0gJGh0dHA7XHJcbiAgICAgICAgdGhpcy5kYXRhU3RvcmUgPSBkYXRhU3RvcmU7XHJcbiAgICAgICAgdGhpcy5kYXRhVHJhbnNjaWV2ZXIgPSBkYXRhVHJhbnNjaWV2ZXI7XHJcbiAgICAgICAgdGhpcy5wcm9ncmVzcyA9IHByb2dyZXNzO1xyXG4gICAgICAgIHRoaXMuX2VkaXRTdG9yZSA9IHt9O1xyXG4gICAgICAgIHRoaXMuX3VwID0gZnVuY3Rpb24gKGluZGV4KSB7XHJcbiAgICAgICAgICAgIGlmIChpbmRleCA9PSAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICBfdGhpcy5fZWRpdFN0b3JlWydwZXJzb25zJ10uc3BsaWNlKGluZGV4IC0gMSwgMiwgX3RoaXMuX2VkaXRTdG9yZVsncGVyc29ucyddW2luZGV4XSwgX3RoaXMuX2VkaXRTdG9yZVsncGVyc29ucyddW2luZGV4IC0gMV0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5fZG93biA9IGZ1bmN0aW9uIChpbmRleCkge1xyXG4gICAgICAgICAgICBpZiAoaW5kZXggPj0gX3RoaXMuX2VkaXRTdG9yZVsncGVyc29ucyddLmxlbmd0aCAtIDEpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIF90aGlzLl9lZGl0U3RvcmVbJ3BlcnNvbnMnXS5zcGxpY2UoaW5kZXgsIDIsIF90aGlzLl9lZGl0U3RvcmVbJ3BlcnNvbnMnXVtpbmRleCArIDFdLCBfdGhpcy5fZWRpdFN0b3JlWydwZXJzb25zJ11baW5kZXhdKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuX3JlbW92ZSA9IGZ1bmN0aW9uIChpbmRleCkge1xyXG4gICAgICAgICAgICBfdGhpcy5fZWRpdFN0b3JlWydwZXJzb25zJ10uc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuX2FkZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKCFfdGhpcy5fZWRpdFN0b3JlWydwZXJzb25zJ10pXHJcbiAgICAgICAgICAgICAgICBfdGhpcy5fZWRpdFN0b3JlWydwZXJzb25zJ10gPSBbXTtcclxuICAgICAgICAgICAgX3RoaXMuX2VkaXRTdG9yZVsncGVyc29ucyddLnB1c2goeyBuYW1lOiBcIlBlcnNvbiBcIiArIChfdGhpcy5fZWRpdFN0b3JlWydwZXJzb25zJ10ubGVuZ3RoICsgMSkgfSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLl9zdWJtaXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIF90aGlzLnByb2dyZXNzLm9wZW4oMSk7XHJcbiAgICAgICAgICAgIHZhciBjb3VudCA9IDA7XHJcbiAgICAgICAgICAgIHZhciByZVBhcnNlID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHZhciByZWxvYWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgYXN5bmMuZm9yRWFjaE9mU2VyaWVzKF90aGlzLmNvbnN0cnVjdG9yLkZJRUxEUywgZnVuY3Rpb24gKGZpZWxkLCBrZXksIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoSlNPTi5zdHJpbmdpZnkoYW5ndWxhci5jb3B5KF90aGlzLl9lZGl0U3RvcmVba2V5XSkpID09IEpTT04uc3RyaW5naWZ5KF90aGlzLmRhdGFTdG9yZS5zZXR0aW5nc1trZXldKSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgICAgIGlmIChmaWVsZC5yZVBhcnNlKVxyXG4gICAgICAgICAgICAgICAgICAgIHJlUGFyc2UgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLnJlbG9hZClcclxuICAgICAgICAgICAgICAgICAgICByZWxvYWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3Muc2V0KFwiU2F2aW5nIFwiICsga2V5ICsgXCIuLi5cIiwgY291bnQrKyAvIE9iamVjdC5rZXlzKF90aGlzLmNvbnN0cnVjdG9yLkZJRUxEUykubGVuZ3RoICogMTAwKTtcclxuICAgICAgICAgICAgICAgIF90aGlzLiRodHRwLnB1dCgnL3NldHRpbmdzL3NhdmUnLCB7IGtleToga2V5LCB2YWx1ZTogX3RoaXMuX2VkaXRTdG9yZVtrZXldIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmRhdGFTdG9yZS5zZXR0aW5nc1trZXldID0gX3RoaXMuX2VkaXRTdG9yZVtrZXldO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobmV3IEVycm9yKFwiRXJyb3Igc2F2aW5nIFwiICsga2V5KSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xyXG4gICAgICAgICAgICAgICAgaWYgKGVycilcclxuICAgICAgICAgICAgICAgICAgICBhbGVydChlcnIpO1xyXG4gICAgICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3MuY2xvc2UoKTtcclxuICAgICAgICAgICAgICAgIGFzeW5jLndhdGVyZmFsbChbXHJcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZVBhcnNlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuZGF0YVRyYW5zY2lldmVyLnJlUGFyc2UoY2FsbGJhY2spO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZWxvYWQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5kYXRhVHJhbnNjaWV2ZXIucmVsb2FkKGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgICAgICAgICB9XSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5fb25XYXRjaFNldHRpbmcgPSBmdW5jdGlvbiAoa2V5KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBfdGhpcy5fZWRpdFN0b3JlW2tleV0gPSBhbmd1bGFyLmNvcHkoX3RoaXMuZGF0YVN0b3JlLnNldHRpbmdzW2tleV0pO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy4kc2NvcGVbJ2RhdGFTdG9yZSddID0gdGhpcy5kYXRhU3RvcmU7XHJcbiAgICAgICAgdGhpcy4kc2NvcGVbJ2VkaXRTdG9yZSddID0gdGhpcy5fZWRpdFN0b3JlO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlWydmaWVsZHMnXSA9IHRoaXMuY29uc3RydWN0b3IuRklFTERTO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlWyd1cCddID0gdGhpcy5fdXA7XHJcbiAgICAgICAgdGhpcy4kc2NvcGVbJ2Rvd24nXSA9IHRoaXMuX2Rvd247XHJcbiAgICAgICAgdGhpcy4kc2NvcGVbJ3JlbW92ZSddID0gdGhpcy5fcmVtb3ZlO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlWydhZGQnXSA9IHRoaXMuX2FkZDtcclxuICAgICAgICB0aGlzLiRzY29wZVsnc3VibWl0J10gPSB0aGlzLl9zdWJtaXQ7XHJcbiAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMuY29uc3RydWN0b3IuRklFTERTKVxyXG4gICAgICAgICAgICB0aGlzLiRzY29wZS4kd2F0Y2goXCJkYXRhU3RvcmUuc2V0dGluZ3MuXCIgKyBrZXksIHRoaXMuX29uV2F0Y2hTZXR0aW5nKGtleSkpO1xyXG4gICAgfVxyXG4gICAgU2V0dGluZ3NDb250cm9sbGVyLkZJRUxEUyA9IHtcclxuICAgICAgICBwZXJzb25zOiB7XHJcbiAgICAgICAgICAgIHJlUGFyc2U6IHRydWUsXHJcbiAgICAgICAgICAgIHJlbG9hZDogdHJ1ZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3RhcnRXb3JraW5nVGltZToge1xyXG4gICAgICAgICAgICBoZWFkaW5nOiAnU3RhcnQgV29ya2luZyBUaW1lJyxcclxuICAgICAgICAgICAgdHlwZTogJ251bWJlcidcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVuZFdvcmtpbmdUaW1lOiB7XHJcbiAgICAgICAgICAgIGhlYWRpbmc6ICdFbmQgV29ya2luZyBUaW1lJyxcclxuICAgICAgICAgICAgdHlwZTogJ251bWJlcidcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIFNldHRpbmdzQ29udHJvbGxlcjtcclxufSkoKTtcclxuYW5ndWxhci5tb2R1bGUoJ0FwcCcpLmNvbnRyb2xsZXIoJ1NldHRpbmdzQ29udHJvbGxlcicsIFsnJHNjb3BlJywgJyRodHRwJywgJ2RhdGFTdG9yZScsICdkYXRhVHJhbnNjaWV2ZXInLCAncHJvZ3Jlc3MnLCBTZXR0aW5nc0NvbnRyb2xsZXJdKTtcclxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcclxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBTZXR0aW5nc0NvbnRyb2xsZXI7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNldHRpbmdzLWNvbnRyb2xsZXIuanMubWFwIiwidmFyIFRpbWVsaW5lQ29udHJvbGxlciA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBUaW1lbGluZUNvbnRyb2xsZXIoJHNjb3BlLCAkZmlsdGVyLCAkaHR0cCwgZGF0YVN0b3JlLCBkYXRhVHJhbnNjaWV2ZXIpIHtcclxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xyXG4gICAgICAgIHRoaXMuJGZpbHRlciA9ICRmaWx0ZXI7XHJcbiAgICAgICAgdGhpcy4kaHR0cCA9ICRodHRwO1xyXG4gICAgICAgIHRoaXMuZGF0YVN0b3JlID0gZGF0YVN0b3JlO1xyXG4gICAgICAgIHRoaXMuZGF0YVRyYW5zY2lldmVyID0gZGF0YVRyYW5zY2lldmVyO1xyXG4gICAgICAgIHRoaXMuX29uUmFuZ2VDaGFuZ2VkID0gZnVuY3Rpb24gKHByb3BlcnRpZXMpIHtcclxuICAgICAgICAgICAgdmFyIGN1cnJlbnRTdGFydCA9IG1vbWVudChwcm9wZXJ0aWVzLnN0YXJ0KS5zdGFydE9mKCdkYXknKTtcclxuICAgICAgICAgICAgdmFyIGN1cnJlbnRFbmQgPSBtb21lbnQocHJvcGVydGllcy5lbmQpLmVuZE9mKCdkYXknKTtcclxuICAgICAgICAgICAgaWYgKGN1cnJlbnRTdGFydC5pc1NhbWVPckFmdGVyKF90aGlzLiRzY29wZVsnc3RhcnQnXSkgJiYgY3VycmVudEVuZC5pc1NhbWVPckJlZm9yZShfdGhpcy4kc2NvcGVbJ2VuZCddKSlcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgaWYgKCFfdGhpcy4kc2NvcGVbJ3N0YXJ0J10gfHwgY3VycmVudFN0YXJ0LmlzQmVmb3JlKF90aGlzLiRzY29wZVsnc3RhcnQnXSkpXHJcbiAgICAgICAgICAgICAgICBfdGhpcy4kc2NvcGVbJ3N0YXJ0J10gPSBjdXJyZW50U3RhcnQ7XHJcbiAgICAgICAgICAgIGlmICghX3RoaXMuJHNjb3BlWydlbmQnXSB8fCBjdXJyZW50RW5kLmlzQWZ0ZXIoX3RoaXMuJHNjb3BlWydlbmQnXSkpXHJcbiAgICAgICAgICAgICAgICBfdGhpcy4kc2NvcGVbJ2VuZCddID0gY3VycmVudEVuZDtcclxuICAgICAgICAgICAgX3RoaXMuX29uUmVsb2FkKCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLl9vblJlbG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgX3RoaXMuZGF0YVRyYW5zY2lldmVyLnJlbG9hZCh7IHN0YXJ0OiBfdGhpcy4kc2NvcGVbJ3N0YXJ0J10sIGVuZDogX3RoaXMuJHNjb3BlWydlbmQnXSB9LCBfdGhpcy5fb25SZWxvYWRFbmQpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5fb25SZWxvYWRFbmQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIF90aGlzLiRzY29wZVsndGltZWxpbmVJdGVtcyddLmNsZWFyKCk7XHJcbiAgICAgICAgICAgIHZhciBub3RlcyA9IHt9O1xyXG4gICAgICAgICAgICBmb3IgKHZhciBub3RlR3VpZCBpbiBfdGhpcy5kYXRhU3RvcmUubm90ZXMpIHtcclxuICAgICAgICAgICAgICAgIHZhciBub3RlID0gX3RoaXMuZGF0YVN0b3JlLm5vdGVzW25vdGVHdWlkXTtcclxuICAgICAgICAgICAgICAgIG5vdGVzW25vdGUuZ3VpZF0gPSBub3RlO1xyXG4gICAgICAgICAgICAgICAgX3RoaXMuJHNjb3BlWyd0aW1lbGluZUl0ZW1zJ10uYWRkKHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogbm90ZS5ndWlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwOiAndXBkYXRlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgY29udGVudDogXCI8YSBocmVmPVxcXCJldmVybm90ZTovLy92aWV3L1wiICsgX3RoaXMuZGF0YVN0b3JlLnVzZXJbJ2lkJ10gKyBcIi9cIiArIF90aGlzLmRhdGFTdG9yZS51c2VyWydzaGFyZElkJ10gKyBcIi9cIiArIG5vdGUuZ3VpZCArIFwiL1wiICsgbm90ZS5ndWlkICsgXCIvXFxcIiB0aXRsZT1cXFwiXCIgKyBub3RlLnRpdGxlICsgXCJcXFwiPlwiICsgX3RoaXMuJGZpbHRlcignYWJicmV2aWF0ZScpKG5vdGUudGl0bGUsIDQwKSArIFwiPC9hPlwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBuZXcgRGF0ZShub3RlLnVwZGF0ZWQpLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdwb2ludCdcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGZvciAodmFyIG5vdGVHdWlkIGluIF90aGlzLmRhdGFTdG9yZS50aW1lTG9ncykge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5vdGVUaW1lTG9ncyA9IF90aGlzLmRhdGFTdG9yZS50aW1lTG9nc1tub3RlR3VpZF07XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciB0aW1lTG9nSWQgaW4gbm90ZVRpbWVMb2dzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRpbWVMb2cgPSBub3RlVGltZUxvZ3NbdGltZUxvZ0lkXTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbm90ZVRpdGxlID0gbm90ZXNbdGltZUxvZy5ub3RlR3VpZF0udGl0bGU7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuJHNjb3BlWyd0aW1lbGluZUl0ZW1zJ10uYWRkKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHRpbWVMb2cuX2lkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cDogdGltZUxvZy5wZXJzb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IFwiPGEgaHJlZj1cXFwiZXZlcm5vdGU6Ly8vdmlldy9cIiArIF90aGlzLmRhdGFTdG9yZS51c2VyWydpZCddICsgXCIvXCIgKyBfdGhpcy5kYXRhU3RvcmUudXNlclsnc2hhcmRJZCddICsgXCIvXCIgKyB0aW1lTG9nLm5vdGVHdWlkICsgXCIvXCIgKyB0aW1lTG9nLm5vdGVHdWlkICsgXCIvXFxcIiB0aXRsZT1cXFwiXCIgKyBub3RlVGl0bGUgKyBcIiBcIiArIHRpbWVMb2cuY29tbWVudCArIFwiXFxcIj5cIiArIF90aGlzLiRmaWx0ZXIoJ2FiYnJldmlhdGUnKShub3RlVGl0bGUsIDIwKSArIFwiIFwiICsgX3RoaXMuJGZpbHRlcignYWJicmV2aWF0ZScpKHRpbWVMb2cuY29tbWVudCwgMjApICsgXCI8L2E+XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBtb21lbnQodGltZUxvZy5kYXRlKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5kOiB0aW1lTG9nLnNwZW50VGltZSA/IG1vbWVudCh0aW1lTG9nLmRhdGUpLmFkZCh0aW1lTG9nLnNwZW50VGltZSwgJ21pbnV0ZXMnKSA6IG51bGwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHRpbWVMb2cuc3BlbnRUaW1lID8gJ3JhbmdlJyA6ICdwb2ludCdcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5fb25SZXNpemUgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgX3RoaXMuJHNjb3BlWyd0aW1lbGluZSddLnNldE9wdGlvbnMoe1xyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiB3aW5kb3cuaW5uZXJIZWlnaHQgLSA5MFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuJHNjb3BlWydkYXRhU3RvcmUnXSA9IHRoaXMuZGF0YVN0b3JlO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlWyd0aW1lbGluZUl0ZW1zJ10gPSBuZXcgdmlzLkRhdGFTZXQoKTtcclxuICAgICAgICB0aGlzLiRzY29wZVsndGltZWxpbmVHcm91cHMnXSA9IG5ldyB2aXMuRGF0YVNldCgpO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlWydzdGFydCddID0gbW9tZW50KCkuc3RhcnRPZignZGF5Jyk7XHJcbiAgICAgICAgdGhpcy4kc2NvcGVbJ2VuZCddID0gbW9tZW50KCkuZW5kT2YoJ2RheScpO1xyXG4gICAgICAgIHRoaXMuZGF0YVRyYW5zY2lldmVyLnJlbG9hZCh7IHN0YXJ0OiB0aGlzLiRzY29wZVsnc3RhcnQnXSwgZW5kOiB0aGlzLiRzY29wZVsnZW5kJ10gfSwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWVsaW5lJyk7XHJcbiAgICAgICAgICAgIC8vIHNldCB3b3JraW5nIHRpbWVcclxuICAgICAgICAgICAgdmFyIGhpZGRlbkRhdGVzO1xyXG4gICAgICAgICAgICBpZiAoX3RoaXMuZGF0YVN0b3JlLnNldHRpbmdzICYmIF90aGlzLmRhdGFTdG9yZS5zZXR0aW5nc1snc3RhcnRXb3JraW5nVGltZSddICYmIF90aGlzLmRhdGFTdG9yZS5zZXR0aW5nc1snZW5kV29ya2luZ1RpbWUnXSlcclxuICAgICAgICAgICAgICAgIGhpZGRlbkRhdGVzID0gW3tcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IG1vbWVudCgpLnN1YnRyYWN0KDEsICdkYXlzJykuc3RhcnRPZignZGF5JykuaG91cihfdGhpcy5kYXRhU3RvcmUuc2V0dGluZ3NbJ2VuZFdvcmtpbmdUaW1lJ10pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmQ6IG1vbWVudCgpLnN0YXJ0T2YoJ2RheScpLmhvdXIoX3RoaXMuZGF0YVN0b3JlLnNldHRpbmdzWydzdGFydFdvcmtpbmdUaW1lJ10pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXBlYXQ6ICdkYWlseSdcclxuICAgICAgICAgICAgICAgICAgICB9XTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgaGlkZGVuRGF0ZXMgPSB7fTtcclxuICAgICAgICAgICAgLy8gZ2VuZXJhdGUgdGltZWxpbmUgb2JqZWN0XHJcbiAgICAgICAgICAgIF90aGlzLiRzY29wZVsndGltZWxpbmUnXSA9IG5ldyB2aXMuVGltZWxpbmUoY29udGFpbmVyLCBfdGhpcy4kc2NvcGVbJ3RpbWVsaW5lSXRlbXMnXSwgX3RoaXMuJHNjb3BlWyd0aW1lbGluZUdyb3VwcyddLCB7XHJcbiAgICAgICAgICAgICAgICBtYXJnaW46IHsgaXRlbTogNSB9LFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiB3aW5kb3cuaW5uZXJIZWlnaHQgLSA4MCxcclxuICAgICAgICAgICAgICAgIG9yaWVudGF0aW9uOiB7IGF4aXM6ICdib3RoJywgaXRlbTogJ3RvcCcgfSxcclxuICAgICAgICAgICAgICAgIHN0YXJ0OiBfdGhpcy4kc2NvcGVbJ3N0YXJ0J10sXHJcbiAgICAgICAgICAgICAgICBlbmQ6IF90aGlzLiRzY29wZVsnZW5kJ10sXHJcbiAgICAgICAgICAgICAgICBvcmRlcjogZnVuY3Rpb24gKGEsIGIpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYS5zdGFydCAtIGIuc3RhcnQ7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgaGlkZGVuRGF0ZXM6IGhpZGRlbkRhdGVzXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAvLyBzZXQgcGVyc29uIGRhdGFcclxuICAgICAgICAgICAgaWYgKCFfdGhpcy5kYXRhU3RvcmUuc2V0dGluZ3MgfHwgIV90aGlzLmRhdGFTdG9yZS5zZXR0aW5nc1sncGVyc29ucyddKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gX3RoaXMuZGF0YVN0b3JlLnNldHRpbmdzWydwZXJzb25zJ107IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGVyc29uID0gX2FbX2ldO1xyXG4gICAgICAgICAgICAgICAgX3RoaXMuJHNjb3BlWyd0aW1lbGluZUdyb3VwcyddLmFkZCh7XHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IHBlcnNvbi5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHBlcnNvbi5uYW1lXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBfdGhpcy4kc2NvcGVbJ3RpbWVsaW5lR3JvdXBzJ10uYWRkKHtcclxuICAgICAgICAgICAgICAgIGlkOiAndXBkYXRlZCcsXHJcbiAgICAgICAgICAgICAgICBjb250ZW50OiAnVXBkYXRlJ1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgLy8gYWRkIGV2ZW50c1xyXG4gICAgICAgICAgICBfdGhpcy4kc2NvcGVbJ3RpbWVsaW5lJ10ub24oJ3JhbmdlY2hhbmdlZCcsIF90aGlzLl9vblJhbmdlQ2hhbmdlZCk7XHJcbiAgICAgICAgICAgIF90aGlzLiRzY29wZS4kb24oJ3Jlc2l6ZTo6cmVzaXplJywgX3RoaXMuX29uUmVzaXplKTtcclxuICAgICAgICAgICAgX3RoaXMuJHNjb3BlLiRvbignZXZlbnQ6OnJlbG9hZCcsIF90aGlzLl9vblJlbG9hZCk7XHJcbiAgICAgICAgICAgIC8vIHJlbG9hZFxyXG4gICAgICAgICAgICBfdGhpcy5fb25SZWxvYWRFbmQoKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIHJldHVybiBUaW1lbGluZUNvbnRyb2xsZXI7XHJcbn0pKCk7XHJcbmFuZ3VsYXIubW9kdWxlKCdBcHAnKS5jb250cm9sbGVyKCdUaW1lbGluZUNvbnRyb2xsZXInLCBbJyRzY29wZScsICckZmlsdGVyJywgJyRodHRwJywgJ2RhdGFTdG9yZScsICdkYXRhVHJhbnNjaWV2ZXInLCBUaW1lbGluZUNvbnRyb2xsZXJdKTtcclxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcclxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBUaW1lbGluZUNvbnRyb2xsZXI7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXRpbWVsaW5lLWNvbnRyb2xsZXIuanMubWFwIiwiYW5ndWxhci5tb2R1bGUoJ0FwcCcpLmRpcmVjdGl2ZSgncmVzaXplJywgZnVuY3Rpb24gKCR0aW1lb3V0LCAkcm9vdFNjb3BlLCAkd2luZG93KSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHRpbWVyID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGFuZ3VsYXIuZWxlbWVudCgkd2luZG93KS5vbignbG9hZCByZXNpemUnLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aW1lcilcclxuICAgICAgICAgICAgICAgICAgICAkdGltZW91dC5jYW5jZWwodGltZXIpO1xyXG4gICAgICAgICAgICAgICAgdGltZXIgPSAkdGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdyZXNpemU6OnJlc2l6ZScpO1xyXG4gICAgICAgICAgICAgICAgfSwgMjAwKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufSk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXJlc2l6ZS5qcy5tYXAiLCJ2YXIgYWJicmV2aWF0ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAodGV4dCwgbGVuLCB0cnVuY2F0aW9uKSB7XHJcbiAgICAgICAgaWYgKGxlbiA9PT0gdm9pZCAwKSB7IGxlbiA9IDEwOyB9XHJcbiAgICAgICAgaWYgKHRydW5jYXRpb24gPT09IHZvaWQgMCkgeyB0cnVuY2F0aW9uID0gJy4uLic7IH1cclxuICAgICAgICB2YXIgY291bnQgPSAwO1xyXG4gICAgICAgIHZhciBzdHIgPSAnJztcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRleHQubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIG4gPSBlbmNvZGVVUkkodGV4dC5jaGFyQXQoaSkpO1xyXG4gICAgICAgICAgICBpZiAobi5sZW5ndGggPCA0KVxyXG4gICAgICAgICAgICAgICAgY291bnQrKztcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgY291bnQgKz0gMjtcclxuICAgICAgICAgICAgaWYgKGNvdW50ID4gbGVuKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0ciArIHRydW5jYXRpb247XHJcbiAgICAgICAgICAgIHN0ciArPSB0ZXh0LmNoYXJBdChpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRleHQ7XHJcbiAgICB9O1xyXG59O1xyXG5hbmd1bGFyLm1vZHVsZSgnQXBwJykuZmlsdGVyKCdhYmJyZXZpYXRlJywgYWJicmV2aWF0ZSk7XHJcbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XHJcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gYWJicmV2aWF0ZTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YWJicmV2aWF0ZS5qcy5tYXAiLCJ2YXIgY2hlY2tJdGVtTWF0Y2hlcyA9IGZ1bmN0aW9uIChpdGVtLCBwcm9wcykge1xyXG4gICAgdmFyIGl0ZW1NYXRjaGVzID0gZmFsc2U7XHJcbiAgICBmb3IgKHZhciBwcm9wIGluIHByb3BzKSB7XHJcbiAgICAgICAgdmFyIHRleHQgPSBwcm9wc1twcm9wXTtcclxuICAgICAgICB0ZXh0ID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgIGlmIChpdGVtW3Byb3BdLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKS5pbmRleE9mKHRleHQpICE9IC0xKSB7XHJcbiAgICAgICAgICAgIGl0ZW1NYXRjaGVzID0gdHJ1ZTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGl0ZW1NYXRjaGVzO1xyXG59O1xyXG52YXIgZmlsdGVyQnlQcm9wZXJ0eSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAoaXRlbXMsIHByb3BzKSB7XHJcbiAgICAgICAgdmFyIG91dCA9IFtdO1xyXG4gICAgICAgIGlmIChhbmd1bGFyLmlzQXJyYXkoaXRlbXMpKVxyXG4gICAgICAgICAgICBmb3IgKHZhciBpdGVtIGluIGl0ZW1zKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaXRlbU1hdGNoZXMgPSBjaGVja0l0ZW1NYXRjaGVzKGl0ZW0sIHByb3BzKTtcclxuICAgICAgICAgICAgICAgIGlmIChpdGVtTWF0Y2hlcylcclxuICAgICAgICAgICAgICAgICAgICBvdXQucHVzaChpdGVtKTtcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGFuZ3VsYXIuaXNPYmplY3QoaXRlbXMpKVxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBpdGVtcy5sZW5ndGg7IF9pKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbSA9IGl0ZW1zW19pXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbU1hdGNoZXMgPSBjaGVja0l0ZW1NYXRjaGVzKGl0ZW0sIHByb3BzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW1NYXRjaGVzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0LnB1c2goaXRlbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIG91dCA9IGl0ZW1zO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG91dDtcclxuICAgICAgICAgICAgfVxyXG4gICAgfTtcclxufTtcclxuYW5ndWxhci5tb2R1bGUoJ0FwcCcpLmZpbHRlcignZmlsdGVyQnlQcm9wZXJ0eScsIGZpbHRlckJ5UHJvcGVydHkpO1xyXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xyXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IGZpbHRlckJ5UHJvcGVydHk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWZpbHRlci1ieS1wcm9wZXJ0eS5qcy5tYXAiLCJ2YXIgb2JqZWN0TGVuZ3RoID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIF9vYmplY3RMZW5ndGggPSBmdW5jdGlvbiAoaW5wdXQsIGRlcHRoKSB7XHJcbiAgICAgICAgaWYgKGRlcHRoID09PSB2b2lkIDApIHsgZGVwdGggPSAwOyB9XHJcbiAgICAgICAgaWYgKCFhbmd1bGFyLmlzT2JqZWN0KGlucHV0KSlcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVXNhZ2Ugb2Ygbm9uLW9iamVjdHMgd2l0aCBvYmplY3RMZW5ndGggZmlsdGVyLlwiKTtcclxuICAgICAgICBpZiAoZGVwdGggPT0gMClcclxuICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKGlucHV0KS5sZW5ndGg7XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSAwO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgaW5wdXQubGVuZ3RoOyBfaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBpbnB1dFtfaV07XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gX29iamVjdExlbmd0aCh2YWx1ZSwgZGVwdGggLSAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICByZXR1cm4gX29iamVjdExlbmd0aDtcclxufTtcclxuYW5ndWxhci5tb2R1bGUoJ0FwcCcpLmZpbHRlcignb2JqZWN0TGVuZ3RoJywgb2JqZWN0TGVuZ3RoKTtcclxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcclxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBvYmplY3RMZW5ndGg7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW9iamVjdC1sZW5ndGguanMubWFwIiwidmFyIG9yZGVyT2JqZWN0QnkgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKGl0ZW1zLCBmaWVsZCwgcmV2ZXJzZSkge1xyXG4gICAgICAgIGlmIChmaWVsZCA9PT0gdm9pZCAwKSB7IGZpZWxkID0gJyR2YWx1ZSc7IH1cclxuICAgICAgICBpZiAocmV2ZXJzZSA9PT0gdm9pZCAwKSB7IHJldmVyc2UgPSB0cnVlOyB9XHJcbiAgICAgICAgdmFyIGZpbHRlcmVkID0gW107XHJcbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKGl0ZW1zLCBmdW5jdGlvbiAoaXRlbSwga2V5KSB7XHJcbiAgICAgICAgICAgIGZpbHRlcmVkLnB1c2goe1xyXG4gICAgICAgICAgICAgICAga2V5OiBrZXksXHJcbiAgICAgICAgICAgICAgICBpdGVtOiBpdGVtXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGZpbHRlcmVkLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcclxuICAgICAgICAgICAgaWYgKGZpZWxkID09ICcka2V5JylcclxuICAgICAgICAgICAgICAgIHJldHVybiAoYS5rZXkgPiBiLmtleSkgPyAtMSA6IDE7XHJcbiAgICAgICAgICAgIGlmIChmaWVsZCA9PSAnJHZhbHVlJylcclxuICAgICAgICAgICAgICAgIHJldHVybiAoYS5pdGVtID4gYi5pdGVtKSA/IC0xIDogMTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBmaWVsZCA9PSAnc3RyaW5nJylcclxuICAgICAgICAgICAgICAgIHJldHVybiAoYVtmaWVsZF0gPiBiW2ZpZWxkXSkgPyAtMSA6IDE7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZmllbGQgPT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICAgICAgICAgIHJldHVybiAoZmllbGQoYS5pdGVtLCBhLmtleSkgPiBmaWVsZChiLml0ZW0sIGIua2V5KSkgPyAtMSA6IDE7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaWYgKHJldmVyc2UpXHJcbiAgICAgICAgICAgIGZpbHRlcmVkLnJldmVyc2UoKTtcclxuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xyXG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaChmaWx0ZXJlZCwgZnVuY3Rpb24gKGl0ZW0pIHtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGl0ZW0uaXRlbTtcclxuICAgICAgICAgICAgcmVzdWx0Wycka2V5J10gPSBpdGVtLmtleTtcclxuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XHJcbiAgICB9O1xyXG59O1xyXG5hbmd1bGFyLm1vZHVsZSgnQXBwJykuZmlsdGVyKCdvcmRlck9iamVjdEJ5Jywgb3JkZXJPYmplY3RCeSk7XHJcbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XHJcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gb3JkZXJPYmplY3RCeTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9b3JkZXItb2JqZWN0LWJ5LmpzLm1hcCIsInZhciBzcGVudFRpbWUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKGlucHV0KSB7XHJcbiAgICAgICAgaWYgKGlucHV0ID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIHJldHVybiAnJztcclxuICAgICAgICBpZiAoIWlucHV0KVxyXG4gICAgICAgICAgICByZXR1cm4gJzBtJztcclxuICAgICAgICB2YXIgaG91ciA9IE1hdGguZmxvb3IoaW5wdXQgLyA2MCk7XHJcbiAgICAgICAgdmFyIG1pbnV0ZSA9IGlucHV0ICUgNjA7XHJcbiAgICAgICAgaWYgKGhvdXIpXHJcbiAgICAgICAgICAgIHJldHVybiBob3VyICsgJ2gnICsgbWludXRlICsgJ20nO1xyXG4gICAgICAgIHJldHVybiBtaW51dGUgKyAnbSc7XHJcbiAgICB9O1xyXG59O1xyXG5hbmd1bGFyLm1vZHVsZSgnQXBwJykuZmlsdGVyKCdzcGVudFRpbWUnLCBzcGVudFRpbWUpO1xyXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xyXG5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IHNwZW50VGltZTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c3BlbnQtdGltZS5qcy5tYXAiLCIvLyBhbmd1bGFyLmpzIHNldHRpbmdcclxuYW5ndWxhci5tb2R1bGUoJ0FwcCcsIFsnbmdSb3V0ZScsICd1aS5ib290c3RyYXAnLCAnbmdTYW5pdGl6ZScsICd1aS5zZWxlY3QnXSk7XHJcbmFuZ3VsYXIubW9kdWxlKCdBcHAnKS5jb25maWcoWyckY29tcGlsZVByb3ZpZGVyJywgZnVuY3Rpb24gKCRjb21waWxlUHJvdmlkZXIpIHtcclxuICAgICAgICAkY29tcGlsZVByb3ZpZGVyLmFIcmVmU2FuaXRpemF0aW9uV2hpdGVsaXN0KC9eXFxzKihodHRwfGh0dHBzfG1haWx0b3xldmVybm90ZSk6Lyk7XHJcbiAgICB9XSk7XHJcbi8vIHJvdXRlIHNldHRpbmdzXHJcbnJlcXVpcmUoJy4vcm91dGUnKTtcclxuLy8gYW5ndWxhci5qcyBmaWx0ZXJzXHJcbnJlcXVpcmUoJy4vZmlsdGVycy9hYmJyZXZpYXRlJyk7XHJcbnJlcXVpcmUoJy4vZmlsdGVycy9maWx0ZXItYnktcHJvcGVydHknKTtcclxucmVxdWlyZSgnLi9maWx0ZXJzL29iamVjdC1sZW5ndGgnKTtcclxucmVxdWlyZSgnLi9maWx0ZXJzL29yZGVyLW9iamVjdC1ieScpO1xyXG5yZXF1aXJlKCcuL2ZpbHRlcnMvc3BlbnQtdGltZScpO1xyXG4vLyBhbmd1bGFyLmpzIHNlcnZpY2VzXHJcbnJlcXVpcmUoJy4vc2VydmljZXMvZGF0YS1zdG9yZScpO1xyXG5yZXF1aXJlKCcuL3NlcnZpY2VzL2RhdGEtdHJhbnNjaWV2ZXInKTtcclxucmVxdWlyZSgnLi9zZXJ2aWNlcy9wcm9ncmVzcycpO1xyXG4vLyBhbmd1bGFyLmpzIGRpcmVjdGl2ZXNcclxucmVxdWlyZSgnLi9kaXJlY3RpdmVzL3Jlc2l6ZScpO1xyXG4vLyBhbmd1bGFyLmpzIGNvbnRyb2xsZXJzXHJcbnJlcXVpcmUoJy4vY29udHJvbGxlcnMvYXV0aC1jb250cm9sbGVyJyk7XHJcbnJlcXVpcmUoJy4vY29udHJvbGxlcnMvY29udHJvbGxlcicpO1xyXG5yZXF1aXJlKCcuL2NvbnRyb2xsZXJzL21lbnUtY29udHJvbGxlcicpO1xyXG5yZXF1aXJlKCcuL2NvbnRyb2xsZXJzL25hdmlnYXRpb24tY29udHJvbGxlcicpO1xyXG5yZXF1aXJlKCcuL2NvbnRyb2xsZXJzL25vdGVzLWNvbnRyb2xsZXInKTtcclxucmVxdWlyZSgnLi9jb250cm9sbGVycy9wcm9ncmVzcy1tb2RhbC1jb250cm9sbGVyJyk7XHJcbnJlcXVpcmUoJy4vY29udHJvbGxlcnMvc2V0dGluZ3MtY29udHJvbGxlcicpO1xyXG5yZXF1aXJlKCcuL2NvbnRyb2xsZXJzL3RpbWVsaW5lLWNvbnRyb2xsZXInKTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiYW5ndWxhci5tb2R1bGUoJ0FwcCcpLmNvbmZpZyhbJyRyb3V0ZVByb3ZpZGVyJywgZnVuY3Rpb24gKCRyb3V0ZVByb3ZpZGVyKSB7XHJcbiAgICAgICAgJHJvdXRlUHJvdmlkZXJcclxuICAgICAgICAgICAgLndoZW4oJy8nLCB7XHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnbWVudSdcclxuICAgICAgICB9KVxyXG4gICAgICAgICAgICAud2hlbignL3RpbWVsaW5lJywge1xyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RpbWVsaW5lJ1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgICAgIC53aGVuKCcvbm90ZXMnLCB7XHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnbm90ZXMnXHJcbiAgICAgICAgfSlcclxuICAgICAgICAgICAgLndoZW4oJy9zZXR0aW5ncycsIHtcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdzZXR0aW5ncydcclxuICAgICAgICB9KVxyXG4gICAgICAgICAgICAub3RoZXJ3aXNlKHtcclxuICAgICAgICAgICAgcmVkaXJlY3RUbzogJy8nXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XSk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXJvdXRlLmpzLm1hcCIsInZhciBEYXRhU3RvcmVTZXJ2aWNlID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIERhdGFTdG9yZVNlcnZpY2UoKSB7XHJcbiAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcclxuICAgICAgICB0aGlzLnBlcnNvbnMgPSBbXTtcclxuICAgICAgICB0aGlzLm5vdGVib29rcyA9IHt9O1xyXG4gICAgICAgIHRoaXMuc3RhY2tzID0gW107XHJcbiAgICAgICAgdGhpcy5ub3RlcyA9IHt9O1xyXG4gICAgICAgIHRoaXMudGltZUxvZ3MgPSB7fTtcclxuICAgICAgICB0aGlzLnByb2ZpdExvZ3MgPSB7fTtcclxuICAgICAgICB0aGlzLnNldHRpbmdzID0ge307XHJcbiAgICB9XHJcbiAgICByZXR1cm4gRGF0YVN0b3JlU2VydmljZTtcclxufSkoKTtcclxuYW5ndWxhci5tb2R1bGUoJ0FwcCcpLnNlcnZpY2UoJ2RhdGFTdG9yZScsIFtEYXRhU3RvcmVTZXJ2aWNlXSk7XHJcbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XHJcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gRGF0YVN0b3JlU2VydmljZTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YS1zdG9yZS5qcy5tYXAiLCJ2YXIgYXN5bmMgPSByZXF1aXJlKCdhc3luYycpO1xyXG52YXIgbWVyZ2UgPSByZXF1aXJlKCdtZXJnZScpO1xyXG52YXIgRGF0YVRyYW5zY2lldmVyU2VydmljZSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBEYXRhVHJhbnNjaWV2ZXJTZXJ2aWNlKCRodHRwLCBkYXRhU3RvcmUsIHByb2dyZXNzKSB7XHJcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICB0aGlzLiRodHRwID0gJGh0dHA7XHJcbiAgICAgICAgdGhpcy5kYXRhU3RvcmUgPSBkYXRhU3RvcmU7XHJcbiAgICAgICAgdGhpcy5wcm9ncmVzcyA9IHByb2dyZXNzO1xyXG4gICAgICAgIHRoaXMuZmlsdGVyUGFyYW1zID0gbnVsbDtcclxuICAgICAgICB0aGlzLnJlbG9hZCA9IGZ1bmN0aW9uIChwYXJhbXMsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJhbXMgPT09IHZvaWQgMCkgeyBwYXJhbXMgPSB7fTsgfVxyXG4gICAgICAgICAgICBpZiAoIWNhbGxiYWNrKVxyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB2YXIgbm90ZVF1ZXJ5ID0gX3RoaXMuX21ha2VOb3RlUXVlcnkocGFyYW1zIHx8IHt9KTtcclxuICAgICAgICAgICAgdmFyIG5vdGVDb3VudCA9IDA7XHJcbiAgICAgICAgICAgIF90aGlzLnByb2dyZXNzLm9wZW4oMTApO1xyXG4gICAgICAgICAgICBhc3luYy5zZXJpZXMoW1xyXG4gICAgICAgICAgICAgICAgLy8gZ2V0IHVzZXJcclxuICAgICAgICAgICAgICAgIC8vIGdldCB1c2VyXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoX3RoaXMuZGF0YVN0b3JlLnVzZXIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnByb2dyZXNzLm5leHQoJ0dldHRpbmcgdXNlciBkYXRhLicpO1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLiRodHRwLmdldCgnL3VzZXInKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5kYXRhU3RvcmUudXNlciA9IGRhdGE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobmV3IEVycm9yKCdFcnJvciAkaHR0cCByZXF1ZXN0JykpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIC8vIGdldCBzZXR0aW5nc1xyXG4gICAgICAgICAgICAgICAgLy8gZ2V0IHNldHRpbmdzXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5uZXh0KCdHZXR0aW5nIHNldHRpbmdzIGRhdGEuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuJGh0dHAuZ2V0KCcvc2V0dGluZ3MnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5kYXRhU3RvcmUuc2V0dGluZ3MgPSBkYXRhO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcignRXJyb3IgJGh0dHAgcmVxdWVzdCcpKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAvLyBjaGVjayBzZXR0aW5nc1xyXG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgc2V0dGluZ3NcclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghX3RoaXMuZGF0YVN0b3JlLnNldHRpbmdzWydwZXJzb25zJ10gfHwgX3RoaXMuZGF0YVN0b3JlLnNldHRpbmdzWydwZXJzb25zJ10ubGVuZ3RoID09IDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoJ1RoaXMgYXBwIG5lZWQgcGVyc29ucyBzZXR0aW5nLiBQbGVhc2Ugc3dpdGNoIFwiU2V0dGluZ3MgUGFnZVwiIGFuZCBzZXQgeW91ciBwZXJzb25zIGRhdGEuJykpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgLy8gc3luY1xyXG4gICAgICAgICAgICAgICAgLy8gc3luY1xyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3MubmV4dCgnU3luY2luZyByZW1vdGUgc2VydmVyLicpO1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLiRodHRwLmdldCgnL3N5bmMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobmV3IEVycm9yKCdFcnJvciAkaHR0cCByZXF1ZXN0JykpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIC8vIGdldCBub3RlYm9va3NcclxuICAgICAgICAgICAgICAgIC8vIGdldCBub3RlYm9va3NcclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnByb2dyZXNzLm5leHQoJ0dldHRpbmcgbm90ZWJvb2tzIGRhdGEuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuJGh0dHAuZ2V0KCcvbm90ZWJvb2tzJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLm5vdGVib29rcyA9IHt9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3RhY2tIYXNoID0ge307XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBkYXRhLmxlbmd0aDsgX2krKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5vdGVib29rID0gZGF0YVtfaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5kYXRhU3RvcmUubm90ZWJvb2tzW25vdGVib29rLmd1aWRdID0gbm90ZWJvb2s7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobm90ZWJvb2suc3RhY2spXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2tIYXNoW25vdGVib29rLnN0YWNrXSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLnN0YWNrcyA9IE9iamVjdC5rZXlzKHN0YWNrSGFzaCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobmV3IEVycm9yKCdFcnJvciAkaHR0cCByZXF1ZXN0JykpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnByb2dyZXNzLm5leHQoJ0dldHRpbmcgbm90ZXMgY291bnQuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuJGh0dHAuZ2V0KCcvbm90ZXMvY291bnQnLCB7IHBhcmFtczogeyBxdWVyeTogbm90ZVF1ZXJ5IH0gfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbm90ZUNvdW50ID0gZGF0YTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5vdGVDb3VudCA+IDEwMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3aW5kb3cuY29uZmlybShcIkN1cnJlbnQgcXVlcnkgZmluZCBcIiArIG5vdGVDb3VudCArIFwiIG5vdGVzLiBJdCBpcyB0b28gbWFueS4gQ29udGludWUgYW55d2F5P1wiKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcignVXNlciBDYW5jZWxlZCcpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhuZXcgRXJyb3IoJ0Vycm9yICRodHRwIHJlcXVlc3QnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgLy8gZ2V0IG5vdGVzXHJcbiAgICAgICAgICAgICAgICAvLyBnZXQgbm90ZXNcclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnByb2dyZXNzLm5leHQoJ0dldHRpbmcgbm90ZXMuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuJGh0dHAuZ2V0KCcvbm90ZXMnLCB7IHBhcmFtczogeyBxdWVyeTogbm90ZVF1ZXJ5IH0gfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLm5vdGVzID0ge307XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBkYXRhLmxlbmd0aDsgX2krKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5vdGUgPSBkYXRhW19pXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmRhdGFTdG9yZS5ub3Rlc1tub3RlLmd1aWRdID0gbm90ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcignRXJyb3IgJGh0dHAgcmVxdWVzdCcpKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAvLyBnZXQgY29udGVudCBmcm9tIHJlbW90ZVxyXG4gICAgICAgICAgICAgICAgLy8gZ2V0IGNvbnRlbnQgZnJvbSByZW1vdGVcclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnByb2dyZXNzLm5leHQoJ1JlcXVlc3QgcmVtb3RlIGNvbnRlbnRzLicpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb3VudCA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgYXN5bmMuZm9yRWFjaE9mU2VyaWVzKF90aGlzLmRhdGFTdG9yZS5ub3RlcywgZnVuY3Rpb24gKG5vdGUsIG5vdGVHdWlkLCBjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5zZXQoXCJSZXF1ZXN0IHJlbW90ZSBjb250ZW50cy4gXCIgKyArK2NvdW50ICsgXCIgLyBcIiArIE9iamVjdC5rZXlzKF90aGlzLmRhdGFTdG9yZS5ub3RlcykubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFub3RlLmhhc0NvbnRlbnQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy4kaHR0cC5nZXQoJy9ub3Rlcy9nZXQtY29udGVudCcsIHsgcGFyYW1zOiB7IHF1ZXJ5OiB7IGd1aWQ6IG5vdGVHdWlkIH0gfSB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGRhdGEubGVuZ3RoOyBfaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGUgPSBkYXRhW19pXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLm5vdGVzW25vdGUuZ3VpZF0gPSBub3RlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcignRXJyb3IgJGh0dHAgcmVxdWVzdCcpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAvLyBnZXQgdGltZSBsb2dzXHJcbiAgICAgICAgICAgICAgICAvLyBnZXQgdGltZSBsb2dzXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5uZXh0KCdHZXR0aW5nIHRpbWUgbG9ncy4nKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZ3VpZHMgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBub3RlR3VpZCBpbiBfdGhpcy5kYXRhU3RvcmUubm90ZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5vdGUgPSBfdGhpcy5kYXRhU3RvcmUubm90ZXNbbm90ZUd1aWRdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBndWlkcy5wdXNoKG5vdGUuZ3VpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0aW1lTG9nUXVlcnkgPSBfdGhpcy5fbWFrZVRpbWVMb2dRdWVyeShtZXJnZSh0cnVlLCBwYXJhbXMsIHsgbm90ZUd1aWRzOiBndWlkcyB9KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuJGh0dHAucG9zdCgnL3RpbWUtbG9ncycsIHsgcXVlcnk6IHRpbWVMb2dRdWVyeSB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5kYXRhU3RvcmUudGltZUxvZ3MgPSB7fTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGRhdGEubGVuZ3RoOyBfaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGltZUxvZyA9IGRhdGFbX2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFfdGhpcy5kYXRhU3RvcmUudGltZUxvZ3NbdGltZUxvZy5ub3RlR3VpZF0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLnRpbWVMb2dzW3RpbWVMb2cubm90ZUd1aWRdID0ge307XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5kYXRhU3RvcmUudGltZUxvZ3NbdGltZUxvZy5ub3RlR3VpZF1bdGltZUxvZy5faWRdID0gdGltZUxvZztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcignRXJyb3IgJGh0dHAgcmVxdWVzdCcpKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAvLyBnZXQgcHJvZml0IGxvZ3NcclxuICAgICAgICAgICAgICAgIC8vIGdldCBwcm9maXQgbG9nc1xyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3MubmV4dCgnR2V0dGluZyBwcm9maXQgbG9ncy4nKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZ3VpZHMgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBub3RlR3VpZCBpbiBfdGhpcy5kYXRhU3RvcmUubm90ZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5vdGUgPSBfdGhpcy5kYXRhU3RvcmUubm90ZXNbbm90ZUd1aWRdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBndWlkcy5wdXNoKG5vdGUuZ3VpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLiRodHRwLnBvc3QoJy9wcm9maXQtbG9ncycsIHsgcXVlcnk6IHsgbm90ZUd1aWQ6IHsgJGluOiBndWlkcyB9IH0gfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLnByb2ZpdExvZ3MgPSB7fTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGRhdGEubGVuZ3RoOyBfaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJvZml0TG9nID0gZGF0YVtfaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIV90aGlzLmRhdGFTdG9yZS5wcm9maXRMb2dzW3Byb2ZpdExvZy5ub3RlR3VpZF0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLnByb2ZpdExvZ3NbcHJvZml0TG9nLm5vdGVHdWlkXSA9IHt9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLnByb2ZpdExvZ3NbcHJvZml0TG9nLm5vdGVHdWlkXVtwcm9maXRMb2cuX2lkXSA9IHByb2ZpdExvZztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcignRXJyb3IgJGh0dHAgcmVxdWVzdCcpKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIF0sIGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgICAgICAgICAgIGlmIChlcnIpXHJcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoZXJyKTtcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5uZXh0KCdEb25lLicpO1xyXG4gICAgICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3MuY2xvc2UoKTtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5yZVBhcnNlID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIGlmICghY2FsbGJhY2spXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIF90aGlzLnByb2dyZXNzLm9wZW4oMik7XHJcbiAgICAgICAgICAgIF90aGlzLnByb2dyZXNzLm5leHQoJ1JlIFBhcnNlIG5vdGVzLi4uJyk7XHJcbiAgICAgICAgICAgIGFzeW5jLndhdGVyZmFsbChbXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy4kaHR0cC5nZXQoJy9ub3Rlcy9yZS1wYXJzZScpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCdFcnJvciAkaHR0cCByZXF1ZXN0Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XSwgZnVuY3Rpb24gKGVycikge1xyXG4gICAgICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3MubmV4dCgnRG9uZS4nKTtcclxuICAgICAgICAgICAgICAgIF90aGlzLnByb2dyZXNzLmNsb3NlKCk7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuY291bnROb3RlcyA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICB2YXIgcXVlcnkgPSBfdGhpcy5fbWFrZU5vdGVRdWVyeSgpO1xyXG4gICAgICAgICAgICBfdGhpcy4kaHR0cC5nZXQoJy9ub3Rlcy9jb3VudCcsIHsgcGFyYW1zOiB7IHF1ZXJ5OiBxdWVyeSB9IH0pXHJcbiAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgZGF0YSk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soJ0Vycm9yICRodHRwIHJlcXVlc3QnKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLmNvdW50VGltZUxvZ3MgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgdmFyIHF1ZXJ5ID0gX3RoaXMuX21ha2VUaW1lTG9nUXVlcnkoKTtcclxuICAgICAgICAgICAgX3RoaXMuJGh0dHAuZ2V0KCcvdGltZS1sb2dzL2NvdW50JywgeyBwYXJhbXM6IHsgcXVlcnk6IHF1ZXJ5IH0gfSlcclxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCBkYXRhKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygnRXJyb3IgJGh0dHAgcmVxdWVzdCcpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuX21ha2VOb3RlUXVlcnkgPSBmdW5jdGlvbiAocGFyYW1zKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJhbXMgPT09IHZvaWQgMCkgeyBwYXJhbXMgPSB7fTsgfVxyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0ge307XHJcbiAgICAgICAgICAgIC8vIHNldCB1cGRhdGVkIHF1ZXJ5XHJcbiAgICAgICAgICAgIGlmIChwYXJhbXMuc3RhcnQpXHJcbiAgICAgICAgICAgICAgICBtZXJnZShyZXN1bHQsIHsgdXBkYXRlZDogeyAkZ3RlOiBwYXJhbXMuc3RhcnQudmFsdWVPZigpIH0gfSk7XHJcbiAgICAgICAgICAgIC8vIGNoZWNrIG5vdGVib29rc1xyXG4gICAgICAgICAgICB2YXIgbm90ZWJvb2tzSGFzaCA9IHt9O1xyXG4gICAgICAgICAgICBpZiAoX3RoaXMuZmlsdGVyUGFyYW1zLm5vdGVib29rR3VpZHMgJiYgX3RoaXMuZmlsdGVyUGFyYW1zLm5vdGVib29rR3VpZHMubGVuZ3RoID4gMClcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSBfdGhpcy5maWx0ZXJQYXJhbXMubm90ZWJvb2tHdWlkczsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbm90ZWJvb2tHdWlkID0gX2FbX2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIG5vdGVib29rc0hhc2hbbm90ZWJvb2tHdWlkXSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIGNoZWNrIHN0YWNrc1xyXG4gICAgICAgICAgICBpZiAoX3RoaXMuZmlsdGVyUGFyYW1zLnN0YWNrcyAmJiBfdGhpcy5maWx0ZXJQYXJhbXMuc3RhY2tzLmxlbmd0aCA+IDApXHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfYiA9IDAsIF9jID0gX3RoaXMuZmlsdGVyUGFyYW1zLnN0YWNrczsgX2IgPCBfYy5sZW5ndGg7IF9iKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgc3RhY2sgPSBfY1tfYl07XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbm90ZWJvb2tHdWlkXzEgaW4gX3RoaXMuZGF0YVN0b3JlLm5vdGVib29rcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbm90ZWJvb2sgPSBfdGhpcy5kYXRhU3RvcmUubm90ZWJvb2tzW25vdGVib29rR3VpZF8xXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0YWNrID09IG5vdGVib29rLnN0YWNrKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90ZWJvb2tzSGFzaFtub3RlYm9vay5ndWlkXSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBzZXQgbm90ZWJvb2tzIHF1ZXJ5IGNoZWNrZWQgYmVmb3JlXHJcbiAgICAgICAgICAgIHZhciBub3RlYm9va3NBcnJheSA9IE9iamVjdC5rZXlzKG5vdGVib29rc0hhc2gpO1xyXG4gICAgICAgICAgICBpZiAobm90ZWJvb2tzQXJyYXkubGVuZ3RoID4gMClcclxuICAgICAgICAgICAgICAgIG1lcmdlKHJlc3VsdCwgeyBub3RlYm9va0d1aWQ6IHsgJGluOiBub3RlYm9va3NBcnJheSB9IH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5fbWFrZVRpbWVMb2dRdWVyeSA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcclxuICAgICAgICAgICAgaWYgKHBhcmFtcyA9PT0gdm9pZCAwKSB7IHBhcmFtcyA9IHt9OyB9XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSB7fTtcclxuICAgICAgICAgICAgLy8gc2V0IGRhdGUgcXVlcnlcclxuICAgICAgICAgICAgaWYgKHBhcmFtcy5zdGFydClcclxuICAgICAgICAgICAgICAgIG1lcmdlLnJlY3Vyc2l2ZShyZXN1bHQsIHsgZGF0ZTogeyAkZ3RlOiBwYXJhbXMuc3RhcnQudmFsdWVPZigpIH0gfSk7XHJcbiAgICAgICAgICAgIGlmIChwYXJhbXMuZW5kKVxyXG4gICAgICAgICAgICAgICAgbWVyZ2UucmVjdXJzaXZlKHJlc3VsdCwgeyBkYXRlOiB7ICRsdGU6IHBhcmFtcy5lbmQudmFsdWVPZigpIH0gfSk7XHJcbiAgICAgICAgICAgIC8vIHNldCBub3RlIGd1aWRzIHF1ZXJ5XHJcbiAgICAgICAgICAgIGlmIChwYXJhbXMubm90ZUd1aWRzKVxyXG4gICAgICAgICAgICAgICAgbWVyZ2UocmVzdWx0LCB7IG5vdGVHdWlkOiB7ICRpbjogcGFyYW1zLm5vdGVHdWlkcyB9IH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5maWx0ZXJQYXJhbXMgPSB7XHJcbiAgICAgICAgICAgIG5vdGVib29rR3VpZHM6IFtdLFxyXG4gICAgICAgICAgICBzdGFja3M6IFtdXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIHJldHVybiBEYXRhVHJhbnNjaWV2ZXJTZXJ2aWNlO1xyXG59KSgpO1xyXG5hbmd1bGFyLm1vZHVsZSgnQXBwJykuc2VydmljZSgnZGF0YVRyYW5zY2lldmVyJywgWyckaHR0cCcsICdkYXRhU3RvcmUnLCAncHJvZ3Jlc3MnLCBEYXRhVHJhbnNjaWV2ZXJTZXJ2aWNlXSk7XHJcbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XHJcbmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gRGF0YVRyYW5zY2lldmVyU2VydmljZTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YS10cmFuc2NpZXZlci5qcy5tYXAiLCJ2YXIgUHJvZ3Jlc3NTZXJ2aWNlID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIFByb2dyZXNzU2VydmljZSgkbW9kYWwpIHtcclxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMuJG1vZGFsID0gJG1vZGFsO1xyXG4gICAgICAgIHRoaXMubW9kYWxJbnN0YW5jZSA9IG51bGw7XHJcbiAgICAgICAgdGhpcy52YWx1ZSA9IDA7XHJcbiAgICAgICAgdGhpcy5jb21wbGV0ZUNvdW50ID0gMDtcclxuICAgICAgICB0aGlzLmFsbENvdW50ID0gMDtcclxuICAgICAgICB0aGlzLm1lc3NhZ2UgPSAnJztcclxuICAgICAgICB0aGlzLm9wZW4gPSBmdW5jdGlvbiAoYWxsQ291bnQpIHtcclxuICAgICAgICAgICAgX3RoaXMubWVzc2FnZSA9ICdwcm9jZXNzaW5nLi4uJztcclxuICAgICAgICAgICAgX3RoaXMudmFsdWUgPSAwO1xyXG4gICAgICAgICAgICBfdGhpcy5jb21wbGV0ZUNvdW50ID0gMDtcclxuICAgICAgICAgICAgX3RoaXMuYWxsQ291bnQgPSBhbGxDb3VudDtcclxuICAgICAgICAgICAgX3RoaXMubW9kYWxJbnN0YW5jZSA9IF90aGlzLiRtb2RhbC5vcGVuKHtcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAncHJvZ3Jlc3MtbW9kYWwnLFxyXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ1Byb2dyZXNzTW9kYWxDb250cm9sbGVyJyxcclxuICAgICAgICAgICAgICAgIGJhY2tkcm9wOiAnc3RhdGljJyxcclxuICAgICAgICAgICAgICAgIGtleWJvYXJkOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHNpemU6ICdzbScsXHJcbiAgICAgICAgICAgICAgICBhbmltYXRpb246IGZhbHNlXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5jbG9zZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgX3RoaXMubW9kYWxJbnN0YW5jZS5jbG9zZSgpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5zZXQgPSBmdW5jdGlvbiAobWVzc2FnZSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB2b2lkIDApIHsgdmFsdWUgPSBudWxsOyB9XHJcbiAgICAgICAgICAgIF90aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgIT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICBfdGhpcy52YWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5uZXh0ID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgX3RoaXMuY29tcGxldGVDb3VudCsrO1xyXG4gICAgICAgICAgICBfdGhpcy5zZXQobWVzc2FnZSwgX3RoaXMuY29tcGxldGVDb3VudCAvIF90aGlzLmFsbENvdW50ICogMTAwKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIFByb2dyZXNzU2VydmljZTtcclxufSkoKTtcclxuYW5ndWxhci5tb2R1bGUoJ0FwcCcpLnNlcnZpY2UoJ3Byb2dyZXNzJywgWyckbW9kYWwnLCBQcm9ncmVzc1NlcnZpY2VdKTtcclxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcclxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBQcm9ncmVzc1NlcnZpY2U7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXByb2dyZXNzLmpzLm1hcCJdfQ==
