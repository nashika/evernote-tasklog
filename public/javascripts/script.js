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
                    throw new Error('Has inexistant dependency');
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
        hasher = hasher || identity;
        var memoized = _restParam(function memoized(args) {
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                async.setImmediate(function () {
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
// Generated by CoffeeScript 1.10.0
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
      this.$scope.isDeveloper = false;
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
          return alert('Set token failed.');
        };
      })(this));
    };

    return AuthController;

  })();

  app.controller('AuthController', ['$scope', '$http', AuthController]);

  module.exports = AuthController;

}).call(this);



},{}],5:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var Controller;

  Controller = (function() {
    function Controller($scope, dataTransciever) {
      this.$scope = $scope;
      this.dataTransciever = dataTransciever;
      this.$scope.dataTransciever = this.dataTransciever;
      this.dataTransciever.reload();
    }

    return Controller;

  })();

  app.controller('Controller', ['$scope', 'dataTransciever', Controller]);

  module.exports = Controller;

}).call(this);



},{}],6:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var MenuController,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  MenuController = (function() {
    MenuController.prototype.lastQueryStr = null;

    function MenuController($scope, $http, dataStore, dataTransciever, noteQuery, timeLogQuery) {
      this.$scope = $scope;
      this.$http = $http;
      this.dataStore = dataStore;
      this.dataTransciever = dataTransciever;
      this.noteQuery = noteQuery;
      this.timeLogQuery = timeLogQuery;
      this._onWatchTimeLogQuery = bind(this._onWatchTimeLogQuery, this);
      this._onWatchNoteQuery = bind(this._onWatchNoteQuery, this);
      this.$scope.dataStore = this.dataStore;
      this.$scope.dataTransciever = this.dataTransciever;
      this.$scope.noteQuery = this.noteQuery;
      this.$scope.timeLogQuery = this.timeLogQuery;
      this.$scope.$watchGroup(['noteQuery.updated', 'noteQuery.notebooks', 'noteQuery.stacks', 'noteQuery.worked'], this._onWatchNoteQuery);
      this.$scope.$watchGroup(['timeLogQuery.worked'], this._onWatchTimeLogQuery);
    }

    MenuController.prototype._onWatchNoteQuery = function() {
      var query, queryStr;
      query = this.noteQuery.query();
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
          return _this.noteQuery.count = data;
        };
      })(this)).error((function(_this) {
        return function() {
          return _this.noteQuery.count = null;
        };
      })(this));
    };

    MenuController.prototype._onWatchTimeLogQuery = function() {
      var query, queryStr;
      query = this.timeLogQuery.query();
      queryStr = JSON.stringify(query);
      if (this.lastQueryStr === queryStr) {
        return;
      }
      this.lastQueryStr = queryStr;
      return this.$http.get('/time-logs/count', {
        params: {
          query: query
        }
      }).success((function(_this) {
        return function(data) {
          return _this.timeLogQuery.count = data;
        };
      })(this)).error((function(_this) {
        return function() {
          return _this.timeLogQuery.count = null;
        };
      })(this));
    };

    return MenuController;

  })();

  app.controller('MenuController', ['$scope', '$http', 'dataStore', 'dataTransciever', 'noteQuery', 'timeLogQuery', MenuController]);

  module.exports = MenuController;

}).call(this);



},{}],7:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
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
// Generated by CoffeeScript 1.10.0
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
// Generated by CoffeeScript 1.10.0
(function() {
  var NotesController,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  NotesController = (function() {
    function NotesController($scope, dataStore) {
      this.$scope = $scope;
      this.dataStore = dataStore;
      this._onWatchProfitLogs = bind(this._onWatchProfitLogs, this);
      this._onWatchTimeLogs = bind(this._onWatchTimeLogs, this);
      this.$scope.dataStore = this.dataStore;
      this.$scope.notesSpentTimes = {};
      this.$scope.notesProfits = {};
      this.$scope.existPersons = [];
      this.$scope.$watchCollection('dataStore.timeLogs', this._onWatchTimeLogs);
      this.$scope.$watchCollection('dataStore.profitLogs', this._onWatchProfitLogs);
    }

    NotesController.prototype._onWatchTimeLogs = function(timeLogs) {
      var base, base1, base2, base3, base4, base5, name, name1, name2, noteGuid, noteTimeLog, personsHash, timeLog, timeLog_id;
      this.$scope.notesSpentTimes = {};
      personsHash = {};
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
            personsHash[timeLog.person] = true;
          }
        }
      }
      return this.$scope.existPersons = Object.keys(personsHash);
    };

    NotesController.prototype._onWatchProfitLogs = function(profitLogs) {
      var base, base1, base2, base3, name, noteGuid, noteProfitLog, person, profitLog, profitLog_id, results;
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
          var base4, i, len, ref, ref1, ref2, results1;
          ref = this.$scope.existPersons;
          results1 = [];
          for (i = 0, len = ref.length; i < len; i++) {
            person = ref[i];
            if (!((ref1 = this.$scope.notesSpentTimes[noteGuid]) != null ? ref1[person] : void 0) || !((ref2 = this.$scope.notesSpentTimes[noteGuid]) != null ? ref2['$total'] : void 0)) {
              results1.push(this.$scope.notesProfits[noteGuid][person] = null);
            } else {
              this.$scope.notesProfits[noteGuid][person] = Math.round(this.$scope.notesProfits[noteGuid]['$total'] * this.$scope.notesSpentTimes[noteGuid][person] / this.$scope.notesSpentTimes[noteGuid]['$total']);
              if ((base4 = this.$scope.notesProfits['$total'])[person] == null) {
                base4[person] = 0;
              }
              results1.push(this.$scope.notesProfits['$total'][person] += this.$scope.notesProfits[noteGuid][person]);
            }
          }
          return results1;
        }).call(this));
      }
      return results;
    };

    return NotesController;

  })();

  app.controller('NotesController', ['$scope', 'dataStore', NotesController]);

  module.exports = NotesController;

}).call(this);



},{}],10:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
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
// Generated by CoffeeScript 1.10.0
(function() {
  var SettingsController, async,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  async = require('async');

  SettingsController = (function() {

    /**
     * @const
     * @type {Object}
     */
    SettingsController.prototype.FIELDS = {
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


    /**
     * @protected
     * @type {Object}
     */

    SettingsController.prototype._editStore = {};

    function SettingsController($scope, $http, dataStore, dataTransciever, progress) {
      var field, key, ref;
      this.$scope = $scope;
      this.$http = $http;
      this.dataStore = dataStore;
      this.dataTransciever = dataTransciever;
      this.progress = progress;
      this._onWatchSetting = bind(this._onWatchSetting, this);
      this._submit = bind(this._submit, this);
      this._add = bind(this._add, this);
      this._remove = bind(this._remove, this);
      this._down = bind(this._down, this);
      this._up = bind(this._up, this);
      this.$scope.dataStore = this.dataStore;
      this.$scope.editStore = this._editStore;
      this.$scope.fields = this.FIELDS;
      this.$scope.up = this._up;
      this.$scope.down = this._down;
      this.$scope.remove = this._remove;
      this.$scope.add = this._add;
      this.$scope.submit = this._submit;
      ref = this.FIELDS;
      for (key in ref) {
        field = ref[key];
        this.$scope.$watch("dataStore.settings." + key, this._onWatchSetting(key));
      }
    }

    SettingsController.prototype._up = function(index) {
      if (index === 0) {
        return;
      }
      return this._editStore.persons.splice(index - 1, 2, this._editStore.persons[index], this._editStore.persons[index - 1]);
    };

    SettingsController.prototype._down = function(index) {
      if (index >= this._editStore.persons.length - 1) {
        return;
      }
      return this._editStore.persons.splice(index, 2, this._editStore.persons[index + 1], this._editStore.persons[index]);
    };

    SettingsController.prototype._remove = function(index) {
      return this._editStore.persons.splice(index, 1);
    };

    SettingsController.prototype._add = function() {
      var base;
      if ((base = this._editStore).persons == null) {
        base.persons = [];
      }
      return this._editStore.persons.push({
        name: "Person " + (this._editStore.persons.length + 1)
      });
    };

    SettingsController.prototype._submit = function() {
      var count, reParse, reload;
      this.progress.open();
      count = 0;
      reParse = false;
      reload = false;
      return async.forEachOfSeries(this.FIELDS, (function(_this) {
        return function(field, key, callback) {
          if (JSON.stringify(angular.copy(_this._editStore[key])) === JSON.stringify(_this.dataStore.settings[key])) {
            return callback();
          }
          if (field.reParse) {
            reParse = true;
          }
          if (field.reload) {
            reload = true;
          }
          _this.progress.set("Saving " + key + "...", count++ / Object.keys(_this.FIELDS).count * 100);
          return _this.$http.put('/settings/save', {
            key: key,
            value: _this._editStore[key]
          }).success(function() {
            _this.dataStore.settings[key] = _this._editStore[key];
            return callback();
          }).error(function() {
            return callback("Error saving " + key);
          });
        };
      })(this), (function(_this) {
        return function(err) {
          if (err) {
            alert(err);
          }
          _this.progress.close();
          return async.waterfall([
            function(callback) {
              if (reParse) {
                return _this.dataTransciever.reParse(callback);
              } else {
                return callback();
              }
            }, function(callback) {
              if (reload) {
                return _this.dataTransciever.reload(callback);
              } else {
                return callback();
              }
            }
          ]);
        };
      })(this));
    };

    SettingsController.prototype._onWatchSetting = function(key) {
      return (function(_this) {
        return function() {
          var ref;
          return _this._editStore[key] = angular.copy((ref = _this.dataStore.settings) != null ? ref[key] : void 0);
        };
      })(this);
    };

    return SettingsController;

  })();

  app.controller('SettingsController', ['$scope', '$http', 'dataStore', 'dataTransciever', 'progress', SettingsController]);

  module.exports = SettingsController;

}).call(this);



},{"async":1}],12:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var TimelineController,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  TimelineController = (function() {
    function TimelineController($scope, $filter, dataStore) {
      var container, options;
      this.$scope = $scope;
      this.$filter = $filter;
      this.dataStore = dataStore;
      this._onResize = bind(this._onResize, this);
      this._onWatchProfitLogs = bind(this._onWatchProfitLogs, this);
      this._onWatchNotes = bind(this._onWatchNotes, this);
      this._onWatchWorkingTime = bind(this._onWatchWorkingTime, this);
      this._onWatchPersons = bind(this._onWatchPersons, this);
      this.$scope.dataStore = this.dataStore;
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
        order: function(a, b) {
          return a.start - b.start;
        }
      };
      this.$scope.timeline = new vis.Timeline(container, this.$scope.timelineItems, this.$scope.timelineGroups, options);
      this.$scope.$watchCollection('dataStore.settings.persons', this._onWatchPersons);
      this.$scope.$watchGroup(['dataStore.settings.startWorkingTime', 'dataStore.settings.endWorkingTime'], this._onWatchWorkingTime);
      this.$scope.$watchCollection('dataStore.notes', this._onWatchNotes);
      this.$scope.$watchCollection('dataStore.timeLogs', this._onWatchNotes);
      this.$scope.$watchCollection('dataStore.profitLogs', this._onWatchProfitLogs);
      this.$scope.$on('resize::resize', this._onResize);
    }

    TimelineController.prototype._onWatchPersons = function() {
      var i, index, len, person, ref, ref1;
      if (!((ref = this.dataStore.settings) != null ? ref.persons : void 0)) {
        return;
      }
      this.$scope.timelineGroups.clear();
      ref1 = this.dataStore.settings.persons;
      for (index = i = 0, len = ref1.length; i < len; index = ++i) {
        person = ref1[index];
        this.$scope.timelineGroups.add({
          id: person.name,
          content: person.name
        });
      }
      return this.$scope.timelineGroups.add({
        id: 'updated',
        content: 'Update'
      });
    };

    TimelineController.prototype._onWatchWorkingTime = function() {
      var ref, ref1;
      if (((ref = this.dataStore.settings) != null ? ref.startWorkingTime : void 0) && ((ref1 = this.dataStore.settings) != null ? ref1.endWorkingTime : void 0)) {
        return this.$scope.timeline.setOptions({
          hiddenDates: [
            {
              start: moment().subtract(1, 'days').startOf('day').hour(this.dataStore.settings.endWorkingTime),
              end: moment().startOf('day').hour(this.dataStore.settings.startWorkingTime),
              repeat: 'daily'
            }
          ]
        });
      } else {
        return this.$scope.timeline.setOptions({
          hiddenDates: {}
        });
      }
    };

    TimelineController.prototype._onWatchNotes = function() {
      var note, noteGuid, noteTimeLog, ref, ref1, results, timeLog, timeLogs_id;
      this.$scope.timelineItems.clear();
      ref = this.dataStore.notes;
      for (noteGuid in ref) {
        note = ref[noteGuid];
        this.$scope.timelineItems.add({
          id: note.guid,
          group: 'updated',
          content: "<a href=\"evernote:///view/" + this.dataStore.user.id + "/" + this.dataStore.user.shardId + "/" + note.guid + "/" + note.guid + "/\" title=\"" + note.title + "\">" + (this.$filter('abbreviate')(note.title, 40)) + "</a>",
          start: new Date(note.updated),
          type: 'point'
        });
      }
      ref1 = this.dataStore.timeLogs;
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
              content: "<a href=\"evernote:///view/" + this.dataStore.user.id + "/" + this.dataStore.user.shardId + "/" + timeLog.noteGuid + "/" + timeLog.noteGuid + "/\" title=\"" + this.dataStore.notes[timeLog.noteGuid].title + " " + timeLog.comment + "\">" + (this.$filter('abbreviate')(this.dataStore.notes[timeLog.noteGuid].title, 20)) + " " + (this.$filter('abbreviate')(timeLog.comment, 20)) + "</a>",
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

  app.controller('TimelineController', ['$scope', '$filter', 'dataStore', TimelineController]);

  module.exports = TimelineController;

}).call(this);



},{}],13:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
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
// Generated by CoffeeScript 1.10.0
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
// Generated by CoffeeScript 1.10.0
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
// Generated by CoffeeScript 1.10.0
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
// Generated by CoffeeScript 1.10.0
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
// Generated by CoffeeScript 1.10.0
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

require('./services/data-store');

require('./services/data-transciever');

require('./services/note-query');

require('./services/progress');

require('./services/time-log-query');

require('./directives/resize');

require('./controllers/auth-controller');

require('./controllers/controller');

require('./controllers/menu-controller');

require('./controllers/navigation-controller');

require('./controllers/notes-controller');

require('./controllers/progress-modal-controller');

require('./controllers/settings-controller');

require('./controllers/timeline-controller');


},{"./controllers/auth-controller":4,"./controllers/controller":5,"./controllers/menu-controller":6,"./controllers/navigation-controller":8,"./controllers/notes-controller":9,"./controllers/progress-modal-controller":10,"./controllers/settings-controller":11,"./controllers/timeline-controller":12,"./directives/resize":13,"./filters/abbreviate":14,"./filters/filter-by-property":15,"./filters/object-length":16,"./filters/order-object-by":17,"./filters/spent-time":18,"./route":20,"./services/data-store":21,"./services/data-transciever":22,"./services/note-query":23,"./services/progress":24,"./services/time-log-query":25}],20:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
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
// Generated by CoffeeScript 1.10.0
(function() {
  var DataStoreService;

  DataStoreService = (function() {

    /**
     * @public
     * @type {Object}
     */
    DataStoreService.prototype.user = null;


    /**
     * @public
     * @type {Array}
     */

    DataStoreService.prototype.persons = [];


    /**
     * @public
     * @type {Object}
     */

    DataStoreService.prototype.notebooks = {};


    /**
     * @public
     * @type {Array}
     */

    DataStoreService.prototype.stacks = [];


    /**
     * @public
     * @type {Object}
     */

    DataStoreService.prototype.notes = {};


    /**
     * @public
     * @type {Object}
     */

    DataStoreService.prototype.timeLogs = {};


    /**
     * @public
     * @type {Object}
     */

    DataStoreService.prototype.profitLogs = {};


    /**
     * @constructor
     */

    function DataStoreService() {}

    return DataStoreService;

  })();

  app.service('dataStore', [DataStoreService]);

  module.exports = DataStoreService;

}).call(this);



},{}],22:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var DataTranscieverService, async,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  async = require('async');

  DataTranscieverService = (function() {

    /**
     * @constructor
     * @param {$HttpProvider} $http
     * @param {DataStoreService} dataStore
     * @param {NoteQueryService} noteQuery
     * @param {ProgressService} progress
     */
    function DataTranscieverService($http, dataStore, noteQuery, progress) {
      this.$http = $http;
      this.dataStore = dataStore;
      this.noteQuery = noteQuery;
      this.progress = progress;
      this.reload = bind(this.reload, this);
    }


    /**
     * @public
     * @param {function} callback
     */

    DataTranscieverService.prototype.reload = function(callback) {
      var noteCount, query;
      if (!callback) {
        callback = (function(_this) {
          return function() {};
        })(this);
      }
      query = this.noteQuery.query();
      noteCount = 0;
      this.progress.open();
      return async.series([
        (function(_this) {
          return function(callback) {
            if (_this.dataStore.user) {
              return callback();
            }
            _this.progress.set('Getting user data.', 0);
            return _this.$http.get('/user').success(function(data) {
              _this.dataStore.user = data;
              return callback();
            }).error(function() {
              return callback('Error $http request');
            });
          };
        })(this), (function(_this) {
          return function(callback) {
            _this.progress.set('Getting settings data.', 10);
            return _this.$http.get('/settings').success(function(data) {
              _this.dataStore.settings = data;
              return callback();
            }).error(function() {
              return callback('Error $http request');
            });
          };
        })(this), (function(_this) {
          return function(callback) {
            if (!_this.dataStore.settings.persons || _this.dataStore.settings.persons.length === 0) {
              return callback('This app need persons setting. Please switch "Settings Page" and set your persons data.');
            }
            return callback();
          };
        })(this), (function(_this) {
          return function(callback) {
            _this.progress.set('Syncing remote server.', 20);
            return _this.$http.get('/sync').success(function() {
              return callback();
            }).error(function() {
              return callback('Error $http request');
            });
          };
        })(this), (function(_this) {
          return function(callback) {
            _this.progress.set('Getting notebooks data.', 30);
            return _this.$http.get('/notebooks').success(function(data) {
              var i, len, notebook, stackHash;
              _this.dataStore.notebooks = {};
              stackHash = {};
              for (i = 0, len = data.length; i < len; i++) {
                notebook = data[i];
                _this.dataStore.notebooks[notebook.guid] = notebook;
                if (notebook.stack) {
                  stackHash[notebook.stack] = true;
                }
              }
              _this.dataStore.stacks = Object.keys(stackHash);
              return callback();
            }).error(function() {
              return callback('Error $http request');
            });
          };
        })(this), (function(_this) {
          return function(callback) {
            _this.progress.set('Getting notes count.', 40);
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
            _this.progress.set('Request remote contents.', 50);
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
            _this.progress.set('Getting notes.', 70);
            return _this.$http.get('/notes', {
              params: {
                query: query,
                content: false
              }
            }).success(function(data) {
              var i, len, note;
              _this.dataStore.notes = {};
              for (i = 0, len = data.length; i < len; i++) {
                note = data[i];
                _this.dataStore.notes[note.guid] = note;
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
              ref = this.dataStore.notes;
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
              _this.dataStore.timeLogs = {};
              for (i = 0, len = data.length; i < len; i++) {
                timeLog = data[i];
                if ((base = _this.dataStore.timeLogs)[name = timeLog.noteGuid] == null) {
                  base[name] = {};
                }
                _this.dataStore.timeLogs[timeLog.noteGuid][timeLog._id] = timeLog;
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
              ref = this.dataStore.notes;
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
              _this.dataStore.profitLogs = {};
              for (i = 0, len = data.length; i < len; i++) {
                profitLog = data[i];
                if ((base = _this.dataStore.profitLogs)[name = profitLog.noteGuid] == null) {
                  base[name] = {};
                }
                _this.dataStore.profitLogs[profitLog.noteGuid][profitLog._id] = profitLog;
              }
              return callback();
            }).error(function() {
              return callback('Error $http request');
            });
          };
        })(this)
      ], (function(_this) {
        return function(err) {
          if (err) {
            alert(err);
          } else {
            _this.progress.set('Done.', 100);
          }
          _this.progress.close();
          return callback(err);
        };
      })(this));
    };

    DataTranscieverService.prototype.reParse = function(callback) {
      if (!callback) {
        callback = (function(_this) {
          return function() {};
        })(this);
      }
      this.progress.open();
      this.progress.set('Re Parse notes...', 50);
      return async.waterfall([
        (function(_this) {
          return function(callback) {
            return _this.$http.get('/notes/re-parse').success(function(data) {
              return callback();
            }).error(function(data) {
              return callback('Error $http request');
            });
          };
        })(this)
      ], (function(_this) {
        return function(err) {
          _this.progress.set('Done.', 100);
          _this.progress.close();
          return callback(err);
        };
      })(this));
    };

    return DataTranscieverService;

  })();

  app.service('dataTransciever', ['$http', 'dataStore', 'noteQuery', 'progress', DataTranscieverService]);

  module.exports = DataTranscieverService;

}).call(this);



},{"async":1}],23:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var NoteQueryService, merge,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  merge = require('merge');

  NoteQueryService = (function() {

    /**
     * @public
     * @type {number}
     */
    NoteQueryService.prototype.updated = 3;


    /**
     * @public
     * @type {Array}
     */

    NoteQueryService.prototype.notebooks = null;


    /**
     * @public
     * @type {Array}
     */

    NoteQueryService.prototype.stacks = null;


    /**
     * @public
     * @type {number}
     */

    NoteQueryService.prototype.count = null;


    /**
     * @constructor
     * @param {SyncDataService} syncData
     */

    function NoteQueryService(dataStore) {
      this.dataStore = dataStore;
      this.query = bind(this.query, this);
    }


    /**
     * @public
     * @return {Object}
     */

    NoteQueryService.prototype.query = function() {
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
          ref2 = this.dataStore.notebooks;
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

    return NoteQueryService;

  })();

  app.service('noteQuery', ['dataStore', NoteQueryService]);

  module.exports = NoteQueryService;

}).call(this);



},{"merge":2}],24:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
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



},{}],25:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var TimeLogQueryService, merge,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  merge = require('merge');

  TimeLogQueryService = (function() {

    /**
     * @public
     * @type {number}
     */
    TimeLogQueryService.prototype.worked = 3;


    /**
     * @public
     * @type {number}
     */

    TimeLogQueryService.prototype.count = null;


    /**
     * @constructor
     * @param {SyncDataService} syncData
     */

    function TimeLogQueryService(dataStore) {
      this.dataStore = dataStore;
      this.query = bind(this.query, this);
    }


    /**
     * @public
     * @return {Object}
     */

    TimeLogQueryService.prototype.query = function() {
      var result;
      result = {};
      if (this.worked) {
        merge(result, {
          date: {
            $gte: parseInt(moment().startOf('day').subtract(this.worked, 'days').format('x'))
          }
        });
      }
      return result;
    };

    return TimeLogQueryService;

  })();

  app.service('timeLogQuery', ['dataStore', TimeLogQueryService]);

  module.exports = TimeLogQueryService;

}).call(this);



},{"merge":2}]},{},[19])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvYXN5bmMvbGliL2FzeW5jLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL21lcmdlL21lcmdlLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsInNyYy9jb250cm9sbGVycy9hdXRoLWNvbnRyb2xsZXIuanMiLCJzcmMvY29udHJvbGxlcnMvY29udHJvbGxlci5qcyIsInNyYy9jb250cm9sbGVycy9tZW51LWNvbnRyb2xsZXIuanMiLCJzcmMvY29udHJvbGxlcnMvbW9kYWwtY29udHJvbGxlci5qcyIsInNyYy9jb250cm9sbGVycy9uYXZpZ2F0aW9uLWNvbnRyb2xsZXIuanMiLCJzcmMvY29udHJvbGxlcnMvbm90ZXMtY29udHJvbGxlci5qcyIsInNyYy9jb250cm9sbGVycy9wcm9ncmVzcy1tb2RhbC1jb250cm9sbGVyLmpzIiwic3JjL2NvbnRyb2xsZXJzL3NldHRpbmdzLWNvbnRyb2xsZXIuanMiLCJzcmMvY29udHJvbGxlcnMvdGltZWxpbmUtY29udHJvbGxlci5qcyIsInNyYy9kaXJlY3RpdmVzL3Jlc2l6ZS5qcyIsInNyYy9maWx0ZXJzL2FiYnJldmlhdGUuanMiLCJzcmMvZmlsdGVycy9maWx0ZXItYnktcHJvcGVydHkuanMiLCJzcmMvZmlsdGVycy9vYmplY3QtbGVuZ3RoLmpzIiwic3JjL2ZpbHRlcnMvb3JkZXItb2JqZWN0LWJ5LmpzIiwic3JjL2ZpbHRlcnMvc3BlbnQtdGltZS5qcyIsIkM6XFxVc2Vyc1xcaW5mb1xcRG9jdW1lbnRzXFx3b3Jrc3BhY2VcXGV2ZXJub3RlLXRhc2tsb2dcXHB1YmxpY1xcamF2YXNjcmlwdHNcXHNyY1xcaW5kZXguY29mZmVlIiwic3JjL3JvdXRlLmpzIiwic3JjL3NlcnZpY2VzL2RhdGEtc3RvcmUuanMiLCJzcmMvc2VydmljZXMvZGF0YS10cmFuc2NpZXZlci5qcyIsInNyYy9zZXJ2aWNlcy9ub3RlLXF1ZXJ5LmpzIiwic3JjL3NlcnZpY2VzL3Byb2dyZXNzLmpzIiwic3JjL3NlcnZpY2VzL3RpbWUtbG9nLXF1ZXJ5LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNodkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBLE1BQU0sQ0FBQyxHQUFQLEdBQWEsT0FBTyxDQUFDLE1BQVIsQ0FBZSxLQUFmLEVBQXNCLENBQUMsU0FBRCxFQUFZLGNBQVosRUFBNEIsWUFBNUIsRUFBMEMsV0FBMUMsQ0FBdEI7O0FBRWIsR0FBRyxDQUFDLE1BQUosQ0FBVztFQUFDLGtCQUFELEVBQXFCLFNBQUMsZ0JBQUQ7V0FDOUIsZ0JBQWdCLENBQUMsMEJBQWpCLENBQTRDLG1DQUE1QztFQUQ4QixDQUFyQjtDQUFYOztBQUtBLE9BQUEsQ0FBUSxTQUFSOztBQUdBLE9BQUEsQ0FBUSxzQkFBUjs7QUFDQSxPQUFBLENBQVEsOEJBQVI7O0FBQ0EsT0FBQSxDQUFRLHlCQUFSOztBQUNBLE9BQUEsQ0FBUSwyQkFBUjs7QUFDQSxPQUFBLENBQVEsc0JBQVI7O0FBR0EsT0FBQSxDQUFRLHVCQUFSOztBQUNBLE9BQUEsQ0FBUSw2QkFBUjs7QUFDQSxPQUFBLENBQVEsdUJBQVI7O0FBQ0EsT0FBQSxDQUFRLHFCQUFSOztBQUNBLE9BQUEsQ0FBUSwyQkFBUjs7QUFHQSxPQUFBLENBQVEscUJBQVI7O0FBR0EsT0FBQSxDQUFRLCtCQUFSOztBQUNBLE9BQUEsQ0FBUSwwQkFBUjs7QUFDQSxPQUFBLENBQVEsK0JBQVI7O0FBQ0EsT0FBQSxDQUFRLHFDQUFSOztBQUNBLE9BQUEsQ0FBUSxnQ0FBUjs7QUFDQSxPQUFBLENBQVEseUNBQVI7O0FBQ0EsT0FBQSxDQUFRLG1DQUFSOztBQUNBLE9BQUEsQ0FBUSxtQ0FBUjs7OztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qIVxuICogYXN5bmNcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9jYW9sYW4vYXN5bmNcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMC0yMDE0IENhb2xhbiBNY01haG9uXG4gKiBSZWxlYXNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2VcbiAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBhc3luYyA9IHt9O1xuICAgIGZ1bmN0aW9uIG5vb3AoKSB7fVxuICAgIGZ1bmN0aW9uIGlkZW50aXR5KHYpIHtcbiAgICAgICAgcmV0dXJuIHY7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHRvQm9vbCh2KSB7XG4gICAgICAgIHJldHVybiAhIXY7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG5vdElkKHYpIHtcbiAgICAgICAgcmV0dXJuICF2O1xuICAgIH1cblxuICAgIC8vIGdsb2JhbCBvbiB0aGUgc2VydmVyLCB3aW5kb3cgaW4gdGhlIGJyb3dzZXJcbiAgICB2YXIgcHJldmlvdXNfYXN5bmM7XG5cbiAgICAvLyBFc3RhYmxpc2ggdGhlIHJvb3Qgb2JqZWN0LCBgd2luZG93YCAoYHNlbGZgKSBpbiB0aGUgYnJvd3NlciwgYGdsb2JhbGBcbiAgICAvLyBvbiB0aGUgc2VydmVyLCBvciBgdGhpc2AgaW4gc29tZSB2aXJ0dWFsIG1hY2hpbmVzLiBXZSB1c2UgYHNlbGZgXG4gICAgLy8gaW5zdGVhZCBvZiBgd2luZG93YCBmb3IgYFdlYldvcmtlcmAgc3VwcG9ydC5cbiAgICB2YXIgcm9vdCA9IHR5cGVvZiBzZWxmID09PSAnb2JqZWN0JyAmJiBzZWxmLnNlbGYgPT09IHNlbGYgJiYgc2VsZiB8fFxuICAgICAgICAgICAgdHlwZW9mIGdsb2JhbCA9PT0gJ29iamVjdCcgJiYgZ2xvYmFsLmdsb2JhbCA9PT0gZ2xvYmFsICYmIGdsb2JhbCB8fFxuICAgICAgICAgICAgdGhpcztcblxuICAgIGlmIChyb290ICE9IG51bGwpIHtcbiAgICAgICAgcHJldmlvdXNfYXN5bmMgPSByb290LmFzeW5jO1xuICAgIH1cblxuICAgIGFzeW5jLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJvb3QuYXN5bmMgPSBwcmV2aW91c19hc3luYztcbiAgICAgICAgcmV0dXJuIGFzeW5jO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBvbmx5X29uY2UoZm4pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKGZuID09PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoXCJDYWxsYmFjayB3YXMgYWxyZWFkeSBjYWxsZWQuXCIpO1xuICAgICAgICAgICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGZuID0gbnVsbDtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfb25jZShmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoZm4gPT09IG51bGwpIHJldHVybjtcbiAgICAgICAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICBmbiA9IG51bGw7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8vLyBjcm9zcy1icm93c2VyIGNvbXBhdGlibGl0eSBmdW5jdGlvbnMgLy8vL1xuXG4gICAgdmFyIF90b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbiAgICB2YXIgX2lzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgcmV0dXJuIF90b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gICAgfTtcblxuICAgIC8vIFBvcnRlZCBmcm9tIHVuZGVyc2NvcmUuanMgaXNPYmplY3RcbiAgICB2YXIgX2lzT2JqZWN0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgIHZhciB0eXBlID0gdHlwZW9mIG9iajtcbiAgICAgICAgcmV0dXJuIHR5cGUgPT09ICdmdW5jdGlvbicgfHwgdHlwZSA9PT0gJ29iamVjdCcgJiYgISFvYmo7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIF9pc0FycmF5TGlrZShhcnIpIHtcbiAgICAgICAgcmV0dXJuIF9pc0FycmF5KGFycikgfHwgKFxuICAgICAgICAgICAgLy8gaGFzIGEgcG9zaXRpdmUgaW50ZWdlciBsZW5ndGggcHJvcGVydHlcbiAgICAgICAgICAgIHR5cGVvZiBhcnIubGVuZ3RoID09PSBcIm51bWJlclwiICYmXG4gICAgICAgICAgICBhcnIubGVuZ3RoID49IDAgJiZcbiAgICAgICAgICAgIGFyci5sZW5ndGggJSAxID09PSAwXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2FycmF5RWFjaChhcnIsIGl0ZXJhdG9yKSB7XG4gICAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgICAgbGVuZ3RoID0gYXJyLmxlbmd0aDtcblxuICAgICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgaXRlcmF0b3IoYXJyW2luZGV4XSwgaW5kZXgsIGFycik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfbWFwKGFyciwgaXRlcmF0b3IpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgICBsZW5ndGggPSBhcnIubGVuZ3RoLFxuICAgICAgICAgICAgcmVzdWx0ID0gQXJyYXkobGVuZ3RoKTtcblxuICAgICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgcmVzdWx0W2luZGV4XSA9IGl0ZXJhdG9yKGFycltpbmRleF0sIGluZGV4LCBhcnIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3JhbmdlKGNvdW50KSB7XG4gICAgICAgIHJldHVybiBfbWFwKEFycmF5KGNvdW50KSwgZnVuY3Rpb24gKHYsIGkpIHsgcmV0dXJuIGk7IH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9yZWR1Y2UoYXJyLCBpdGVyYXRvciwgbWVtbykge1xuICAgICAgICBfYXJyYXlFYWNoKGFyciwgZnVuY3Rpb24gKHgsIGksIGEpIHtcbiAgICAgICAgICAgIG1lbW8gPSBpdGVyYXRvcihtZW1vLCB4LCBpLCBhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBtZW1vO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9mb3JFYWNoT2Yob2JqZWN0LCBpdGVyYXRvcikge1xuICAgICAgICBfYXJyYXlFYWNoKF9rZXlzKG9iamVjdCksIGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKG9iamVjdFtrZXldLCBrZXkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfaW5kZXhPZihhcnIsIGl0ZW0pIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChhcnJbaV0gPT09IGl0ZW0pIHJldHVybiBpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG5cbiAgICB2YXIgX2tleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHZhciBrZXlzID0gW107XG4gICAgICAgIGZvciAodmFyIGsgaW4gb2JqKSB7XG4gICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGspKSB7XG4gICAgICAgICAgICAgICAga2V5cy5wdXNoKGspO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBrZXlzO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBfa2V5SXRlcmF0b3IoY29sbCkge1xuICAgICAgICB2YXIgaSA9IC0xO1xuICAgICAgICB2YXIgbGVuO1xuICAgICAgICB2YXIga2V5cztcbiAgICAgICAgaWYgKF9pc0FycmF5TGlrZShjb2xsKSkge1xuICAgICAgICAgICAgbGVuID0gY29sbC5sZW5ndGg7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dCgpIHtcbiAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGkgPCBsZW4gPyBpIDogbnVsbDtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBrZXlzID0gX2tleXMoY29sbCk7XG4gICAgICAgICAgICBsZW4gPSBrZXlzLmxlbmd0aDtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0KCkge1xuICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICByZXR1cm4gaSA8IGxlbiA/IGtleXNbaV0gOiBudWxsO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFNpbWlsYXIgdG8gRVM2J3MgcmVzdCBwYXJhbSAoaHR0cDovL2FyaXlhLm9maWxhYnMuY29tLzIwMTMvMDMvZXM2LWFuZC1yZXN0LXBhcmFtZXRlci5odG1sKVxuICAgIC8vIFRoaXMgYWNjdW11bGF0ZXMgdGhlIGFyZ3VtZW50cyBwYXNzZWQgaW50byBhbiBhcnJheSwgYWZ0ZXIgYSBnaXZlbiBpbmRleC5cbiAgICAvLyBGcm9tIHVuZGVyc2NvcmUuanMgKGh0dHBzOi8vZ2l0aHViLmNvbS9qYXNoa2VuYXMvdW5kZXJzY29yZS9wdWxsLzIxNDApLlxuICAgIGZ1bmN0aW9uIF9yZXN0UGFyYW0oZnVuYywgc3RhcnRJbmRleCkge1xuICAgICAgICBzdGFydEluZGV4ID0gc3RhcnRJbmRleCA9PSBudWxsID8gZnVuYy5sZW5ndGggLSAxIDogK3N0YXJ0SW5kZXg7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBsZW5ndGggPSBNYXRoLm1heChhcmd1bWVudHMubGVuZ3RoIC0gc3RhcnRJbmRleCwgMCk7XG4gICAgICAgICAgICB2YXIgcmVzdCA9IEFycmF5KGxlbmd0aCk7XG4gICAgICAgICAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICAgICAgcmVzdFtpbmRleF0gPSBhcmd1bWVudHNbaW5kZXggKyBzdGFydEluZGV4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN3aXRjaCAoc3RhcnRJbmRleCkge1xuICAgICAgICAgICAgICAgIGNhc2UgMDogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCByZXN0KTtcbiAgICAgICAgICAgICAgICBjYXNlIDE6IHJldHVybiBmdW5jLmNhbGwodGhpcywgYXJndW1lbnRzWzBdLCByZXN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEN1cnJlbnRseSB1bnVzZWQgYnV0IGhhbmRsZSBjYXNlcyBvdXRzaWRlIG9mIHRoZSBzd2l0Y2ggc3RhdGVtZW50OlxuICAgICAgICAgICAgLy8gdmFyIGFyZ3MgPSBBcnJheShzdGFydEluZGV4ICsgMSk7XG4gICAgICAgICAgICAvLyBmb3IgKGluZGV4ID0gMDsgaW5kZXggPCBzdGFydEluZGV4OyBpbmRleCsrKSB7XG4gICAgICAgICAgICAvLyAgICAgYXJnc1tpbmRleF0gPSBhcmd1bWVudHNbaW5kZXhdO1xuICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgLy8gYXJnc1tzdGFydEluZGV4XSA9IHJlc3Q7XG4gICAgICAgICAgICAvLyByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfd2l0aG91dEluZGV4KGl0ZXJhdG9yKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUsIGluZGV4LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZXJhdG9yKHZhbHVlLCBjYWxsYmFjayk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8vLyBleHBvcnRlZCBhc3luYyBtb2R1bGUgZnVuY3Rpb25zIC8vLy9cblxuICAgIC8vLy8gbmV4dFRpY2sgaW1wbGVtZW50YXRpb24gd2l0aCBicm93c2VyLWNvbXBhdGlibGUgZmFsbGJhY2sgLy8vL1xuXG4gICAgLy8gY2FwdHVyZSB0aGUgZ2xvYmFsIHJlZmVyZW5jZSB0byBndWFyZCBhZ2FpbnN0IGZha2VUaW1lciBtb2Nrc1xuICAgIHZhciBfc2V0SW1tZWRpYXRlID0gdHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gJ2Z1bmN0aW9uJyAmJiBzZXRJbW1lZGlhdGU7XG5cbiAgICB2YXIgX2RlbGF5ID0gX3NldEltbWVkaWF0ZSA/IGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgIC8vIG5vdCBhIGRpcmVjdCBhbGlhcyBmb3IgSUUxMCBjb21wYXRpYmlsaXR5XG4gICAgICAgIF9zZXRJbW1lZGlhdGUoZm4pO1xuICAgIH0gOiBmdW5jdGlvbihmbikge1xuICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9O1xuXG4gICAgaWYgKHR5cGVvZiBwcm9jZXNzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgcHJvY2Vzcy5uZXh0VGljayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBhc3luYy5uZXh0VGljayA9IHByb2Nlc3MubmV4dFRpY2s7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgYXN5bmMubmV4dFRpY2sgPSBfZGVsYXk7XG4gICAgfVxuICAgIGFzeW5jLnNldEltbWVkaWF0ZSA9IF9zZXRJbW1lZGlhdGUgPyBfZGVsYXkgOiBhc3luYy5uZXh0VGljaztcblxuXG4gICAgYXN5bmMuZm9yRWFjaCA9XG4gICAgYXN5bmMuZWFjaCA9IGZ1bmN0aW9uIChhcnIsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gYXN5bmMuZWFjaE9mKGFyciwgX3dpdGhvdXRJbmRleChpdGVyYXRvciksIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMuZm9yRWFjaFNlcmllcyA9XG4gICAgYXN5bmMuZWFjaFNlcmllcyA9IGZ1bmN0aW9uIChhcnIsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gYXN5bmMuZWFjaE9mU2VyaWVzKGFyciwgX3dpdGhvdXRJbmRleChpdGVyYXRvciksIGNhbGxiYWNrKTtcbiAgICB9O1xuXG5cbiAgICBhc3luYy5mb3JFYWNoTGltaXQgPVxuICAgIGFzeW5jLmVhY2hMaW1pdCA9IGZ1bmN0aW9uIChhcnIsIGxpbWl0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIF9lYWNoT2ZMaW1pdChsaW1pdCkoYXJyLCBfd2l0aG91dEluZGV4KGl0ZXJhdG9yKSwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy5mb3JFYWNoT2YgPVxuICAgIGFzeW5jLmVhY2hPZiA9IGZ1bmN0aW9uIChvYmplY3QsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IF9vbmNlKGNhbGxiYWNrIHx8IG5vb3ApO1xuICAgICAgICBvYmplY3QgPSBvYmplY3QgfHwgW107XG5cbiAgICAgICAgdmFyIGl0ZXIgPSBfa2V5SXRlcmF0b3Iob2JqZWN0KTtcbiAgICAgICAgdmFyIGtleSwgY29tcGxldGVkID0gMDtcblxuICAgICAgICB3aGlsZSAoKGtleSA9IGl0ZXIoKSkgIT0gbnVsbCkge1xuICAgICAgICAgICAgY29tcGxldGVkICs9IDE7XG4gICAgICAgICAgICBpdGVyYXRvcihvYmplY3Rba2V5XSwga2V5LCBvbmx5X29uY2UoZG9uZSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbXBsZXRlZCA9PT0gMCkgY2FsbGJhY2sobnVsbCk7XG5cbiAgICAgICAgZnVuY3Rpb24gZG9uZShlcnIpIHtcbiAgICAgICAgICAgIGNvbXBsZXRlZC0tO1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBDaGVjayBrZXkgaXMgbnVsbCBpbiBjYXNlIGl0ZXJhdG9yIGlzbid0IGV4aGF1c3RlZFxuICAgICAgICAgICAgLy8gYW5kIGRvbmUgcmVzb2x2ZWQgc3luY2hyb25vdXNseS5cbiAgICAgICAgICAgIGVsc2UgaWYgKGtleSA9PT0gbnVsbCAmJiBjb21wbGV0ZWQgPD0gMCkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGFzeW5jLmZvckVhY2hPZlNlcmllcyA9XG4gICAgYXN5bmMuZWFjaE9mU2VyaWVzID0gZnVuY3Rpb24gKG9iaiwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gX29uY2UoY2FsbGJhY2sgfHwgbm9vcCk7XG4gICAgICAgIG9iaiA9IG9iaiB8fCBbXTtcbiAgICAgICAgdmFyIG5leHRLZXkgPSBfa2V5SXRlcmF0b3Iob2JqKTtcbiAgICAgICAgdmFyIGtleSA9IG5leHRLZXkoKTtcbiAgICAgICAgZnVuY3Rpb24gaXRlcmF0ZSgpIHtcbiAgICAgICAgICAgIHZhciBzeW5jID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChrZXkgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpdGVyYXRvcihvYmpba2V5XSwga2V5LCBvbmx5X29uY2UoZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGtleSA9IG5leHRLZXkoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN5bmMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUoaXRlcmF0ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZXJhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIHN5bmMgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpdGVyYXRlKCk7XG4gICAgfTtcblxuXG5cbiAgICBhc3luYy5mb3JFYWNoT2ZMaW1pdCA9XG4gICAgYXN5bmMuZWFjaE9mTGltaXQgPSBmdW5jdGlvbiAob2JqLCBsaW1pdCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIF9lYWNoT2ZMaW1pdChsaW1pdCkob2JqLCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBfZWFjaE9mTGltaXQobGltaXQpIHtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9iaiwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IF9vbmNlKGNhbGxiYWNrIHx8IG5vb3ApO1xuICAgICAgICAgICAgb2JqID0gb2JqIHx8IFtdO1xuICAgICAgICAgICAgdmFyIG5leHRLZXkgPSBfa2V5SXRlcmF0b3Iob2JqKTtcbiAgICAgICAgICAgIGlmIChsaW1pdCA8PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGRvbmUgPSBmYWxzZTtcbiAgICAgICAgICAgIHZhciBydW5uaW5nID0gMDtcbiAgICAgICAgICAgIHZhciBlcnJvcmVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgIChmdW5jdGlvbiByZXBsZW5pc2ggKCkge1xuICAgICAgICAgICAgICAgIGlmIChkb25lICYmIHJ1bm5pbmcgPD0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgd2hpbGUgKHJ1bm5pbmcgPCBsaW1pdCAmJiAhZXJyb3JlZCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIga2V5ID0gbmV4dEtleSgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb25lID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChydW5uaW5nIDw9IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBydW5uaW5nICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIGl0ZXJhdG9yKG9ialtrZXldLCBrZXksIG9ubHlfb25jZShmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBydW5uaW5nIC09IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcGxlbmlzaCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkoKTtcbiAgICAgICAgfTtcbiAgICB9XG5cblxuICAgIGZ1bmN0aW9uIGRvUGFyYWxsZWwoZm4pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChvYmosIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGZuKGFzeW5jLmVhY2hPZiwgb2JqLCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBkb1BhcmFsbGVsTGltaXQoZm4pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChvYmosIGxpbWl0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHJldHVybiBmbihfZWFjaE9mTGltaXQobGltaXQpLCBvYmosIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGRvU2VyaWVzKGZuKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAob2JqLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHJldHVybiBmbihhc3luYy5lYWNoT2ZTZXJpZXMsIG9iaiwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfYXN5bmNNYXAoZWFjaGZuLCBhcnIsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IF9vbmNlKGNhbGxiYWNrIHx8IG5vb3ApO1xuICAgICAgICBhcnIgPSBhcnIgfHwgW107XG4gICAgICAgIHZhciByZXN1bHRzID0gX2lzQXJyYXlMaWtlKGFycikgPyBbXSA6IHt9O1xuICAgICAgICBlYWNoZm4oYXJyLCBmdW5jdGlvbiAodmFsdWUsIGluZGV4LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgaXRlcmF0b3IodmFsdWUsIGZ1bmN0aW9uIChlcnIsIHYpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzW2luZGV4XSA9IHY7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnIsIHJlc3VsdHMpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYy5tYXAgPSBkb1BhcmFsbGVsKF9hc3luY01hcCk7XG4gICAgYXN5bmMubWFwU2VyaWVzID0gZG9TZXJpZXMoX2FzeW5jTWFwKTtcbiAgICBhc3luYy5tYXBMaW1pdCA9IGRvUGFyYWxsZWxMaW1pdChfYXN5bmNNYXApO1xuXG4gICAgLy8gcmVkdWNlIG9ubHkgaGFzIGEgc2VyaWVzIHZlcnNpb24sIGFzIGRvaW5nIHJlZHVjZSBpbiBwYXJhbGxlbCB3b24ndFxuICAgIC8vIHdvcmsgaW4gbWFueSBzaXR1YXRpb25zLlxuICAgIGFzeW5jLmluamVjdCA9XG4gICAgYXN5bmMuZm9sZGwgPVxuICAgIGFzeW5jLnJlZHVjZSA9IGZ1bmN0aW9uIChhcnIsIG1lbW8sIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBhc3luYy5lYWNoT2ZTZXJpZXMoYXJyLCBmdW5jdGlvbiAoeCwgaSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKG1lbW8sIHgsIGZ1bmN0aW9uIChlcnIsIHYpIHtcbiAgICAgICAgICAgICAgICBtZW1vID0gdjtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgbWVtbyk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBhc3luYy5mb2xkciA9XG4gICAgYXN5bmMucmVkdWNlUmlnaHQgPSBmdW5jdGlvbiAoYXJyLCBtZW1vLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHJldmVyc2VkID0gX21hcChhcnIsIGlkZW50aXR5KS5yZXZlcnNlKCk7XG4gICAgICAgIGFzeW5jLnJlZHVjZShyZXZlcnNlZCwgbWVtbywgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMudHJhbnNmb3JtID0gZnVuY3Rpb24gKGFyciwgbWVtbywgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAzKSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IGl0ZXJhdG9yO1xuICAgICAgICAgICAgaXRlcmF0b3IgPSBtZW1vO1xuICAgICAgICAgICAgbWVtbyA9IF9pc0FycmF5KGFycikgPyBbXSA6IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgYXN5bmMuZWFjaE9mKGFyciwgZnVuY3Rpb24odiwgaywgY2IpIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKG1lbW8sIHYsIGssIGNiKTtcbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnIsIG1lbW8pO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gX2ZpbHRlcihlYWNoZm4sIGFyciwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciByZXN1bHRzID0gW107XG4gICAgICAgIGVhY2hmbihhcnIsIGZ1bmN0aW9uICh4LCBpbmRleCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKHgsIGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgaWYgKHYpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHtpbmRleDogaW5kZXgsIHZhbHVlOiB4fSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2FsbGJhY2soX21hcChyZXN1bHRzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYS5pbmRleCAtIGIuaW5kZXg7XG4gICAgICAgICAgICB9KSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geC52YWx1ZTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMuc2VsZWN0ID1cbiAgICBhc3luYy5maWx0ZXIgPSBkb1BhcmFsbGVsKF9maWx0ZXIpO1xuXG4gICAgYXN5bmMuc2VsZWN0TGltaXQgPVxuICAgIGFzeW5jLmZpbHRlckxpbWl0ID0gZG9QYXJhbGxlbExpbWl0KF9maWx0ZXIpO1xuXG4gICAgYXN5bmMuc2VsZWN0U2VyaWVzID1cbiAgICBhc3luYy5maWx0ZXJTZXJpZXMgPSBkb1NlcmllcyhfZmlsdGVyKTtcblxuICAgIGZ1bmN0aW9uIF9yZWplY3QoZWFjaGZuLCBhcnIsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBfZmlsdGVyKGVhY2hmbiwgYXJyLCBmdW5jdGlvbih2YWx1ZSwgY2IpIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKHZhbHVlLCBmdW5jdGlvbih2KSB7XG4gICAgICAgICAgICAgICAgY2IoIXYpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGNhbGxiYWNrKTtcbiAgICB9XG4gICAgYXN5bmMucmVqZWN0ID0gZG9QYXJhbGxlbChfcmVqZWN0KTtcbiAgICBhc3luYy5yZWplY3RMaW1pdCA9IGRvUGFyYWxsZWxMaW1pdChfcmVqZWN0KTtcbiAgICBhc3luYy5yZWplY3RTZXJpZXMgPSBkb1NlcmllcyhfcmVqZWN0KTtcblxuICAgIGZ1bmN0aW9uIF9jcmVhdGVUZXN0ZXIoZWFjaGZuLCBjaGVjaywgZ2V0UmVzdWx0KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihhcnIsIGxpbWl0LCBpdGVyYXRvciwgY2IpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGRvbmUoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNiKSBjYihnZXRSZXN1bHQoZmFsc2UsIHZvaWQgMCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnVuY3Rpb24gaXRlcmF0ZWUoeCwgXywgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBpZiAoIWNiKSByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICBpdGVyYXRvcih4LCBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2IgJiYgY2hlY2sodikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNiKGdldFJlc3VsdCh0cnVlLCB4KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYiA9IGl0ZXJhdG9yID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMykge1xuICAgICAgICAgICAgICAgIGVhY2hmbihhcnIsIGxpbWl0LCBpdGVyYXRlZSwgZG9uZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNiID0gaXRlcmF0b3I7XG4gICAgICAgICAgICAgICAgaXRlcmF0b3IgPSBsaW1pdDtcbiAgICAgICAgICAgICAgICBlYWNoZm4oYXJyLCBpdGVyYXRlZSwgZG9uZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYXN5bmMuYW55ID1cbiAgICBhc3luYy5zb21lID0gX2NyZWF0ZVRlc3Rlcihhc3luYy5lYWNoT2YsIHRvQm9vbCwgaWRlbnRpdHkpO1xuXG4gICAgYXN5bmMuc29tZUxpbWl0ID0gX2NyZWF0ZVRlc3Rlcihhc3luYy5lYWNoT2ZMaW1pdCwgdG9Cb29sLCBpZGVudGl0eSk7XG5cbiAgICBhc3luYy5hbGwgPVxuICAgIGFzeW5jLmV2ZXJ5ID0gX2NyZWF0ZVRlc3Rlcihhc3luYy5lYWNoT2YsIG5vdElkLCBub3RJZCk7XG5cbiAgICBhc3luYy5ldmVyeUxpbWl0ID0gX2NyZWF0ZVRlc3Rlcihhc3luYy5lYWNoT2ZMaW1pdCwgbm90SWQsIG5vdElkKTtcblxuICAgIGZ1bmN0aW9uIF9maW5kR2V0UmVzdWx0KHYsIHgpIHtcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICAgIGFzeW5jLmRldGVjdCA9IF9jcmVhdGVUZXN0ZXIoYXN5bmMuZWFjaE9mLCBpZGVudGl0eSwgX2ZpbmRHZXRSZXN1bHQpO1xuICAgIGFzeW5jLmRldGVjdFNlcmllcyA9IF9jcmVhdGVUZXN0ZXIoYXN5bmMuZWFjaE9mU2VyaWVzLCBpZGVudGl0eSwgX2ZpbmRHZXRSZXN1bHQpO1xuICAgIGFzeW5jLmRldGVjdExpbWl0ID0gX2NyZWF0ZVRlc3Rlcihhc3luYy5lYWNoT2ZMaW1pdCwgaWRlbnRpdHksIF9maW5kR2V0UmVzdWx0KTtcblxuICAgIGFzeW5jLnNvcnRCeSA9IGZ1bmN0aW9uIChhcnIsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBhc3luYy5tYXAoYXJyLCBmdW5jdGlvbiAoeCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKHgsIGZ1bmN0aW9uIChlcnIsIGNyaXRlcmlhKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwge3ZhbHVlOiB4LCBjcml0ZXJpYTogY3JpdGVyaWF9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVyciwgcmVzdWx0cykge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgX21hcChyZXN1bHRzLnNvcnQoY29tcGFyYXRvciksIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB4LnZhbHVlO1xuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcblxuICAgICAgICBmdW5jdGlvbiBjb21wYXJhdG9yKGxlZnQsIHJpZ2h0KSB7XG4gICAgICAgICAgICB2YXIgYSA9IGxlZnQuY3JpdGVyaWEsIGIgPSByaWdodC5jcml0ZXJpYTtcbiAgICAgICAgICAgIHJldHVybiBhIDwgYiA/IC0xIDogYSA+IGIgPyAxIDogMDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBhc3luYy5hdXRvID0gZnVuY3Rpb24gKHRhc2tzLCBjb25jdXJyZW5jeSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBhcmd1bWVudHNbMV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIC8vIGNvbmN1cnJlbmN5IGlzIG9wdGlvbmFsLCBzaGlmdCB0aGUgYXJncy5cbiAgICAgICAgICAgIGNhbGxiYWNrID0gY29uY3VycmVuY3k7XG4gICAgICAgICAgICBjb25jdXJyZW5jeSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY2FsbGJhY2sgPSBfb25jZShjYWxsYmFjayB8fCBub29wKTtcbiAgICAgICAgdmFyIGtleXMgPSBfa2V5cyh0YXNrcyk7XG4gICAgICAgIHZhciByZW1haW5pbmdUYXNrcyA9IGtleXMubGVuZ3RoO1xuICAgICAgICBpZiAoIXJlbWFpbmluZ1Rhc2tzKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFjb25jdXJyZW5jeSkge1xuICAgICAgICAgICAgY29uY3VycmVuY3kgPSByZW1haW5pbmdUYXNrcztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZXN1bHRzID0ge307XG4gICAgICAgIHZhciBydW5uaW5nVGFza3MgPSAwO1xuXG4gICAgICAgIHZhciBoYXNFcnJvciA9IGZhbHNlO1xuXG4gICAgICAgIHZhciBsaXN0ZW5lcnMgPSBbXTtcbiAgICAgICAgZnVuY3Rpb24gYWRkTGlzdGVuZXIoZm4pIHtcbiAgICAgICAgICAgIGxpc3RlbmVycy51bnNoaWZ0KGZuKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihmbikge1xuICAgICAgICAgICAgdmFyIGlkeCA9IF9pbmRleE9mKGxpc3RlbmVycywgZm4pO1xuICAgICAgICAgICAgaWYgKGlkeCA+PSAwKSBsaXN0ZW5lcnMuc3BsaWNlKGlkeCwgMSk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gdGFza0NvbXBsZXRlKCkge1xuICAgICAgICAgICAgcmVtYWluaW5nVGFza3MtLTtcbiAgICAgICAgICAgIF9hcnJheUVhY2gobGlzdGVuZXJzLnNsaWNlKDApLCBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBhZGRMaXN0ZW5lcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoIXJlbWFpbmluZ1Rhc2tzKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdWx0cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIF9hcnJheUVhY2goa2V5cywgZnVuY3Rpb24gKGspIHtcbiAgICAgICAgICAgIGlmIChoYXNFcnJvcikgcmV0dXJuO1xuICAgICAgICAgICAgdmFyIHRhc2sgPSBfaXNBcnJheSh0YXNrc1trXSkgPyB0YXNrc1trXTogW3Rhc2tzW2tdXTtcbiAgICAgICAgICAgIHZhciB0YXNrQ2FsbGJhY2sgPSBfcmVzdFBhcmFtKGZ1bmN0aW9uKGVyciwgYXJncykge1xuICAgICAgICAgICAgICAgIHJ1bm5pbmdUYXNrcy0tO1xuICAgICAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA8PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzYWZlUmVzdWx0cyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBfZm9yRWFjaE9mKHJlc3VsdHMsIGZ1bmN0aW9uKHZhbCwgcmtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2FmZVJlc3VsdHNbcmtleV0gPSB2YWw7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzYWZlUmVzdWx0c1trXSA9IGFyZ3M7XG4gICAgICAgICAgICAgICAgICAgIGhhc0Vycm9yID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIsIHNhZmVSZXN1bHRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHNba10gPSBhcmdzO1xuICAgICAgICAgICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUodGFza0NvbXBsZXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciByZXF1aXJlcyA9IHRhc2suc2xpY2UoMCwgdGFzay5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgIC8vIHByZXZlbnQgZGVhZC1sb2Nrc1xuICAgICAgICAgICAgdmFyIGxlbiA9IHJlcXVpcmVzLmxlbmd0aDtcbiAgICAgICAgICAgIHZhciBkZXA7XG4gICAgICAgICAgICB3aGlsZSAobGVuLS0pIHtcbiAgICAgICAgICAgICAgICBpZiAoIShkZXAgPSB0YXNrc1tyZXF1aXJlc1tsZW5dXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdIYXMgaW5leGlzdGFudCBkZXBlbmRlbmN5Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChfaXNBcnJheShkZXApICYmIF9pbmRleE9mKGRlcCwgaykgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0hhcyBjeWNsaWMgZGVwZW5kZW5jaWVzJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnVuY3Rpb24gcmVhZHkoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bm5pbmdUYXNrcyA8IGNvbmN1cnJlbmN5ICYmIF9yZWR1Y2UocmVxdWlyZXMsIGZ1bmN0aW9uIChhLCB4KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoYSAmJiByZXN1bHRzLmhhc093blByb3BlcnR5KHgpKTtcbiAgICAgICAgICAgICAgICB9LCB0cnVlKSAmJiAhcmVzdWx0cy5oYXNPd25Qcm9wZXJ0eShrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZWFkeSgpKSB7XG4gICAgICAgICAgICAgICAgcnVubmluZ1Rhc2tzKys7XG4gICAgICAgICAgICAgICAgdGFza1t0YXNrLmxlbmd0aCAtIDFdKHRhc2tDYWxsYmFjaywgcmVzdWx0cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBhZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmdW5jdGlvbiBsaXN0ZW5lcigpIHtcbiAgICAgICAgICAgICAgICBpZiAocmVhZHkoKSkge1xuICAgICAgICAgICAgICAgICAgICBydW5uaW5nVGFza3MrKztcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgICAgICB0YXNrW3Rhc2subGVuZ3RoIC0gMV0odGFza0NhbGxiYWNrLCByZXN1bHRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cblxuXG4gICAgYXN5bmMucmV0cnkgPSBmdW5jdGlvbih0aW1lcywgdGFzaywgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIERFRkFVTFRfVElNRVMgPSA1O1xuICAgICAgICB2YXIgREVGQVVMVF9JTlRFUlZBTCA9IDA7XG5cbiAgICAgICAgdmFyIGF0dGVtcHRzID0gW107XG5cbiAgICAgICAgdmFyIG9wdHMgPSB7XG4gICAgICAgICAgICB0aW1lczogREVGQVVMVF9USU1FUyxcbiAgICAgICAgICAgIGludGVydmFsOiBERUZBVUxUX0lOVEVSVkFMXG4gICAgICAgIH07XG5cbiAgICAgICAgZnVuY3Rpb24gcGFyc2VUaW1lcyhhY2MsIHQpe1xuICAgICAgICAgICAgaWYodHlwZW9mIHQgPT09ICdudW1iZXInKXtcbiAgICAgICAgICAgICAgICBhY2MudGltZXMgPSBwYXJzZUludCh0LCAxMCkgfHwgREVGQVVMVF9USU1FUztcbiAgICAgICAgICAgIH0gZWxzZSBpZih0eXBlb2YgdCA9PT0gJ29iamVjdCcpe1xuICAgICAgICAgICAgICAgIGFjYy50aW1lcyA9IHBhcnNlSW50KHQudGltZXMsIDEwKSB8fCBERUZBVUxUX1RJTUVTO1xuICAgICAgICAgICAgICAgIGFjYy5pbnRlcnZhbCA9IHBhcnNlSW50KHQuaW50ZXJ2YWwsIDEwKSB8fCBERUZBVUxUX0lOVEVSVkFMO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vuc3VwcG9ydGVkIGFyZ3VtZW50IHR5cGUgZm9yIFxcJ3RpbWVzXFwnOiAnICsgdHlwZW9mIHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIGlmIChsZW5ndGggPCAxIHx8IGxlbmd0aCA+IDMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBhcmd1bWVudHMgLSBtdXN0IGJlIGVpdGhlciAodGFzayksICh0YXNrLCBjYWxsYmFjayksICh0aW1lcywgdGFzaykgb3IgKHRpbWVzLCB0YXNrLCBjYWxsYmFjayknKTtcbiAgICAgICAgfSBlbHNlIGlmIChsZW5ndGggPD0gMiAmJiB0eXBlb2YgdGltZXMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gdGFzaztcbiAgICAgICAgICAgIHRhc2sgPSB0aW1lcztcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHRpbWVzICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBwYXJzZVRpbWVzKG9wdHMsIHRpbWVzKTtcbiAgICAgICAgfVxuICAgICAgICBvcHRzLmNhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgICAgIG9wdHMudGFzayA9IHRhc2s7XG5cbiAgICAgICAgZnVuY3Rpb24gd3JhcHBlZFRhc2sod3JhcHBlZENhbGxiYWNrLCB3cmFwcGVkUmVzdWx0cykge1xuICAgICAgICAgICAgZnVuY3Rpb24gcmV0cnlBdHRlbXB0KHRhc2ssIGZpbmFsQXR0ZW1wdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbihzZXJpZXNDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICB0YXNrKGZ1bmN0aW9uKGVyciwgcmVzdWx0KXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcmllc0NhbGxiYWNrKCFlcnIgfHwgZmluYWxBdHRlbXB0LCB7ZXJyOiBlcnIsIHJlc3VsdDogcmVzdWx0fSk7XG4gICAgICAgICAgICAgICAgICAgIH0sIHdyYXBwZWRSZXN1bHRzKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiByZXRyeUludGVydmFsKGludGVydmFsKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oc2VyaWVzQ2FsbGJhY2spe1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJpZXNDYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgaW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHdoaWxlIChvcHRzLnRpbWVzKSB7XG5cbiAgICAgICAgICAgICAgICB2YXIgZmluYWxBdHRlbXB0ID0gIShvcHRzLnRpbWVzLT0xKTtcbiAgICAgICAgICAgICAgICBhdHRlbXB0cy5wdXNoKHJldHJ5QXR0ZW1wdChvcHRzLnRhc2ssIGZpbmFsQXR0ZW1wdCkpO1xuICAgICAgICAgICAgICAgIGlmKCFmaW5hbEF0dGVtcHQgJiYgb3B0cy5pbnRlcnZhbCA+IDApe1xuICAgICAgICAgICAgICAgICAgICBhdHRlbXB0cy5wdXNoKHJldHJ5SW50ZXJ2YWwob3B0cy5pbnRlcnZhbCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXN5bmMuc2VyaWVzKGF0dGVtcHRzLCBmdW5jdGlvbihkb25lLCBkYXRhKXtcbiAgICAgICAgICAgICAgICBkYXRhID0gZGF0YVtkYXRhLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgICh3cmFwcGVkQ2FsbGJhY2sgfHwgb3B0cy5jYWxsYmFjaykoZGF0YS5lcnIsIGRhdGEucmVzdWx0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgYSBjYWxsYmFjayBpcyBwYXNzZWQsIHJ1biB0aGlzIGFzIGEgY29udHJvbGwgZmxvd1xuICAgICAgICByZXR1cm4gb3B0cy5jYWxsYmFjayA/IHdyYXBwZWRUYXNrKCkgOiB3cmFwcGVkVGFzaztcbiAgICB9O1xuXG4gICAgYXN5bmMud2F0ZXJmYWxsID0gZnVuY3Rpb24gKHRhc2tzLCBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IF9vbmNlKGNhbGxiYWNrIHx8IG5vb3ApO1xuICAgICAgICBpZiAoIV9pc0FycmF5KHRhc2tzKSkge1xuICAgICAgICAgICAgdmFyIGVyciA9IG5ldyBFcnJvcignRmlyc3QgYXJndW1lbnQgdG8gd2F0ZXJmYWxsIG11c3QgYmUgYW4gYXJyYXkgb2YgZnVuY3Rpb25zJyk7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRhc2tzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gd3JhcEl0ZXJhdG9yKGl0ZXJhdG9yKSB7XG4gICAgICAgICAgICByZXR1cm4gX3Jlc3RQYXJhbShmdW5jdGlvbiAoZXJyLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseShudWxsLCBbZXJyXS5jb25jYXQoYXJncykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5leHQgPSBpdGVyYXRvci5uZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzLnB1c2god3JhcEl0ZXJhdG9yKG5leHQpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MucHVzaChjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZW5zdXJlQXN5bmMoaXRlcmF0b3IpLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHdyYXBJdGVyYXRvcihhc3luYy5pdGVyYXRvcih0YXNrcykpKCk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIF9wYXJhbGxlbChlYWNoZm4sIHRhc2tzLCBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IGNhbGxiYWNrIHx8IG5vb3A7XG4gICAgICAgIHZhciByZXN1bHRzID0gX2lzQXJyYXlMaWtlKHRhc2tzKSA/IFtdIDoge307XG5cbiAgICAgICAgZWFjaGZuKHRhc2tzLCBmdW5jdGlvbiAodGFzaywga2V5LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgdGFzayhfcmVzdFBhcmFtKGZ1bmN0aW9uIChlcnIsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5sZW5ndGggPD0gMSkge1xuICAgICAgICAgICAgICAgICAgICBhcmdzID0gYXJnc1swXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzdWx0c1trZXldID0gYXJncztcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnIsIHJlc3VsdHMpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYy5wYXJhbGxlbCA9IGZ1bmN0aW9uICh0YXNrcywgY2FsbGJhY2spIHtcbiAgICAgICAgX3BhcmFsbGVsKGFzeW5jLmVhY2hPZiwgdGFza3MsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMucGFyYWxsZWxMaW1pdCA9IGZ1bmN0aW9uKHRhc2tzLCBsaW1pdCwgY2FsbGJhY2spIHtcbiAgICAgICAgX3BhcmFsbGVsKF9lYWNoT2ZMaW1pdChsaW1pdCksIHRhc2tzLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLnNlcmllcyA9IGZ1bmN0aW9uKHRhc2tzLCBjYWxsYmFjaykge1xuICAgICAgICBfcGFyYWxsZWwoYXN5bmMuZWFjaE9mU2VyaWVzLCB0YXNrcywgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy5pdGVyYXRvciA9IGZ1bmN0aW9uICh0YXNrcykge1xuICAgICAgICBmdW5jdGlvbiBtYWtlQ2FsbGJhY2soaW5kZXgpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGZuKCkge1xuICAgICAgICAgICAgICAgIGlmICh0YXNrcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGFza3NbaW5kZXhdLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmbi5uZXh0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmbi5uZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoaW5kZXggPCB0YXNrcy5sZW5ndGggLSAxKSA/IG1ha2VDYWxsYmFjayhpbmRleCArIDEpOiBudWxsO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBmbjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWFrZUNhbGxiYWNrKDApO1xuICAgIH07XG5cbiAgICBhc3luYy5hcHBseSA9IF9yZXN0UGFyYW0oZnVuY3Rpb24gKGZuLCBhcmdzKSB7XG4gICAgICAgIHJldHVybiBfcmVzdFBhcmFtKGZ1bmN0aW9uIChjYWxsQXJncykge1xuICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KFxuICAgICAgICAgICAgICAgIG51bGwsIGFyZ3MuY29uY2F0KGNhbGxBcmdzKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBfY29uY2F0KGVhY2hmbiwgYXJyLCBmbiwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICBlYWNoZm4oYXJyLCBmdW5jdGlvbiAoeCwgaW5kZXgsIGNiKSB7XG4gICAgICAgICAgICBmbih4LCBmdW5jdGlvbiAoZXJyLCB5KSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdCh5IHx8IFtdKTtcbiAgICAgICAgICAgICAgICBjYihlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgcmVzdWx0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jLmNvbmNhdCA9IGRvUGFyYWxsZWwoX2NvbmNhdCk7XG4gICAgYXN5bmMuY29uY2F0U2VyaWVzID0gZG9TZXJpZXMoX2NvbmNhdCk7XG5cbiAgICBhc3luYy53aGlsc3QgPSBmdW5jdGlvbiAodGVzdCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgbm9vcDtcbiAgICAgICAgaWYgKHRlc3QoKSkge1xuICAgICAgICAgICAgdmFyIG5leHQgPSBfcmVzdFBhcmFtKGZ1bmN0aW9uKGVyciwgYXJncykge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRlc3QuYXBwbHkodGhpcywgYXJncykpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlcmF0b3IobmV4dCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgW251bGxdLmNvbmNhdChhcmdzKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpdGVyYXRvcihuZXh0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGFzeW5jLmRvV2hpbHN0ID0gZnVuY3Rpb24gKGl0ZXJhdG9yLCB0ZXN0LCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgY2FsbHMgPSAwO1xuICAgICAgICByZXR1cm4gYXN5bmMud2hpbHN0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuICsrY2FsbHMgPD0gMSB8fCB0ZXN0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0sIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLnVudGlsID0gZnVuY3Rpb24gKHRlc3QsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gYXN5bmMud2hpbHN0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuICF0ZXN0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0sIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLmRvVW50aWwgPSBmdW5jdGlvbiAoaXRlcmF0b3IsIHRlc3QsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiBhc3luYy5kb1doaWxzdChpdGVyYXRvciwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gIXRlc3QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfSwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy5kdXJpbmcgPSBmdW5jdGlvbiAodGVzdCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgbm9vcDtcblxuICAgICAgICB2YXIgbmV4dCA9IF9yZXN0UGFyYW0oZnVuY3Rpb24oZXJyLCBhcmdzKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXJncy5wdXNoKGNoZWNrKTtcbiAgICAgICAgICAgICAgICB0ZXN0LmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgY2hlY2sgPSBmdW5jdGlvbihlcnIsIHRydXRoKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHJ1dGgpIHtcbiAgICAgICAgICAgICAgICBpdGVyYXRvcihuZXh0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdGVzdChjaGVjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLmRvRHVyaW5nID0gZnVuY3Rpb24gKGl0ZXJhdG9yLCB0ZXN0LCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgY2FsbHMgPSAwO1xuICAgICAgICBhc3luYy5kdXJpbmcoZnVuY3Rpb24obmV4dCkge1xuICAgICAgICAgICAgaWYgKGNhbGxzKysgPCAxKSB7XG4gICAgICAgICAgICAgICAgbmV4dChudWxsLCB0cnVlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGVzdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBfcXVldWUod29ya2VyLCBjb25jdXJyZW5jeSwgcGF5bG9hZCkge1xuICAgICAgICBpZiAoY29uY3VycmVuY3kgPT0gbnVsbCkge1xuICAgICAgICAgICAgY29uY3VycmVuY3kgPSAxO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYoY29uY3VycmVuY3kgPT09IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ29uY3VycmVuY3kgbXVzdCBub3QgYmUgemVybycpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIF9pbnNlcnQocSwgZGF0YSwgcG9zLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrICE9IG51bGwgJiYgdHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ0YXNrIGNhbGxiYWNrIG11c3QgYmUgYSBmdW5jdGlvblwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHEuc3RhcnRlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAoIV9pc0FycmF5KGRhdGEpKSB7XG4gICAgICAgICAgICAgICAgZGF0YSA9IFtkYXRhXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGRhdGEubGVuZ3RoID09PSAwICYmIHEuaWRsZSgpKSB7XG4gICAgICAgICAgICAgICAgLy8gY2FsbCBkcmFpbiBpbW1lZGlhdGVseSBpZiB0aGVyZSBhcmUgbm8gdGFza3NcbiAgICAgICAgICAgICAgICByZXR1cm4gYXN5bmMuc2V0SW1tZWRpYXRlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBxLmRyYWluKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfYXJyYXlFYWNoKGRhdGEsIGZ1bmN0aW9uKHRhc2spIHtcbiAgICAgICAgICAgICAgICB2YXIgaXRlbSA9IHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogdGFzayxcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrIHx8IG5vb3BcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgaWYgKHBvcykge1xuICAgICAgICAgICAgICAgICAgICBxLnRhc2tzLnVuc2hpZnQoaXRlbSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcS50YXNrcy5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChxLnRhc2tzLmxlbmd0aCA9PT0gcS5jb25jdXJyZW5jeSkge1xuICAgICAgICAgICAgICAgICAgICBxLnNhdHVyYXRlZCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYXN5bmMuc2V0SW1tZWRpYXRlKHEucHJvY2Vzcyk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gX25leHQocSwgdGFza3MpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHdvcmtlcnMgLT0gMTtcblxuICAgICAgICAgICAgICAgIHZhciByZW1vdmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICAgICAgICAgICAgX2FycmF5RWFjaCh0YXNrcywgZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgICAgICAgICAgICAgX2FycmF5RWFjaCh3b3JrZXJzTGlzdCwgZnVuY3Rpb24gKHdvcmtlciwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3b3JrZXIgPT09IHRhc2sgJiYgIXJlbW92ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3b3JrZXJzTGlzdC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICB0YXNrLmNhbGxiYWNrLmFwcGx5KHRhc2ssIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmIChxLnRhc2tzLmxlbmd0aCArIHdvcmtlcnMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcS5kcmFpbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBxLnByb2Nlc3MoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgd29ya2VycyA9IDA7XG4gICAgICAgIHZhciB3b3JrZXJzTGlzdCA9IFtdO1xuICAgICAgICB2YXIgcSA9IHtcbiAgICAgICAgICAgIHRhc2tzOiBbXSxcbiAgICAgICAgICAgIGNvbmN1cnJlbmN5OiBjb25jdXJyZW5jeSxcbiAgICAgICAgICAgIHBheWxvYWQ6IHBheWxvYWQsXG4gICAgICAgICAgICBzYXR1cmF0ZWQ6IG5vb3AsXG4gICAgICAgICAgICBlbXB0eTogbm9vcCxcbiAgICAgICAgICAgIGRyYWluOiBub29wLFxuICAgICAgICAgICAgc3RhcnRlZDogZmFsc2UsXG4gICAgICAgICAgICBwYXVzZWQ6IGZhbHNlLFxuICAgICAgICAgICAgcHVzaDogZnVuY3Rpb24gKGRhdGEsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgX2luc2VydChxLCBkYXRhLCBmYWxzZSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGtpbGw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBxLmRyYWluID0gbm9vcDtcbiAgICAgICAgICAgICAgICBxLnRhc2tzID0gW107XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdW5zaGlmdDogZnVuY3Rpb24gKGRhdGEsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgX2luc2VydChxLCBkYXRhLCB0cnVlLCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJvY2VzczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHdoaWxlKCFxLnBhdXNlZCAmJiB3b3JrZXJzIDwgcS5jb25jdXJyZW5jeSAmJiBxLnRhc2tzLmxlbmd0aCl7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhc2tzID0gcS5wYXlsb2FkID9cbiAgICAgICAgICAgICAgICAgICAgICAgIHEudGFza3Muc3BsaWNlKDAsIHEucGF5bG9hZCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgcS50YXNrcy5zcGxpY2UoMCwgcS50YXNrcy5sZW5ndGgpO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRhID0gX21hcCh0YXNrcywgZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0YXNrLmRhdGE7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChxLnRhc2tzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcS5lbXB0eSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHdvcmtlcnMgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgd29ya2Vyc0xpc3QucHVzaCh0YXNrc1swXSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjYiA9IG9ubHlfb25jZShfbmV4dChxLCB0YXNrcykpO1xuICAgICAgICAgICAgICAgICAgICB3b3JrZXIoZGF0YSwgY2IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsZW5ndGg6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcS50YXNrcy5sZW5ndGg7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcnVubmluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB3b3JrZXJzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHdvcmtlcnNMaXN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHdvcmtlcnNMaXN0O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlkbGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBxLnRhc2tzLmxlbmd0aCArIHdvcmtlcnMgPT09IDA7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcGF1c2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBxLnBhdXNlZCA9IHRydWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzdW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHEucGF1c2VkID09PSBmYWxzZSkgeyByZXR1cm47IH1cbiAgICAgICAgICAgICAgICBxLnBhdXNlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHZhciByZXN1bWVDb3VudCA9IE1hdGgubWluKHEuY29uY3VycmVuY3ksIHEudGFza3MubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAvLyBOZWVkIHRvIGNhbGwgcS5wcm9jZXNzIG9uY2UgcGVyIGNvbmN1cnJlbnRcbiAgICAgICAgICAgICAgICAvLyB3b3JrZXIgdG8gcHJlc2VydmUgZnVsbCBjb25jdXJyZW5jeSBhZnRlciBwYXVzZVxuICAgICAgICAgICAgICAgIGZvciAodmFyIHcgPSAxOyB3IDw9IHJlc3VtZUNvdW50OyB3KyspIHtcbiAgICAgICAgICAgICAgICAgICAgYXN5bmMuc2V0SW1tZWRpYXRlKHEucHJvY2Vzcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gcTtcbiAgICB9XG5cbiAgICBhc3luYy5xdWV1ZSA9IGZ1bmN0aW9uICh3b3JrZXIsIGNvbmN1cnJlbmN5KSB7XG4gICAgICAgIHZhciBxID0gX3F1ZXVlKGZ1bmN0aW9uIChpdGVtcywgY2IpIHtcbiAgICAgICAgICAgIHdvcmtlcihpdGVtc1swXSwgY2IpO1xuICAgICAgICB9LCBjb25jdXJyZW5jeSwgMSk7XG5cbiAgICAgICAgcmV0dXJuIHE7XG4gICAgfTtcblxuICAgIGFzeW5jLnByaW9yaXR5UXVldWUgPSBmdW5jdGlvbiAod29ya2VyLCBjb25jdXJyZW5jeSkge1xuXG4gICAgICAgIGZ1bmN0aW9uIF9jb21wYXJlVGFza3MoYSwgYil7XG4gICAgICAgICAgICByZXR1cm4gYS5wcmlvcml0eSAtIGIucHJpb3JpdHk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBfYmluYXJ5U2VhcmNoKHNlcXVlbmNlLCBpdGVtLCBjb21wYXJlKSB7XG4gICAgICAgICAgICB2YXIgYmVnID0gLTEsXG4gICAgICAgICAgICAgICAgZW5kID0gc2VxdWVuY2UubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIHdoaWxlIChiZWcgPCBlbmQpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWlkID0gYmVnICsgKChlbmQgLSBiZWcgKyAxKSA+Pj4gMSk7XG4gICAgICAgICAgICAgICAgaWYgKGNvbXBhcmUoaXRlbSwgc2VxdWVuY2VbbWlkXSkgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICBiZWcgPSBtaWQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZW5kID0gbWlkIC0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYmVnO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gX2luc2VydChxLCBkYXRhLCBwcmlvcml0eSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjayAhPSBudWxsICYmIHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidGFzayBjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb25cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBxLnN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKCFfaXNBcnJheShkYXRhKSkge1xuICAgICAgICAgICAgICAgIGRhdGEgPSBbZGF0YV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihkYXRhLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIC8vIGNhbGwgZHJhaW4gaW1tZWRpYXRlbHkgaWYgdGhlcmUgYXJlIG5vIHRhc2tzXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFzeW5jLnNldEltbWVkaWF0ZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgcS5kcmFpbigpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX2FycmF5RWFjaChkYXRhLCBmdW5jdGlvbih0YXNrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGl0ZW0gPSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHRhc2ssXG4gICAgICAgICAgICAgICAgICAgIHByaW9yaXR5OiBwcmlvcml0eSxcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6IHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJyA/IGNhbGxiYWNrIDogbm9vcFxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBxLnRhc2tzLnNwbGljZShfYmluYXJ5U2VhcmNoKHEudGFza3MsIGl0ZW0sIF9jb21wYXJlVGFza3MpICsgMSwgMCwgaXRlbSk7XG5cbiAgICAgICAgICAgICAgICBpZiAocS50YXNrcy5sZW5ndGggPT09IHEuY29uY3VycmVuY3kpIHtcbiAgICAgICAgICAgICAgICAgICAgcS5zYXR1cmF0ZWQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXN5bmMuc2V0SW1tZWRpYXRlKHEucHJvY2Vzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFN0YXJ0IHdpdGggYSBub3JtYWwgcXVldWVcbiAgICAgICAgdmFyIHEgPSBhc3luYy5xdWV1ZSh3b3JrZXIsIGNvbmN1cnJlbmN5KTtcblxuICAgICAgICAvLyBPdmVycmlkZSBwdXNoIHRvIGFjY2VwdCBzZWNvbmQgcGFyYW1ldGVyIHJlcHJlc2VudGluZyBwcmlvcml0eVxuICAgICAgICBxLnB1c2ggPSBmdW5jdGlvbiAoZGF0YSwgcHJpb3JpdHksIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBfaW5zZXJ0KHEsIGRhdGEsIHByaW9yaXR5LCBjYWxsYmFjayk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gUmVtb3ZlIHVuc2hpZnQgZnVuY3Rpb25cbiAgICAgICAgZGVsZXRlIHEudW5zaGlmdDtcblxuICAgICAgICByZXR1cm4gcTtcbiAgICB9O1xuXG4gICAgYXN5bmMuY2FyZ28gPSBmdW5jdGlvbiAod29ya2VyLCBwYXlsb2FkKSB7XG4gICAgICAgIHJldHVybiBfcXVldWUod29ya2VyLCAxLCBwYXlsb2FkKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gX2NvbnNvbGVfZm4obmFtZSkge1xuICAgICAgICByZXR1cm4gX3Jlc3RQYXJhbShmdW5jdGlvbiAoZm4sIGFyZ3MpIHtcbiAgICAgICAgICAgIGZuLmFwcGx5KG51bGwsIGFyZ3MuY29uY2F0KFtfcmVzdFBhcmFtKGZ1bmN0aW9uIChlcnIsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb25zb2xlLmVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGNvbnNvbGVbbmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9hcnJheUVhY2goYXJncywgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlW25hbWVdKHgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KV0pKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jLmxvZyA9IF9jb25zb2xlX2ZuKCdsb2cnKTtcbiAgICBhc3luYy5kaXIgPSBfY29uc29sZV9mbignZGlyJyk7XG4gICAgLyphc3luYy5pbmZvID0gX2NvbnNvbGVfZm4oJ2luZm8nKTtcbiAgICBhc3luYy53YXJuID0gX2NvbnNvbGVfZm4oJ3dhcm4nKTtcbiAgICBhc3luYy5lcnJvciA9IF9jb25zb2xlX2ZuKCdlcnJvcicpOyovXG5cbiAgICBhc3luYy5tZW1vaXplID0gZnVuY3Rpb24gKGZuLCBoYXNoZXIpIHtcbiAgICAgICAgdmFyIG1lbW8gPSB7fTtcbiAgICAgICAgdmFyIHF1ZXVlcyA9IHt9O1xuICAgICAgICBoYXNoZXIgPSBoYXNoZXIgfHwgaWRlbnRpdHk7XG4gICAgICAgIHZhciBtZW1vaXplZCA9IF9yZXN0UGFyYW0oZnVuY3Rpb24gbWVtb2l6ZWQoYXJncykge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gYXJncy5wb3AoKTtcbiAgICAgICAgICAgIHZhciBrZXkgPSBoYXNoZXIuYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICAgICAgICBpZiAoa2V5IGluIG1lbW8pIHtcbiAgICAgICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseShudWxsLCBtZW1vW2tleV0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5IGluIHF1ZXVlcykge1xuICAgICAgICAgICAgICAgIHF1ZXVlc1trZXldLnB1c2goY2FsbGJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcXVldWVzW2tleV0gPSBbY2FsbGJhY2tdO1xuICAgICAgICAgICAgICAgIGZuLmFwcGx5KG51bGwsIGFyZ3MuY29uY2F0KFtfcmVzdFBhcmFtKGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lbW9ba2V5XSA9IGFyZ3M7XG4gICAgICAgICAgICAgICAgICAgIHZhciBxID0gcXVldWVzW2tleV07XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBxdWV1ZXNba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBxLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcVtpXS5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgbWVtb2l6ZWQubWVtbyA9IG1lbW87XG4gICAgICAgIG1lbW9pemVkLnVubWVtb2l6ZWQgPSBmbjtcbiAgICAgICAgcmV0dXJuIG1lbW9pemVkO1xuICAgIH07XG5cbiAgICBhc3luYy51bm1lbW9pemUgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAoZm4udW5tZW1vaXplZCB8fCBmbikuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gX3RpbWVzKG1hcHBlcikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGNvdW50LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIG1hcHBlcihfcmFuZ2UoY291bnQpLCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFzeW5jLnRpbWVzID0gX3RpbWVzKGFzeW5jLm1hcCk7XG4gICAgYXN5bmMudGltZXNTZXJpZXMgPSBfdGltZXMoYXN5bmMubWFwU2VyaWVzKTtcbiAgICBhc3luYy50aW1lc0xpbWl0ID0gZnVuY3Rpb24gKGNvdW50LCBsaW1pdCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiBhc3luYy5tYXBMaW1pdChfcmFuZ2UoY291bnQpLCBsaW1pdCwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMuc2VxID0gZnVuY3Rpb24gKC8qIGZ1bmN0aW9ucy4uLiAqLykge1xuICAgICAgICB2YXIgZm5zID0gYXJndW1lbnRzO1xuICAgICAgICByZXR1cm4gX3Jlc3RQYXJhbShmdW5jdGlvbiAoYXJncykge1xuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBhcmdzW2FyZ3MubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBhcmdzLnBvcCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayA9IG5vb3A7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGFzeW5jLnJlZHVjZShmbnMsIGFyZ3MsIGZ1bmN0aW9uIChuZXdhcmdzLCBmbiwgY2IpIHtcbiAgICAgICAgICAgICAgICBmbi5hcHBseSh0aGF0LCBuZXdhcmdzLmNvbmNhdChbX3Jlc3RQYXJhbShmdW5jdGlvbiAoZXJyLCBuZXh0YXJncykge1xuICAgICAgICAgICAgICAgICAgICBjYihlcnIsIG5leHRhcmdzKTtcbiAgICAgICAgICAgICAgICB9KV0pKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5jdGlvbiAoZXJyLCByZXN1bHRzKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkodGhhdCwgW2Vycl0uY29uY2F0KHJlc3VsdHMpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgYXN5bmMuY29tcG9zZSA9IGZ1bmN0aW9uICgvKiBmdW5jdGlvbnMuLi4gKi8pIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jLnNlcS5hcHBseShudWxsLCBBcnJheS5wcm90b3R5cGUucmV2ZXJzZS5jYWxsKGFyZ3VtZW50cykpO1xuICAgIH07XG5cblxuICAgIGZ1bmN0aW9uIF9hcHBseUVhY2goZWFjaGZuKSB7XG4gICAgICAgIHJldHVybiBfcmVzdFBhcmFtKGZ1bmN0aW9uKGZucywgYXJncykge1xuICAgICAgICAgICAgdmFyIGdvID0gX3Jlc3RQYXJhbShmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3MucG9wKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVhY2hmbihmbnMsIGZ1bmN0aW9uIChmbiwgXywgY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgZm4uYXBwbHkodGhhdCwgYXJncy5jb25jYXQoW2NiXSkpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgY2FsbGJhY2spO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoYXJncy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ28uYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ287XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jLmFwcGx5RWFjaCA9IF9hcHBseUVhY2goYXN5bmMuZWFjaE9mKTtcbiAgICBhc3luYy5hcHBseUVhY2hTZXJpZXMgPSBfYXBwbHlFYWNoKGFzeW5jLmVhY2hPZlNlcmllcyk7XG5cblxuICAgIGFzeW5jLmZvcmV2ZXIgPSBmdW5jdGlvbiAoZm4sIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBkb25lID0gb25seV9vbmNlKGNhbGxiYWNrIHx8IG5vb3ApO1xuICAgICAgICB2YXIgdGFzayA9IGVuc3VyZUFzeW5jKGZuKTtcbiAgICAgICAgZnVuY3Rpb24gbmV4dChlcnIpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZG9uZShlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGFzayhuZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBuZXh0KCk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGVuc3VyZUFzeW5jKGZuKSB7XG4gICAgICAgIHJldHVybiBfcmVzdFBhcmFtKGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBhcmdzLnBvcCgpO1xuICAgICAgICAgICAgYXJncy5wdXNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5uZXJBcmdzID0gYXJndW1lbnRzO1xuICAgICAgICAgICAgICAgIGlmIChzeW5jKSB7XG4gICAgICAgICAgICAgICAgICAgIGFzeW5jLnNldEltbWVkaWF0ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseShudWxsLCBpbm5lckFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseShudWxsLCBpbm5lckFyZ3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdmFyIHN5bmMgPSB0cnVlO1xuICAgICAgICAgICAgZm4uYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICBzeW5jID0gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jLmVuc3VyZUFzeW5jID0gZW5zdXJlQXN5bmM7XG5cbiAgICBhc3luYy5jb25zdGFudCA9IF9yZXN0UGFyYW0oZnVuY3Rpb24odmFsdWVzKSB7XG4gICAgICAgIHZhciBhcmdzID0gW251bGxdLmNvbmNhdCh2YWx1ZXMpO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2suYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICBhc3luYy53cmFwU3luYyA9XG4gICAgYXN5bmMuYXN5bmNpZnkgPSBmdW5jdGlvbiBhc3luY2lmeShmdW5jKSB7XG4gICAgICAgIHJldHVybiBfcmVzdFBhcmFtKGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBhcmdzLnBvcCgpO1xuICAgICAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBpZiByZXN1bHQgaXMgUHJvbWlzZSBvYmplY3RcbiAgICAgICAgICAgIGlmIChfaXNPYmplY3QocmVzdWx0KSAmJiB0eXBlb2YgcmVzdWx0LnRoZW4gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIHJlc3VsdC50aGVuKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9KVtcImNhdGNoXCJdKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIubWVzc2FnZSA/IGVyciA6IG5ldyBFcnJvcihlcnIpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdWx0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8vIE5vZGUuanNcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBhc3luYztcbiAgICB9XG4gICAgLy8gQU1EIC8gUmVxdWlyZUpTXG4gICAgZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShbXSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGFzeW5jO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgLy8gaW5jbHVkZWQgZGlyZWN0bHkgdmlhIDxzY3JpcHQ+IHRhZ1xuICAgIGVsc2Uge1xuICAgICAgICByb290LmFzeW5jID0gYXN5bmM7XG4gICAgfVxuXG59KCkpO1xuIiwiLyohXHJcbiAqIEBuYW1lIEphdmFTY3JpcHQvTm9kZUpTIE1lcmdlIHYxLjIuMFxyXG4gKiBAYXV0aG9yIHllaWtvc1xyXG4gKiBAcmVwb3NpdG9yeSBodHRwczovL2dpdGh1Yi5jb20veWVpa29zL2pzLm1lcmdlXHJcblxyXG4gKiBDb3B5cmlnaHQgMjAxNCB5ZWlrb3MgLSBNSVQgbGljZW5zZVxyXG4gKiBodHRwczovL3Jhdy5naXRodWIuY29tL3llaWtvcy9qcy5tZXJnZS9tYXN0ZXIvTElDRU5TRVxyXG4gKi9cclxuXHJcbjsoZnVuY3Rpb24oaXNOb2RlKSB7XHJcblxyXG5cdC8qKlxyXG5cdCAqIE1lcmdlIG9uZSBvciBtb3JlIG9iamVjdHMgXHJcblx0ICogQHBhcmFtIGJvb2w/IGNsb25lXHJcblx0ICogQHBhcmFtIG1peGVkLC4uLiBhcmd1bWVudHNcclxuXHQgKiBAcmV0dXJuIG9iamVjdFxyXG5cdCAqL1xyXG5cclxuXHR2YXIgUHVibGljID0gZnVuY3Rpb24oY2xvbmUpIHtcclxuXHJcblx0XHRyZXR1cm4gbWVyZ2UoY2xvbmUgPT09IHRydWUsIGZhbHNlLCBhcmd1bWVudHMpO1xyXG5cclxuXHR9LCBwdWJsaWNOYW1lID0gJ21lcmdlJztcclxuXHJcblx0LyoqXHJcblx0ICogTWVyZ2UgdHdvIG9yIG1vcmUgb2JqZWN0cyByZWN1cnNpdmVseSBcclxuXHQgKiBAcGFyYW0gYm9vbD8gY2xvbmVcclxuXHQgKiBAcGFyYW0gbWl4ZWQsLi4uIGFyZ3VtZW50c1xyXG5cdCAqIEByZXR1cm4gb2JqZWN0XHJcblx0ICovXHJcblxyXG5cdFB1YmxpYy5yZWN1cnNpdmUgPSBmdW5jdGlvbihjbG9uZSkge1xyXG5cclxuXHRcdHJldHVybiBtZXJnZShjbG9uZSA9PT0gdHJ1ZSwgdHJ1ZSwgYXJndW1lbnRzKTtcclxuXHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogQ2xvbmUgdGhlIGlucHV0IHJlbW92aW5nIGFueSByZWZlcmVuY2VcclxuXHQgKiBAcGFyYW0gbWl4ZWQgaW5wdXRcclxuXHQgKiBAcmV0dXJuIG1peGVkXHJcblx0ICovXHJcblxyXG5cdFB1YmxpYy5jbG9uZSA9IGZ1bmN0aW9uKGlucHV0KSB7XHJcblxyXG5cdFx0dmFyIG91dHB1dCA9IGlucHV0LFxyXG5cdFx0XHR0eXBlID0gdHlwZU9mKGlucHV0KSxcclxuXHRcdFx0aW5kZXgsIHNpemU7XHJcblxyXG5cdFx0aWYgKHR5cGUgPT09ICdhcnJheScpIHtcclxuXHJcblx0XHRcdG91dHB1dCA9IFtdO1xyXG5cdFx0XHRzaXplID0gaW5wdXQubGVuZ3RoO1xyXG5cclxuXHRcdFx0Zm9yIChpbmRleD0wO2luZGV4PHNpemU7KytpbmRleClcclxuXHJcblx0XHRcdFx0b3V0cHV0W2luZGV4XSA9IFB1YmxpYy5jbG9uZShpbnB1dFtpbmRleF0pO1xyXG5cclxuXHRcdH0gZWxzZSBpZiAodHlwZSA9PT0gJ29iamVjdCcpIHtcclxuXHJcblx0XHRcdG91dHB1dCA9IHt9O1xyXG5cclxuXHRcdFx0Zm9yIChpbmRleCBpbiBpbnB1dClcclxuXHJcblx0XHRcdFx0b3V0cHV0W2luZGV4XSA9IFB1YmxpYy5jbG9uZShpbnB1dFtpbmRleF0pO1xyXG5cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gb3V0cHV0O1xyXG5cclxuXHR9O1xyXG5cclxuXHQvKipcclxuXHQgKiBNZXJnZSB0d28gb2JqZWN0cyByZWN1cnNpdmVseVxyXG5cdCAqIEBwYXJhbSBtaXhlZCBpbnB1dFxyXG5cdCAqIEBwYXJhbSBtaXhlZCBleHRlbmRcclxuXHQgKiBAcmV0dXJuIG1peGVkXHJcblx0ICovXHJcblxyXG5cdGZ1bmN0aW9uIG1lcmdlX3JlY3Vyc2l2ZShiYXNlLCBleHRlbmQpIHtcclxuXHJcblx0XHRpZiAodHlwZU9mKGJhc2UpICE9PSAnb2JqZWN0JylcclxuXHJcblx0XHRcdHJldHVybiBleHRlbmQ7XHJcblxyXG5cdFx0Zm9yICh2YXIga2V5IGluIGV4dGVuZCkge1xyXG5cclxuXHRcdFx0aWYgKHR5cGVPZihiYXNlW2tleV0pID09PSAnb2JqZWN0JyAmJiB0eXBlT2YoZXh0ZW5kW2tleV0pID09PSAnb2JqZWN0Jykge1xyXG5cclxuXHRcdFx0XHRiYXNlW2tleV0gPSBtZXJnZV9yZWN1cnNpdmUoYmFzZVtrZXldLCBleHRlbmRba2V5XSk7XHJcblxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cclxuXHRcdFx0XHRiYXNlW2tleV0gPSBleHRlbmRba2V5XTtcclxuXHJcblx0XHRcdH1cclxuXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGJhc2U7XHJcblxyXG5cdH1cclxuXHJcblx0LyoqXHJcblx0ICogTWVyZ2UgdHdvIG9yIG1vcmUgb2JqZWN0c1xyXG5cdCAqIEBwYXJhbSBib29sIGNsb25lXHJcblx0ICogQHBhcmFtIGJvb2wgcmVjdXJzaXZlXHJcblx0ICogQHBhcmFtIGFycmF5IGFyZ3ZcclxuXHQgKiBAcmV0dXJuIG9iamVjdFxyXG5cdCAqL1xyXG5cclxuXHRmdW5jdGlvbiBtZXJnZShjbG9uZSwgcmVjdXJzaXZlLCBhcmd2KSB7XHJcblxyXG5cdFx0dmFyIHJlc3VsdCA9IGFyZ3ZbMF0sXHJcblx0XHRcdHNpemUgPSBhcmd2Lmxlbmd0aDtcclxuXHJcblx0XHRpZiAoY2xvbmUgfHwgdHlwZU9mKHJlc3VsdCkgIT09ICdvYmplY3QnKVxyXG5cclxuXHRcdFx0cmVzdWx0ID0ge307XHJcblxyXG5cdFx0Zm9yICh2YXIgaW5kZXg9MDtpbmRleDxzaXplOysraW5kZXgpIHtcclxuXHJcblx0XHRcdHZhciBpdGVtID0gYXJndltpbmRleF0sXHJcblxyXG5cdFx0XHRcdHR5cGUgPSB0eXBlT2YoaXRlbSk7XHJcblxyXG5cdFx0XHRpZiAodHlwZSAhPT0gJ29iamVjdCcpIGNvbnRpbnVlO1xyXG5cclxuXHRcdFx0Zm9yICh2YXIga2V5IGluIGl0ZW0pIHtcclxuXHJcblx0XHRcdFx0dmFyIHNpdGVtID0gY2xvbmUgPyBQdWJsaWMuY2xvbmUoaXRlbVtrZXldKSA6IGl0ZW1ba2V5XTtcclxuXHJcblx0XHRcdFx0aWYgKHJlY3Vyc2l2ZSkge1xyXG5cclxuXHRcdFx0XHRcdHJlc3VsdFtrZXldID0gbWVyZ2VfcmVjdXJzaXZlKHJlc3VsdFtrZXldLCBzaXRlbSk7XHJcblxyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblxyXG5cdFx0XHRcdFx0cmVzdWx0W2tleV0gPSBzaXRlbTtcclxuXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0fVxyXG5cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gcmVzdWx0O1xyXG5cclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIEdldCB0eXBlIG9mIHZhcmlhYmxlXHJcblx0ICogQHBhcmFtIG1peGVkIGlucHV0XHJcblx0ICogQHJldHVybiBzdHJpbmdcclxuXHQgKlxyXG5cdCAqIEBzZWUgaHR0cDovL2pzcGVyZi5jb20vdHlwZW9mdmFyXHJcblx0ICovXHJcblxyXG5cdGZ1bmN0aW9uIHR5cGVPZihpbnB1dCkge1xyXG5cclxuXHRcdHJldHVybiAoe30pLnRvU3RyaW5nLmNhbGwoaW5wdXQpLnNsaWNlKDgsIC0xKS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuXHR9XHJcblxyXG5cdGlmIChpc05vZGUpIHtcclxuXHJcblx0XHRtb2R1bGUuZXhwb3J0cyA9IFB1YmxpYztcclxuXHJcblx0fSBlbHNlIHtcclxuXHJcblx0XHR3aW5kb3dbcHVibGljTmFtZV0gPSBQdWJsaWM7XHJcblxyXG5cdH1cclxuXHJcbn0pKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZSAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKTsiLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgc2V0VGltZW91dChkcmFpblF1ZXVlLCAwKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMC4wXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBBdXRoQ29udHJvbGxlcixcbiAgICBiaW5kID0gZnVuY3Rpb24oZm4sIG1lKXsgcmV0dXJuIGZ1bmN0aW9uKCl7IHJldHVybiBmbi5hcHBseShtZSwgYXJndW1lbnRzKTsgfTsgfTtcblxuICBBdXRoQ29udHJvbGxlciA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBBdXRoQ29udHJvbGxlcigkc2NvcGUsICRodHRwKSB7XG4gICAgICB0aGlzLiRzY29wZSA9ICRzY29wZTtcbiAgICAgIHRoaXMuJGh0dHAgPSAkaHR0cDtcbiAgICAgIHRoaXMuX3NldFRva2VuID0gYmluZCh0aGlzLl9zZXRUb2tlbiwgdGhpcyk7XG4gICAgICB0aGlzLl9pbml0ID0gYmluZCh0aGlzLl9pbml0LCB0aGlzKTtcbiAgICAgIHRoaXMuJHNjb3BlLm1lc3NhZ2UgPSBudWxsO1xuICAgICAgdGhpcy4kc2NvcGUuaXNEZXZlbG9wZXIgPSBmYWxzZTtcbiAgICAgIHRoaXMuJHNjb3BlLnNhbmRib3ggPSB7XG4gICAgICAgIHRva2VuOiBudWxsLFxuICAgICAgICB1c2VybmFtZTogbnVsbFxuICAgICAgfTtcbiAgICAgIHRoaXMuJHNjb3BlLnByb2R1Y3Rpb24gPSB7XG4gICAgICAgIHRva2VuOiBudWxsLFxuICAgICAgICB1c2VybmFtZTogbnVsbFxuICAgICAgfTtcbiAgICAgIHRoaXMuJHNjb3BlLnNldFRva2VuID0gdGhpcy5fc2V0VG9rZW47XG4gICAgICB0aGlzLl9pbml0KCk7XG4gICAgfVxuXG4gICAgQXV0aENvbnRyb2xsZXIucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy4kaHR0cC5nZXQoJy9hdXRoL3Rva2VuJykuZXJyb3IoKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGRhdGEpO1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpLnN1Y2Nlc3MoKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgX3RoaXMuJHNjb3BlLnByb2R1Y3Rpb24gPSBkYXRhO1xuICAgICAgICAgIHJldHVybiBfdGhpcy4kaHR0cC5wb3N0KCcvYXV0aC90b2tlbicsIHtcbiAgICAgICAgICAgIHNhbmRib3g6IHRydWVcbiAgICAgICAgICB9KS5lcnJvcihmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZGF0YSk7XG4gICAgICAgICAgfSkuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuJHNjb3BlLnNhbmRib3ggPSBkYXRhO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpO1xuICAgIH07XG5cbiAgICBBdXRoQ29udHJvbGxlci5wcm90b3R5cGUuX3NldFRva2VuID0gZnVuY3Rpb24oc2FuZGJveCkge1xuICAgICAgdmFyIHRva2VuO1xuICAgICAgdG9rZW4gPSBwcm9tcHQoXCJJbnB1dCBkZXZlbG9wZXIgdG9rZW4gKFwiICsgKHNhbmRib3ggPyAnc2FuZGJveCcgOiAncHJvZHVjdGlvbicpICsgXCIpXCIpO1xuICAgICAgaWYgKCF0b2tlbikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy4kaHR0cC5wb3N0KCcvYXV0aC90b2tlbicsIHtcbiAgICAgICAgc2FuZGJveDogc2FuZGJveCxcbiAgICAgICAgdG9rZW46IHRva2VuXG4gICAgICB9KS5zdWNjZXNzKChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgIGlmIChzYW5kYm94KSB7XG4gICAgICAgICAgICBfdGhpcy4kc2NvcGUuc2FuZGJveCA9IGRhdGE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIF90aGlzLiRzY29wZS5wcm9kdWN0aW9uID0gZGF0YTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4gYWxlcnQoJ1Rva2VuIGlzIGludmFsaWQuJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpLmVycm9yKChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgIHJldHVybiBhbGVydCgnU2V0IHRva2VuIGZhaWxlZC4nKTtcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIEF1dGhDb250cm9sbGVyO1xuXG4gIH0pKCk7XG5cbiAgYXBwLmNvbnRyb2xsZXIoJ0F1dGhDb250cm9sbGVyJywgWyckc2NvcGUnLCAnJGh0dHAnLCBBdXRoQ29udHJvbGxlcl0pO1xuXG4gIG1vZHVsZS5leHBvcnRzID0gQXV0aENvbnRyb2xsZXI7XG5cbn0pLmNhbGwodGhpcyk7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWF1dGgtY29udHJvbGxlci5qcy5tYXBcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMC4wXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBDb250cm9sbGVyO1xuXG4gIENvbnRyb2xsZXIgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gQ29udHJvbGxlcigkc2NvcGUsIGRhdGFUcmFuc2NpZXZlcikge1xuICAgICAgdGhpcy4kc2NvcGUgPSAkc2NvcGU7XG4gICAgICB0aGlzLmRhdGFUcmFuc2NpZXZlciA9IGRhdGFUcmFuc2NpZXZlcjtcbiAgICAgIHRoaXMuJHNjb3BlLmRhdGFUcmFuc2NpZXZlciA9IHRoaXMuZGF0YVRyYW5zY2lldmVyO1xuICAgICAgdGhpcy5kYXRhVHJhbnNjaWV2ZXIucmVsb2FkKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIENvbnRyb2xsZXI7XG5cbiAgfSkoKTtcblxuICBhcHAuY29udHJvbGxlcignQ29udHJvbGxlcicsIFsnJHNjb3BlJywgJ2RhdGFUcmFuc2NpZXZlcicsIENvbnRyb2xsZXJdKTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IENvbnRyb2xsZXI7XG5cbn0pLmNhbGwodGhpcyk7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWNvbnRyb2xsZXIuanMubWFwXG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTAuMFxuKGZ1bmN0aW9uKCkge1xuICB2YXIgTWVudUNvbnRyb2xsZXIsXG4gICAgYmluZCA9IGZ1bmN0aW9uKGZuLCBtZSl7IHJldHVybiBmdW5jdGlvbigpeyByZXR1cm4gZm4uYXBwbHkobWUsIGFyZ3VtZW50cyk7IH07IH07XG5cbiAgTWVudUNvbnRyb2xsZXIgPSAoZnVuY3Rpb24oKSB7XG4gICAgTWVudUNvbnRyb2xsZXIucHJvdG90eXBlLmxhc3RRdWVyeVN0ciA9IG51bGw7XG5cbiAgICBmdW5jdGlvbiBNZW51Q29udHJvbGxlcigkc2NvcGUsICRodHRwLCBkYXRhU3RvcmUsIGRhdGFUcmFuc2NpZXZlciwgbm90ZVF1ZXJ5LCB0aW1lTG9nUXVlcnkpIHtcbiAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xuICAgICAgdGhpcy4kaHR0cCA9ICRodHRwO1xuICAgICAgdGhpcy5kYXRhU3RvcmUgPSBkYXRhU3RvcmU7XG4gICAgICB0aGlzLmRhdGFUcmFuc2NpZXZlciA9IGRhdGFUcmFuc2NpZXZlcjtcbiAgICAgIHRoaXMubm90ZVF1ZXJ5ID0gbm90ZVF1ZXJ5O1xuICAgICAgdGhpcy50aW1lTG9nUXVlcnkgPSB0aW1lTG9nUXVlcnk7XG4gICAgICB0aGlzLl9vbldhdGNoVGltZUxvZ1F1ZXJ5ID0gYmluZCh0aGlzLl9vbldhdGNoVGltZUxvZ1F1ZXJ5LCB0aGlzKTtcbiAgICAgIHRoaXMuX29uV2F0Y2hOb3RlUXVlcnkgPSBiaW5kKHRoaXMuX29uV2F0Y2hOb3RlUXVlcnksIHRoaXMpO1xuICAgICAgdGhpcy4kc2NvcGUuZGF0YVN0b3JlID0gdGhpcy5kYXRhU3RvcmU7XG4gICAgICB0aGlzLiRzY29wZS5kYXRhVHJhbnNjaWV2ZXIgPSB0aGlzLmRhdGFUcmFuc2NpZXZlcjtcbiAgICAgIHRoaXMuJHNjb3BlLm5vdGVRdWVyeSA9IHRoaXMubm90ZVF1ZXJ5O1xuICAgICAgdGhpcy4kc2NvcGUudGltZUxvZ1F1ZXJ5ID0gdGhpcy50aW1lTG9nUXVlcnk7XG4gICAgICB0aGlzLiRzY29wZS4kd2F0Y2hHcm91cChbJ25vdGVRdWVyeS51cGRhdGVkJywgJ25vdGVRdWVyeS5ub3RlYm9va3MnLCAnbm90ZVF1ZXJ5LnN0YWNrcycsICdub3RlUXVlcnkud29ya2VkJ10sIHRoaXMuX29uV2F0Y2hOb3RlUXVlcnkpO1xuICAgICAgdGhpcy4kc2NvcGUuJHdhdGNoR3JvdXAoWyd0aW1lTG9nUXVlcnkud29ya2VkJ10sIHRoaXMuX29uV2F0Y2hUaW1lTG9nUXVlcnkpO1xuICAgIH1cblxuICAgIE1lbnVDb250cm9sbGVyLnByb3RvdHlwZS5fb25XYXRjaE5vdGVRdWVyeSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHF1ZXJ5LCBxdWVyeVN0cjtcbiAgICAgIHF1ZXJ5ID0gdGhpcy5ub3RlUXVlcnkucXVlcnkoKTtcbiAgICAgIHF1ZXJ5U3RyID0gSlNPTi5zdHJpbmdpZnkocXVlcnkpO1xuICAgICAgaWYgKHRoaXMubGFzdFF1ZXJ5U3RyID09PSBxdWVyeVN0cikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLmxhc3RRdWVyeVN0ciA9IHF1ZXJ5U3RyO1xuICAgICAgcmV0dXJuIHRoaXMuJGh0dHAuZ2V0KCcvbm90ZXMvY291bnQnLCB7XG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgIHF1ZXJ5OiBxdWVyeVxuICAgICAgICB9XG4gICAgICB9KS5zdWNjZXNzKChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgIHJldHVybiBfdGhpcy5ub3RlUXVlcnkuY291bnQgPSBkYXRhO1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpLmVycm9yKChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLm5vdGVRdWVyeS5jb3VudCA9IG51bGw7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgfTtcblxuICAgIE1lbnVDb250cm9sbGVyLnByb3RvdHlwZS5fb25XYXRjaFRpbWVMb2dRdWVyeSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHF1ZXJ5LCBxdWVyeVN0cjtcbiAgICAgIHF1ZXJ5ID0gdGhpcy50aW1lTG9nUXVlcnkucXVlcnkoKTtcbiAgICAgIHF1ZXJ5U3RyID0gSlNPTi5zdHJpbmdpZnkocXVlcnkpO1xuICAgICAgaWYgKHRoaXMubGFzdFF1ZXJ5U3RyID09PSBxdWVyeVN0cikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLmxhc3RRdWVyeVN0ciA9IHF1ZXJ5U3RyO1xuICAgICAgcmV0dXJuIHRoaXMuJGh0dHAuZ2V0KCcvdGltZS1sb2dzL2NvdW50Jywge1xuICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICBxdWVyeTogcXVlcnlcbiAgICAgICAgfVxuICAgICAgfSkuc3VjY2VzcygoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICByZXR1cm4gX3RoaXMudGltZUxvZ1F1ZXJ5LmNvdW50ID0gZGF0YTtcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpKS5lcnJvcigoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBfdGhpcy50aW1lTG9nUXVlcnkuY291bnQgPSBudWxsO1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpO1xuICAgIH07XG5cbiAgICByZXR1cm4gTWVudUNvbnRyb2xsZXI7XG5cbiAgfSkoKTtcblxuICBhcHAuY29udHJvbGxlcignTWVudUNvbnRyb2xsZXInLCBbJyRzY29wZScsICckaHR0cCcsICdkYXRhU3RvcmUnLCAnZGF0YVRyYW5zY2lldmVyJywgJ25vdGVRdWVyeScsICd0aW1lTG9nUXVlcnknLCBNZW51Q29udHJvbGxlcl0pO1xuXG4gIG1vZHVsZS5leHBvcnRzID0gTWVudUNvbnRyb2xsZXI7XG5cbn0pLmNhbGwodGhpcyk7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1lbnUtY29udHJvbGxlci5qcy5tYXBcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMC4wXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBNb2RhbENvbnRyb2xsZXI7XG5cbiAgTW9kYWxDb250cm9sbGVyID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIE1vZGFsQ29udHJvbGxlcigkc2NvcGUpIHtcbiAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xuICAgIH1cblxuICAgIHJldHVybiBNb2RhbENvbnRyb2xsZXI7XG5cbiAgfSkoKTtcblxuICBhcHAuY29udHJvbGxlcignTW9kYWxDb250cm9sbGVyJywgWyckc2NvcGUnLCBNb2RhbENvbnRyb2xsZXJdKTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IE1vZGFsQ29udHJvbGxlcjtcblxufSkuY2FsbCh0aGlzKTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bW9kYWwtY29udHJvbGxlci5qcy5tYXBcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMC4wXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBOYXZpZ2F0aW9uQ29udHJvbGxlcjtcblxuICBOYXZpZ2F0aW9uQ29udHJvbGxlciA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBOYXZpZ2F0aW9uQ29udHJvbGxlcigkc2NvcGUsICRyb3V0ZSkge1xuICAgICAgdGhpcy4kc2NvcGUgPSAkc2NvcGU7XG4gICAgICB0aGlzLiRyb3V0ZSA9ICRyb3V0ZTtcbiAgICAgIHRoaXMuJHNjb3BlLm5hdkNvbGxhcHNlID0gdHJ1ZTtcbiAgICAgIHRoaXMuJHNjb3BlLiRyb3V0ZSA9IHRoaXMuJHJvdXRlO1xuICAgIH1cblxuICAgIHJldHVybiBOYXZpZ2F0aW9uQ29udHJvbGxlcjtcblxuICB9KSgpO1xuXG4gIGFwcC5jb250cm9sbGVyKCdOYXZpZ2F0aW9uQ29udHJvbGxlcicsIFsnJHNjb3BlJywgJyRyb3V0ZScsIE5hdmlnYXRpb25Db250cm9sbGVyXSk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBOYXZpZ2F0aW9uQ29udHJvbGxlcjtcblxufSkuY2FsbCh0aGlzKTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bmF2aWdhdGlvbi1jb250cm9sbGVyLmpzLm1hcFxuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjEwLjBcbihmdW5jdGlvbigpIHtcbiAgdmFyIE5vdGVzQ29udHJvbGxlcixcbiAgICBiaW5kID0gZnVuY3Rpb24oZm4sIG1lKXsgcmV0dXJuIGZ1bmN0aW9uKCl7IHJldHVybiBmbi5hcHBseShtZSwgYXJndW1lbnRzKTsgfTsgfTtcblxuICBOb3Rlc0NvbnRyb2xsZXIgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gTm90ZXNDb250cm9sbGVyKCRzY29wZSwgZGF0YVN0b3JlKSB7XG4gICAgICB0aGlzLiRzY29wZSA9ICRzY29wZTtcbiAgICAgIHRoaXMuZGF0YVN0b3JlID0gZGF0YVN0b3JlO1xuICAgICAgdGhpcy5fb25XYXRjaFByb2ZpdExvZ3MgPSBiaW5kKHRoaXMuX29uV2F0Y2hQcm9maXRMb2dzLCB0aGlzKTtcbiAgICAgIHRoaXMuX29uV2F0Y2hUaW1lTG9ncyA9IGJpbmQodGhpcy5fb25XYXRjaFRpbWVMb2dzLCB0aGlzKTtcbiAgICAgIHRoaXMuJHNjb3BlLmRhdGFTdG9yZSA9IHRoaXMuZGF0YVN0b3JlO1xuICAgICAgdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzID0ge307XG4gICAgICB0aGlzLiRzY29wZS5ub3Rlc1Byb2ZpdHMgPSB7fTtcbiAgICAgIHRoaXMuJHNjb3BlLmV4aXN0UGVyc29ucyA9IFtdO1xuICAgICAgdGhpcy4kc2NvcGUuJHdhdGNoQ29sbGVjdGlvbignZGF0YVN0b3JlLnRpbWVMb2dzJywgdGhpcy5fb25XYXRjaFRpbWVMb2dzKTtcbiAgICAgIHRoaXMuJHNjb3BlLiR3YXRjaENvbGxlY3Rpb24oJ2RhdGFTdG9yZS5wcm9maXRMb2dzJywgdGhpcy5fb25XYXRjaFByb2ZpdExvZ3MpO1xuICAgIH1cblxuICAgIE5vdGVzQ29udHJvbGxlci5wcm90b3R5cGUuX29uV2F0Y2hUaW1lTG9ncyA9IGZ1bmN0aW9uKHRpbWVMb2dzKSB7XG4gICAgICB2YXIgYmFzZSwgYmFzZTEsIGJhc2UyLCBiYXNlMywgYmFzZTQsIGJhc2U1LCBuYW1lLCBuYW1lMSwgbmFtZTIsIG5vdGVHdWlkLCBub3RlVGltZUxvZywgcGVyc29uc0hhc2gsIHRpbWVMb2csIHRpbWVMb2dfaWQ7XG4gICAgICB0aGlzLiRzY29wZS5ub3Rlc1NwZW50VGltZXMgPSB7fTtcbiAgICAgIHBlcnNvbnNIYXNoID0ge307XG4gICAgICBmb3IgKG5vdGVHdWlkIGluIHRpbWVMb2dzKSB7XG4gICAgICAgIG5vdGVUaW1lTG9nID0gdGltZUxvZ3Nbbm90ZUd1aWRdO1xuICAgICAgICBmb3IgKHRpbWVMb2dfaWQgaW4gbm90ZVRpbWVMb2cpIHtcbiAgICAgICAgICB0aW1lTG9nID0gbm90ZVRpbWVMb2dbdGltZUxvZ19pZF07XG4gICAgICAgICAgaWYgKChiYXNlID0gdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzKVtuYW1lID0gdGltZUxvZy5ub3RlR3VpZF0gPT0gbnVsbCkge1xuICAgICAgICAgICAgYmFzZVtuYW1lXSA9IHt9O1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoKGJhc2UxID0gdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzW3RpbWVMb2cubm90ZUd1aWRdKVsnJHRvdGFsJ10gPT0gbnVsbCkge1xuICAgICAgICAgICAgYmFzZTFbJyR0b3RhbCddID0gMDtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzW3RpbWVMb2cubm90ZUd1aWRdWyckdG90YWwnXSArPSB0aW1lTG9nLnNwZW50VGltZTtcbiAgICAgICAgICBpZiAoKGJhc2UyID0gdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzW3RpbWVMb2cubm90ZUd1aWRdKVtuYW1lMSA9IHRpbWVMb2cucGVyc29uXSA9PSBudWxsKSB7XG4gICAgICAgICAgICBiYXNlMltuYW1lMV0gPSAwO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLiRzY29wZS5ub3Rlc1NwZW50VGltZXNbdGltZUxvZy5ub3RlR3VpZF1bdGltZUxvZy5wZXJzb25dICs9IHRpbWVMb2cuc3BlbnRUaW1lO1xuICAgICAgICAgIGlmICgoYmFzZTMgPSB0aGlzLiRzY29wZS5ub3Rlc1NwZW50VGltZXMpWyckdG90YWwnXSA9PSBudWxsKSB7XG4gICAgICAgICAgICBiYXNlM1snJHRvdGFsJ10gPSB7fTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKChiYXNlNCA9IHRoaXMuJHNjb3BlLm5vdGVzU3BlbnRUaW1lc1snJHRvdGFsJ10pWyckdG90YWwnXSA9PSBudWxsKSB7XG4gICAgICAgICAgICBiYXNlNFsnJHRvdGFsJ10gPSAwO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLiRzY29wZS5ub3Rlc1NwZW50VGltZXNbJyR0b3RhbCddWyckdG90YWwnXSArPSB0aW1lTG9nLnNwZW50VGltZTtcbiAgICAgICAgICBpZiAoKGJhc2U1ID0gdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzWyckdG90YWwnXSlbbmFtZTIgPSB0aW1lTG9nLnBlcnNvbl0gPT0gbnVsbCkge1xuICAgICAgICAgICAgYmFzZTVbbmFtZTJdID0gMDtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzWyckdG90YWwnXVt0aW1lTG9nLnBlcnNvbl0gKz0gdGltZUxvZy5zcGVudFRpbWU7XG4gICAgICAgICAgaWYgKHRpbWVMb2cuc3BlbnRUaW1lID4gMCkge1xuICAgICAgICAgICAgcGVyc29uc0hhc2hbdGltZUxvZy5wZXJzb25dID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLiRzY29wZS5leGlzdFBlcnNvbnMgPSBPYmplY3Qua2V5cyhwZXJzb25zSGFzaCk7XG4gICAgfTtcblxuICAgIE5vdGVzQ29udHJvbGxlci5wcm90b3R5cGUuX29uV2F0Y2hQcm9maXRMb2dzID0gZnVuY3Rpb24ocHJvZml0TG9ncykge1xuICAgICAgdmFyIGJhc2UsIGJhc2UxLCBiYXNlMiwgYmFzZTMsIG5hbWUsIG5vdGVHdWlkLCBub3RlUHJvZml0TG9nLCBwZXJzb24sIHByb2ZpdExvZywgcHJvZml0TG9nX2lkLCByZXN1bHRzO1xuICAgICAgdGhpcy4kc2NvcGUubm90ZXNQcm9maXRzID0ge307XG4gICAgICByZXN1bHRzID0gW107XG4gICAgICBmb3IgKG5vdGVHdWlkIGluIHByb2ZpdExvZ3MpIHtcbiAgICAgICAgbm90ZVByb2ZpdExvZyA9IHByb2ZpdExvZ3Nbbm90ZUd1aWRdO1xuICAgICAgICBmb3IgKHByb2ZpdExvZ19pZCBpbiBub3RlUHJvZml0TG9nKSB7XG4gICAgICAgICAgcHJvZml0TG9nID0gbm90ZVByb2ZpdExvZ1twcm9maXRMb2dfaWRdO1xuICAgICAgICAgIGlmICgoYmFzZSA9IHRoaXMuJHNjb3BlLm5vdGVzUHJvZml0cylbbmFtZSA9IHByb2ZpdExvZy5ub3RlR3VpZF0gPT0gbnVsbCkge1xuICAgICAgICAgICAgYmFzZVtuYW1lXSA9IHt9O1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoKGJhc2UxID0gdGhpcy4kc2NvcGUubm90ZXNQcm9maXRzW3Byb2ZpdExvZy5ub3RlR3VpZF0pWyckdG90YWwnXSA9PSBudWxsKSB7XG4gICAgICAgICAgICBiYXNlMVsnJHRvdGFsJ10gPSAwO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLiRzY29wZS5ub3Rlc1Byb2ZpdHNbcHJvZml0TG9nLm5vdGVHdWlkXVsnJHRvdGFsJ10gKz0gcHJvZml0TG9nLnByb2ZpdDtcbiAgICAgICAgICBpZiAoKGJhc2UyID0gdGhpcy4kc2NvcGUubm90ZXNQcm9maXRzKVsnJHRvdGFsJ10gPT0gbnVsbCkge1xuICAgICAgICAgICAgYmFzZTJbJyR0b3RhbCddID0ge307XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICgoYmFzZTMgPSB0aGlzLiRzY29wZS5ub3Rlc1Byb2ZpdHNbJyR0b3RhbCddKVsnJHRvdGFsJ10gPT0gbnVsbCkge1xuICAgICAgICAgICAgYmFzZTNbJyR0b3RhbCddID0gMDtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy4kc2NvcGUubm90ZXNQcm9maXRzWyckdG90YWwnXVsnJHRvdGFsJ10gKz0gcHJvZml0TG9nLnByb2ZpdDtcbiAgICAgICAgfVxuICAgICAgICByZXN1bHRzLnB1c2goKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBiYXNlNCwgaSwgbGVuLCByZWYsIHJlZjEsIHJlZjIsIHJlc3VsdHMxO1xuICAgICAgICAgIHJlZiA9IHRoaXMuJHNjb3BlLmV4aXN0UGVyc29ucztcbiAgICAgICAgICByZXN1bHRzMSA9IFtdO1xuICAgICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IHJlZi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgcGVyc29uID0gcmVmW2ldO1xuICAgICAgICAgICAgaWYgKCEoKHJlZjEgPSB0aGlzLiRzY29wZS5ub3Rlc1NwZW50VGltZXNbbm90ZUd1aWRdKSAhPSBudWxsID8gcmVmMVtwZXJzb25dIDogdm9pZCAwKSB8fCAhKChyZWYyID0gdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzW25vdGVHdWlkXSkgIT0gbnVsbCA/IHJlZjJbJyR0b3RhbCddIDogdm9pZCAwKSkge1xuICAgICAgICAgICAgICByZXN1bHRzMS5wdXNoKHRoaXMuJHNjb3BlLm5vdGVzUHJvZml0c1tub3RlR3VpZF1bcGVyc29uXSA9IG51bGwpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy4kc2NvcGUubm90ZXNQcm9maXRzW25vdGVHdWlkXVtwZXJzb25dID0gTWF0aC5yb3VuZCh0aGlzLiRzY29wZS5ub3Rlc1Byb2ZpdHNbbm90ZUd1aWRdWyckdG90YWwnXSAqIHRoaXMuJHNjb3BlLm5vdGVzU3BlbnRUaW1lc1tub3RlR3VpZF1bcGVyc29uXSAvIHRoaXMuJHNjb3BlLm5vdGVzU3BlbnRUaW1lc1tub3RlR3VpZF1bJyR0b3RhbCddKTtcbiAgICAgICAgICAgICAgaWYgKChiYXNlNCA9IHRoaXMuJHNjb3BlLm5vdGVzUHJvZml0c1snJHRvdGFsJ10pW3BlcnNvbl0gPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGJhc2U0W3BlcnNvbl0gPSAwO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJlc3VsdHMxLnB1c2godGhpcy4kc2NvcGUubm90ZXNQcm9maXRzWyckdG90YWwnXVtwZXJzb25dICs9IHRoaXMuJHNjb3BlLm5vdGVzUHJvZml0c1tub3RlR3VpZF1bcGVyc29uXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXN1bHRzMTtcbiAgICAgICAgfSkuY2FsbCh0aGlzKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9O1xuXG4gICAgcmV0dXJuIE5vdGVzQ29udHJvbGxlcjtcblxuICB9KSgpO1xuXG4gIGFwcC5jb250cm9sbGVyKCdOb3Rlc0NvbnRyb2xsZXInLCBbJyRzY29wZScsICdkYXRhU3RvcmUnLCBOb3Rlc0NvbnRyb2xsZXJdKTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IE5vdGVzQ29udHJvbGxlcjtcblxufSkuY2FsbCh0aGlzKTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bm90ZXMtY29udHJvbGxlci5qcy5tYXBcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMC4wXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBNb2RhbENvbnRyb2xsZXIsIFByb2dyZXNzTW9kYWxDb250cm9sbGVyLFxuICAgIGV4dGVuZCA9IGZ1bmN0aW9uKGNoaWxkLCBwYXJlbnQpIHsgZm9yICh2YXIga2V5IGluIHBhcmVudCkgeyBpZiAoaGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldOyB9IGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfSBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7IGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7IGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7IHJldHVybiBjaGlsZDsgfSxcbiAgICBoYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHk7XG5cbiAgTW9kYWxDb250cm9sbGVyID0gcmVxdWlyZSgnLi9tb2RhbC1jb250cm9sbGVyJyk7XG5cbiAgUHJvZ3Jlc3NNb2RhbENvbnRyb2xsZXIgPSAoZnVuY3Rpb24oc3VwZXJDbGFzcykge1xuICAgIGV4dGVuZChQcm9ncmVzc01vZGFsQ29udHJvbGxlciwgc3VwZXJDbGFzcyk7XG5cbiAgICBmdW5jdGlvbiBQcm9ncmVzc01vZGFsQ29udHJvbGxlcigkc2NvcGUsIHByb2dyZXNzKSB7XG4gICAgICB0aGlzLiRzY29wZSA9ICRzY29wZTtcbiAgICAgIHRoaXMucHJvZ3Jlc3MgPSBwcm9ncmVzcztcbiAgICAgIHRoaXMuJHNjb3BlLnByb2dyZXNzID0gdGhpcy5wcm9ncmVzcztcbiAgICB9XG5cbiAgICByZXR1cm4gUHJvZ3Jlc3NNb2RhbENvbnRyb2xsZXI7XG5cbiAgfSkoTW9kYWxDb250cm9sbGVyKTtcblxuICBhcHAuY29udHJvbGxlcignUHJvZ3Jlc3NNb2RhbENvbnRyb2xsZXInLCBbJyRzY29wZScsICdwcm9ncmVzcycsIFByb2dyZXNzTW9kYWxDb250cm9sbGVyXSk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBQcm9ncmVzc01vZGFsQ29udHJvbGxlcjtcblxufSkuY2FsbCh0aGlzKTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cHJvZ3Jlc3MtbW9kYWwtY29udHJvbGxlci5qcy5tYXBcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMC4wXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBTZXR0aW5nc0NvbnRyb2xsZXIsIGFzeW5jLFxuICAgIGJpbmQgPSBmdW5jdGlvbihmbiwgbWUpeyByZXR1cm4gZnVuY3Rpb24oKXsgcmV0dXJuIGZuLmFwcGx5KG1lLCBhcmd1bWVudHMpOyB9OyB9O1xuXG4gIGFzeW5jID0gcmVxdWlyZSgnYXN5bmMnKTtcblxuICBTZXR0aW5nc0NvbnRyb2xsZXIgPSAoZnVuY3Rpb24oKSB7XG5cbiAgICAvKipcbiAgICAgKiBAY29uc3RcbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqL1xuICAgIFNldHRpbmdzQ29udHJvbGxlci5wcm90b3R5cGUuRklFTERTID0ge1xuICAgICAgcGVyc29uczoge1xuICAgICAgICByZVBhcnNlOiB0cnVlLFxuICAgICAgICByZWxvYWQ6IHRydWVcbiAgICAgIH0sXG4gICAgICBzdGFydFdvcmtpbmdUaW1lOiB7XG4gICAgICAgIGhlYWRpbmc6ICdTdGFydCBXb3JraW5nIFRpbWUnLFxuICAgICAgICB0eXBlOiAnbnVtYmVyJ1xuICAgICAgfSxcbiAgICAgIGVuZFdvcmtpbmdUaW1lOiB7XG4gICAgICAgIGhlYWRpbmc6ICdFbmQgV29ya2luZyBUaW1lJyxcbiAgICAgICAgdHlwZTogJ251bWJlcidcbiAgICAgIH1cbiAgICB9O1xuXG5cbiAgICAvKipcbiAgICAgKiBAcHJvdGVjdGVkXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cblxuICAgIFNldHRpbmdzQ29udHJvbGxlci5wcm90b3R5cGUuX2VkaXRTdG9yZSA9IHt9O1xuXG4gICAgZnVuY3Rpb24gU2V0dGluZ3NDb250cm9sbGVyKCRzY29wZSwgJGh0dHAsIGRhdGFTdG9yZSwgZGF0YVRyYW5zY2lldmVyLCBwcm9ncmVzcykge1xuICAgICAgdmFyIGZpZWxkLCBrZXksIHJlZjtcbiAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xuICAgICAgdGhpcy4kaHR0cCA9ICRodHRwO1xuICAgICAgdGhpcy5kYXRhU3RvcmUgPSBkYXRhU3RvcmU7XG4gICAgICB0aGlzLmRhdGFUcmFuc2NpZXZlciA9IGRhdGFUcmFuc2NpZXZlcjtcbiAgICAgIHRoaXMucHJvZ3Jlc3MgPSBwcm9ncmVzcztcbiAgICAgIHRoaXMuX29uV2F0Y2hTZXR0aW5nID0gYmluZCh0aGlzLl9vbldhdGNoU2V0dGluZywgdGhpcyk7XG4gICAgICB0aGlzLl9zdWJtaXQgPSBiaW5kKHRoaXMuX3N1Ym1pdCwgdGhpcyk7XG4gICAgICB0aGlzLl9hZGQgPSBiaW5kKHRoaXMuX2FkZCwgdGhpcyk7XG4gICAgICB0aGlzLl9yZW1vdmUgPSBiaW5kKHRoaXMuX3JlbW92ZSwgdGhpcyk7XG4gICAgICB0aGlzLl9kb3duID0gYmluZCh0aGlzLl9kb3duLCB0aGlzKTtcbiAgICAgIHRoaXMuX3VwID0gYmluZCh0aGlzLl91cCwgdGhpcyk7XG4gICAgICB0aGlzLiRzY29wZS5kYXRhU3RvcmUgPSB0aGlzLmRhdGFTdG9yZTtcbiAgICAgIHRoaXMuJHNjb3BlLmVkaXRTdG9yZSA9IHRoaXMuX2VkaXRTdG9yZTtcbiAgICAgIHRoaXMuJHNjb3BlLmZpZWxkcyA9IHRoaXMuRklFTERTO1xuICAgICAgdGhpcy4kc2NvcGUudXAgPSB0aGlzLl91cDtcbiAgICAgIHRoaXMuJHNjb3BlLmRvd24gPSB0aGlzLl9kb3duO1xuICAgICAgdGhpcy4kc2NvcGUucmVtb3ZlID0gdGhpcy5fcmVtb3ZlO1xuICAgICAgdGhpcy4kc2NvcGUuYWRkID0gdGhpcy5fYWRkO1xuICAgICAgdGhpcy4kc2NvcGUuc3VibWl0ID0gdGhpcy5fc3VibWl0O1xuICAgICAgcmVmID0gdGhpcy5GSUVMRFM7XG4gICAgICBmb3IgKGtleSBpbiByZWYpIHtcbiAgICAgICAgZmllbGQgPSByZWZba2V5XTtcbiAgICAgICAgdGhpcy4kc2NvcGUuJHdhdGNoKFwiZGF0YVN0b3JlLnNldHRpbmdzLlwiICsga2V5LCB0aGlzLl9vbldhdGNoU2V0dGluZyhrZXkpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBTZXR0aW5nc0NvbnRyb2xsZXIucHJvdG90eXBlLl91cCA9IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICBpZiAoaW5kZXggPT09IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuX2VkaXRTdG9yZS5wZXJzb25zLnNwbGljZShpbmRleCAtIDEsIDIsIHRoaXMuX2VkaXRTdG9yZS5wZXJzb25zW2luZGV4XSwgdGhpcy5fZWRpdFN0b3JlLnBlcnNvbnNbaW5kZXggLSAxXSk7XG4gICAgfTtcblxuICAgIFNldHRpbmdzQ29udHJvbGxlci5wcm90b3R5cGUuX2Rvd24gPSBmdW5jdGlvbihpbmRleCkge1xuICAgICAgaWYgKGluZGV4ID49IHRoaXMuX2VkaXRTdG9yZS5wZXJzb25zLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuX2VkaXRTdG9yZS5wZXJzb25zLnNwbGljZShpbmRleCwgMiwgdGhpcy5fZWRpdFN0b3JlLnBlcnNvbnNbaW5kZXggKyAxXSwgdGhpcy5fZWRpdFN0b3JlLnBlcnNvbnNbaW5kZXhdKTtcbiAgICB9O1xuXG4gICAgU2V0dGluZ3NDb250cm9sbGVyLnByb3RvdHlwZS5fcmVtb3ZlID0gZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9lZGl0U3RvcmUucGVyc29ucy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH07XG5cbiAgICBTZXR0aW5nc0NvbnRyb2xsZXIucHJvdG90eXBlLl9hZGQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBiYXNlO1xuICAgICAgaWYgKChiYXNlID0gdGhpcy5fZWRpdFN0b3JlKS5wZXJzb25zID09IG51bGwpIHtcbiAgICAgICAgYmFzZS5wZXJzb25zID0gW107XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5fZWRpdFN0b3JlLnBlcnNvbnMucHVzaCh7XG4gICAgICAgIG5hbWU6IFwiUGVyc29uIFwiICsgKHRoaXMuX2VkaXRTdG9yZS5wZXJzb25zLmxlbmd0aCArIDEpXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgU2V0dGluZ3NDb250cm9sbGVyLnByb3RvdHlwZS5fc3VibWl0ID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgY291bnQsIHJlUGFyc2UsIHJlbG9hZDtcbiAgICAgIHRoaXMucHJvZ3Jlc3Mub3BlbigpO1xuICAgICAgY291bnQgPSAwO1xuICAgICAgcmVQYXJzZSA9IGZhbHNlO1xuICAgICAgcmVsb2FkID0gZmFsc2U7XG4gICAgICByZXR1cm4gYXN5bmMuZm9yRWFjaE9mU2VyaWVzKHRoaXMuRklFTERTLCAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGZpZWxkLCBrZXksIGNhbGxiYWNrKSB7XG4gICAgICAgICAgaWYgKEpTT04uc3RyaW5naWZ5KGFuZ3VsYXIuY29weShfdGhpcy5fZWRpdFN0b3JlW2tleV0pKSA9PT0gSlNPTi5zdHJpbmdpZnkoX3RoaXMuZGF0YVN0b3JlLnNldHRpbmdzW2tleV0pKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGZpZWxkLnJlUGFyc2UpIHtcbiAgICAgICAgICAgIHJlUGFyc2UgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZmllbGQucmVsb2FkKSB7XG4gICAgICAgICAgICByZWxvYWQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5zZXQoXCJTYXZpbmcgXCIgKyBrZXkgKyBcIi4uLlwiLCBjb3VudCsrIC8gT2JqZWN0LmtleXMoX3RoaXMuRklFTERTKS5jb3VudCAqIDEwMCk7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLiRodHRwLnB1dCgnL3NldHRpbmdzL3NhdmUnLCB7XG4gICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgIHZhbHVlOiBfdGhpcy5fZWRpdFN0b3JlW2tleV1cbiAgICAgICAgICB9KS5zdWNjZXNzKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLnNldHRpbmdzW2tleV0gPSBfdGhpcy5fZWRpdFN0b3JlW2tleV07XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgICB9KS5lcnJvcihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhcIkVycm9yIHNhdmluZyBcIiArIGtleSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSwgKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBhbGVydChlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5jbG9zZSgpO1xuICAgICAgICAgIHJldHVybiBhc3luYy53YXRlcmZhbGwoW1xuICAgICAgICAgICAgZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgaWYgKHJlUGFyc2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXMuZGF0YVRyYW5zY2lldmVyLnJlUGFyc2UoY2FsbGJhY2spO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgICBpZiAocmVsb2FkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLmRhdGFUcmFuc2NpZXZlci5yZWxvYWQoY2FsbGJhY2spO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgXSk7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgfTtcblxuICAgIFNldHRpbmdzQ29udHJvbGxlci5wcm90b3R5cGUuX29uV2F0Y2hTZXR0aW5nID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgcmVmO1xuICAgICAgICAgIHJldHVybiBfdGhpcy5fZWRpdFN0b3JlW2tleV0gPSBhbmd1bGFyLmNvcHkoKHJlZiA9IF90aGlzLmRhdGFTdG9yZS5zZXR0aW5ncykgIT0gbnVsbCA/IHJlZltrZXldIDogdm9pZCAwKTtcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpO1xuICAgIH07XG5cbiAgICByZXR1cm4gU2V0dGluZ3NDb250cm9sbGVyO1xuXG4gIH0pKCk7XG5cbiAgYXBwLmNvbnRyb2xsZXIoJ1NldHRpbmdzQ29udHJvbGxlcicsIFsnJHNjb3BlJywgJyRodHRwJywgJ2RhdGFTdG9yZScsICdkYXRhVHJhbnNjaWV2ZXInLCAncHJvZ3Jlc3MnLCBTZXR0aW5nc0NvbnRyb2xsZXJdKTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IFNldHRpbmdzQ29udHJvbGxlcjtcblxufSkuY2FsbCh0aGlzKTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c2V0dGluZ3MtY29udHJvbGxlci5qcy5tYXBcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMC4wXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBUaW1lbGluZUNvbnRyb2xsZXIsXG4gICAgYmluZCA9IGZ1bmN0aW9uKGZuLCBtZSl7IHJldHVybiBmdW5jdGlvbigpeyByZXR1cm4gZm4uYXBwbHkobWUsIGFyZ3VtZW50cyk7IH07IH07XG5cbiAgVGltZWxpbmVDb250cm9sbGVyID0gKGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIFRpbWVsaW5lQ29udHJvbGxlcigkc2NvcGUsICRmaWx0ZXIsIGRhdGFTdG9yZSkge1xuICAgICAgdmFyIGNvbnRhaW5lciwgb3B0aW9ucztcbiAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xuICAgICAgdGhpcy4kZmlsdGVyID0gJGZpbHRlcjtcbiAgICAgIHRoaXMuZGF0YVN0b3JlID0gZGF0YVN0b3JlO1xuICAgICAgdGhpcy5fb25SZXNpemUgPSBiaW5kKHRoaXMuX29uUmVzaXplLCB0aGlzKTtcbiAgICAgIHRoaXMuX29uV2F0Y2hQcm9maXRMb2dzID0gYmluZCh0aGlzLl9vbldhdGNoUHJvZml0TG9ncywgdGhpcyk7XG4gICAgICB0aGlzLl9vbldhdGNoTm90ZXMgPSBiaW5kKHRoaXMuX29uV2F0Y2hOb3RlcywgdGhpcyk7XG4gICAgICB0aGlzLl9vbldhdGNoV29ya2luZ1RpbWUgPSBiaW5kKHRoaXMuX29uV2F0Y2hXb3JraW5nVGltZSwgdGhpcyk7XG4gICAgICB0aGlzLl9vbldhdGNoUGVyc29ucyA9IGJpbmQodGhpcy5fb25XYXRjaFBlcnNvbnMsIHRoaXMpO1xuICAgICAgdGhpcy4kc2NvcGUuZGF0YVN0b3JlID0gdGhpcy5kYXRhU3RvcmU7XG4gICAgICB0aGlzLiRzY29wZS50aW1lbGluZUl0ZW1zID0gbmV3IHZpcy5EYXRhU2V0KCk7XG4gICAgICB0aGlzLiRzY29wZS50aW1lbGluZUdyb3VwcyA9IG5ldyB2aXMuRGF0YVNldCgpO1xuICAgICAgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWVsaW5lJyk7XG4gICAgICBvcHRpb25zID0ge1xuICAgICAgICBtYXJnaW46IHtcbiAgICAgICAgICBpdGVtOiA1XG4gICAgICAgIH0sXG4gICAgICAgIGhlaWdodDogd2luZG93LmlubmVySGVpZ2h0IC0gODAsXG4gICAgICAgIG9yaWVudGF0aW9uOiB7XG4gICAgICAgICAgYXhpczogJ2JvdGgnLFxuICAgICAgICAgIGl0ZW06ICd0b3AnXG4gICAgICAgIH0sXG4gICAgICAgIHN0YXJ0OiBtb21lbnQoKS5zdGFydE9mKCdkYXknKSxcbiAgICAgICAgZW5kOiBtb21lbnQoKS5lbmRPZignZGF5JyksXG4gICAgICAgIG9yZGVyOiBmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgcmV0dXJuIGEuc3RhcnQgLSBiLnN0YXJ0O1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgdGhpcy4kc2NvcGUudGltZWxpbmUgPSBuZXcgdmlzLlRpbWVsaW5lKGNvbnRhaW5lciwgdGhpcy4kc2NvcGUudGltZWxpbmVJdGVtcywgdGhpcy4kc2NvcGUudGltZWxpbmVHcm91cHMsIG9wdGlvbnMpO1xuICAgICAgdGhpcy4kc2NvcGUuJHdhdGNoQ29sbGVjdGlvbignZGF0YVN0b3JlLnNldHRpbmdzLnBlcnNvbnMnLCB0aGlzLl9vbldhdGNoUGVyc29ucyk7XG4gICAgICB0aGlzLiRzY29wZS4kd2F0Y2hHcm91cChbJ2RhdGFTdG9yZS5zZXR0aW5ncy5zdGFydFdvcmtpbmdUaW1lJywgJ2RhdGFTdG9yZS5zZXR0aW5ncy5lbmRXb3JraW5nVGltZSddLCB0aGlzLl9vbldhdGNoV29ya2luZ1RpbWUpO1xuICAgICAgdGhpcy4kc2NvcGUuJHdhdGNoQ29sbGVjdGlvbignZGF0YVN0b3JlLm5vdGVzJywgdGhpcy5fb25XYXRjaE5vdGVzKTtcbiAgICAgIHRoaXMuJHNjb3BlLiR3YXRjaENvbGxlY3Rpb24oJ2RhdGFTdG9yZS50aW1lTG9ncycsIHRoaXMuX29uV2F0Y2hOb3Rlcyk7XG4gICAgICB0aGlzLiRzY29wZS4kd2F0Y2hDb2xsZWN0aW9uKCdkYXRhU3RvcmUucHJvZml0TG9ncycsIHRoaXMuX29uV2F0Y2hQcm9maXRMb2dzKTtcbiAgICAgIHRoaXMuJHNjb3BlLiRvbigncmVzaXplOjpyZXNpemUnLCB0aGlzLl9vblJlc2l6ZSk7XG4gICAgfVxuXG4gICAgVGltZWxpbmVDb250cm9sbGVyLnByb3RvdHlwZS5fb25XYXRjaFBlcnNvbnMgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBpLCBpbmRleCwgbGVuLCBwZXJzb24sIHJlZiwgcmVmMTtcbiAgICAgIGlmICghKChyZWYgPSB0aGlzLmRhdGFTdG9yZS5zZXR0aW5ncykgIT0gbnVsbCA/IHJlZi5wZXJzb25zIDogdm9pZCAwKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLiRzY29wZS50aW1lbGluZUdyb3Vwcy5jbGVhcigpO1xuICAgICAgcmVmMSA9IHRoaXMuZGF0YVN0b3JlLnNldHRpbmdzLnBlcnNvbnM7XG4gICAgICBmb3IgKGluZGV4ID0gaSA9IDAsIGxlbiA9IHJlZjEubGVuZ3RoOyBpIDwgbGVuOyBpbmRleCA9ICsraSkge1xuICAgICAgICBwZXJzb24gPSByZWYxW2luZGV4XTtcbiAgICAgICAgdGhpcy4kc2NvcGUudGltZWxpbmVHcm91cHMuYWRkKHtcbiAgICAgICAgICBpZDogcGVyc29uLm5hbWUsXG4gICAgICAgICAgY29udGVudDogcGVyc29uLm5hbWVcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy4kc2NvcGUudGltZWxpbmVHcm91cHMuYWRkKHtcbiAgICAgICAgaWQ6ICd1cGRhdGVkJyxcbiAgICAgICAgY29udGVudDogJ1VwZGF0ZSdcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBUaW1lbGluZUNvbnRyb2xsZXIucHJvdG90eXBlLl9vbldhdGNoV29ya2luZ1RpbWUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciByZWYsIHJlZjE7XG4gICAgICBpZiAoKChyZWYgPSB0aGlzLmRhdGFTdG9yZS5zZXR0aW5ncykgIT0gbnVsbCA/IHJlZi5zdGFydFdvcmtpbmdUaW1lIDogdm9pZCAwKSAmJiAoKHJlZjEgPSB0aGlzLmRhdGFTdG9yZS5zZXR0aW5ncykgIT0gbnVsbCA/IHJlZjEuZW5kV29ya2luZ1RpbWUgOiB2b2lkIDApKSB7XG4gICAgICAgIHJldHVybiB0aGlzLiRzY29wZS50aW1lbGluZS5zZXRPcHRpb25zKHtcbiAgICAgICAgICBoaWRkZW5EYXRlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzdGFydDogbW9tZW50KCkuc3VidHJhY3QoMSwgJ2RheXMnKS5zdGFydE9mKCdkYXknKS5ob3VyKHRoaXMuZGF0YVN0b3JlLnNldHRpbmdzLmVuZFdvcmtpbmdUaW1lKSxcbiAgICAgICAgICAgICAgZW5kOiBtb21lbnQoKS5zdGFydE9mKCdkYXknKS5ob3VyKHRoaXMuZGF0YVN0b3JlLnNldHRpbmdzLnN0YXJ0V29ya2luZ1RpbWUpLFxuICAgICAgICAgICAgICByZXBlYXQ6ICdkYWlseSdcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuJHNjb3BlLnRpbWVsaW5lLnNldE9wdGlvbnMoe1xuICAgICAgICAgIGhpZGRlbkRhdGVzOiB7fVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgVGltZWxpbmVDb250cm9sbGVyLnByb3RvdHlwZS5fb25XYXRjaE5vdGVzID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbm90ZSwgbm90ZUd1aWQsIG5vdGVUaW1lTG9nLCByZWYsIHJlZjEsIHJlc3VsdHMsIHRpbWVMb2csIHRpbWVMb2dzX2lkO1xuICAgICAgdGhpcy4kc2NvcGUudGltZWxpbmVJdGVtcy5jbGVhcigpO1xuICAgICAgcmVmID0gdGhpcy5kYXRhU3RvcmUubm90ZXM7XG4gICAgICBmb3IgKG5vdGVHdWlkIGluIHJlZikge1xuICAgICAgICBub3RlID0gcmVmW25vdGVHdWlkXTtcbiAgICAgICAgdGhpcy4kc2NvcGUudGltZWxpbmVJdGVtcy5hZGQoe1xuICAgICAgICAgIGlkOiBub3RlLmd1aWQsXG4gICAgICAgICAgZ3JvdXA6ICd1cGRhdGVkJyxcbiAgICAgICAgICBjb250ZW50OiBcIjxhIGhyZWY9XFxcImV2ZXJub3RlOi8vL3ZpZXcvXCIgKyB0aGlzLmRhdGFTdG9yZS51c2VyLmlkICsgXCIvXCIgKyB0aGlzLmRhdGFTdG9yZS51c2VyLnNoYXJkSWQgKyBcIi9cIiArIG5vdGUuZ3VpZCArIFwiL1wiICsgbm90ZS5ndWlkICsgXCIvXFxcIiB0aXRsZT1cXFwiXCIgKyBub3RlLnRpdGxlICsgXCJcXFwiPlwiICsgKHRoaXMuJGZpbHRlcignYWJicmV2aWF0ZScpKG5vdGUudGl0bGUsIDQwKSkgKyBcIjwvYT5cIixcbiAgICAgICAgICBzdGFydDogbmV3IERhdGUobm90ZS51cGRhdGVkKSxcbiAgICAgICAgICB0eXBlOiAncG9pbnQnXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmVmMSA9IHRoaXMuZGF0YVN0b3JlLnRpbWVMb2dzO1xuICAgICAgcmVzdWx0cyA9IFtdO1xuICAgICAgZm9yIChub3RlR3VpZCBpbiByZWYxKSB7XG4gICAgICAgIG5vdGVUaW1lTG9nID0gcmVmMVtub3RlR3VpZF07XG4gICAgICAgIHJlc3VsdHMucHVzaCgoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHJlc3VsdHMxO1xuICAgICAgICAgIHJlc3VsdHMxID0gW107XG4gICAgICAgICAgZm9yICh0aW1lTG9nc19pZCBpbiBub3RlVGltZUxvZykge1xuICAgICAgICAgICAgdGltZUxvZyA9IG5vdGVUaW1lTG9nW3RpbWVMb2dzX2lkXTtcbiAgICAgICAgICAgIHJlc3VsdHMxLnB1c2godGhpcy4kc2NvcGUudGltZWxpbmVJdGVtcy5hZGQoe1xuICAgICAgICAgICAgICBpZDogdGltZUxvZy5faWQsXG4gICAgICAgICAgICAgIGdyb3VwOiB0aW1lTG9nLnBlcnNvbixcbiAgICAgICAgICAgICAgY29udGVudDogXCI8YSBocmVmPVxcXCJldmVybm90ZTovLy92aWV3L1wiICsgdGhpcy5kYXRhU3RvcmUudXNlci5pZCArIFwiL1wiICsgdGhpcy5kYXRhU3RvcmUudXNlci5zaGFyZElkICsgXCIvXCIgKyB0aW1lTG9nLm5vdGVHdWlkICsgXCIvXCIgKyB0aW1lTG9nLm5vdGVHdWlkICsgXCIvXFxcIiB0aXRsZT1cXFwiXCIgKyB0aGlzLmRhdGFTdG9yZS5ub3Rlc1t0aW1lTG9nLm5vdGVHdWlkXS50aXRsZSArIFwiIFwiICsgdGltZUxvZy5jb21tZW50ICsgXCJcXFwiPlwiICsgKHRoaXMuJGZpbHRlcignYWJicmV2aWF0ZScpKHRoaXMuZGF0YVN0b3JlLm5vdGVzW3RpbWVMb2cubm90ZUd1aWRdLnRpdGxlLCAyMCkpICsgXCIgXCIgKyAodGhpcy4kZmlsdGVyKCdhYmJyZXZpYXRlJykodGltZUxvZy5jb21tZW50LCAyMCkpICsgXCI8L2E+XCIsXG4gICAgICAgICAgICAgIHN0YXJ0OiBtb21lbnQodGltZUxvZy5kYXRlKSxcbiAgICAgICAgICAgICAgZW5kOiB0aW1lTG9nLnNwZW50VGltZSA/IG1vbWVudCh0aW1lTG9nLmRhdGUpLmFkZCh0aW1lTG9nLnNwZW50VGltZSwgJ21pbnV0ZXMnKSA6IG51bGwsXG4gICAgICAgICAgICAgIHR5cGU6IHRpbWVMb2cuc3BlbnRUaW1lID8gJ3JhbmdlJyA6ICdwb2ludCdcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdHMxO1xuICAgICAgICB9KS5jYWxsKHRoaXMpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH07XG5cbiAgICBUaW1lbGluZUNvbnRyb2xsZXIucHJvdG90eXBlLl9vbldhdGNoUHJvZml0TG9ncyA9IGZ1bmN0aW9uKCkge307XG5cbiAgICBUaW1lbGluZUNvbnRyb2xsZXIucHJvdG90eXBlLl9vblJlc2l6ZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICByZXR1cm4gdGhpcy4kc2NvcGUudGltZWxpbmUuc2V0T3B0aW9ucyh7XG4gICAgICAgIGhlaWdodDogd2luZG93LmlubmVySGVpZ2h0IC0gOTBcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4gVGltZWxpbmVDb250cm9sbGVyO1xuXG4gIH0pKCk7XG5cbiAgYXBwLmNvbnRyb2xsZXIoJ1RpbWVsaW5lQ29udHJvbGxlcicsIFsnJHNjb3BlJywgJyRmaWx0ZXInLCAnZGF0YVN0b3JlJywgVGltZWxpbmVDb250cm9sbGVyXSk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBUaW1lbGluZUNvbnRyb2xsZXI7XG5cbn0pLmNhbGwodGhpcyk7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXRpbWVsaW5lLWNvbnRyb2xsZXIuanMubWFwXG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTAuMFxuKGZ1bmN0aW9uKCkge1xuICBhcHAuZGlyZWN0aXZlKCdyZXNpemUnLCBmdW5jdGlvbigkdGltZW91dCwgJHJvb3RTY29wZSwgJHdpbmRvdykge1xuICAgIHJldHVybiB7XG4gICAgICBsaW5rOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHRpbWVyO1xuICAgICAgICB0aW1lciA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gYW5ndWxhci5lbGVtZW50KCR3aW5kb3cpLm9uKCdsb2FkIHJlc2l6ZScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgaWYgKHRpbWVyKSB7XG4gICAgICAgICAgICAkdGltZW91dC5jYW5jZWwodGltZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdGltZXIgPSAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3Jlc2l6ZTo6cmVzaXplJyk7XG4gICAgICAgICAgfSwgMjAwKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcbiAgfSk7XG5cbn0pLmNhbGwodGhpcyk7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXJlc2l6ZS5qcy5tYXBcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMC4wXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBhYmJyZXZpYXRlO1xuXG4gIGFiYnJldmlhdGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24odGV4dCwgbGVuLCB0cnVuY2F0aW9uKSB7XG4gICAgICB2YXIgY291bnQsIGksIGosIG4sIHJlZiwgc3RyO1xuICAgICAgaWYgKGxlbiA9PSBudWxsKSB7XG4gICAgICAgIGxlbiA9IDEwO1xuICAgICAgfVxuICAgICAgaWYgKHRydW5jYXRpb24gPT0gbnVsbCkge1xuICAgICAgICB0cnVuY2F0aW9uID0gJy4uLic7XG4gICAgICB9XG4gICAgICBjb3VudCA9IDA7XG4gICAgICBzdHIgPSAnJztcbiAgICAgIGZvciAoaSA9IGogPSAwLCByZWYgPSB0ZXh0Lmxlbmd0aCAtIDE7IDAgPD0gcmVmID8gaiA8PSByZWYgOiBqID49IHJlZjsgaSA9IDAgPD0gcmVmID8gKytqIDogLS1qKSB7XG4gICAgICAgIG4gPSBlc2NhcGUodGV4dC5jaGFyQXQoaSkpO1xuICAgICAgICBpZiAobi5sZW5ndGggPCA0KSB7XG4gICAgICAgICAgY291bnQrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb3VudCArPSAyO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb3VudCA+IGxlbikge1xuICAgICAgICAgIHJldHVybiBzdHIgKyB0cnVuY2F0aW9uO1xuICAgICAgICB9XG4gICAgICAgIHN0ciArPSB0ZXh0LmNoYXJBdChpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0ZXh0O1xuICAgIH07XG4gIH07XG5cbiAgYXBwLmZpbHRlcignYWJicmV2aWF0ZScsIGFiYnJldmlhdGUpO1xuXG4gIG1vZHVsZS5leHBvcnRzID0gYWJicmV2aWF0ZTtcblxufSkuY2FsbCh0aGlzKTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YWJicmV2aWF0ZS5qcy5tYXBcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMC4wXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBjaGVja0l0ZW1NYXRjaGVzLCBmaWx0ZXJCeVByb3BlcnR5O1xuXG4gIGNoZWNrSXRlbU1hdGNoZXMgPSAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oaXRlbSwgcHJvcHMpIHtcbiAgICAgIHZhciBpdGVtTWF0Y2hlcywgcHJvcCwgdGV4dDtcbiAgICAgIGl0ZW1NYXRjaGVzID0gZmFsc2U7XG4gICAgICBmb3IgKHByb3AgaW4gcHJvcHMpIHtcbiAgICAgICAgdGV4dCA9IHByb3BzW3Byb3BdO1xuICAgICAgICB0ZXh0ID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBpZiAoaXRlbVtwcm9wXS50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkuaW5kZXhPZih0ZXh0KSAhPT0gLTEpIHtcbiAgICAgICAgICBpdGVtTWF0Y2hlcyA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBpdGVtTWF0Y2hlcztcbiAgICB9O1xuICB9KSh0aGlzKTtcblxuICBmaWx0ZXJCeVByb3BlcnR5ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGl0ZW1zLCBwcm9wcykge1xuICAgICAgdmFyIGksIGl0ZW0sIGl0ZW1NYXRjaGVzLCBrZXksIGxlbiwgb3V0O1xuICAgICAgb3V0ID0gW107XG4gICAgICBpZiAoYW5ndWxhci5pc0FycmF5KGl0ZW1zKSkge1xuICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBpdGVtcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgIGl0ZW0gPSBpdGVtc1tpXTtcbiAgICAgICAgICBpdGVtTWF0Y2hlcyA9IGNoZWNrSXRlbU1hdGNoZXMoaXRlbSwgcHJvcHMpO1xuICAgICAgICAgIGlmIChpdGVtTWF0Y2hlcykge1xuICAgICAgICAgICAgb3V0LnB1c2goaXRlbSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGFuZ3VsYXIuaXNPYmplY3QoaXRlbXMpKSB7XG4gICAgICAgIGZvciAoa2V5IGluIGl0ZW1zKSB7XG4gICAgICAgICAgaXRlbSA9IGl0ZW1zW2tleV07XG4gICAgICAgICAgaXRlbU1hdGNoZXMgPSBjaGVja0l0ZW1NYXRjaGVzKGl0ZW0sIHByb3BzKTtcbiAgICAgICAgICBpZiAoaXRlbU1hdGNoZXMpIHtcbiAgICAgICAgICAgIG91dC5wdXNoKGl0ZW0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3V0ID0gaXRlbXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gIH07XG5cbiAgYXBwLmZpbHRlcignZmlsdGVyQnlQcm9wZXJ0eScsIGZpbHRlckJ5UHJvcGVydHkpO1xuXG4gIG1vZHVsZS5leHBvcnRzID0gZmlsdGVyQnlQcm9wZXJ0eTtcblxufSkuY2FsbCh0aGlzKTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZmlsdGVyLWJ5LXByb3BlcnR5LmpzLm1hcFxuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjEwLjBcbihmdW5jdGlvbigpIHtcbiAgdmFyIG9iamVjdExlbmd0aDtcblxuICBvYmplY3RMZW5ndGggPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgX29iamVjdExlbmd0aDtcbiAgICBfb2JqZWN0TGVuZ3RoID0gZnVuY3Rpb24oaW5wdXQsIGRlcHRoKSB7XG4gICAgICB2YXIga2V5LCByZXN1bHQsIHZhbHVlO1xuICAgICAgaWYgKGRlcHRoID09IG51bGwpIHtcbiAgICAgICAgZGVwdGggPSAwO1xuICAgICAgfVxuICAgICAgaWYgKCFhbmd1bGFyLmlzT2JqZWN0KGlucHV0KSkge1xuICAgICAgICB0aHJvdyBFcnJvcihcIlVzYWdlIG9mIG5vbi1vYmplY3RzIHdpdGggb2JqZWN0TGVuZ3RoIGZpbHRlci5cIik7XG4gICAgICB9XG4gICAgICBpZiAoZGVwdGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKGlucHV0KS5sZW5ndGg7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHQgPSAwO1xuICAgICAgICBmb3IgKGtleSBpbiBpbnB1dCkge1xuICAgICAgICAgIHZhbHVlID0gaW5wdXRba2V5XTtcbiAgICAgICAgICByZXN1bHQgKz0gX29iamVjdExlbmd0aCh2YWx1ZSwgZGVwdGggLSAxKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIF9vYmplY3RMZW5ndGg7XG4gIH07XG5cbiAgYXBwLmZpbHRlcignb2JqZWN0TGVuZ3RoJywgb2JqZWN0TGVuZ3RoKTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IG9iamVjdExlbmd0aDtcblxufSkuY2FsbCh0aGlzKTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9b2JqZWN0LWxlbmd0aC5qcy5tYXBcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMC4wXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBvcmRlck9iamVjdEJ5O1xuXG4gIG9yZGVyT2JqZWN0QnkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oaXRlbXMsIGZpZWxkLCByZXZlcnNlKSB7XG4gICAgICB2YXIgZmlsdGVyZWQsIHJlc3VsdHM7XG4gICAgICBpZiAoZmllbGQgPT0gbnVsbCkge1xuICAgICAgICBmaWVsZCA9ICckdmFsdWUnO1xuICAgICAgfVxuICAgICAgaWYgKHJldmVyc2UgPT0gbnVsbCkge1xuICAgICAgICByZXZlcnNlID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGZpbHRlcmVkID0gW107XG4gICAgICBhbmd1bGFyLmZvckVhY2goaXRlbXMsIGZ1bmN0aW9uKGl0ZW0sIGtleSkge1xuICAgICAgICByZXR1cm4gZmlsdGVyZWQucHVzaCh7XG4gICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgaXRlbTogaXRlbVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgZmlsdGVyZWQuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgIGlmIChmaWVsZCA9PT0gJyRrZXknKSB7XG4gICAgICAgICAgaWYgKGEua2V5ID4gYi5rZXkpIHtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChmaWVsZCA9PT0gJyR2YWx1ZScpIHtcbiAgICAgICAgICBpZiAoYS5pdGVtID4gYi5pdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGZpZWxkID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIGlmIChhW2ZpZWxkXSA+IGJbZmllbGRdKSB7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGZpZWxkID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgaWYgKGZpZWxkKGEuaXRlbSwgYS5rZXkpID4gZmllbGQoYi5pdGVtLCBiLmtleSkpIHtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGlmIChyZXZlcnNlKSB7XG4gICAgICAgIGZpbHRlcmVkLnJldmVyc2UoKTtcbiAgICAgIH1cbiAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgIGFuZ3VsYXIuZm9yRWFjaChmaWx0ZXJlZCwgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICB2YXIgcmVzdWx0O1xuICAgICAgICByZXN1bHQgPSBpdGVtLml0ZW07XG4gICAgICAgIHJlc3VsdFsnJGtleSddID0gaXRlbS5rZXk7XG4gICAgICAgIHJldHVybiByZXN1bHRzLnB1c2gocmVzdWx0KTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfTtcbiAgfTtcblxuICBhcHAuZmlsdGVyKCdvcmRlck9iamVjdEJ5Jywgb3JkZXJPYmplY3RCeSk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBvcmRlck9iamVjdEJ5O1xuXG59KS5jYWxsKHRoaXMpO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1vcmRlci1vYmplY3QtYnkuanMubWFwXG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTAuMFxuKGZ1bmN0aW9uKCkge1xuICB2YXIgc3BlbnRUaW1lO1xuXG4gIHNwZW50VGltZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgdmFyIGhvdXIsIG1pbnV0ZTtcbiAgICAgIGlmIChpbnB1dCA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICAgIH1cbiAgICAgIGlmICghaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuICcwbSc7XG4gICAgICB9XG4gICAgICBob3VyID0gTWF0aC5mbG9vcihpbnB1dCAvIDYwKTtcbiAgICAgIG1pbnV0ZSA9IGlucHV0ICUgNjA7XG4gICAgICBpZiAoaG91cikge1xuICAgICAgICByZXR1cm4gaG91ciArICdoJyArIG1pbnV0ZSArICdtJztcbiAgICAgIH1cbiAgICAgIHJldHVybiBtaW51dGUgKyAnbSc7XG4gICAgfTtcbiAgfTtcblxuICBhcHAuZmlsdGVyKCdzcGVudFRpbWUnLCBzcGVudFRpbWUpO1xuXG4gIG1vZHVsZS5leHBvcnRzID0gc3BlbnRUaW1lO1xuXG59KS5jYWxsKHRoaXMpO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1zcGVudC10aW1lLmpzLm1hcFxuIiwiIyBhbmd1bGFyLmpzIHNldHRpbmdcclxud2luZG93LmFwcCA9IGFuZ3VsYXIubW9kdWxlKCdBcHAnLCBbJ25nUm91dGUnLCAndWkuYm9vdHN0cmFwJywgJ25nU2FuaXRpemUnLCAndWkuc2VsZWN0J10pXHJcblxyXG5hcHAuY29uZmlnIFsnJGNvbXBpbGVQcm92aWRlcicsICgkY29tcGlsZVByb3ZpZGVyKSAtPlxyXG4gICRjb21waWxlUHJvdmlkZXIuYUhyZWZTYW5pdGl6YXRpb25XaGl0ZWxpc3QoL15cXHMqKGh0dHB8aHR0cHN8bWFpbHRvfGV2ZXJub3RlKTovKTtcclxuXVxyXG5cclxuIyByb3V0ZSBzZXR0aW5nc1xyXG5yZXF1aXJlICcuL3JvdXRlJ1xyXG5cclxuIyBhbmd1bGFyLmpzIGZpbHRlcnNcclxucmVxdWlyZSAnLi9maWx0ZXJzL2FiYnJldmlhdGUnXHJcbnJlcXVpcmUgJy4vZmlsdGVycy9maWx0ZXItYnktcHJvcGVydHknXHJcbnJlcXVpcmUgJy4vZmlsdGVycy9vYmplY3QtbGVuZ3RoJ1xyXG5yZXF1aXJlICcuL2ZpbHRlcnMvb3JkZXItb2JqZWN0LWJ5J1xyXG5yZXF1aXJlICcuL2ZpbHRlcnMvc3BlbnQtdGltZSdcclxuXHJcbiMgYW5ndWxhci5qcyBzZXJ2aWNlc1xyXG5yZXF1aXJlICcuL3NlcnZpY2VzL2RhdGEtc3RvcmUnXHJcbnJlcXVpcmUgJy4vc2VydmljZXMvZGF0YS10cmFuc2NpZXZlcidcclxucmVxdWlyZSAnLi9zZXJ2aWNlcy9ub3RlLXF1ZXJ5J1xyXG5yZXF1aXJlICcuL3NlcnZpY2VzL3Byb2dyZXNzJ1xyXG5yZXF1aXJlICcuL3NlcnZpY2VzL3RpbWUtbG9nLXF1ZXJ5J1xyXG5cclxuIyBhbmd1bGFyLmpzIGRpcmVjdGl2ZXNcclxucmVxdWlyZSAnLi9kaXJlY3RpdmVzL3Jlc2l6ZSdcclxuXHJcbiMgYW5ndWxhci5qcyBjb250cm9sbGVyc1xyXG5yZXF1aXJlICcuL2NvbnRyb2xsZXJzL2F1dGgtY29udHJvbGxlcidcclxucmVxdWlyZSAnLi9jb250cm9sbGVycy9jb250cm9sbGVyJ1xyXG5yZXF1aXJlICcuL2NvbnRyb2xsZXJzL21lbnUtY29udHJvbGxlcidcclxucmVxdWlyZSAnLi9jb250cm9sbGVycy9uYXZpZ2F0aW9uLWNvbnRyb2xsZXInXHJcbnJlcXVpcmUgJy4vY29udHJvbGxlcnMvbm90ZXMtY29udHJvbGxlcidcclxucmVxdWlyZSAnLi9jb250cm9sbGVycy9wcm9ncmVzcy1tb2RhbC1jb250cm9sbGVyJ1xyXG5yZXF1aXJlICcuL2NvbnRyb2xsZXJzL3NldHRpbmdzLWNvbnRyb2xsZXInXHJcbnJlcXVpcmUgJy4vY29udHJvbGxlcnMvdGltZWxpbmUtY29udHJvbGxlcidcclxuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjEwLjBcbihmdW5jdGlvbigpIHtcbiAgYXBwLmNvbmZpZyhbXG4gICAgJyRyb3V0ZVByb3ZpZGVyJywgZnVuY3Rpb24oJHJvdXRlUHJvdmlkZXIpIHtcbiAgICAgIHJldHVybiAkcm91dGVQcm92aWRlci53aGVuKCcvJywge1xuICAgICAgICB0ZW1wbGF0ZVVybDogJ21lbnUnXG4gICAgICB9KS53aGVuKCcvdGltZWxpbmUnLCB7XG4gICAgICAgIHRlbXBsYXRlVXJsOiAndGltZWxpbmUnXG4gICAgICB9KS53aGVuKCcvbm90ZXMnLCB7XG4gICAgICAgIHRlbXBsYXRlVXJsOiAnbm90ZXMnXG4gICAgICB9KS53aGVuKCcvc2V0dGluZ3MnLCB7XG4gICAgICAgIHRlbXBsYXRlVXJsOiAnc2V0dGluZ3MnXG4gICAgICB9KS5vdGhlcndpc2Uoe1xuICAgICAgICByZWRpcmVjdFRvOiAnLydcbiAgICAgIH0pO1xuICAgIH1cbiAgXSk7XG5cbn0pLmNhbGwodGhpcyk7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXJvdXRlLmpzLm1hcFxuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjEwLjBcbihmdW5jdGlvbigpIHtcbiAgdmFyIERhdGFTdG9yZVNlcnZpY2U7XG5cbiAgRGF0YVN0b3JlU2VydmljZSA9IChmdW5jdGlvbigpIHtcblxuICAgIC8qKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqL1xuICAgIERhdGFTdG9yZVNlcnZpY2UucHJvdG90eXBlLnVzZXIgPSBudWxsO1xuXG5cbiAgICAvKipcbiAgICAgKiBAcHVibGljXG4gICAgICogQHR5cGUge0FycmF5fVxuICAgICAqL1xuXG4gICAgRGF0YVN0b3JlU2VydmljZS5wcm90b3R5cGUucGVyc29ucyA9IFtdO1xuXG5cbiAgICAvKipcbiAgICAgKiBAcHVibGljXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cblxuICAgIERhdGFTdG9yZVNlcnZpY2UucHJvdG90eXBlLm5vdGVib29rcyA9IHt9O1xuXG5cbiAgICAvKipcbiAgICAgKiBAcHVibGljXG4gICAgICogQHR5cGUge0FycmF5fVxuICAgICAqL1xuXG4gICAgRGF0YVN0b3JlU2VydmljZS5wcm90b3R5cGUuc3RhY2tzID0gW107XG5cblxuICAgIC8qKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqL1xuXG4gICAgRGF0YVN0b3JlU2VydmljZS5wcm90b3R5cGUubm90ZXMgPSB7fTtcblxuXG4gICAgLyoqXG4gICAgICogQHB1YmxpY1xuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICovXG5cbiAgICBEYXRhU3RvcmVTZXJ2aWNlLnByb3RvdHlwZS50aW1lTG9ncyA9IHt9O1xuXG5cbiAgICAvKipcbiAgICAgKiBAcHVibGljXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cblxuICAgIERhdGFTdG9yZVNlcnZpY2UucHJvdG90eXBlLnByb2ZpdExvZ3MgPSB7fTtcblxuXG4gICAgLyoqXG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICovXG5cbiAgICBmdW5jdGlvbiBEYXRhU3RvcmVTZXJ2aWNlKCkge31cblxuICAgIHJldHVybiBEYXRhU3RvcmVTZXJ2aWNlO1xuXG4gIH0pKCk7XG5cbiAgYXBwLnNlcnZpY2UoJ2RhdGFTdG9yZScsIFtEYXRhU3RvcmVTZXJ2aWNlXSk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBEYXRhU3RvcmVTZXJ2aWNlO1xuXG59KS5jYWxsKHRoaXMpO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhLXN0b3JlLmpzLm1hcFxuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjEwLjBcbihmdW5jdGlvbigpIHtcbiAgdmFyIERhdGFUcmFuc2NpZXZlclNlcnZpY2UsIGFzeW5jLFxuICAgIGJpbmQgPSBmdW5jdGlvbihmbiwgbWUpeyByZXR1cm4gZnVuY3Rpb24oKXsgcmV0dXJuIGZuLmFwcGx5KG1lLCBhcmd1bWVudHMpOyB9OyB9O1xuXG4gIGFzeW5jID0gcmVxdWlyZSgnYXN5bmMnKTtcblxuICBEYXRhVHJhbnNjaWV2ZXJTZXJ2aWNlID0gKGZ1bmN0aW9uKCkge1xuXG4gICAgLyoqXG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICogQHBhcmFtIHskSHR0cFByb3ZpZGVyfSAkaHR0cFxuICAgICAqIEBwYXJhbSB7RGF0YVN0b3JlU2VydmljZX0gZGF0YVN0b3JlXG4gICAgICogQHBhcmFtIHtOb3RlUXVlcnlTZXJ2aWNlfSBub3RlUXVlcnlcbiAgICAgKiBAcGFyYW0ge1Byb2dyZXNzU2VydmljZX0gcHJvZ3Jlc3NcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBEYXRhVHJhbnNjaWV2ZXJTZXJ2aWNlKCRodHRwLCBkYXRhU3RvcmUsIG5vdGVRdWVyeSwgcHJvZ3Jlc3MpIHtcbiAgICAgIHRoaXMuJGh0dHAgPSAkaHR0cDtcbiAgICAgIHRoaXMuZGF0YVN0b3JlID0gZGF0YVN0b3JlO1xuICAgICAgdGhpcy5ub3RlUXVlcnkgPSBub3RlUXVlcnk7XG4gICAgICB0aGlzLnByb2dyZXNzID0gcHJvZ3Jlc3M7XG4gICAgICB0aGlzLnJlbG9hZCA9IGJpbmQodGhpcy5yZWxvYWQsIHRoaXMpO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogQHB1YmxpY1xuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrXG4gICAgICovXG5cbiAgICBEYXRhVHJhbnNjaWV2ZXJTZXJ2aWNlLnByb3RvdHlwZS5yZWxvYWQgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgdmFyIG5vdGVDb3VudCwgcXVlcnk7XG4gICAgICBpZiAoIWNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge307XG4gICAgICAgIH0pKHRoaXMpO1xuICAgICAgfVxuICAgICAgcXVlcnkgPSB0aGlzLm5vdGVRdWVyeS5xdWVyeSgpO1xuICAgICAgbm90ZUNvdW50ID0gMDtcbiAgICAgIHRoaXMucHJvZ3Jlc3Mub3BlbigpO1xuICAgICAgcmV0dXJuIGFzeW5jLnNlcmllcyhbXG4gICAgICAgIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgaWYgKF90aGlzLmRhdGFTdG9yZS51c2VyKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3Muc2V0KCdHZXR0aW5nIHVzZXIgZGF0YS4nLCAwKTtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy4kaHR0cC5nZXQoJy91c2VyJykuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgIF90aGlzLmRhdGFTdG9yZS51c2VyID0gZGF0YTtcbiAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9KS5lcnJvcihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCdFcnJvciAkaHR0cCByZXF1ZXN0Jyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9O1xuICAgICAgICB9KSh0aGlzKSwgKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5zZXQoJ0dldHRpbmcgc2V0dGluZ3MgZGF0YS4nLCAxMCk7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuJGh0dHAuZ2V0KCcvc2V0dGluZ3MnKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLnNldHRpbmdzID0gZGF0YTtcbiAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9KS5lcnJvcihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCdFcnJvciAkaHR0cCByZXF1ZXN0Jyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9O1xuICAgICAgICB9KSh0aGlzKSwgKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpZiAoIV90aGlzLmRhdGFTdG9yZS5zZXR0aW5ncy5wZXJzb25zIHx8IF90aGlzLmRhdGFTdG9yZS5zZXR0aW5ncy5wZXJzb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soJ1RoaXMgYXBwIG5lZWQgcGVyc29ucyBzZXR0aW5nLiBQbGVhc2Ugc3dpdGNoIFwiU2V0dGluZ3MgUGFnZVwiIGFuZCBzZXQgeW91ciBwZXJzb25zIGRhdGEuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9KSh0aGlzKSwgKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5zZXQoJ1N5bmNpbmcgcmVtb3RlIHNlcnZlci4nLCAyMCk7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuJGh0dHAuZ2V0KCcvc3luYycpLnN1Y2Nlc3MoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfSkuZXJyb3IoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygnRXJyb3IgJGh0dHAgcmVxdWVzdCcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSkodGhpcyksIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3Muc2V0KCdHZXR0aW5nIG5vdGVib29rcyBkYXRhLicsIDMwKTtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy4kaHR0cC5nZXQoJy9ub3RlYm9va3MnKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgdmFyIGksIGxlbiwgbm90ZWJvb2ssIHN0YWNrSGFzaDtcbiAgICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLm5vdGVib29rcyA9IHt9O1xuICAgICAgICAgICAgICBzdGFja0hhc2ggPSB7fTtcbiAgICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuID0gZGF0YS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIG5vdGVib29rID0gZGF0YVtpXTtcbiAgICAgICAgICAgICAgICBfdGhpcy5kYXRhU3RvcmUubm90ZWJvb2tzW25vdGVib29rLmd1aWRdID0gbm90ZWJvb2s7XG4gICAgICAgICAgICAgICAgaWYgKG5vdGVib29rLnN0YWNrKSB7XG4gICAgICAgICAgICAgICAgICBzdGFja0hhc2hbbm90ZWJvb2suc3RhY2tdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLnN0YWNrcyA9IE9iamVjdC5rZXlzKHN0YWNrSGFzaCk7XG4gICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfSkuZXJyb3IoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygnRXJyb3IgJGh0dHAgcmVxdWVzdCcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSkodGhpcyksIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3Muc2V0KCdHZXR0aW5nIG5vdGVzIGNvdW50LicsIDQwKTtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy4kaHR0cC5nZXQoJy9ub3Rlcy9jb3VudCcsIHtcbiAgICAgICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICAgICAgcXVlcnk6IHF1ZXJ5XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICBub3RlQ291bnQgPSBkYXRhO1xuICAgICAgICAgICAgICBpZiAobm90ZUNvdW50ID4gMTAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5jb25maXJtKFwiQ3VycmVudCBxdWVyeSBmaW5kIFwiICsgbm90ZUNvdW50ICsgXCIgbm90ZXMuIEl0IGlzIHRvbyBtYW55LiBDb250aW51ZSBhbnl3YXk/XCIpKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCdVc2VyIENhbmNlbGVkJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KS5lcnJvcihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCdFcnJvciAkaHR0cCByZXF1ZXN0Jyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9O1xuICAgICAgICB9KSh0aGlzKSwgKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5zZXQoJ1JlcXVlc3QgcmVtb3RlIGNvbnRlbnRzLicsIDUwKTtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy4kaHR0cC5nZXQoJy9ub3Rlcy9nZXQtY29udGVudCcsIHtcbiAgICAgICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICAgICAgcXVlcnk6IHF1ZXJ5XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLnN1Y2Nlc3MoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfSkuZXJyb3IoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygnRXJyb3IgJGh0dHAgcmVxdWVzdCcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSkodGhpcyksIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3Muc2V0KCdHZXR0aW5nIG5vdGVzLicsIDcwKTtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy4kaHR0cC5nZXQoJy9ub3RlcycsIHtcbiAgICAgICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICAgICAgcXVlcnk6IHF1ZXJ5LFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGZhbHNlXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICB2YXIgaSwgbGVuLCBub3RlO1xuICAgICAgICAgICAgICBfdGhpcy5kYXRhU3RvcmUubm90ZXMgPSB7fTtcbiAgICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuID0gZGF0YS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIG5vdGUgPSBkYXRhW2ldO1xuICAgICAgICAgICAgICAgIF90aGlzLmRhdGFTdG9yZS5ub3Rlc1tub3RlLmd1aWRdID0gbm90ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH0pLmVycm9yKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soJ0Vycm9yICRodHRwIHJlcXVlc3QnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH07XG4gICAgICAgIH0pKHRoaXMpLCAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBndWlkcywgbm90ZSwgbm90ZUd1aWQ7XG4gICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5zZXQoJ0dldHRpbmcgdGltZSBsb2dzLicsIDgwKTtcbiAgICAgICAgICAgIGd1aWRzID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICB2YXIgcmVmLCByZXN1bHRzO1xuICAgICAgICAgICAgICByZWYgPSB0aGlzLmRhdGFTdG9yZS5ub3RlcztcbiAgICAgICAgICAgICAgcmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgICBmb3IgKG5vdGVHdWlkIGluIHJlZikge1xuICAgICAgICAgICAgICAgIG5vdGUgPSByZWZbbm90ZUd1aWRdO1xuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChub3RlLmd1aWQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgICAgICAgICAgfSkuY2FsbChfdGhpcyk7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuJGh0dHAucG9zdCgnL3RpbWUtbG9ncycsIHtcbiAgICAgICAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICAgICAgICBub3RlR3VpZDoge1xuICAgICAgICAgICAgICAgICAgJGluOiBndWlkc1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgIHZhciBiYXNlLCBpLCBsZW4sIG5hbWUsIHRpbWVMb2c7XG4gICAgICAgICAgICAgIF90aGlzLmRhdGFTdG9yZS50aW1lTG9ncyA9IHt9O1xuICAgICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBkYXRhLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGltZUxvZyA9IGRhdGFbaV07XG4gICAgICAgICAgICAgICAgaWYgKChiYXNlID0gX3RoaXMuZGF0YVN0b3JlLnRpbWVMb2dzKVtuYW1lID0gdGltZUxvZy5ub3RlR3VpZF0gPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgYmFzZVtuYW1lXSA9IHt9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfdGhpcy5kYXRhU3RvcmUudGltZUxvZ3NbdGltZUxvZy5ub3RlR3VpZF1bdGltZUxvZy5faWRdID0gdGltZUxvZztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH0pLmVycm9yKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soJ0Vycm9yICRodHRwIHJlcXVlc3QnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH07XG4gICAgICAgIH0pKHRoaXMpLCAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBndWlkcywgbm90ZSwgbm90ZUd1aWQ7XG4gICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5zZXQoJ0dldHRpbmcgcHJvZml0IGxvZ3MuJywgOTApO1xuICAgICAgICAgICAgZ3VpZHMgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHZhciByZWYsIHJlc3VsdHM7XG4gICAgICAgICAgICAgIHJlZiA9IHRoaXMuZGF0YVN0b3JlLm5vdGVzO1xuICAgICAgICAgICAgICByZXN1bHRzID0gW107XG4gICAgICAgICAgICAgIGZvciAobm90ZUd1aWQgaW4gcmVmKSB7XG4gICAgICAgICAgICAgICAgbm90ZSA9IHJlZltub3RlR3VpZF07XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKG5vdGUuZ3VpZCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICAgICAgICB9KS5jYWxsKF90aGlzKTtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy4kaHR0cC5wb3N0KCcvcHJvZml0LWxvZ3MnLCB7XG4gICAgICAgICAgICAgIHF1ZXJ5OiB7XG4gICAgICAgICAgICAgICAgbm90ZUd1aWQ6IHtcbiAgICAgICAgICAgICAgICAgICRpbjogZ3VpZHNcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICB2YXIgYmFzZSwgaSwgbGVuLCBuYW1lLCBwcm9maXRMb2c7XG4gICAgICAgICAgICAgIF90aGlzLmRhdGFTdG9yZS5wcm9maXRMb2dzID0ge307XG4gICAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBwcm9maXRMb2cgPSBkYXRhW2ldO1xuICAgICAgICAgICAgICAgIGlmICgoYmFzZSA9IF90aGlzLmRhdGFTdG9yZS5wcm9maXRMb2dzKVtuYW1lID0gcHJvZml0TG9nLm5vdGVHdWlkXSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICBiYXNlW25hbWVdID0ge307XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF90aGlzLmRhdGFTdG9yZS5wcm9maXRMb2dzW3Byb2ZpdExvZy5ub3RlR3VpZF1bcHJvZml0TG9nLl9pZF0gPSBwcm9maXRMb2c7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9KS5lcnJvcihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCdFcnJvciAkaHR0cCByZXF1ZXN0Jyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9O1xuICAgICAgICB9KSh0aGlzKVxuICAgICAgXSwgKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBhbGVydChlcnIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5zZXQoJ0RvbmUuJywgMTAwKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgX3RoaXMucHJvZ3Jlc3MuY2xvc2UoKTtcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpKTtcbiAgICB9O1xuXG4gICAgRGF0YVRyYW5zY2lldmVyU2VydmljZS5wcm90b3R5cGUucmVQYXJzZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICBpZiAoIWNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge307XG4gICAgICAgIH0pKHRoaXMpO1xuICAgICAgfVxuICAgICAgdGhpcy5wcm9ncmVzcy5vcGVuKCk7XG4gICAgICB0aGlzLnByb2dyZXNzLnNldCgnUmUgUGFyc2Ugbm90ZXMuLi4nLCA1MCk7XG4gICAgICByZXR1cm4gYXN5bmMud2F0ZXJmYWxsKFtcbiAgICAgICAgKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuJGh0dHAuZ2V0KCcvbm90ZXMvcmUtcGFyc2UnKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9KS5lcnJvcihmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygnRXJyb3IgJGh0dHAgcmVxdWVzdCcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSkodGhpcylcbiAgICAgIF0sIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgX3RoaXMucHJvZ3Jlc3Muc2V0KCdEb25lLicsIDEwMCk7XG4gICAgICAgICAgX3RoaXMucHJvZ3Jlc3MuY2xvc2UoKTtcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIERhdGFUcmFuc2NpZXZlclNlcnZpY2U7XG5cbiAgfSkoKTtcblxuICBhcHAuc2VydmljZSgnZGF0YVRyYW5zY2lldmVyJywgWyckaHR0cCcsICdkYXRhU3RvcmUnLCAnbm90ZVF1ZXJ5JywgJ3Byb2dyZXNzJywgRGF0YVRyYW5zY2lldmVyU2VydmljZV0pO1xuXG4gIG1vZHVsZS5leHBvcnRzID0gRGF0YVRyYW5zY2lldmVyU2VydmljZTtcblxufSkuY2FsbCh0aGlzKTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YS10cmFuc2NpZXZlci5qcy5tYXBcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMC4wXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBOb3RlUXVlcnlTZXJ2aWNlLCBtZXJnZSxcbiAgICBiaW5kID0gZnVuY3Rpb24oZm4sIG1lKXsgcmV0dXJuIGZ1bmN0aW9uKCl7IHJldHVybiBmbi5hcHBseShtZSwgYXJndW1lbnRzKTsgfTsgfTtcblxuICBtZXJnZSA9IHJlcXVpcmUoJ21lcmdlJyk7XG5cbiAgTm90ZVF1ZXJ5U2VydmljZSA9IChmdW5jdGlvbigpIHtcblxuICAgIC8qKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqL1xuICAgIE5vdGVRdWVyeVNlcnZpY2UucHJvdG90eXBlLnVwZGF0ZWQgPSAzO1xuXG5cbiAgICAvKipcbiAgICAgKiBAcHVibGljXG4gICAgICogQHR5cGUge0FycmF5fVxuICAgICAqL1xuXG4gICAgTm90ZVF1ZXJ5U2VydmljZS5wcm90b3R5cGUubm90ZWJvb2tzID0gbnVsbDtcblxuXG4gICAgLyoqXG4gICAgICogQHB1YmxpY1xuICAgICAqIEB0eXBlIHtBcnJheX1cbiAgICAgKi9cblxuICAgIE5vdGVRdWVyeVNlcnZpY2UucHJvdG90eXBlLnN0YWNrcyA9IG51bGw7XG5cblxuICAgIC8qKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqL1xuXG4gICAgTm90ZVF1ZXJ5U2VydmljZS5wcm90b3R5cGUuY291bnQgPSBudWxsO1xuXG5cbiAgICAvKipcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKiBAcGFyYW0ge1N5bmNEYXRhU2VydmljZX0gc3luY0RhdGFcbiAgICAgKi9cblxuICAgIGZ1bmN0aW9uIE5vdGVRdWVyeVNlcnZpY2UoZGF0YVN0b3JlKSB7XG4gICAgICB0aGlzLmRhdGFTdG9yZSA9IGRhdGFTdG9yZTtcbiAgICAgIHRoaXMucXVlcnkgPSBiaW5kKHRoaXMucXVlcnksIHRoaXMpO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogQHB1YmxpY1xuICAgICAqIEByZXR1cm4ge09iamVjdH1cbiAgICAgKi9cblxuICAgIE5vdGVRdWVyeVNlcnZpY2UucHJvdG90eXBlLnF1ZXJ5ID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaSwgaiwgbGVuLCBsZW4xLCBub3RlYm9vaywgbm90ZWJvb2tHdWlkLCBub3RlYm9va3NBcnJheSwgbm90ZWJvb2tzSGFzaCwgcmVmLCByZWYxLCByZWYyLCByZXN1bHQsIHN0YWNrO1xuICAgICAgcmVzdWx0ID0ge307XG4gICAgICBpZiAodGhpcy51cGRhdGVkKSB7XG4gICAgICAgIG1lcmdlKHJlc3VsdCwge1xuICAgICAgICAgIHVwZGF0ZWQ6IHtcbiAgICAgICAgICAgICRndGU6IHBhcnNlSW50KG1vbWVudCgpLnN0YXJ0T2YoJ2RheScpLnN1YnRyYWN0KHRoaXMudXBkYXRlZCwgJ2RheXMnKS5mb3JtYXQoJ3gnKSlcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgbm90ZWJvb2tzSGFzaCA9IHt9O1xuICAgICAgaWYgKHRoaXMubm90ZWJvb2tzICYmIHRoaXMubm90ZWJvb2tzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmVmID0gdGhpcy5ub3RlYm9va3M7XG4gICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IHJlZi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgIG5vdGVib29rR3VpZCA9IHJlZltpXTtcbiAgICAgICAgICBub3RlYm9va3NIYXNoW25vdGVib29rR3VpZF0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5zdGFja3MgJiYgdGhpcy5zdGFja3MubGVuZ3RoID4gMCkge1xuICAgICAgICByZWYxID0gdGhpcy5zdGFja3M7XG4gICAgICAgIGZvciAoaiA9IDAsIGxlbjEgPSByZWYxLmxlbmd0aDsgaiA8IGxlbjE7IGorKykge1xuICAgICAgICAgIHN0YWNrID0gcmVmMVtqXTtcbiAgICAgICAgICByZWYyID0gdGhpcy5kYXRhU3RvcmUubm90ZWJvb2tzO1xuICAgICAgICAgIGZvciAobm90ZWJvb2tHdWlkIGluIHJlZjIpIHtcbiAgICAgICAgICAgIG5vdGVib29rID0gcmVmMltub3RlYm9va0d1aWRdO1xuICAgICAgICAgICAgaWYgKHN0YWNrID09PSBub3RlYm9vay5zdGFjaykge1xuICAgICAgICAgICAgICBub3RlYm9va3NIYXNoW25vdGVib29rLmd1aWRdID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIG5vdGVib29rc0FycmF5ID0gT2JqZWN0LmtleXMobm90ZWJvb2tzSGFzaCk7XG4gICAgICBpZiAobm90ZWJvb2tzQXJyYXkubGVuZ3RoID4gMCkge1xuICAgICAgICBtZXJnZShyZXN1bHQsIHtcbiAgICAgICAgICBub3RlYm9va0d1aWQ6IHtcbiAgICAgICAgICAgICRpbjogbm90ZWJvb2tzQXJyYXlcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIE5vdGVRdWVyeVNlcnZpY2U7XG5cbiAgfSkoKTtcblxuICBhcHAuc2VydmljZSgnbm90ZVF1ZXJ5JywgWydkYXRhU3RvcmUnLCBOb3RlUXVlcnlTZXJ2aWNlXSk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBOb3RlUXVlcnlTZXJ2aWNlO1xuXG59KS5jYWxsKHRoaXMpO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1ub3RlLXF1ZXJ5LmpzLm1hcFxuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjEwLjBcbihmdW5jdGlvbigpIHtcbiAgdmFyIFByb2dyZXNzU2VydmljZSxcbiAgICBiaW5kID0gZnVuY3Rpb24oZm4sIG1lKXsgcmV0dXJuIGZ1bmN0aW9uKCl7IHJldHVybiBmbi5hcHBseShtZSwgYXJndW1lbnRzKTsgfTsgfTtcblxuICBQcm9ncmVzc1NlcnZpY2UgPSAoZnVuY3Rpb24oKSB7XG4gICAgUHJvZ3Jlc3NTZXJ2aWNlLnByb3RvdHlwZS5tb2RhbEluc3RhbmNlID0gbnVsbDtcblxuICAgIFByb2dyZXNzU2VydmljZS5wcm90b3R5cGUudmFsdWUgPSAwO1xuXG4gICAgUHJvZ3Jlc3NTZXJ2aWNlLnByb3RvdHlwZS5tZXNzYWdlID0gJyc7XG5cbiAgICBmdW5jdGlvbiBQcm9ncmVzc1NlcnZpY2UoJG1vZGFsKSB7XG4gICAgICB0aGlzLiRtb2RhbCA9ICRtb2RhbDtcbiAgICAgIHRoaXMuc2V0ID0gYmluZCh0aGlzLnNldCwgdGhpcyk7XG4gICAgICB0aGlzLmNsb3NlID0gYmluZCh0aGlzLmNsb3NlLCB0aGlzKTtcbiAgICAgIHRoaXMub3BlbiA9IGJpbmQodGhpcy5vcGVuLCB0aGlzKTtcbiAgICB9XG5cbiAgICBQcm9ncmVzc1NlcnZpY2UucHJvdG90eXBlLm9wZW4gPSBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMubWVzc2FnZSA9ICdwcm9jZXNzaW5nLi4uJztcbiAgICAgIHRoaXMudmFsdWUgPSAwO1xuICAgICAgcmV0dXJuIHRoaXMubW9kYWxJbnN0YW5jZSA9IHRoaXMuJG1vZGFsLm9wZW4oe1xuICAgICAgICB0ZW1wbGF0ZVVybDogJ3Byb2dyZXNzLW1vZGFsJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1Byb2dyZXNzTW9kYWxDb250cm9sbGVyJyxcbiAgICAgICAgYmFja2Ryb3A6ICdzdGF0aWMnLFxuICAgICAgICBrZXlib2FyZDogZmFsc2UsXG4gICAgICAgIHNpemU6ICdzbScsXG4gICAgICAgIGFuaW1hdGlvbjogZmFsc2VcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBQcm9ncmVzc1NlcnZpY2UucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5tb2RhbEluc3RhbmNlLmNsb3NlKCk7XG4gICAgfTtcblxuICAgIFByb2dyZXNzU2VydmljZS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24obWVzc2FnZSwgdmFsdWUpIHtcbiAgICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICAgIHZhbHVlID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICBpZiAodmFsdWUgIT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIFByb2dyZXNzU2VydmljZTtcblxuICB9KSgpO1xuXG4gIGFwcC5zZXJ2aWNlKCdwcm9ncmVzcycsIFsnJG1vZGFsJywgUHJvZ3Jlc3NTZXJ2aWNlXSk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBQcm9ncmVzc1NlcnZpY2U7XG5cbn0pLmNhbGwodGhpcyk7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXByb2dyZXNzLmpzLm1hcFxuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjEwLjBcbihmdW5jdGlvbigpIHtcbiAgdmFyIFRpbWVMb2dRdWVyeVNlcnZpY2UsIG1lcmdlLFxuICAgIGJpbmQgPSBmdW5jdGlvbihmbiwgbWUpeyByZXR1cm4gZnVuY3Rpb24oKXsgcmV0dXJuIGZuLmFwcGx5KG1lLCBhcmd1bWVudHMpOyB9OyB9O1xuXG4gIG1lcmdlID0gcmVxdWlyZSgnbWVyZ2UnKTtcblxuICBUaW1lTG9nUXVlcnlTZXJ2aWNlID0gKGZ1bmN0aW9uKCkge1xuXG4gICAgLyoqXG4gICAgICogQHB1YmxpY1xuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgVGltZUxvZ1F1ZXJ5U2VydmljZS5wcm90b3R5cGUud29ya2VkID0gMztcblxuXG4gICAgLyoqXG4gICAgICogQHB1YmxpY1xuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG5cbiAgICBUaW1lTG9nUXVlcnlTZXJ2aWNlLnByb3RvdHlwZS5jb3VudCA9IG51bGw7XG5cblxuICAgIC8qKlxuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqIEBwYXJhbSB7U3luY0RhdGFTZXJ2aWNlfSBzeW5jRGF0YVxuICAgICAqL1xuXG4gICAgZnVuY3Rpb24gVGltZUxvZ1F1ZXJ5U2VydmljZShkYXRhU3RvcmUpIHtcbiAgICAgIHRoaXMuZGF0YVN0b3JlID0gZGF0YVN0b3JlO1xuICAgICAgdGhpcy5xdWVyeSA9IGJpbmQodGhpcy5xdWVyeSwgdGhpcyk7XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBAcHVibGljXG4gICAgICogQHJldHVybiB7T2JqZWN0fVxuICAgICAqL1xuXG4gICAgVGltZUxvZ1F1ZXJ5U2VydmljZS5wcm90b3R5cGUucXVlcnkgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciByZXN1bHQ7XG4gICAgICByZXN1bHQgPSB7fTtcbiAgICAgIGlmICh0aGlzLndvcmtlZCkge1xuICAgICAgICBtZXJnZShyZXN1bHQsIHtcbiAgICAgICAgICBkYXRlOiB7XG4gICAgICAgICAgICAkZ3RlOiBwYXJzZUludChtb21lbnQoKS5zdGFydE9mKCdkYXknKS5zdWJ0cmFjdCh0aGlzLndvcmtlZCwgJ2RheXMnKS5mb3JtYXQoJ3gnKSlcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIFRpbWVMb2dRdWVyeVNlcnZpY2U7XG5cbiAgfSkoKTtcblxuICBhcHAuc2VydmljZSgndGltZUxvZ1F1ZXJ5JywgWydkYXRhU3RvcmUnLCBUaW1lTG9nUXVlcnlTZXJ2aWNlXSk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBUaW1lTG9nUXVlcnlTZXJ2aWNlO1xuXG59KS5jYWxsKHRoaXMpO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD10aW1lLWxvZy1xdWVyeS5qcy5tYXBcbiJdfQ==
