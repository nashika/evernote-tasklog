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
    function Controller($scope) {
      this.$scope = $scope;
    }

    return Controller;

  })();

  app.controller('Controller', ['$scope', Controller]);

  module.exports = Controller;

}).call(this);



},{}],6:[function(require,module,exports){
// Generated by CoffeeScript 1.10.0
(function() {
  var MenuController,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  MenuController = (function() {
    function MenuController($scope, $http, dataStore, dataTransciever) {
      this.$scope = $scope;
      this.$http = $http;
      this.dataStore = dataStore;
      this.dataTransciever = dataTransciever;
      this._onWatchFilterParams = bind(this._onWatchFilterParams, this);
      this._onReload = bind(this._onReload, this);
      this.$scope.dataStore = this.dataStore;
      this.$scope.dataTransciever = this.dataTransciever;
      this.$scope.noteCount = null;
      this.$scope.$watchGroup(['dataTransciever.filterParams.notebookGuids', 'dataTransciever.filterParams.stacks'], this._onWatchFilterParams);
      this.$scope.$on('event::reload', this._onReload);
    }

    MenuController.prototype._onReload = function() {
      return this.dataTransciever.reload();
    };

    MenuController.prototype._onWatchFilterParams = function() {
      return this.dataTransciever.countNotes((function(_this) {
        return function(err, count) {
          if (err) {
            alert(err);
            return;
          }
          return _this.$scope.noteCount = count;
        };
      })(this));
    };

    return MenuController;

  })();

  app.controller('MenuController', ['$scope', '$http', 'dataStore', 'dataTransciever', MenuController]);

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
  var NavigationController,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  NavigationController = (function() {
    function NavigationController($scope, $rootScope, $route) {
      this.$scope = $scope;
      this.$rootScope = $rootScope;
      this.$route = $route;
      this._reload = bind(this._reload, this);
      this.$scope.navCollapse = true;
      this.$scope.$route = this.$route;
      this.$scope.reload = this._reload;
    }

    NavigationController.prototype._reload = function() {
      return this.$rootScope.$broadcast('event::reload');
    };

    return NavigationController;

  })();

  app.controller('NavigationController', ['$scope', '$rootScope', '$route', NavigationController]);

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
  var TimelineController, async,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  async = require('async');

  TimelineController = (function() {
    function TimelineController($scope, $filter, $http, dataStore, dataTransciever) {
      this.$scope = $scope;
      this.$filter = $filter;
      this.$http = $http;
      this.dataStore = dataStore;
      this.dataTransciever = dataTransciever;
      this._onResize = bind(this._onResize, this);
      this._onReloadEnd = bind(this._onReloadEnd, this);
      this._onReload = bind(this._onReload, this);
      this._onRangeChanged = bind(this._onRangeChanged, this);
      this.$scope.dataStore = this.dataStore;
      this.$scope.timelineItems = new vis.DataSet();
      this.$scope.timelineGroups = new vis.DataSet();
      this.$scope.start = moment().startOf('day');
      this.$scope.end = moment().endOf('day');
      this.dataTransciever.reload({
        start: this.$scope.start,
        end: this.$scope.end
      }, (function(_this) {
        return function() {
          var container, hiddenDates, i, index, len, person, ref, ref1, ref2, ref3;
          container = document.getElementById('timeline');
          if (((ref = _this.dataStore.settings) != null ? ref.startWorkingTime : void 0) && ((ref1 = _this.dataStore.settings) != null ? ref1.endWorkingTime : void 0)) {
            hiddenDates = [
              {
                start: moment().subtract(1, 'days').startOf('day').hour(_this.dataStore.settings.endWorkingTime),
                end: moment().startOf('day').hour(_this.dataStore.settings.startWorkingTime),
                repeat: 'daily'
              }
            ];
          } else {
            hiddenDates = {};
          }
          _this.$scope.timeline = new vis.Timeline(container, _this.$scope.timelineItems, _this.$scope.timelineGroups, {
            margin: {
              item: 5
            },
            height: window.innerHeight - 80,
            orientation: {
              axis: 'both',
              item: 'top'
            },
            start: _this.$scope.start,
            end: _this.$scope.end,
            order: function(a, b) {
              return a.start - b.start;
            },
            hiddenDates: hiddenDates
          });
          if (!((ref2 = _this.dataStore.settings) != null ? ref2.persons : void 0)) {
            return;
          }
          ref3 = _this.dataStore.settings.persons;
          for (index = i = 0, len = ref3.length; i < len; index = ++i) {
            person = ref3[index];
            _this.$scope.timelineGroups.add({
              id: person.name,
              content: person.name
            });
          }
          _this.$scope.timelineGroups.add({
            id: 'updated',
            content: 'Update'
          });
          _this.$scope.timeline.on('rangechanged', _this._onRangeChanged);
          _this.$scope.$on('resize::resize', _this._onResize);
          _this.$scope.$on('event::reload', _this._onReload);
          return _this._onReloadEnd();
        };
      })(this));
    }

    TimelineController.prototype._onRangeChanged = function(properties) {
      var currentEnd, currentStart;
      currentStart = moment(properties.start).startOf('day');
      currentEnd = moment(properties.end).endOf('day');
      if (currentStart.isSameOrAfter(this.$scope.start) && currentEnd.isSameOrBefore(this.$scope.end)) {
        return;
      }
      if (!this.$scope.start || currentStart.isBefore(this.$scope.start)) {
        this.$scope.start = currentStart;
      }
      if (!this.$scope.end || currentEnd.isAfter(this.$scope.end)) {
        this.$scope.end = currentEnd;
      }
      return this._onReload();
    };

    TimelineController.prototype._onReload = function() {
      console.log('timeline controller reload');
      return this.dataTransciever.reload({
        start: this.$scope.start,
        end: this.$scope.end
      }, this._onReloadEnd);
    };

    TimelineController.prototype._onReloadEnd = function() {
      var note, noteGuid, noteTimeLogs, noteTitle, ref, ref1, results, timeLog, timeLogId;
      this.$scope.timelineItems.clear();
      ref = this.dataStore.notes;
      for (noteGuid in ref) {
        note = ref[noteGuid];
        notes[note.guid] = note;
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
        noteTimeLogs = ref1[noteGuid];
        results.push((function() {
          var results1;
          results1 = [];
          for (timeLogId in noteTimeLogs) {
            timeLog = noteTimeLogs[timeLogId];
            noteTitle = notes[timeLog.noteGuid].title;
            results1.push(this.$scope.timelineItems.add({
              id: timeLog._id,
              group: timeLog.person,
              content: "<a href=\"evernote:///view/" + this.dataStore.user.id + "/" + this.dataStore.user.shardId + "/" + timeLog.noteGuid + "/" + timeLog.noteGuid + "/\" title=\"" + noteTitle + " " + timeLog.comment + "\">" + (this.$filter('abbreviate')(noteTitle, 20)) + " " + (this.$filter('abbreviate')(timeLog.comment, 20)) + "</a>",
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

    TimelineController.prototype._onResize = function(event) {
      return this.$scope.timeline.setOptions({
        height: window.innerHeight - 90
      });
    };

    return TimelineController;

  })();

  app.controller('TimelineController', ['$scope', '$filter', '$http', 'dataStore', 'dataTransciever', TimelineController]);

  module.exports = TimelineController;

}).call(this);



},{"async":1}],13:[function(require,module,exports){
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

require('./services/progress');

require('./directives/resize');

require('./controllers/auth-controller');

require('./controllers/controller');

require('./controllers/menu-controller');

require('./controllers/navigation-controller');

require('./controllers/notes-controller');

require('./controllers/progress-modal-controller');

require('./controllers/settings-controller');

require('./controllers/timeline-controller');


},{"./controllers/auth-controller":4,"./controllers/controller":5,"./controllers/menu-controller":6,"./controllers/navigation-controller":8,"./controllers/notes-controller":9,"./controllers/progress-modal-controller":10,"./controllers/settings-controller":11,"./controllers/timeline-controller":12,"./directives/resize":13,"./filters/abbreviate":14,"./filters/filter-by-property":15,"./filters/object-length":16,"./filters/order-object-by":17,"./filters/spent-time":18,"./route":20,"./services/data-store":21,"./services/data-transciever":22,"./services/progress":23}],20:[function(require,module,exports){
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
     * @public
     * @type {Object}
     */

    DataStoreService.prototype.settings = {};


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
  var DataTranscieverService, async, merge,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  async = require('async');

  merge = require('merge');

  DataTranscieverService = (function() {

    /**
     * @public
     * @type {Object}
     */
    DataTranscieverService.prototype.filterParams = null;


    /**
     * @constructor
     * @param {$HttpProvider} $http
     * @param {DataStoreService} dataStore
     * @param {ProgressService} progress
     */

    function DataTranscieverService($http, dataStore, progress) {
      this.$http = $http;
      this.dataStore = dataStore;
      this.progress = progress;
      this._makeTimeLogQuery = bind(this._makeTimeLogQuery, this);
      this._makeNoteQuery = bind(this._makeNoteQuery, this);
      this.countTimeLogs = bind(this.countTimeLogs, this);
      this.countNotes = bind(this.countNotes, this);
      this.reload = bind(this.reload, this);
      this.filterParams = {
        notebookGuids: [],
        stacks: []
      };
    }


    /**
     * @public
     * @param {function} callback
     */

    DataTranscieverService.prototype.reload = function(params, callback) {
      var noteCount, noteQuery;
      if (params == null) {
        params = {};
      }
      if (!callback) {
        callback = (function(_this) {
          return function() {};
        })(this);
      }
      noteQuery = this._makeNoteQuery(params != null ? params : {});
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
                query: noteQuery
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
                query: noteQuery
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
                query: noteQuery,
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
            var guids, note, noteGuid, timeLogQuery;
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
            timeLogQuery = _this._makeTimeLogQuery(merge(true, params, {
              noteGuids: guids
            }));
            return _this.$http.post('/time-logs', {
              query: timeLogQuery
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

    DataTranscieverService.prototype.countNotes = function(callback) {
      var query;
      query = this._makeNoteQuery();
      return this.$http.get('/notes/count', {
        params: {
          query: query
        }
      }).success((function(_this) {
        return function(data) {
          return callback(null, data);
        };
      })(this)).error((function(_this) {
        return function() {
          return callback('Error $http request');
        };
      })(this));
    };

    DataTranscieverService.prototype.countTimeLogs = function(callback) {
      var query;
      query = this._makeTimeLogQuery();
      return this.$http.get('/time-logs/count', {
        params: {
          query: query
        }
      }).success((function(_this) {
        return function(data) {
          return callback(null, data);
        };
      })(this)).error((function(_this) {
        return function() {
          return callback('Error $http request');
        };
      })(this));
    };


    /**
     * @protected
     * @param {Object} params
     * @return {Object}
     */

    DataTranscieverService.prototype._makeNoteQuery = function(params) {
      var i, j, len, len1, notebook, notebookGuid, notebooksArray, notebooksHash, ref, ref1, ref2, result, stack;
      if (params == null) {
        params = {};
      }
      result = {};
      if (params.start) {
        merge(result, {
          updated: {
            $gte: params.start.valueOf()
          }
        });
      }
      notebooksHash = {};
      if (this.filterParams.notebookGuids && this.filterParams.notebookGuids.length > 0) {
        ref = this.filterParams.notebookGuids;
        for (i = 0, len = ref.length; i < len; i++) {
          notebookGuid = ref[i];
          notebooksHash[notebookGuid] = true;
        }
      }
      if (this.filterParams.stacks && this.filterParams.stacks.length > 0) {
        ref1 = this.filterParams.stacks;
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


    /**
     * @public
     * @param {Object} params
     * @return {Object}
     */

    DataTranscieverService.prototype._makeTimeLogQuery = function(params) {
      var result;
      if (params == null) {
        params = {};
      }
      result = {};
      if (params.start) {
        merge.recursive(result, {
          date: {
            $gte: params.start.valueOf()
          }
        });
      }
      if (params.end) {
        merge.recursive(result, {
          date: {
            $lte: params.end.valueOf()
          }
        });
      }
      if (params.noteGuids) {
        merge(result, {
          noteGuid: {
            $in: params.noteGuids
          }
        });
      }
      return result;
    };

    return DataTranscieverService;

  })();

  app.service('dataTransciever', ['$http', 'dataStore', 'progress', DataTranscieverService]);

  module.exports = DataTranscieverService;

}).call(this);



},{"async":1,"merge":2}],23:[function(require,module,exports){
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



},{}]},{},[19])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvYXN5bmMvbGliL2FzeW5jLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL21lcmdlL21lcmdlLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsInNyYy9jb250cm9sbGVycy9hdXRoLWNvbnRyb2xsZXIuanMiLCJzcmMvY29udHJvbGxlcnMvY29udHJvbGxlci5qcyIsInNyYy9jb250cm9sbGVycy9tZW51LWNvbnRyb2xsZXIuanMiLCJzcmMvY29udHJvbGxlcnMvbW9kYWwtY29udHJvbGxlci5qcyIsInNyYy9jb250cm9sbGVycy9uYXZpZ2F0aW9uLWNvbnRyb2xsZXIuanMiLCJzcmMvY29udHJvbGxlcnMvbm90ZXMtY29udHJvbGxlci5qcyIsInNyYy9jb250cm9sbGVycy9wcm9ncmVzcy1tb2RhbC1jb250cm9sbGVyLmpzIiwic3JjL2NvbnRyb2xsZXJzL3NldHRpbmdzLWNvbnRyb2xsZXIuanMiLCJzcmMvY29udHJvbGxlcnMvdGltZWxpbmUtY29udHJvbGxlci5qcyIsInNyYy9kaXJlY3RpdmVzL3Jlc2l6ZS5qcyIsInNyYy9maWx0ZXJzL2FiYnJldmlhdGUuanMiLCJzcmMvZmlsdGVycy9maWx0ZXItYnktcHJvcGVydHkuanMiLCJzcmMvZmlsdGVycy9vYmplY3QtbGVuZ3RoLmpzIiwic3JjL2ZpbHRlcnMvb3JkZXItb2JqZWN0LWJ5LmpzIiwic3JjL2ZpbHRlcnMvc3BlbnQtdGltZS5qcyIsIkM6XFxVc2Vyc1xcaW5mb1xcRG9jdW1lbnRzXFx3b3Jrc3BhY2VcXGV2ZXJub3RlLXRhc2tsb2dcXHB1YmxpY1xcamF2YXNjcmlwdHNcXHNyY1xcaW5kZXguY29mZmVlIiwic3JjL3JvdXRlLmpzIiwic3JjL3NlcnZpY2VzL2RhdGEtc3RvcmUuanMiLCJzcmMvc2VydmljZXMvZGF0YS10cmFuc2NpZXZlci5qcyIsInNyYy9zZXJ2aWNlcy9wcm9ncmVzcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDaHZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQSxNQUFNLENBQUMsR0FBUCxHQUFhLE9BQU8sQ0FBQyxNQUFSLENBQWUsS0FBZixFQUFzQixDQUFDLFNBQUQsRUFBWSxjQUFaLEVBQTRCLFlBQTVCLEVBQTBDLFdBQTFDLENBQXRCOztBQUViLEdBQUcsQ0FBQyxNQUFKLENBQVc7RUFBQyxrQkFBRCxFQUFxQixTQUFDLGdCQUFEO1dBQzlCLGdCQUFnQixDQUFDLDBCQUFqQixDQUE0QyxtQ0FBNUM7RUFEOEIsQ0FBckI7Q0FBWDs7QUFLQSxPQUFBLENBQVEsU0FBUjs7QUFHQSxPQUFBLENBQVEsc0JBQVI7O0FBQ0EsT0FBQSxDQUFRLDhCQUFSOztBQUNBLE9BQUEsQ0FBUSx5QkFBUjs7QUFDQSxPQUFBLENBQVEsMkJBQVI7O0FBQ0EsT0FBQSxDQUFRLHNCQUFSOztBQUdBLE9BQUEsQ0FBUSx1QkFBUjs7QUFDQSxPQUFBLENBQVEsNkJBQVI7O0FBQ0EsT0FBQSxDQUFRLHFCQUFSOztBQUdBLE9BQUEsQ0FBUSxxQkFBUjs7QUFHQSxPQUFBLENBQVEsK0JBQVI7O0FBQ0EsT0FBQSxDQUFRLDBCQUFSOztBQUNBLE9BQUEsQ0FBUSwrQkFBUjs7QUFDQSxPQUFBLENBQVEscUNBQVI7O0FBQ0EsT0FBQSxDQUFRLGdDQUFSOztBQUNBLE9BQUEsQ0FBUSx5Q0FBUjs7QUFDQSxPQUFBLENBQVEsbUNBQVI7O0FBQ0EsT0FBQSxDQUFRLG1DQUFSOzs7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiFcbiAqIGFzeW5jXG4gKiBodHRwczovL2dpdGh1Yi5jb20vY2FvbGFuL2FzeW5jXG4gKlxuICogQ29weXJpZ2h0IDIwMTAtMjAxNCBDYW9sYW4gTWNNYWhvblxuICogUmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgYXN5bmMgPSB7fTtcbiAgICBmdW5jdGlvbiBub29wKCkge31cbiAgICBmdW5jdGlvbiBpZGVudGl0eSh2KSB7XG4gICAgICAgIHJldHVybiB2O1xuICAgIH1cbiAgICBmdW5jdGlvbiB0b0Jvb2wodikge1xuICAgICAgICByZXR1cm4gISF2O1xuICAgIH1cbiAgICBmdW5jdGlvbiBub3RJZCh2KSB7XG4gICAgICAgIHJldHVybiAhdjtcbiAgICB9XG5cbiAgICAvLyBnbG9iYWwgb24gdGhlIHNlcnZlciwgd2luZG93IGluIHRoZSBicm93c2VyXG4gICAgdmFyIHByZXZpb3VzX2FzeW5jO1xuXG4gICAgLy8gRXN0YWJsaXNoIHRoZSByb290IG9iamVjdCwgYHdpbmRvd2AgKGBzZWxmYCkgaW4gdGhlIGJyb3dzZXIsIGBnbG9iYWxgXG4gICAgLy8gb24gdGhlIHNlcnZlciwgb3IgYHRoaXNgIGluIHNvbWUgdmlydHVhbCBtYWNoaW5lcy4gV2UgdXNlIGBzZWxmYFxuICAgIC8vIGluc3RlYWQgb2YgYHdpbmRvd2AgZm9yIGBXZWJXb3JrZXJgIHN1cHBvcnQuXG4gICAgdmFyIHJvb3QgPSB0eXBlb2Ygc2VsZiA9PT0gJ29iamVjdCcgJiYgc2VsZi5zZWxmID09PSBzZWxmICYmIHNlbGYgfHxcbiAgICAgICAgICAgIHR5cGVvZiBnbG9iYWwgPT09ICdvYmplY3QnICYmIGdsb2JhbC5nbG9iYWwgPT09IGdsb2JhbCAmJiBnbG9iYWwgfHxcbiAgICAgICAgICAgIHRoaXM7XG5cbiAgICBpZiAocm9vdCAhPSBudWxsKSB7XG4gICAgICAgIHByZXZpb3VzX2FzeW5jID0gcm9vdC5hc3luYztcbiAgICB9XG5cbiAgICBhc3luYy5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByb290LmFzeW5jID0gcHJldmlvdXNfYXN5bmM7XG4gICAgICAgIHJldHVybiBhc3luYztcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gb25seV9vbmNlKGZuKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChmbiA9PT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKFwiQ2FsbGJhY2sgd2FzIGFscmVhZHkgY2FsbGVkLlwiKTtcbiAgICAgICAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICBmbiA9IG51bGw7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX29uY2UoZm4pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKGZuID09PSBudWxsKSByZXR1cm47XG4gICAgICAgICAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgZm4gPSBudWxsO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vLy8gY3Jvc3MtYnJvd3NlciBjb21wYXRpYmxpdHkgZnVuY3Rpb25zIC8vLy9cblxuICAgIHZhciBfdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4gICAgdmFyIF9pc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHJldHVybiBfdG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBBcnJheV0nO1xuICAgIH07XG5cbiAgICAvLyBQb3J0ZWQgZnJvbSB1bmRlcnNjb3JlLmpzIGlzT2JqZWN0XG4gICAgdmFyIF9pc09iamVjdCA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgICB2YXIgdHlwZSA9IHR5cGVvZiBvYmo7XG4gICAgICAgIHJldHVybiB0eXBlID09PSAnZnVuY3Rpb24nIHx8IHR5cGUgPT09ICdvYmplY3QnICYmICEhb2JqO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBfaXNBcnJheUxpa2UoYXJyKSB7XG4gICAgICAgIHJldHVybiBfaXNBcnJheShhcnIpIHx8IChcbiAgICAgICAgICAgIC8vIGhhcyBhIHBvc2l0aXZlIGludGVnZXIgbGVuZ3RoIHByb3BlcnR5XG4gICAgICAgICAgICB0eXBlb2YgYXJyLmxlbmd0aCA9PT0gXCJudW1iZXJcIiAmJlxuICAgICAgICAgICAgYXJyLmxlbmd0aCA+PSAwICYmXG4gICAgICAgICAgICBhcnIubGVuZ3RoICUgMSA9PT0gMFxuICAgICAgICApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9hcnJheUVhY2goYXJyLCBpdGVyYXRvcikge1xuICAgICAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgICAgIGxlbmd0aCA9IGFyci5sZW5ndGg7XG5cbiAgICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKGFycltpbmRleF0sIGluZGV4LCBhcnIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX21hcChhcnIsIGl0ZXJhdG9yKSB7XG4gICAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgICAgbGVuZ3RoID0gYXJyLmxlbmd0aCxcbiAgICAgICAgICAgIHJlc3VsdCA9IEFycmF5KGxlbmd0aCk7XG5cbiAgICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgIHJlc3VsdFtpbmRleF0gPSBpdGVyYXRvcihhcnJbaW5kZXhdLCBpbmRleCwgYXJyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9yYW5nZShjb3VudCkge1xuICAgICAgICByZXR1cm4gX21hcChBcnJheShjb3VudCksIGZ1bmN0aW9uICh2LCBpKSB7IHJldHVybiBpOyB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfcmVkdWNlKGFyciwgaXRlcmF0b3IsIG1lbW8pIHtcbiAgICAgICAgX2FycmF5RWFjaChhcnIsIGZ1bmN0aW9uICh4LCBpLCBhKSB7XG4gICAgICAgICAgICBtZW1vID0gaXRlcmF0b3IobWVtbywgeCwgaSwgYSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbWVtbztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfZm9yRWFjaE9mKG9iamVjdCwgaXRlcmF0b3IpIHtcbiAgICAgICAgX2FycmF5RWFjaChfa2V5cyhvYmplY3QpLCBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICBpdGVyYXRvcihvYmplY3Rba2V5XSwga2V5KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2luZGV4T2YoYXJyLCBpdGVtKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoYXJyW2ldID09PSBpdGVtKSByZXR1cm4gaTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gLTE7XG4gICAgfVxuXG4gICAgdmFyIF9rZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICAgICAgICB2YXIga2V5cyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBrIGluIG9iaikge1xuICAgICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrKSkge1xuICAgICAgICAgICAgICAgIGtleXMucHVzaChrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ga2V5cztcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gX2tleUl0ZXJhdG9yKGNvbGwpIHtcbiAgICAgICAgdmFyIGkgPSAtMTtcbiAgICAgICAgdmFyIGxlbjtcbiAgICAgICAgdmFyIGtleXM7XG4gICAgICAgIGlmIChfaXNBcnJheUxpa2UoY29sbCkpIHtcbiAgICAgICAgICAgIGxlbiA9IGNvbGwubGVuZ3RoO1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHQoKSB7XG4gICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIHJldHVybiBpIDwgbGVuID8gaSA6IG51bGw7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAga2V5cyA9IF9rZXlzKGNvbGwpO1xuICAgICAgICAgICAgbGVuID0ga2V5cy5sZW5ndGg7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dCgpIHtcbiAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGkgPCBsZW4gPyBrZXlzW2ldIDogbnVsbDtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBTaW1pbGFyIHRvIEVTNidzIHJlc3QgcGFyYW0gKGh0dHA6Ly9hcml5YS5vZmlsYWJzLmNvbS8yMDEzLzAzL2VzNi1hbmQtcmVzdC1wYXJhbWV0ZXIuaHRtbClcbiAgICAvLyBUaGlzIGFjY3VtdWxhdGVzIHRoZSBhcmd1bWVudHMgcGFzc2VkIGludG8gYW4gYXJyYXksIGFmdGVyIGEgZ2l2ZW4gaW5kZXguXG4gICAgLy8gRnJvbSB1bmRlcnNjb3JlLmpzIChodHRwczovL2dpdGh1Yi5jb20vamFzaGtlbmFzL3VuZGVyc2NvcmUvcHVsbC8yMTQwKS5cbiAgICBmdW5jdGlvbiBfcmVzdFBhcmFtKGZ1bmMsIHN0YXJ0SW5kZXgpIHtcbiAgICAgICAgc3RhcnRJbmRleCA9IHN0YXJ0SW5kZXggPT0gbnVsbCA/IGZ1bmMubGVuZ3RoIC0gMSA6ICtzdGFydEluZGV4O1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgbGVuZ3RoID0gTWF0aC5tYXgoYXJndW1lbnRzLmxlbmd0aCAtIHN0YXJ0SW5kZXgsIDApO1xuICAgICAgICAgICAgdmFyIHJlc3QgPSBBcnJheShsZW5ndGgpO1xuICAgICAgICAgICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgICAgIHJlc3RbaW5kZXhdID0gYXJndW1lbnRzW2luZGV4ICsgc3RhcnRJbmRleF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzd2l0Y2ggKHN0YXJ0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICBjYXNlIDA6IHJldHVybiBmdW5jLmNhbGwodGhpcywgcmVzdCk7XG4gICAgICAgICAgICAgICAgY2FzZSAxOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIGFyZ3VtZW50c1swXSwgcmVzdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBDdXJyZW50bHkgdW51c2VkIGJ1dCBoYW5kbGUgY2FzZXMgb3V0c2lkZSBvZiB0aGUgc3dpdGNoIHN0YXRlbWVudDpcbiAgICAgICAgICAgIC8vIHZhciBhcmdzID0gQXJyYXkoc3RhcnRJbmRleCArIDEpO1xuICAgICAgICAgICAgLy8gZm9yIChpbmRleCA9IDA7IGluZGV4IDwgc3RhcnRJbmRleDsgaW5kZXgrKykge1xuICAgICAgICAgICAgLy8gICAgIGFyZ3NbaW5kZXhdID0gYXJndW1lbnRzW2luZGV4XTtcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIC8vIGFyZ3Nbc3RhcnRJbmRleF0gPSByZXN0O1xuICAgICAgICAgICAgLy8gcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3dpdGhvdXRJbmRleChpdGVyYXRvcikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlLCBpbmRleCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHJldHVybiBpdGVyYXRvcih2YWx1ZSwgY2FsbGJhY2spO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vLy8gZXhwb3J0ZWQgYXN5bmMgbW9kdWxlIGZ1bmN0aW9ucyAvLy8vXG5cbiAgICAvLy8vIG5leHRUaWNrIGltcGxlbWVudGF0aW9uIHdpdGggYnJvd3Nlci1jb21wYXRpYmxlIGZhbGxiYWNrIC8vLy9cblxuICAgIC8vIGNhcHR1cmUgdGhlIGdsb2JhbCByZWZlcmVuY2UgdG8gZ3VhcmQgYWdhaW5zdCBmYWtlVGltZXIgbW9ja3NcbiAgICB2YXIgX3NldEltbWVkaWF0ZSA9IHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09ICdmdW5jdGlvbicgJiYgc2V0SW1tZWRpYXRlO1xuXG4gICAgdmFyIF9kZWxheSA9IF9zZXRJbW1lZGlhdGUgPyBmdW5jdGlvbihmbikge1xuICAgICAgICAvLyBub3QgYSBkaXJlY3QgYWxpYXMgZm9yIElFMTAgY29tcGF0aWJpbGl0eVxuICAgICAgICBfc2V0SW1tZWRpYXRlKGZuKTtcbiAgICB9IDogZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcblxuICAgIGlmICh0eXBlb2YgcHJvY2VzcyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIHByb2Nlc3MubmV4dFRpY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgYXN5bmMubmV4dFRpY2sgPSBwcm9jZXNzLm5leHRUaWNrO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGFzeW5jLm5leHRUaWNrID0gX2RlbGF5O1xuICAgIH1cbiAgICBhc3luYy5zZXRJbW1lZGlhdGUgPSBfc2V0SW1tZWRpYXRlID8gX2RlbGF5IDogYXN5bmMubmV4dFRpY2s7XG5cblxuICAgIGFzeW5jLmZvckVhY2ggPVxuICAgIGFzeW5jLmVhY2ggPSBmdW5jdGlvbiAoYXJyLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jLmVhY2hPZihhcnIsIF93aXRob3V0SW5kZXgoaXRlcmF0b3IpLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLmZvckVhY2hTZXJpZXMgPVxuICAgIGFzeW5jLmVhY2hTZXJpZXMgPSBmdW5jdGlvbiAoYXJyLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jLmVhY2hPZlNlcmllcyhhcnIsIF93aXRob3V0SW5kZXgoaXRlcmF0b3IpLCBjYWxsYmFjayk7XG4gICAgfTtcblxuXG4gICAgYXN5bmMuZm9yRWFjaExpbWl0ID1cbiAgICBhc3luYy5lYWNoTGltaXQgPSBmdW5jdGlvbiAoYXJyLCBsaW1pdCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiBfZWFjaE9mTGltaXQobGltaXQpKGFyciwgX3dpdGhvdXRJbmRleChpdGVyYXRvciksIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMuZm9yRWFjaE9mID1cbiAgICBhc3luYy5lYWNoT2YgPSBmdW5jdGlvbiAob2JqZWN0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sgPSBfb25jZShjYWxsYmFjayB8fCBub29wKTtcbiAgICAgICAgb2JqZWN0ID0gb2JqZWN0IHx8IFtdO1xuXG4gICAgICAgIHZhciBpdGVyID0gX2tleUl0ZXJhdG9yKG9iamVjdCk7XG4gICAgICAgIHZhciBrZXksIGNvbXBsZXRlZCA9IDA7XG5cbiAgICAgICAgd2hpbGUgKChrZXkgPSBpdGVyKCkpICE9IG51bGwpIHtcbiAgICAgICAgICAgIGNvbXBsZXRlZCArPSAxO1xuICAgICAgICAgICAgaXRlcmF0b3Iob2JqZWN0W2tleV0sIGtleSwgb25seV9vbmNlKGRvbmUpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb21wbGV0ZWQgPT09IDApIGNhbGxiYWNrKG51bGwpO1xuXG4gICAgICAgIGZ1bmN0aW9uIGRvbmUoZXJyKSB7XG4gICAgICAgICAgICBjb21wbGV0ZWQtLTtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gQ2hlY2sga2V5IGlzIG51bGwgaW4gY2FzZSBpdGVyYXRvciBpc24ndCBleGhhdXN0ZWRcbiAgICAgICAgICAgIC8vIGFuZCBkb25lIHJlc29sdmVkIHN5bmNocm9ub3VzbHkuXG4gICAgICAgICAgICBlbHNlIGlmIChrZXkgPT09IG51bGwgJiYgY29tcGxldGVkIDw9IDApIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBhc3luYy5mb3JFYWNoT2ZTZXJpZXMgPVxuICAgIGFzeW5jLmVhY2hPZlNlcmllcyA9IGZ1bmN0aW9uIChvYmosIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IF9vbmNlKGNhbGxiYWNrIHx8IG5vb3ApO1xuICAgICAgICBvYmogPSBvYmogfHwgW107XG4gICAgICAgIHZhciBuZXh0S2V5ID0gX2tleUl0ZXJhdG9yKG9iaik7XG4gICAgICAgIHZhciBrZXkgPSBuZXh0S2V5KCk7XG4gICAgICAgIGZ1bmN0aW9uIGl0ZXJhdGUoKSB7XG4gICAgICAgICAgICB2YXIgc3luYyA9IHRydWU7XG4gICAgICAgICAgICBpZiAoa2V5ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaXRlcmF0b3Iob2JqW2tleV0sIGtleSwgb25seV9vbmNlKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBrZXkgPSBuZXh0S2V5KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzeW5jKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXN5bmMuc2V0SW1tZWRpYXRlKGl0ZXJhdGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVyYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBzeW5jID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaXRlcmF0ZSgpO1xuICAgIH07XG5cblxuXG4gICAgYXN5bmMuZm9yRWFjaE9mTGltaXQgPVxuICAgIGFzeW5jLmVhY2hPZkxpbWl0ID0gZnVuY3Rpb24gKG9iaiwgbGltaXQsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBfZWFjaE9mTGltaXQobGltaXQpKG9iaiwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gX2VhY2hPZkxpbWl0KGxpbWl0KSB7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChvYmosIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2sgPSBfb25jZShjYWxsYmFjayB8fCBub29wKTtcbiAgICAgICAgICAgIG9iaiA9IG9iaiB8fCBbXTtcbiAgICAgICAgICAgIHZhciBuZXh0S2V5ID0gX2tleUl0ZXJhdG9yKG9iaik7XG4gICAgICAgICAgICBpZiAobGltaXQgPD0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBkb25lID0gZmFsc2U7XG4gICAgICAgICAgICB2YXIgcnVubmluZyA9IDA7XG4gICAgICAgICAgICB2YXIgZXJyb3JlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAoZnVuY3Rpb24gcmVwbGVuaXNoICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoZG9uZSAmJiBydW5uaW5nIDw9IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHdoaWxlIChydW5uaW5nIDwgbGltaXQgJiYgIWVycm9yZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGtleSA9IG5leHRLZXkoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9uZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocnVubmluZyA8PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcnVubmluZyArPSAxO1xuICAgICAgICAgICAgICAgICAgICBpdGVyYXRvcihvYmpba2V5XSwga2V5LCBvbmx5X29uY2UoZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcnVubmluZyAtPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXBsZW5pc2goKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKCk7XG4gICAgICAgIH07XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBkb1BhcmFsbGVsKGZuKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAob2JqLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHJldHVybiBmbihhc3luYy5lYWNoT2YsIG9iaiwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZG9QYXJhbGxlbExpbWl0KGZuKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAob2JqLCBsaW1pdCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gZm4oX2VhY2hPZkxpbWl0KGxpbWl0KSwgb2JqLCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBkb1Nlcmllcyhmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9iaiwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gZm4oYXN5bmMuZWFjaE9mU2VyaWVzLCBvYmosIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2FzeW5jTWFwKGVhY2hmbiwgYXJyLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sgPSBfb25jZShjYWxsYmFjayB8fCBub29wKTtcbiAgICAgICAgYXJyID0gYXJyIHx8IFtdO1xuICAgICAgICB2YXIgcmVzdWx0cyA9IF9pc0FycmF5TGlrZShhcnIpID8gW10gOiB7fTtcbiAgICAgICAgZWFjaGZuKGFyciwgZnVuY3Rpb24gKHZhbHVlLCBpbmRleCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKHZhbHVlLCBmdW5jdGlvbiAoZXJyLCB2KSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0c1tpbmRleF0gPSB2O1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgY2FsbGJhY2soZXJyLCByZXN1bHRzKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMubWFwID0gZG9QYXJhbGxlbChfYXN5bmNNYXApO1xuICAgIGFzeW5jLm1hcFNlcmllcyA9IGRvU2VyaWVzKF9hc3luY01hcCk7XG4gICAgYXN5bmMubWFwTGltaXQgPSBkb1BhcmFsbGVsTGltaXQoX2FzeW5jTWFwKTtcblxuICAgIC8vIHJlZHVjZSBvbmx5IGhhcyBhIHNlcmllcyB2ZXJzaW9uLCBhcyBkb2luZyByZWR1Y2UgaW4gcGFyYWxsZWwgd29uJ3RcbiAgICAvLyB3b3JrIGluIG1hbnkgc2l0dWF0aW9ucy5cbiAgICBhc3luYy5pbmplY3QgPVxuICAgIGFzeW5jLmZvbGRsID1cbiAgICBhc3luYy5yZWR1Y2UgPSBmdW5jdGlvbiAoYXJyLCBtZW1vLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgYXN5bmMuZWFjaE9mU2VyaWVzKGFyciwgZnVuY3Rpb24gKHgsIGksIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpdGVyYXRvcihtZW1vLCB4LCBmdW5jdGlvbiAoZXJyLCB2KSB7XG4gICAgICAgICAgICAgICAgbWVtbyA9IHY7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnIsIG1lbW8pO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgYXN5bmMuZm9sZHIgPVxuICAgIGFzeW5jLnJlZHVjZVJpZ2h0ID0gZnVuY3Rpb24gKGFyciwgbWVtbywgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciByZXZlcnNlZCA9IF9tYXAoYXJyLCBpZGVudGl0eSkucmV2ZXJzZSgpO1xuICAgICAgICBhc3luYy5yZWR1Y2UocmV2ZXJzZWQsIG1lbW8sIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLnRyYW5zZm9ybSA9IGZ1bmN0aW9uIChhcnIsIG1lbW8sIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMykge1xuICAgICAgICAgICAgY2FsbGJhY2sgPSBpdGVyYXRvcjtcbiAgICAgICAgICAgIGl0ZXJhdG9yID0gbWVtbztcbiAgICAgICAgICAgIG1lbW8gPSBfaXNBcnJheShhcnIpID8gW10gOiB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFzeW5jLmVhY2hPZihhcnIsIGZ1bmN0aW9uKHYsIGssIGNiKSB7XG4gICAgICAgICAgICBpdGVyYXRvcihtZW1vLCB2LCBrLCBjYik7XG4gICAgICAgIH0sIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgY2FsbGJhY2soZXJyLCBtZW1vKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIF9maWx0ZXIoZWFjaGZuLCBhcnIsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgICAgICBlYWNoZm4oYXJyLCBmdW5jdGlvbiAoeCwgaW5kZXgsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpdGVyYXRvcih4LCBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgIGlmICh2KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7aW5kZXg6IGluZGV4LCB2YWx1ZTogeH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKF9tYXAocmVzdWx0cy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGEuaW5kZXggLSBiLmluZGV4O1xuICAgICAgICAgICAgfSksIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHgudmFsdWU7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jLnNlbGVjdCA9XG4gICAgYXN5bmMuZmlsdGVyID0gZG9QYXJhbGxlbChfZmlsdGVyKTtcblxuICAgIGFzeW5jLnNlbGVjdExpbWl0ID1cbiAgICBhc3luYy5maWx0ZXJMaW1pdCA9IGRvUGFyYWxsZWxMaW1pdChfZmlsdGVyKTtcblxuICAgIGFzeW5jLnNlbGVjdFNlcmllcyA9XG4gICAgYXN5bmMuZmlsdGVyU2VyaWVzID0gZG9TZXJpZXMoX2ZpbHRlcik7XG5cbiAgICBmdW5jdGlvbiBfcmVqZWN0KGVhY2hmbiwgYXJyLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgX2ZpbHRlcihlYWNoZm4sIGFyciwgZnVuY3Rpb24odmFsdWUsIGNiKSB7XG4gICAgICAgICAgICBpdGVyYXRvcih2YWx1ZSwgZnVuY3Rpb24odikge1xuICAgICAgICAgICAgICAgIGNiKCF2KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBjYWxsYmFjayk7XG4gICAgfVxuICAgIGFzeW5jLnJlamVjdCA9IGRvUGFyYWxsZWwoX3JlamVjdCk7XG4gICAgYXN5bmMucmVqZWN0TGltaXQgPSBkb1BhcmFsbGVsTGltaXQoX3JlamVjdCk7XG4gICAgYXN5bmMucmVqZWN0U2VyaWVzID0gZG9TZXJpZXMoX3JlamVjdCk7XG5cbiAgICBmdW5jdGlvbiBfY3JlYXRlVGVzdGVyKGVhY2hmbiwgY2hlY2ssIGdldFJlc3VsdCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oYXJyLCBsaW1pdCwgaXRlcmF0b3IsIGNiKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiBkb25lKCkge1xuICAgICAgICAgICAgICAgIGlmIChjYikgY2IoZ2V0UmVzdWx0KGZhbHNlLCB2b2lkIDApKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZ1bmN0aW9uIGl0ZXJhdGVlKHgsIF8sIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFjYikgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgaXRlcmF0b3IoeCwgZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNiICYmIGNoZWNrKHYpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYihnZXRSZXN1bHQodHJ1ZSwgeCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2IgPSBpdGVyYXRvciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDMpIHtcbiAgICAgICAgICAgICAgICBlYWNoZm4oYXJyLCBsaW1pdCwgaXRlcmF0ZWUsIGRvbmUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYiA9IGl0ZXJhdG9yO1xuICAgICAgICAgICAgICAgIGl0ZXJhdG9yID0gbGltaXQ7XG4gICAgICAgICAgICAgICAgZWFjaGZuKGFyciwgaXRlcmF0ZWUsIGRvbmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFzeW5jLmFueSA9XG4gICAgYXN5bmMuc29tZSA9IF9jcmVhdGVUZXN0ZXIoYXN5bmMuZWFjaE9mLCB0b0Jvb2wsIGlkZW50aXR5KTtcblxuICAgIGFzeW5jLnNvbWVMaW1pdCA9IF9jcmVhdGVUZXN0ZXIoYXN5bmMuZWFjaE9mTGltaXQsIHRvQm9vbCwgaWRlbnRpdHkpO1xuXG4gICAgYXN5bmMuYWxsID1cbiAgICBhc3luYy5ldmVyeSA9IF9jcmVhdGVUZXN0ZXIoYXN5bmMuZWFjaE9mLCBub3RJZCwgbm90SWQpO1xuXG4gICAgYXN5bmMuZXZlcnlMaW1pdCA9IF9jcmVhdGVUZXN0ZXIoYXN5bmMuZWFjaE9mTGltaXQsIG5vdElkLCBub3RJZCk7XG5cbiAgICBmdW5jdGlvbiBfZmluZEdldFJlc3VsdCh2LCB4KSB7XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgICBhc3luYy5kZXRlY3QgPSBfY3JlYXRlVGVzdGVyKGFzeW5jLmVhY2hPZiwgaWRlbnRpdHksIF9maW5kR2V0UmVzdWx0KTtcbiAgICBhc3luYy5kZXRlY3RTZXJpZXMgPSBfY3JlYXRlVGVzdGVyKGFzeW5jLmVhY2hPZlNlcmllcywgaWRlbnRpdHksIF9maW5kR2V0UmVzdWx0KTtcbiAgICBhc3luYy5kZXRlY3RMaW1pdCA9IF9jcmVhdGVUZXN0ZXIoYXN5bmMuZWFjaE9mTGltaXQsIGlkZW50aXR5LCBfZmluZEdldFJlc3VsdCk7XG5cbiAgICBhc3luYy5zb3J0QnkgPSBmdW5jdGlvbiAoYXJyLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgYXN5bmMubWFwKGFyciwgZnVuY3Rpb24gKHgsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpdGVyYXRvcih4LCBmdW5jdGlvbiAoZXJyLCBjcml0ZXJpYSkge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHt2YWx1ZTogeCwgY3JpdGVyaWE6IGNyaXRlcmlhfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIsIHJlc3VsdHMpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIF9tYXAocmVzdWx0cy5zb3J0KGNvbXBhcmF0b3IpLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geC52YWx1ZTtcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgZnVuY3Rpb24gY29tcGFyYXRvcihsZWZ0LCByaWdodCkge1xuICAgICAgICAgICAgdmFyIGEgPSBsZWZ0LmNyaXRlcmlhLCBiID0gcmlnaHQuY3JpdGVyaWE7XG4gICAgICAgICAgICByZXR1cm4gYSA8IGIgPyAtMSA6IGEgPiBiID8gMSA6IDA7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgYXN5bmMuYXV0byA9IGZ1bmN0aW9uICh0YXNrcywgY29uY3VycmVuY3ksIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgYXJndW1lbnRzWzFdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAvLyBjb25jdXJyZW5jeSBpcyBvcHRpb25hbCwgc2hpZnQgdGhlIGFyZ3MuXG4gICAgICAgICAgICBjYWxsYmFjayA9IGNvbmN1cnJlbmN5O1xuICAgICAgICAgICAgY29uY3VycmVuY3kgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrID0gX29uY2UoY2FsbGJhY2sgfHwgbm9vcCk7XG4gICAgICAgIHZhciBrZXlzID0gX2tleXModGFza3MpO1xuICAgICAgICB2YXIgcmVtYWluaW5nVGFza3MgPSBrZXlzLmxlbmd0aDtcbiAgICAgICAgaWYgKCFyZW1haW5pbmdUYXNrcykge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghY29uY3VycmVuY3kpIHtcbiAgICAgICAgICAgIGNvbmN1cnJlbmN5ID0gcmVtYWluaW5nVGFza3M7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVzdWx0cyA9IHt9O1xuICAgICAgICB2YXIgcnVubmluZ1Rhc2tzID0gMDtcblxuICAgICAgICB2YXIgaGFzRXJyb3IgPSBmYWxzZTtcblxuICAgICAgICB2YXIgbGlzdGVuZXJzID0gW107XG4gICAgICAgIGZ1bmN0aW9uIGFkZExpc3RlbmVyKGZuKSB7XG4gICAgICAgICAgICBsaXN0ZW5lcnMudW5zaGlmdChmbik7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIoZm4pIHtcbiAgICAgICAgICAgIHZhciBpZHggPSBfaW5kZXhPZihsaXN0ZW5lcnMsIGZuKTtcbiAgICAgICAgICAgIGlmIChpZHggPj0gMCkgbGlzdGVuZXJzLnNwbGljZShpZHgsIDEpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHRhc2tDb21wbGV0ZSgpIHtcbiAgICAgICAgICAgIHJlbWFpbmluZ1Rhc2tzLS07XG4gICAgICAgICAgICBfYXJyYXlFYWNoKGxpc3RlbmVycy5zbGljZSgwKSwgZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgYWRkTGlzdGVuZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCFyZW1haW5pbmdUYXNrcykge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBfYXJyYXlFYWNoKGtleXMsIGZ1bmN0aW9uIChrKSB7XG4gICAgICAgICAgICBpZiAoaGFzRXJyb3IpIHJldHVybjtcbiAgICAgICAgICAgIHZhciB0YXNrID0gX2lzQXJyYXkodGFza3Nba10pID8gdGFza3Nba106IFt0YXNrc1trXV07XG4gICAgICAgICAgICB2YXIgdGFza0NhbGxiYWNrID0gX3Jlc3RQYXJhbShmdW5jdGlvbihlcnIsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBydW5uaW5nVGFza3MtLTtcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5sZW5ndGggPD0gMSkge1xuICAgICAgICAgICAgICAgICAgICBhcmdzID0gYXJnc1swXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2FmZVJlc3VsdHMgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgX2ZvckVhY2hPZihyZXN1bHRzLCBmdW5jdGlvbih2YWwsIHJrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNhZmVSZXN1bHRzW3JrZXldID0gdmFsO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgc2FmZVJlc3VsdHNba10gPSBhcmdzO1xuICAgICAgICAgICAgICAgICAgICBoYXNFcnJvciA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyLCBzYWZlUmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzW2tdID0gYXJncztcbiAgICAgICAgICAgICAgICAgICAgYXN5bmMuc2V0SW1tZWRpYXRlKHRhc2tDb21wbGV0ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YXIgcmVxdWlyZXMgPSB0YXNrLnNsaWNlKDAsIHRhc2subGVuZ3RoIC0gMSk7XG4gICAgICAgICAgICAvLyBwcmV2ZW50IGRlYWQtbG9ja3NcbiAgICAgICAgICAgIHZhciBsZW4gPSByZXF1aXJlcy5sZW5ndGg7XG4gICAgICAgICAgICB2YXIgZGVwO1xuICAgICAgICAgICAgd2hpbGUgKGxlbi0tKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEoZGVwID0gdGFza3NbcmVxdWlyZXNbbGVuXV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSGFzIGluZXhpc3RhbnQgZGVwZW5kZW5jeScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoX2lzQXJyYXkoZGVwKSAmJiBfaW5kZXhPZihkZXAsIGspID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdIYXMgY3ljbGljIGRlcGVuZGVuY2llcycpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZ1bmN0aW9uIHJlYWR5KCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBydW5uaW5nVGFza3MgPCBjb25jdXJyZW5jeSAmJiBfcmVkdWNlKHJlcXVpcmVzLCBmdW5jdGlvbiAoYSwgeCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKGEgJiYgcmVzdWx0cy5oYXNPd25Qcm9wZXJ0eSh4KSk7XG4gICAgICAgICAgICAgICAgfSwgdHJ1ZSkgJiYgIXJlc3VsdHMuaGFzT3duUHJvcGVydHkoayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVhZHkoKSkge1xuICAgICAgICAgICAgICAgIHJ1bm5pbmdUYXNrcysrO1xuICAgICAgICAgICAgICAgIHRhc2tbdGFzay5sZW5ndGggLSAxXSh0YXNrQ2FsbGJhY2ssIHJlc3VsdHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnVuY3Rpb24gbGlzdGVuZXIoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlYWR5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcnVubmluZ1Rhc2tzKys7XG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGFza1t0YXNrLmxlbmd0aCAtIDFdKHRhc2tDYWxsYmFjaywgcmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG5cblxuICAgIGFzeW5jLnJldHJ5ID0gZnVuY3Rpb24odGltZXMsIHRhc2ssIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBERUZBVUxUX1RJTUVTID0gNTtcbiAgICAgICAgdmFyIERFRkFVTFRfSU5URVJWQUwgPSAwO1xuXG4gICAgICAgIHZhciBhdHRlbXB0cyA9IFtdO1xuXG4gICAgICAgIHZhciBvcHRzID0ge1xuICAgICAgICAgICAgdGltZXM6IERFRkFVTFRfVElNRVMsXG4gICAgICAgICAgICBpbnRlcnZhbDogREVGQVVMVF9JTlRFUlZBTFxuICAgICAgICB9O1xuXG4gICAgICAgIGZ1bmN0aW9uIHBhcnNlVGltZXMoYWNjLCB0KXtcbiAgICAgICAgICAgIGlmKHR5cGVvZiB0ID09PSAnbnVtYmVyJyl7XG4gICAgICAgICAgICAgICAgYWNjLnRpbWVzID0gcGFyc2VJbnQodCwgMTApIHx8IERFRkFVTFRfVElNRVM7XG4gICAgICAgICAgICB9IGVsc2UgaWYodHlwZW9mIHQgPT09ICdvYmplY3QnKXtcbiAgICAgICAgICAgICAgICBhY2MudGltZXMgPSBwYXJzZUludCh0LnRpbWVzLCAxMCkgfHwgREVGQVVMVF9USU1FUztcbiAgICAgICAgICAgICAgICBhY2MuaW50ZXJ2YWwgPSBwYXJzZUludCh0LmludGVydmFsLCAxMCkgfHwgREVGQVVMVF9JTlRFUlZBTDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbnN1cHBvcnRlZCBhcmd1bWVudCB0eXBlIGZvciBcXCd0aW1lc1xcJzogJyArIHR5cGVvZiB0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICBpZiAobGVuZ3RoIDwgMSB8fCBsZW5ndGggPiAzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgYXJndW1lbnRzIC0gbXVzdCBiZSBlaXRoZXIgKHRhc2spLCAodGFzaywgY2FsbGJhY2spLCAodGltZXMsIHRhc2spIG9yICh0aW1lcywgdGFzaywgY2FsbGJhY2spJyk7XG4gICAgICAgIH0gZWxzZSBpZiAobGVuZ3RoIDw9IDIgJiYgdHlwZW9mIHRpbWVzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IHRhc2s7XG4gICAgICAgICAgICB0YXNrID0gdGltZXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiB0aW1lcyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcGFyc2VUaW1lcyhvcHRzLCB0aW1lcyk7XG4gICAgICAgIH1cbiAgICAgICAgb3B0cy5jYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgICAgICBvcHRzLnRhc2sgPSB0YXNrO1xuXG4gICAgICAgIGZ1bmN0aW9uIHdyYXBwZWRUYXNrKHdyYXBwZWRDYWxsYmFjaywgd3JhcHBlZFJlc3VsdHMpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIHJldHJ5QXR0ZW1wdCh0YXNrLCBmaW5hbEF0dGVtcHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oc2VyaWVzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgdGFzayhmdW5jdGlvbihlcnIsIHJlc3VsdCl7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJpZXNDYWxsYmFjayghZXJyIHx8IGZpbmFsQXR0ZW1wdCwge2VycjogZXJyLCByZXN1bHQ6IHJlc3VsdH0pO1xuICAgICAgICAgICAgICAgICAgICB9LCB3cmFwcGVkUmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gcmV0cnlJbnRlcnZhbChpbnRlcnZhbCl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHNlcmllc0NhbGxiYWNrKXtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VyaWVzQ2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIGludGVydmFsKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB3aGlsZSAob3B0cy50aW1lcykge1xuXG4gICAgICAgICAgICAgICAgdmFyIGZpbmFsQXR0ZW1wdCA9ICEob3B0cy50aW1lcy09MSk7XG4gICAgICAgICAgICAgICAgYXR0ZW1wdHMucHVzaChyZXRyeUF0dGVtcHQob3B0cy50YXNrLCBmaW5hbEF0dGVtcHQpKTtcbiAgICAgICAgICAgICAgICBpZighZmluYWxBdHRlbXB0ICYmIG9wdHMuaW50ZXJ2YWwgPiAwKXtcbiAgICAgICAgICAgICAgICAgICAgYXR0ZW1wdHMucHVzaChyZXRyeUludGVydmFsKG9wdHMuaW50ZXJ2YWwpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGFzeW5jLnNlcmllcyhhdHRlbXB0cywgZnVuY3Rpb24oZG9uZSwgZGF0YSl7XG4gICAgICAgICAgICAgICAgZGF0YSA9IGRhdGFbZGF0YS5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgICAgICAod3JhcHBlZENhbGxiYWNrIHx8IG9wdHMuY2FsbGJhY2spKGRhdGEuZXJyLCBkYXRhLnJlc3VsdCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIGEgY2FsbGJhY2sgaXMgcGFzc2VkLCBydW4gdGhpcyBhcyBhIGNvbnRyb2xsIGZsb3dcbiAgICAgICAgcmV0dXJuIG9wdHMuY2FsbGJhY2sgPyB3cmFwcGVkVGFzaygpIDogd3JhcHBlZFRhc2s7XG4gICAgfTtcblxuICAgIGFzeW5jLndhdGVyZmFsbCA9IGZ1bmN0aW9uICh0YXNrcywgY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sgPSBfb25jZShjYWxsYmFjayB8fCBub29wKTtcbiAgICAgICAgaWYgKCFfaXNBcnJheSh0YXNrcykpIHtcbiAgICAgICAgICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoJ0ZpcnN0IGFyZ3VtZW50IHRvIHdhdGVyZmFsbCBtdXN0IGJlIGFuIGFycmF5IG9mIGZ1bmN0aW9ucycpO1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0YXNrcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHdyYXBJdGVyYXRvcihpdGVyYXRvcikge1xuICAgICAgICAgICAgcmV0dXJuIF9yZXN0UGFyYW0oZnVuY3Rpb24gKGVyciwgYXJncykge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgW2Vycl0uY29uY2F0KGFyZ3MpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXh0ID0gaXRlcmF0b3IubmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobmV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJncy5wdXNoKHdyYXBJdGVyYXRvcihuZXh0KSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVuc3VyZUFzeW5jKGl0ZXJhdG9yKS5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB3cmFwSXRlcmF0b3IoYXN5bmMuaXRlcmF0b3IodGFza3MpKSgpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBfcGFyYWxsZWwoZWFjaGZuLCB0YXNrcywgY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBub29wO1xuICAgICAgICB2YXIgcmVzdWx0cyA9IF9pc0FycmF5TGlrZSh0YXNrcykgPyBbXSA6IHt9O1xuXG4gICAgICAgIGVhY2hmbih0YXNrcywgZnVuY3Rpb24gKHRhc2ssIGtleSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRhc2soX3Jlc3RQYXJhbShmdW5jdGlvbiAoZXJyLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoIDw9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgYXJncyA9IGFyZ3NbMF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3VsdHNba2V5XSA9IGFyZ3M7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgY2FsbGJhY2soZXJyLCByZXN1bHRzKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMucGFyYWxsZWwgPSBmdW5jdGlvbiAodGFza3MsIGNhbGxiYWNrKSB7XG4gICAgICAgIF9wYXJhbGxlbChhc3luYy5lYWNoT2YsIHRhc2tzLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLnBhcmFsbGVsTGltaXQgPSBmdW5jdGlvbih0YXNrcywgbGltaXQsIGNhbGxiYWNrKSB7XG4gICAgICAgIF9wYXJhbGxlbChfZWFjaE9mTGltaXQobGltaXQpLCB0YXNrcywgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy5zZXJpZXMgPSBmdW5jdGlvbih0YXNrcywgY2FsbGJhY2spIHtcbiAgICAgICAgX3BhcmFsbGVsKGFzeW5jLmVhY2hPZlNlcmllcywgdGFza3MsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMuaXRlcmF0b3IgPSBmdW5jdGlvbiAodGFza3MpIHtcbiAgICAgICAgZnVuY3Rpb24gbWFrZUNhbGxiYWNrKGluZGV4KSB7XG4gICAgICAgICAgICBmdW5jdGlvbiBmbigpIHtcbiAgICAgICAgICAgICAgICBpZiAodGFza3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhc2tzW2luZGV4XS5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZm4ubmV4dCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm4ubmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKGluZGV4IDwgdGFza3MubGVuZ3RoIC0gMSkgPyBtYWtlQ2FsbGJhY2soaW5kZXggKyAxKTogbnVsbDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gZm47XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1ha2VDYWxsYmFjaygwKTtcbiAgICB9O1xuXG4gICAgYXN5bmMuYXBwbHkgPSBfcmVzdFBhcmFtKGZ1bmN0aW9uIChmbiwgYXJncykge1xuICAgICAgICByZXR1cm4gX3Jlc3RQYXJhbShmdW5jdGlvbiAoY2FsbEFyZ3MpIHtcbiAgICAgICAgICAgIHJldHVybiBmbi5hcHBseShcbiAgICAgICAgICAgICAgICBudWxsLCBhcmdzLmNvbmNhdChjYWxsQXJncylcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gX2NvbmNhdChlYWNoZm4sIGFyciwgZm4sIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgZWFjaGZuKGFyciwgZnVuY3Rpb24gKHgsIGluZGV4LCBjYikge1xuICAgICAgICAgICAgZm4oeCwgZnVuY3Rpb24gKGVyciwgeSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQoeSB8fCBbXSk7XG4gICAgICAgICAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnIsIHJlc3VsdCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYy5jb25jYXQgPSBkb1BhcmFsbGVsKF9jb25jYXQpO1xuICAgIGFzeW5jLmNvbmNhdFNlcmllcyA9IGRvU2VyaWVzKF9jb25jYXQpO1xuXG4gICAgYXN5bmMud2hpbHN0ID0gZnVuY3Rpb24gKHRlc3QsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IGNhbGxiYWNrIHx8IG5vb3A7XG4gICAgICAgIGlmICh0ZXN0KCkpIHtcbiAgICAgICAgICAgIHZhciBuZXh0ID0gX3Jlc3RQYXJhbShmdW5jdGlvbihlcnIsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0ZXN0LmFwcGx5KHRoaXMsIGFyZ3MpKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZXJhdG9yKG5leHQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIFtudWxsXS5jb25jYXQoYXJncykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaXRlcmF0b3IobmV4dCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBhc3luYy5kb1doaWxzdCA9IGZ1bmN0aW9uIChpdGVyYXRvciwgdGVzdCwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGNhbGxzID0gMDtcbiAgICAgICAgcmV0dXJuIGFzeW5jLndoaWxzdChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiArK2NhbGxzIDw9IDEgfHwgdGVzdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9LCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy51bnRpbCA9IGZ1bmN0aW9uICh0ZXN0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jLndoaWxzdChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiAhdGVzdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9LCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy5kb1VudGlsID0gZnVuY3Rpb24gKGl0ZXJhdG9yLCB0ZXN0LCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gYXN5bmMuZG9XaGlsc3QoaXRlcmF0b3IsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuICF0ZXN0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0sIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMuZHVyaW5nID0gZnVuY3Rpb24gKHRlc3QsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IGNhbGxiYWNrIHx8IG5vb3A7XG5cbiAgICAgICAgdmFyIG5leHQgPSBfcmVzdFBhcmFtKGZ1bmN0aW9uKGVyciwgYXJncykge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGFyZ3MucHVzaChjaGVjayk7XG4gICAgICAgICAgICAgICAgdGVzdC5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGNoZWNrID0gZnVuY3Rpb24oZXJyLCB0cnV0aCkge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRydXRoKSB7XG4gICAgICAgICAgICAgICAgaXRlcmF0b3IobmV4dCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHRlc3QoY2hlY2spO1xuICAgIH07XG5cbiAgICBhc3luYy5kb0R1cmluZyA9IGZ1bmN0aW9uIChpdGVyYXRvciwgdGVzdCwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGNhbGxzID0gMDtcbiAgICAgICAgYXN5bmMuZHVyaW5nKGZ1bmN0aW9uKG5leHQpIHtcbiAgICAgICAgICAgIGlmIChjYWxscysrIDwgMSkge1xuICAgICAgICAgICAgICAgIG5leHQobnVsbCwgdHJ1ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRlc3QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gX3F1ZXVlKHdvcmtlciwgY29uY3VycmVuY3ksIHBheWxvYWQpIHtcbiAgICAgICAgaWYgKGNvbmN1cnJlbmN5ID09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbmN1cnJlbmN5ID0gMTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKGNvbmN1cnJlbmN5ID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbmN1cnJlbmN5IG11c3Qgbm90IGJlIHplcm8nKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBfaW5zZXJ0KHEsIGRhdGEsIHBvcywgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjayAhPSBudWxsICYmIHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidGFzayBjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb25cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBxLnN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKCFfaXNBcnJheShkYXRhKSkge1xuICAgICAgICAgICAgICAgIGRhdGEgPSBbZGF0YV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihkYXRhLmxlbmd0aCA9PT0gMCAmJiBxLmlkbGUoKSkge1xuICAgICAgICAgICAgICAgIC8vIGNhbGwgZHJhaW4gaW1tZWRpYXRlbHkgaWYgdGhlcmUgYXJlIG5vIHRhc2tzXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFzeW5jLnNldEltbWVkaWF0ZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgcS5kcmFpbigpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX2FycmF5RWFjaChkYXRhLCBmdW5jdGlvbih0YXNrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGl0ZW0gPSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHRhc2ssXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiBjYWxsYmFjayB8fCBub29wXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGlmIChwb3MpIHtcbiAgICAgICAgICAgICAgICAgICAgcS50YXNrcy51bnNoaWZ0KGl0ZW0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHEudGFza3MucHVzaChpdGVtKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAocS50YXNrcy5sZW5ndGggPT09IHEuY29uY3VycmVuY3kpIHtcbiAgICAgICAgICAgICAgICAgICAgcS5zYXR1cmF0ZWQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGFzeW5jLnNldEltbWVkaWF0ZShxLnByb2Nlc3MpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIF9uZXh0KHEsIHRhc2tzKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICB3b3JrZXJzIC09IDE7XG5cbiAgICAgICAgICAgICAgICB2YXIgcmVtb3ZlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICAgICAgICAgIF9hcnJheUVhY2godGFza3MsIGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgICAgICAgICAgICAgIF9hcnJheUVhY2god29ya2Vyc0xpc3QsIGZ1bmN0aW9uICh3b3JrZXIsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAod29ya2VyID09PSB0YXNrICYmICFyZW1vdmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd29ya2Vyc0xpc3Quc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGFzay5jYWxsYmFjay5hcHBseSh0YXNrLCBhcmdzKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAocS50YXNrcy5sZW5ndGggKyB3b3JrZXJzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHEuZHJhaW4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcS5wcm9jZXNzKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHdvcmtlcnMgPSAwO1xuICAgICAgICB2YXIgd29ya2Vyc0xpc3QgPSBbXTtcbiAgICAgICAgdmFyIHEgPSB7XG4gICAgICAgICAgICB0YXNrczogW10sXG4gICAgICAgICAgICBjb25jdXJyZW5jeTogY29uY3VycmVuY3ksXG4gICAgICAgICAgICBwYXlsb2FkOiBwYXlsb2FkLFxuICAgICAgICAgICAgc2F0dXJhdGVkOiBub29wLFxuICAgICAgICAgICAgZW1wdHk6IG5vb3AsXG4gICAgICAgICAgICBkcmFpbjogbm9vcCxcbiAgICAgICAgICAgIHN0YXJ0ZWQ6IGZhbHNlLFxuICAgICAgICAgICAgcGF1c2VkOiBmYWxzZSxcbiAgICAgICAgICAgIHB1c2g6IGZ1bmN0aW9uIChkYXRhLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIF9pbnNlcnQocSwgZGF0YSwgZmFsc2UsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBraWxsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcS5kcmFpbiA9IG5vb3A7XG4gICAgICAgICAgICAgICAgcS50YXNrcyA9IFtdO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVuc2hpZnQ6IGZ1bmN0aW9uIChkYXRhLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIF9pbnNlcnQocSwgZGF0YSwgdHJ1ZSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB3aGlsZSghcS5wYXVzZWQgJiYgd29ya2VycyA8IHEuY29uY3VycmVuY3kgJiYgcS50YXNrcy5sZW5ndGgpe1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciB0YXNrcyA9IHEucGF5bG9hZCA/XG4gICAgICAgICAgICAgICAgICAgICAgICBxLnRhc2tzLnNwbGljZSgwLCBxLnBheWxvYWQpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHEudGFza3Muc3BsaWNlKDAsIHEudGFza3MubGVuZ3RoKTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IF9tYXAodGFza3MsIGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGFzay5kYXRhO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAocS50YXNrcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHEuZW1wdHkoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB3b3JrZXJzICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIHdvcmtlcnNMaXN0LnB1c2godGFza3NbMF0pO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2IgPSBvbmx5X29uY2UoX25leHQocSwgdGFza3MpKTtcbiAgICAgICAgICAgICAgICAgICAgd29ya2VyKGRhdGEsIGNiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGVuZ3RoOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHEudGFza3MubGVuZ3RoO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJ1bm5pbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gd29ya2VycztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB3b3JrZXJzTGlzdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB3b3JrZXJzTGlzdDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpZGxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcS50YXNrcy5sZW5ndGggKyB3b3JrZXJzID09PSAwO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBhdXNlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcS5wYXVzZWQgPSB0cnVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlc3VtZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChxLnBhdXNlZCA9PT0gZmFsc2UpIHsgcmV0dXJuOyB9XG4gICAgICAgICAgICAgICAgcS5wYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdW1lQ291bnQgPSBNYXRoLm1pbihxLmNvbmN1cnJlbmN5LCBxLnRhc2tzLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgLy8gTmVlZCB0byBjYWxsIHEucHJvY2VzcyBvbmNlIHBlciBjb25jdXJyZW50XG4gICAgICAgICAgICAgICAgLy8gd29ya2VyIHRvIHByZXNlcnZlIGZ1bGwgY29uY3VycmVuY3kgYWZ0ZXIgcGF1c2VcbiAgICAgICAgICAgICAgICBmb3IgKHZhciB3ID0gMTsgdyA8PSByZXN1bWVDb3VudDsgdysrKSB7XG4gICAgICAgICAgICAgICAgICAgIGFzeW5jLnNldEltbWVkaWF0ZShxLnByb2Nlc3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHE7XG4gICAgfVxuXG4gICAgYXN5bmMucXVldWUgPSBmdW5jdGlvbiAod29ya2VyLCBjb25jdXJyZW5jeSkge1xuICAgICAgICB2YXIgcSA9IF9xdWV1ZShmdW5jdGlvbiAoaXRlbXMsIGNiKSB7XG4gICAgICAgICAgICB3b3JrZXIoaXRlbXNbMF0sIGNiKTtcbiAgICAgICAgfSwgY29uY3VycmVuY3ksIDEpO1xuXG4gICAgICAgIHJldHVybiBxO1xuICAgIH07XG5cbiAgICBhc3luYy5wcmlvcml0eVF1ZXVlID0gZnVuY3Rpb24gKHdvcmtlciwgY29uY3VycmVuY3kpIHtcblxuICAgICAgICBmdW5jdGlvbiBfY29tcGFyZVRhc2tzKGEsIGIpe1xuICAgICAgICAgICAgcmV0dXJuIGEucHJpb3JpdHkgLSBiLnByaW9yaXR5O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gX2JpbmFyeVNlYXJjaChzZXF1ZW5jZSwgaXRlbSwgY29tcGFyZSkge1xuICAgICAgICAgICAgdmFyIGJlZyA9IC0xLFxuICAgICAgICAgICAgICAgIGVuZCA9IHNlcXVlbmNlLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICB3aGlsZSAoYmVnIDwgZW5kKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1pZCA9IGJlZyArICgoZW5kIC0gYmVnICsgMSkgPj4+IDEpO1xuICAgICAgICAgICAgICAgIGlmIChjb21wYXJlKGl0ZW0sIHNlcXVlbmNlW21pZF0pID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgYmVnID0gbWlkO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGVuZCA9IG1pZCAtIDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGJlZztcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIF9pbnNlcnQocSwgZGF0YSwgcHJpb3JpdHksIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2sgIT0gbnVsbCAmJiB0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInRhc2sgY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcS5zdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmICghX2lzQXJyYXkoZGF0YSkpIHtcbiAgICAgICAgICAgICAgICBkYXRhID0gW2RhdGFdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoZGF0YS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAvLyBjYWxsIGRyYWluIGltbWVkaWF0ZWx5IGlmIHRoZXJlIGFyZSBubyB0YXNrc1xuICAgICAgICAgICAgICAgIHJldHVybiBhc3luYy5zZXRJbW1lZGlhdGUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHEuZHJhaW4oKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF9hcnJheUVhY2goZGF0YSwgZnVuY3Rpb24odGFzaykge1xuICAgICAgICAgICAgICAgIHZhciBpdGVtID0ge1xuICAgICAgICAgICAgICAgICAgICBkYXRhOiB0YXNrLFxuICAgICAgICAgICAgICAgICAgICBwcmlvcml0eTogcHJpb3JpdHksXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiB0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicgPyBjYWxsYmFjayA6IG5vb3BcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgcS50YXNrcy5zcGxpY2UoX2JpbmFyeVNlYXJjaChxLnRhc2tzLCBpdGVtLCBfY29tcGFyZVRhc2tzKSArIDEsIDAsIGl0ZW0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKHEudGFza3MubGVuZ3RoID09PSBxLmNvbmN1cnJlbmN5KSB7XG4gICAgICAgICAgICAgICAgICAgIHEuc2F0dXJhdGVkKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGFzeW5jLnNldEltbWVkaWF0ZShxLnByb2Nlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTdGFydCB3aXRoIGEgbm9ybWFsIHF1ZXVlXG4gICAgICAgIHZhciBxID0gYXN5bmMucXVldWUod29ya2VyLCBjb25jdXJyZW5jeSk7XG5cbiAgICAgICAgLy8gT3ZlcnJpZGUgcHVzaCB0byBhY2NlcHQgc2Vjb25kIHBhcmFtZXRlciByZXByZXNlbnRpbmcgcHJpb3JpdHlcbiAgICAgICAgcS5wdXNoID0gZnVuY3Rpb24gKGRhdGEsIHByaW9yaXR5LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgX2luc2VydChxLCBkYXRhLCBwcmlvcml0eSwgY2FsbGJhY2spO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIFJlbW92ZSB1bnNoaWZ0IGZ1bmN0aW9uXG4gICAgICAgIGRlbGV0ZSBxLnVuc2hpZnQ7XG5cbiAgICAgICAgcmV0dXJuIHE7XG4gICAgfTtcblxuICAgIGFzeW5jLmNhcmdvID0gZnVuY3Rpb24gKHdvcmtlciwgcGF5bG9hZCkge1xuICAgICAgICByZXR1cm4gX3F1ZXVlKHdvcmtlciwgMSwgcGF5bG9hZCk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIF9jb25zb2xlX2ZuKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIF9yZXN0UGFyYW0oZnVuY3Rpb24gKGZuLCBhcmdzKSB7XG4gICAgICAgICAgICBmbi5hcHBseShudWxsLCBhcmdzLmNvbmNhdChbX3Jlc3RQYXJhbShmdW5jdGlvbiAoZXJyLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uc29sZS5lcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChjb25zb2xlW25hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfYXJyYXlFYWNoKGFyZ3MsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZVtuYW1lXSh4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSldKSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYy5sb2cgPSBfY29uc29sZV9mbignbG9nJyk7XG4gICAgYXN5bmMuZGlyID0gX2NvbnNvbGVfZm4oJ2RpcicpO1xuICAgIC8qYXN5bmMuaW5mbyA9IF9jb25zb2xlX2ZuKCdpbmZvJyk7XG4gICAgYXN5bmMud2FybiA9IF9jb25zb2xlX2ZuKCd3YXJuJyk7XG4gICAgYXN5bmMuZXJyb3IgPSBfY29uc29sZV9mbignZXJyb3InKTsqL1xuXG4gICAgYXN5bmMubWVtb2l6ZSA9IGZ1bmN0aW9uIChmbiwgaGFzaGVyKSB7XG4gICAgICAgIHZhciBtZW1vID0ge307XG4gICAgICAgIHZhciBxdWV1ZXMgPSB7fTtcbiAgICAgICAgaGFzaGVyID0gaGFzaGVyIHx8IGlkZW50aXR5O1xuICAgICAgICB2YXIgbWVtb2l6ZWQgPSBfcmVzdFBhcmFtKGZ1bmN0aW9uIG1lbW9pemVkKGFyZ3MpIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3MucG9wKCk7XG4gICAgICAgICAgICB2YXIga2V5ID0gaGFzaGVyLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgICAgICAgaWYgKGtleSBpbiBtZW1vKSB7XG4gICAgICAgICAgICAgICAgYXN5bmMuc2V0SW1tZWRpYXRlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgbWVtb1trZXldKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGtleSBpbiBxdWV1ZXMpIHtcbiAgICAgICAgICAgICAgICBxdWV1ZXNba2V5XS5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHF1ZXVlc1trZXldID0gW2NhbGxiYWNrXTtcbiAgICAgICAgICAgICAgICBmbi5hcHBseShudWxsLCBhcmdzLmNvbmNhdChbX3Jlc3RQYXJhbShmdW5jdGlvbiAoYXJncykge1xuICAgICAgICAgICAgICAgICAgICBtZW1vW2tleV0gPSBhcmdzO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcSA9IHF1ZXVlc1trZXldO1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgcXVldWVzW2tleV07XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gcS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHFbaV0uYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KV0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIG1lbW9pemVkLm1lbW8gPSBtZW1vO1xuICAgICAgICBtZW1vaXplZC51bm1lbW9pemVkID0gZm47XG4gICAgICAgIHJldHVybiBtZW1vaXplZDtcbiAgICB9O1xuXG4gICAgYXN5bmMudW5tZW1vaXplID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gKGZuLnVubWVtb2l6ZWQgfHwgZm4pLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIF90aW1lcyhtYXBwZXIpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChjb3VudCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBtYXBwZXIoX3JhbmdlKGNvdW50KSwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhc3luYy50aW1lcyA9IF90aW1lcyhhc3luYy5tYXApO1xuICAgIGFzeW5jLnRpbWVzU2VyaWVzID0gX3RpbWVzKGFzeW5jLm1hcFNlcmllcyk7XG4gICAgYXN5bmMudGltZXNMaW1pdCA9IGZ1bmN0aW9uIChjb3VudCwgbGltaXQsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gYXN5bmMubWFwTGltaXQoX3JhbmdlKGNvdW50KSwgbGltaXQsIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLnNlcSA9IGZ1bmN0aW9uICgvKiBmdW5jdGlvbnMuLi4gKi8pIHtcbiAgICAgICAgdmFyIGZucyA9IGFyZ3VtZW50cztcbiAgICAgICAgcmV0dXJuIF9yZXN0UGFyYW0oZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gYXJnc1thcmdzLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgYXJncy5wb3AoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sgPSBub29wO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhc3luYy5yZWR1Y2UoZm5zLCBhcmdzLCBmdW5jdGlvbiAobmV3YXJncywgZm4sIGNiKSB7XG4gICAgICAgICAgICAgICAgZm4uYXBwbHkodGhhdCwgbmV3YXJncy5jb25jYXQoW19yZXN0UGFyYW0oZnVuY3Rpb24gKGVyciwgbmV4dGFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgY2IoZXJyLCBuZXh0YXJncyk7XG4gICAgICAgICAgICAgICAgfSldKSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVuY3Rpb24gKGVyciwgcmVzdWx0cykge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KHRoYXQsIFtlcnJdLmNvbmNhdChyZXN1bHRzKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGFzeW5jLmNvbXBvc2UgPSBmdW5jdGlvbiAoLyogZnVuY3Rpb25zLi4uICovKSB7XG4gICAgICAgIHJldHVybiBhc3luYy5zZXEuYXBwbHkobnVsbCwgQXJyYXkucHJvdG90eXBlLnJldmVyc2UuY2FsbChhcmd1bWVudHMpKTtcbiAgICB9O1xuXG5cbiAgICBmdW5jdGlvbiBfYXBwbHlFYWNoKGVhY2hmbikge1xuICAgICAgICByZXR1cm4gX3Jlc3RQYXJhbShmdW5jdGlvbihmbnMsIGFyZ3MpIHtcbiAgICAgICAgICAgIHZhciBnbyA9IF9yZXN0UGFyYW0oZnVuY3Rpb24oYXJncykge1xuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBhcmdzLnBvcCgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBlYWNoZm4oZm5zLCBmdW5jdGlvbiAoZm4sIF8sIGNiKSB7XG4gICAgICAgICAgICAgICAgICAgIGZuLmFwcGx5KHRoYXQsIGFyZ3MuY29uY2F0KFtjYl0pKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdvLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdvO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYy5hcHBseUVhY2ggPSBfYXBwbHlFYWNoKGFzeW5jLmVhY2hPZik7XG4gICAgYXN5bmMuYXBwbHlFYWNoU2VyaWVzID0gX2FwcGx5RWFjaChhc3luYy5lYWNoT2ZTZXJpZXMpO1xuXG5cbiAgICBhc3luYy5mb3JldmVyID0gZnVuY3Rpb24gKGZuLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgZG9uZSA9IG9ubHlfb25jZShjYWxsYmFjayB8fCBub29wKTtcbiAgICAgICAgdmFyIHRhc2sgPSBlbnN1cmVBc3luYyhmbik7XG4gICAgICAgIGZ1bmN0aW9uIG5leHQoZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRvbmUoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRhc2sobmV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgbmV4dCgpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBlbnN1cmVBc3luYyhmbikge1xuICAgICAgICByZXR1cm4gX3Jlc3RQYXJhbShmdW5jdGlvbiAoYXJncykge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gYXJncy5wb3AoKTtcbiAgICAgICAgICAgIGFyZ3MucHVzaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGlubmVyQXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgICAgICBpZiAoc3luYykge1xuICAgICAgICAgICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgaW5uZXJBcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgaW5uZXJBcmdzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciBzeW5jID0gdHJ1ZTtcbiAgICAgICAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgc3luYyA9IGZhbHNlO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYy5lbnN1cmVBc3luYyA9IGVuc3VyZUFzeW5jO1xuXG4gICAgYXN5bmMuY29uc3RhbnQgPSBfcmVzdFBhcmFtKGZ1bmN0aW9uKHZhbHVlcykge1xuICAgICAgICB2YXIgYXJncyA9IFtudWxsXS5jb25jYXQodmFsdWVzKTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgYXN5bmMud3JhcFN5bmMgPVxuICAgIGFzeW5jLmFzeW5jaWZ5ID0gZnVuY3Rpb24gYXN5bmNpZnkoZnVuYykge1xuICAgICAgICByZXR1cm4gX3Jlc3RQYXJhbShmdW5jdGlvbiAoYXJncykge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gYXJncy5wb3AoKTtcbiAgICAgICAgICAgIHZhciByZXN1bHQ7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gaWYgcmVzdWx0IGlzIFByb21pc2Ugb2JqZWN0XG4gICAgICAgICAgICBpZiAoX2lzT2JqZWN0KHJlc3VsdCkgJiYgdHlwZW9mIHJlc3VsdC50aGVuID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQudGhlbihmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfSlbXCJjYXRjaFwiXShmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyLm1lc3NhZ2UgPyBlcnIgOiBuZXcgRXJyb3IoZXJyKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLyBOb2RlLmpzXG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gYXN5bmM7XG4gICAgfVxuICAgIC8vIEFNRCAvIFJlcXVpcmVKU1xuICAgIGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoW10sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBhc3luYztcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8vIGluY2x1ZGVkIGRpcmVjdGx5IHZpYSA8c2NyaXB0PiB0YWdcbiAgICBlbHNlIHtcbiAgICAgICAgcm9vdC5hc3luYyA9IGFzeW5jO1xuICAgIH1cblxufSgpKTtcbiIsIi8qIVxyXG4gKiBAbmFtZSBKYXZhU2NyaXB0L05vZGVKUyBNZXJnZSB2MS4yLjBcclxuICogQGF1dGhvciB5ZWlrb3NcclxuICogQHJlcG9zaXRvcnkgaHR0cHM6Ly9naXRodWIuY29tL3llaWtvcy9qcy5tZXJnZVxyXG5cclxuICogQ29weXJpZ2h0IDIwMTQgeWVpa29zIC0gTUlUIGxpY2Vuc2VcclxuICogaHR0cHM6Ly9yYXcuZ2l0aHViLmNvbS95ZWlrb3MvanMubWVyZ2UvbWFzdGVyL0xJQ0VOU0VcclxuICovXHJcblxyXG47KGZ1bmN0aW9uKGlzTm9kZSkge1xyXG5cclxuXHQvKipcclxuXHQgKiBNZXJnZSBvbmUgb3IgbW9yZSBvYmplY3RzIFxyXG5cdCAqIEBwYXJhbSBib29sPyBjbG9uZVxyXG5cdCAqIEBwYXJhbSBtaXhlZCwuLi4gYXJndW1lbnRzXHJcblx0ICogQHJldHVybiBvYmplY3RcclxuXHQgKi9cclxuXHJcblx0dmFyIFB1YmxpYyA9IGZ1bmN0aW9uKGNsb25lKSB7XHJcblxyXG5cdFx0cmV0dXJuIG1lcmdlKGNsb25lID09PSB0cnVlLCBmYWxzZSwgYXJndW1lbnRzKTtcclxuXHJcblx0fSwgcHVibGljTmFtZSA9ICdtZXJnZSc7XHJcblxyXG5cdC8qKlxyXG5cdCAqIE1lcmdlIHR3byBvciBtb3JlIG9iamVjdHMgcmVjdXJzaXZlbHkgXHJcblx0ICogQHBhcmFtIGJvb2w/IGNsb25lXHJcblx0ICogQHBhcmFtIG1peGVkLC4uLiBhcmd1bWVudHNcclxuXHQgKiBAcmV0dXJuIG9iamVjdFxyXG5cdCAqL1xyXG5cclxuXHRQdWJsaWMucmVjdXJzaXZlID0gZnVuY3Rpb24oY2xvbmUpIHtcclxuXHJcblx0XHRyZXR1cm4gbWVyZ2UoY2xvbmUgPT09IHRydWUsIHRydWUsIGFyZ3VtZW50cyk7XHJcblxyXG5cdH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIENsb25lIHRoZSBpbnB1dCByZW1vdmluZyBhbnkgcmVmZXJlbmNlXHJcblx0ICogQHBhcmFtIG1peGVkIGlucHV0XHJcblx0ICogQHJldHVybiBtaXhlZFxyXG5cdCAqL1xyXG5cclxuXHRQdWJsaWMuY2xvbmUgPSBmdW5jdGlvbihpbnB1dCkge1xyXG5cclxuXHRcdHZhciBvdXRwdXQgPSBpbnB1dCxcclxuXHRcdFx0dHlwZSA9IHR5cGVPZihpbnB1dCksXHJcblx0XHRcdGluZGV4LCBzaXplO1xyXG5cclxuXHRcdGlmICh0eXBlID09PSAnYXJyYXknKSB7XHJcblxyXG5cdFx0XHRvdXRwdXQgPSBbXTtcclxuXHRcdFx0c2l6ZSA9IGlucHV0Lmxlbmd0aDtcclxuXHJcblx0XHRcdGZvciAoaW5kZXg9MDtpbmRleDxzaXplOysraW5kZXgpXHJcblxyXG5cdFx0XHRcdG91dHB1dFtpbmRleF0gPSBQdWJsaWMuY2xvbmUoaW5wdXRbaW5kZXhdKTtcclxuXHJcblx0XHR9IGVsc2UgaWYgKHR5cGUgPT09ICdvYmplY3QnKSB7XHJcblxyXG5cdFx0XHRvdXRwdXQgPSB7fTtcclxuXHJcblx0XHRcdGZvciAoaW5kZXggaW4gaW5wdXQpXHJcblxyXG5cdFx0XHRcdG91dHB1dFtpbmRleF0gPSBQdWJsaWMuY2xvbmUoaW5wdXRbaW5kZXhdKTtcclxuXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIG91dHB1dDtcclxuXHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogTWVyZ2UgdHdvIG9iamVjdHMgcmVjdXJzaXZlbHlcclxuXHQgKiBAcGFyYW0gbWl4ZWQgaW5wdXRcclxuXHQgKiBAcGFyYW0gbWl4ZWQgZXh0ZW5kXHJcblx0ICogQHJldHVybiBtaXhlZFxyXG5cdCAqL1xyXG5cclxuXHRmdW5jdGlvbiBtZXJnZV9yZWN1cnNpdmUoYmFzZSwgZXh0ZW5kKSB7XHJcblxyXG5cdFx0aWYgKHR5cGVPZihiYXNlKSAhPT0gJ29iamVjdCcpXHJcblxyXG5cdFx0XHRyZXR1cm4gZXh0ZW5kO1xyXG5cclxuXHRcdGZvciAodmFyIGtleSBpbiBleHRlbmQpIHtcclxuXHJcblx0XHRcdGlmICh0eXBlT2YoYmFzZVtrZXldKSA9PT0gJ29iamVjdCcgJiYgdHlwZU9mKGV4dGVuZFtrZXldKSA9PT0gJ29iamVjdCcpIHtcclxuXHJcblx0XHRcdFx0YmFzZVtrZXldID0gbWVyZ2VfcmVjdXJzaXZlKGJhc2Vba2V5XSwgZXh0ZW5kW2tleV0pO1xyXG5cclxuXHRcdFx0fSBlbHNlIHtcclxuXHJcblx0XHRcdFx0YmFzZVtrZXldID0gZXh0ZW5kW2tleV07XHJcblxyXG5cdFx0XHR9XHJcblxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBiYXNlO1xyXG5cclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIE1lcmdlIHR3byBvciBtb3JlIG9iamVjdHNcclxuXHQgKiBAcGFyYW0gYm9vbCBjbG9uZVxyXG5cdCAqIEBwYXJhbSBib29sIHJlY3Vyc2l2ZVxyXG5cdCAqIEBwYXJhbSBhcnJheSBhcmd2XHJcblx0ICogQHJldHVybiBvYmplY3RcclxuXHQgKi9cclxuXHJcblx0ZnVuY3Rpb24gbWVyZ2UoY2xvbmUsIHJlY3Vyc2l2ZSwgYXJndikge1xyXG5cclxuXHRcdHZhciByZXN1bHQgPSBhcmd2WzBdLFxyXG5cdFx0XHRzaXplID0gYXJndi5sZW5ndGg7XHJcblxyXG5cdFx0aWYgKGNsb25lIHx8IHR5cGVPZihyZXN1bHQpICE9PSAnb2JqZWN0JylcclxuXHJcblx0XHRcdHJlc3VsdCA9IHt9O1xyXG5cclxuXHRcdGZvciAodmFyIGluZGV4PTA7aW5kZXg8c2l6ZTsrK2luZGV4KSB7XHJcblxyXG5cdFx0XHR2YXIgaXRlbSA9IGFyZ3ZbaW5kZXhdLFxyXG5cclxuXHRcdFx0XHR0eXBlID0gdHlwZU9mKGl0ZW0pO1xyXG5cclxuXHRcdFx0aWYgKHR5cGUgIT09ICdvYmplY3QnKSBjb250aW51ZTtcclxuXHJcblx0XHRcdGZvciAodmFyIGtleSBpbiBpdGVtKSB7XHJcblxyXG5cdFx0XHRcdHZhciBzaXRlbSA9IGNsb25lID8gUHVibGljLmNsb25lKGl0ZW1ba2V5XSkgOiBpdGVtW2tleV07XHJcblxyXG5cdFx0XHRcdGlmIChyZWN1cnNpdmUpIHtcclxuXHJcblx0XHRcdFx0XHRyZXN1bHRba2V5XSA9IG1lcmdlX3JlY3Vyc2l2ZShyZXN1bHRba2V5XSwgc2l0ZW0pO1xyXG5cclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cclxuXHRcdFx0XHRcdHJlc3VsdFtrZXldID0gc2l0ZW07XHJcblxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdH1cclxuXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHJlc3VsdDtcclxuXHJcblx0fVxyXG5cclxuXHQvKipcclxuXHQgKiBHZXQgdHlwZSBvZiB2YXJpYWJsZVxyXG5cdCAqIEBwYXJhbSBtaXhlZCBpbnB1dFxyXG5cdCAqIEByZXR1cm4gc3RyaW5nXHJcblx0ICpcclxuXHQgKiBAc2VlIGh0dHA6Ly9qc3BlcmYuY29tL3R5cGVvZnZhclxyXG5cdCAqL1xyXG5cclxuXHRmdW5jdGlvbiB0eXBlT2YoaW5wdXQpIHtcclxuXHJcblx0XHRyZXR1cm4gKHt9KS50b1N0cmluZy5jYWxsKGlucHV0KS5zbGljZSg4LCAtMSkudG9Mb3dlckNhc2UoKTtcclxuXHJcblx0fVxyXG5cclxuXHRpZiAoaXNOb2RlKSB7XHJcblxyXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBQdWJsaWM7XHJcblxyXG5cdH0gZWxzZSB7XHJcblxyXG5cdFx0d2luZG93W3B1YmxpY05hbWVdID0gUHVibGljO1xyXG5cclxuXHR9XHJcblxyXG59KSh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzID09PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cyk7IiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTAuMFxyXG4oZnVuY3Rpb24oKSB7XHJcbiAgdmFyIEF1dGhDb250cm9sbGVyLFxyXG4gICAgYmluZCA9IGZ1bmN0aW9uKGZuLCBtZSl7IHJldHVybiBmdW5jdGlvbigpeyByZXR1cm4gZm4uYXBwbHkobWUsIGFyZ3VtZW50cyk7IH07IH07XHJcblxyXG4gIEF1dGhDb250cm9sbGVyID0gKGZ1bmN0aW9uKCkge1xyXG4gICAgZnVuY3Rpb24gQXV0aENvbnRyb2xsZXIoJHNjb3BlLCAkaHR0cCkge1xyXG4gICAgICB0aGlzLiRzY29wZSA9ICRzY29wZTtcclxuICAgICAgdGhpcy4kaHR0cCA9ICRodHRwO1xyXG4gICAgICB0aGlzLl9zZXRUb2tlbiA9IGJpbmQodGhpcy5fc2V0VG9rZW4sIHRoaXMpO1xyXG4gICAgICB0aGlzLl9pbml0ID0gYmluZCh0aGlzLl9pbml0LCB0aGlzKTtcclxuICAgICAgdGhpcy4kc2NvcGUubWVzc2FnZSA9IG51bGw7XHJcbiAgICAgIHRoaXMuJHNjb3BlLmlzRGV2ZWxvcGVyID0gZmFsc2U7XHJcbiAgICAgIHRoaXMuJHNjb3BlLnNhbmRib3ggPSB7XHJcbiAgICAgICAgdG9rZW46IG51bGwsXHJcbiAgICAgICAgdXNlcm5hbWU6IG51bGxcclxuICAgICAgfTtcclxuICAgICAgdGhpcy4kc2NvcGUucHJvZHVjdGlvbiA9IHtcclxuICAgICAgICB0b2tlbjogbnVsbCxcclxuICAgICAgICB1c2VybmFtZTogbnVsbFxyXG4gICAgICB9O1xyXG4gICAgICB0aGlzLiRzY29wZS5zZXRUb2tlbiA9IHRoaXMuX3NldFRva2VuO1xyXG4gICAgICB0aGlzLl9pbml0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgQXV0aENvbnRyb2xsZXIucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLiRodHRwLmdldCgnL2F1dGgvdG9rZW4nKS5lcnJvcigoZnVuY3Rpb24oX3RoaXMpIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGRhdGEpO1xyXG4gICAgICAgIH07XHJcbiAgICAgIH0pKHRoaXMpKS5zdWNjZXNzKChmdW5jdGlvbihfdGhpcykge1xyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgICBfdGhpcy4kc2NvcGUucHJvZHVjdGlvbiA9IGRhdGE7XHJcbiAgICAgICAgICByZXR1cm4gX3RoaXMuJGh0dHAucG9zdCgnL2F1dGgvdG9rZW4nLCB7XHJcbiAgICAgICAgICAgIHNhbmRib3g6IHRydWVcclxuICAgICAgICAgIH0pLmVycm9yKGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGRhdGEpO1xyXG4gICAgICAgICAgfSkuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy4kc2NvcGUuc2FuZGJveCA9IGRhdGE7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgICB9KSh0aGlzKSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEF1dGhDb250cm9sbGVyLnByb3RvdHlwZS5fc2V0VG9rZW4gPSBmdW5jdGlvbihzYW5kYm94KSB7XHJcbiAgICAgIHZhciB0b2tlbjtcclxuICAgICAgdG9rZW4gPSBwcm9tcHQoXCJJbnB1dCBkZXZlbG9wZXIgdG9rZW4gKFwiICsgKHNhbmRib3ggPyAnc2FuZGJveCcgOiAncHJvZHVjdGlvbicpICsgXCIpXCIpO1xyXG4gICAgICBpZiAoIXRva2VuKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0aGlzLiRodHRwLnBvc3QoJy9hdXRoL3Rva2VuJywge1xyXG4gICAgICAgIHNhbmRib3g6IHNhbmRib3gsXHJcbiAgICAgICAgdG9rZW46IHRva2VuXHJcbiAgICAgIH0pLnN1Y2Nlc3MoKGZ1bmN0aW9uKF90aGlzKSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgICAgIGlmIChzYW5kYm94KSB7XHJcbiAgICAgICAgICAgIF90aGlzLiRzY29wZS5zYW5kYm94ID0gZGF0YTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIF90aGlzLiRzY29wZS5wcm9kdWN0aW9uID0gZGF0YTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmICghZGF0YSkge1xyXG4gICAgICAgICAgICByZXR1cm4gYWxlcnQoJ1Rva2VuIGlzIGludmFsaWQuJyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgfSkodGhpcykpLmVycm9yKChmdW5jdGlvbihfdGhpcykge1xyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgICByZXR1cm4gYWxlcnQoJ1NldCB0b2tlbiBmYWlsZWQuJyk7XHJcbiAgICAgICAgfTtcclxuICAgICAgfSkodGhpcykpO1xyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gQXV0aENvbnRyb2xsZXI7XHJcblxyXG4gIH0pKCk7XHJcblxyXG4gIGFwcC5jb250cm9sbGVyKCdBdXRoQ29udHJvbGxlcicsIFsnJHNjb3BlJywgJyRodHRwJywgQXV0aENvbnRyb2xsZXJdKTtcclxuXHJcbiAgbW9kdWxlLmV4cG9ydHMgPSBBdXRoQ29udHJvbGxlcjtcclxuXHJcbn0pLmNhbGwodGhpcyk7XHJcblxyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hdXRoLWNvbnRyb2xsZXIuanMubWFwXHJcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMC4wXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBDb250cm9sbGVyO1xuXG4gIENvbnRyb2xsZXIgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gQ29udHJvbGxlcigkc2NvcGUpIHtcbiAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xuICAgIH1cblxuICAgIHJldHVybiBDb250cm9sbGVyO1xuXG4gIH0pKCk7XG5cbiAgYXBwLmNvbnRyb2xsZXIoJ0NvbnRyb2xsZXInLCBbJyRzY29wZScsIENvbnRyb2xsZXJdKTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IENvbnRyb2xsZXI7XG5cbn0pLmNhbGwodGhpcyk7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWNvbnRyb2xsZXIuanMubWFwXG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTAuMFxuKGZ1bmN0aW9uKCkge1xuICB2YXIgTWVudUNvbnRyb2xsZXIsXG4gICAgYmluZCA9IGZ1bmN0aW9uKGZuLCBtZSl7IHJldHVybiBmdW5jdGlvbigpeyByZXR1cm4gZm4uYXBwbHkobWUsIGFyZ3VtZW50cyk7IH07IH07XG5cbiAgTWVudUNvbnRyb2xsZXIgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gTWVudUNvbnRyb2xsZXIoJHNjb3BlLCAkaHR0cCwgZGF0YVN0b3JlLCBkYXRhVHJhbnNjaWV2ZXIpIHtcbiAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xuICAgICAgdGhpcy4kaHR0cCA9ICRodHRwO1xuICAgICAgdGhpcy5kYXRhU3RvcmUgPSBkYXRhU3RvcmU7XG4gICAgICB0aGlzLmRhdGFUcmFuc2NpZXZlciA9IGRhdGFUcmFuc2NpZXZlcjtcbiAgICAgIHRoaXMuX29uV2F0Y2hGaWx0ZXJQYXJhbXMgPSBiaW5kKHRoaXMuX29uV2F0Y2hGaWx0ZXJQYXJhbXMsIHRoaXMpO1xuICAgICAgdGhpcy5fb25SZWxvYWQgPSBiaW5kKHRoaXMuX29uUmVsb2FkLCB0aGlzKTtcbiAgICAgIHRoaXMuJHNjb3BlLmRhdGFTdG9yZSA9IHRoaXMuZGF0YVN0b3JlO1xuICAgICAgdGhpcy4kc2NvcGUuZGF0YVRyYW5zY2lldmVyID0gdGhpcy5kYXRhVHJhbnNjaWV2ZXI7XG4gICAgICB0aGlzLiRzY29wZS5ub3RlQ291bnQgPSBudWxsO1xuICAgICAgdGhpcy4kc2NvcGUuJHdhdGNoR3JvdXAoWydkYXRhVHJhbnNjaWV2ZXIuZmlsdGVyUGFyYW1zLm5vdGVib29rR3VpZHMnLCAnZGF0YVRyYW5zY2lldmVyLmZpbHRlclBhcmFtcy5zdGFja3MnXSwgdGhpcy5fb25XYXRjaEZpbHRlclBhcmFtcyk7XG4gICAgICB0aGlzLiRzY29wZS4kb24oJ2V2ZW50OjpyZWxvYWQnLCB0aGlzLl9vblJlbG9hZCk7XG4gICAgfVxuXG4gICAgTWVudUNvbnRyb2xsZXIucHJvdG90eXBlLl9vblJlbG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZGF0YVRyYW5zY2lldmVyLnJlbG9hZCgpO1xuICAgIH07XG5cbiAgICBNZW51Q29udHJvbGxlci5wcm90b3R5cGUuX29uV2F0Y2hGaWx0ZXJQYXJhbXMgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLmRhdGFUcmFuc2NpZXZlci5jb3VudE5vdGVzKChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oZXJyLCBjb3VudCkge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIGFsZXJ0KGVycik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBfdGhpcy4kc2NvcGUubm90ZUNvdW50ID0gY291bnQ7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgfTtcblxuICAgIHJldHVybiBNZW51Q29udHJvbGxlcjtcblxuICB9KSgpO1xuXG4gIGFwcC5jb250cm9sbGVyKCdNZW51Q29udHJvbGxlcicsIFsnJHNjb3BlJywgJyRodHRwJywgJ2RhdGFTdG9yZScsICdkYXRhVHJhbnNjaWV2ZXInLCBNZW51Q29udHJvbGxlcl0pO1xuXG4gIG1vZHVsZS5leHBvcnRzID0gTWVudUNvbnRyb2xsZXI7XG5cbn0pLmNhbGwodGhpcyk7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1lbnUtY29udHJvbGxlci5qcy5tYXBcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMC4wXHJcbihmdW5jdGlvbigpIHtcclxuICB2YXIgTW9kYWxDb250cm9sbGVyO1xyXG5cclxuICBNb2RhbENvbnRyb2xsZXIgPSAoZnVuY3Rpb24oKSB7XHJcbiAgICBmdW5jdGlvbiBNb2RhbENvbnRyb2xsZXIoJHNjb3BlKSB7XHJcbiAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBNb2RhbENvbnRyb2xsZXI7XHJcblxyXG4gIH0pKCk7XHJcblxyXG4gIGFwcC5jb250cm9sbGVyKCdNb2RhbENvbnRyb2xsZXInLCBbJyRzY29wZScsIE1vZGFsQ29udHJvbGxlcl0pO1xyXG5cclxuICBtb2R1bGUuZXhwb3J0cyA9IE1vZGFsQ29udHJvbGxlcjtcclxuXHJcbn0pLmNhbGwodGhpcyk7XHJcblxyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1tb2RhbC1jb250cm9sbGVyLmpzLm1hcFxyXG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTAuMFxuKGZ1bmN0aW9uKCkge1xuICB2YXIgTmF2aWdhdGlvbkNvbnRyb2xsZXIsXG4gICAgYmluZCA9IGZ1bmN0aW9uKGZuLCBtZSl7IHJldHVybiBmdW5jdGlvbigpeyByZXR1cm4gZm4uYXBwbHkobWUsIGFyZ3VtZW50cyk7IH07IH07XG5cbiAgTmF2aWdhdGlvbkNvbnRyb2xsZXIgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gTmF2aWdhdGlvbkNvbnRyb2xsZXIoJHNjb3BlLCAkcm9vdFNjb3BlLCAkcm91dGUpIHtcbiAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xuICAgICAgdGhpcy4kcm9vdFNjb3BlID0gJHJvb3RTY29wZTtcbiAgICAgIHRoaXMuJHJvdXRlID0gJHJvdXRlO1xuICAgICAgdGhpcy5fcmVsb2FkID0gYmluZCh0aGlzLl9yZWxvYWQsIHRoaXMpO1xuICAgICAgdGhpcy4kc2NvcGUubmF2Q29sbGFwc2UgPSB0cnVlO1xuICAgICAgdGhpcy4kc2NvcGUuJHJvdXRlID0gdGhpcy4kcm91dGU7XG4gICAgICB0aGlzLiRzY29wZS5yZWxvYWQgPSB0aGlzLl9yZWxvYWQ7XG4gICAgfVxuXG4gICAgTmF2aWdhdGlvbkNvbnRyb2xsZXIucHJvdG90eXBlLl9yZWxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLiRyb290U2NvcGUuJGJyb2FkY2FzdCgnZXZlbnQ6OnJlbG9hZCcpO1xuICAgIH07XG5cbiAgICByZXR1cm4gTmF2aWdhdGlvbkNvbnRyb2xsZXI7XG5cbiAgfSkoKTtcblxuICBhcHAuY29udHJvbGxlcignTmF2aWdhdGlvbkNvbnRyb2xsZXInLCBbJyRzY29wZScsICckcm9vdFNjb3BlJywgJyRyb3V0ZScsIE5hdmlnYXRpb25Db250cm9sbGVyXSk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBOYXZpZ2F0aW9uQ29udHJvbGxlcjtcblxufSkuY2FsbCh0aGlzKTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bmF2aWdhdGlvbi1jb250cm9sbGVyLmpzLm1hcFxuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjEwLjBcclxuKGZ1bmN0aW9uKCkge1xyXG4gIHZhciBOb3Rlc0NvbnRyb2xsZXIsXHJcbiAgICBiaW5kID0gZnVuY3Rpb24oZm4sIG1lKXsgcmV0dXJuIGZ1bmN0aW9uKCl7IHJldHVybiBmbi5hcHBseShtZSwgYXJndW1lbnRzKTsgfTsgfTtcclxuXHJcbiAgTm90ZXNDb250cm9sbGVyID0gKGZ1bmN0aW9uKCkge1xyXG4gICAgZnVuY3Rpb24gTm90ZXNDb250cm9sbGVyKCRzY29wZSwgZGF0YVN0b3JlKSB7XHJcbiAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xyXG4gICAgICB0aGlzLmRhdGFTdG9yZSA9IGRhdGFTdG9yZTtcclxuICAgICAgdGhpcy5fb25XYXRjaFByb2ZpdExvZ3MgPSBiaW5kKHRoaXMuX29uV2F0Y2hQcm9maXRMb2dzLCB0aGlzKTtcclxuICAgICAgdGhpcy5fb25XYXRjaFRpbWVMb2dzID0gYmluZCh0aGlzLl9vbldhdGNoVGltZUxvZ3MsIHRoaXMpO1xyXG4gICAgICB0aGlzLiRzY29wZS5kYXRhU3RvcmUgPSB0aGlzLmRhdGFTdG9yZTtcclxuICAgICAgdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzID0ge307XHJcbiAgICAgIHRoaXMuJHNjb3BlLm5vdGVzUHJvZml0cyA9IHt9O1xyXG4gICAgICB0aGlzLiRzY29wZS5leGlzdFBlcnNvbnMgPSBbXTtcclxuICAgICAgdGhpcy4kc2NvcGUuJHdhdGNoQ29sbGVjdGlvbignZGF0YVN0b3JlLnRpbWVMb2dzJywgdGhpcy5fb25XYXRjaFRpbWVMb2dzKTtcclxuICAgICAgdGhpcy4kc2NvcGUuJHdhdGNoQ29sbGVjdGlvbignZGF0YVN0b3JlLnByb2ZpdExvZ3MnLCB0aGlzLl9vbldhdGNoUHJvZml0TG9ncyk7XHJcbiAgICB9XHJcblxyXG4gICAgTm90ZXNDb250cm9sbGVyLnByb3RvdHlwZS5fb25XYXRjaFRpbWVMb2dzID0gZnVuY3Rpb24odGltZUxvZ3MpIHtcclxuICAgICAgdmFyIGJhc2UsIGJhc2UxLCBiYXNlMiwgYmFzZTMsIGJhc2U0LCBiYXNlNSwgbmFtZSwgbmFtZTEsIG5hbWUyLCBub3RlR3VpZCwgbm90ZVRpbWVMb2csIHBlcnNvbnNIYXNoLCB0aW1lTG9nLCB0aW1lTG9nX2lkO1xyXG4gICAgICB0aGlzLiRzY29wZS5ub3Rlc1NwZW50VGltZXMgPSB7fTtcclxuICAgICAgcGVyc29uc0hhc2ggPSB7fTtcclxuICAgICAgZm9yIChub3RlR3VpZCBpbiB0aW1lTG9ncykge1xyXG4gICAgICAgIG5vdGVUaW1lTG9nID0gdGltZUxvZ3Nbbm90ZUd1aWRdO1xyXG4gICAgICAgIGZvciAodGltZUxvZ19pZCBpbiBub3RlVGltZUxvZykge1xyXG4gICAgICAgICAgdGltZUxvZyA9IG5vdGVUaW1lTG9nW3RpbWVMb2dfaWRdO1xyXG4gICAgICAgICAgaWYgKChiYXNlID0gdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzKVtuYW1lID0gdGltZUxvZy5ub3RlR3VpZF0gPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBiYXNlW25hbWVdID0ge307XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoKGJhc2UxID0gdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzW3RpbWVMb2cubm90ZUd1aWRdKVsnJHRvdGFsJ10gPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBiYXNlMVsnJHRvdGFsJ10gPSAwO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzW3RpbWVMb2cubm90ZUd1aWRdWyckdG90YWwnXSArPSB0aW1lTG9nLnNwZW50VGltZTtcclxuICAgICAgICAgIGlmICgoYmFzZTIgPSB0aGlzLiRzY29wZS5ub3Rlc1NwZW50VGltZXNbdGltZUxvZy5ub3RlR3VpZF0pW25hbWUxID0gdGltZUxvZy5wZXJzb25dID09IG51bGwpIHtcclxuICAgICAgICAgICAgYmFzZTJbbmFtZTFdID0gMDtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHRoaXMuJHNjb3BlLm5vdGVzU3BlbnRUaW1lc1t0aW1lTG9nLm5vdGVHdWlkXVt0aW1lTG9nLnBlcnNvbl0gKz0gdGltZUxvZy5zcGVudFRpbWU7XHJcbiAgICAgICAgICBpZiAoKGJhc2UzID0gdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzKVsnJHRvdGFsJ10gPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBiYXNlM1snJHRvdGFsJ10gPSB7fTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmICgoYmFzZTQgPSB0aGlzLiRzY29wZS5ub3Rlc1NwZW50VGltZXNbJyR0b3RhbCddKVsnJHRvdGFsJ10gPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBiYXNlNFsnJHRvdGFsJ10gPSAwO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzWyckdG90YWwnXVsnJHRvdGFsJ10gKz0gdGltZUxvZy5zcGVudFRpbWU7XHJcbiAgICAgICAgICBpZiAoKGJhc2U1ID0gdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzWyckdG90YWwnXSlbbmFtZTIgPSB0aW1lTG9nLnBlcnNvbl0gPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBiYXNlNVtuYW1lMl0gPSAwO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzWyckdG90YWwnXVt0aW1lTG9nLnBlcnNvbl0gKz0gdGltZUxvZy5zcGVudFRpbWU7XHJcbiAgICAgICAgICBpZiAodGltZUxvZy5zcGVudFRpbWUgPiAwKSB7XHJcbiAgICAgICAgICAgIHBlcnNvbnNIYXNoW3RpbWVMb2cucGVyc29uXSA9IHRydWU7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0aGlzLiRzY29wZS5leGlzdFBlcnNvbnMgPSBPYmplY3Qua2V5cyhwZXJzb25zSGFzaCk7XHJcbiAgICB9O1xyXG5cclxuICAgIE5vdGVzQ29udHJvbGxlci5wcm90b3R5cGUuX29uV2F0Y2hQcm9maXRMb2dzID0gZnVuY3Rpb24ocHJvZml0TG9ncykge1xyXG4gICAgICB2YXIgYmFzZSwgYmFzZTEsIGJhc2UyLCBiYXNlMywgbmFtZSwgbm90ZUd1aWQsIG5vdGVQcm9maXRMb2csIHBlcnNvbiwgcHJvZml0TG9nLCBwcm9maXRMb2dfaWQsIHJlc3VsdHM7XHJcbiAgICAgIHRoaXMuJHNjb3BlLm5vdGVzUHJvZml0cyA9IHt9O1xyXG4gICAgICByZXN1bHRzID0gW107XHJcbiAgICAgIGZvciAobm90ZUd1aWQgaW4gcHJvZml0TG9ncykge1xyXG4gICAgICAgIG5vdGVQcm9maXRMb2cgPSBwcm9maXRMb2dzW25vdGVHdWlkXTtcclxuICAgICAgICBmb3IgKHByb2ZpdExvZ19pZCBpbiBub3RlUHJvZml0TG9nKSB7XHJcbiAgICAgICAgICBwcm9maXRMb2cgPSBub3RlUHJvZml0TG9nW3Byb2ZpdExvZ19pZF07XHJcbiAgICAgICAgICBpZiAoKGJhc2UgPSB0aGlzLiRzY29wZS5ub3Rlc1Byb2ZpdHMpW25hbWUgPSBwcm9maXRMb2cubm90ZUd1aWRdID09IG51bGwpIHtcclxuICAgICAgICAgICAgYmFzZVtuYW1lXSA9IHt9O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKChiYXNlMSA9IHRoaXMuJHNjb3BlLm5vdGVzUHJvZml0c1twcm9maXRMb2cubm90ZUd1aWRdKVsnJHRvdGFsJ10gPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBiYXNlMVsnJHRvdGFsJ10gPSAwO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgdGhpcy4kc2NvcGUubm90ZXNQcm9maXRzW3Byb2ZpdExvZy5ub3RlR3VpZF1bJyR0b3RhbCddICs9IHByb2ZpdExvZy5wcm9maXQ7XHJcbiAgICAgICAgICBpZiAoKGJhc2UyID0gdGhpcy4kc2NvcGUubm90ZXNQcm9maXRzKVsnJHRvdGFsJ10gPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBiYXNlMlsnJHRvdGFsJ10gPSB7fTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmICgoYmFzZTMgPSB0aGlzLiRzY29wZS5ub3Rlc1Byb2ZpdHNbJyR0b3RhbCddKVsnJHRvdGFsJ10gPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBiYXNlM1snJHRvdGFsJ10gPSAwO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgdGhpcy4kc2NvcGUubm90ZXNQcm9maXRzWyckdG90YWwnXVsnJHRvdGFsJ10gKz0gcHJvZml0TG9nLnByb2ZpdDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmVzdWx0cy5wdXNoKChmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHZhciBiYXNlNCwgaSwgbGVuLCByZWYsIHJlZjEsIHJlZjIsIHJlc3VsdHMxO1xyXG4gICAgICAgICAgcmVmID0gdGhpcy4kc2NvcGUuZXhpc3RQZXJzb25zO1xyXG4gICAgICAgICAgcmVzdWx0czEgPSBbXTtcclxuICAgICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IHJlZi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgICAgICBwZXJzb24gPSByZWZbaV07XHJcbiAgICAgICAgICAgIGlmICghKChyZWYxID0gdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzW25vdGVHdWlkXSkgIT0gbnVsbCA/IHJlZjFbcGVyc29uXSA6IHZvaWQgMCkgfHwgISgocmVmMiA9IHRoaXMuJHNjb3BlLm5vdGVzU3BlbnRUaW1lc1tub3RlR3VpZF0pICE9IG51bGwgPyByZWYyWyckdG90YWwnXSA6IHZvaWQgMCkpIHtcclxuICAgICAgICAgICAgICByZXN1bHRzMS5wdXNoKHRoaXMuJHNjb3BlLm5vdGVzUHJvZml0c1tub3RlR3VpZF1bcGVyc29uXSA9IG51bGwpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHRoaXMuJHNjb3BlLm5vdGVzUHJvZml0c1tub3RlR3VpZF1bcGVyc29uXSA9IE1hdGgucm91bmQodGhpcy4kc2NvcGUubm90ZXNQcm9maXRzW25vdGVHdWlkXVsnJHRvdGFsJ10gKiB0aGlzLiRzY29wZS5ub3Rlc1NwZW50VGltZXNbbm90ZUd1aWRdW3BlcnNvbl0gLyB0aGlzLiRzY29wZS5ub3Rlc1NwZW50VGltZXNbbm90ZUd1aWRdWyckdG90YWwnXSk7XHJcbiAgICAgICAgICAgICAgaWYgKChiYXNlNCA9IHRoaXMuJHNjb3BlLm5vdGVzUHJvZml0c1snJHRvdGFsJ10pW3BlcnNvbl0gPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgYmFzZTRbcGVyc29uXSA9IDA7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIHJlc3VsdHMxLnB1c2godGhpcy4kc2NvcGUubm90ZXNQcm9maXRzWyckdG90YWwnXVtwZXJzb25dICs9IHRoaXMuJHNjb3BlLm5vdGVzUHJvZml0c1tub3RlR3VpZF1bcGVyc29uXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiByZXN1bHRzMTtcclxuICAgICAgICB9KS5jYWxsKHRoaXMpKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcmVzdWx0cztcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIE5vdGVzQ29udHJvbGxlcjtcclxuXHJcbiAgfSkoKTtcclxuXHJcbiAgYXBwLmNvbnRyb2xsZXIoJ05vdGVzQ29udHJvbGxlcicsIFsnJHNjb3BlJywgJ2RhdGFTdG9yZScsIE5vdGVzQ29udHJvbGxlcl0pO1xyXG5cclxuICBtb2R1bGUuZXhwb3J0cyA9IE5vdGVzQ29udHJvbGxlcjtcclxuXHJcbn0pLmNhbGwodGhpcyk7XHJcblxyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1ub3Rlcy1jb250cm9sbGVyLmpzLm1hcFxyXG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTAuMFxyXG4oZnVuY3Rpb24oKSB7XHJcbiAgdmFyIE1vZGFsQ29udHJvbGxlciwgUHJvZ3Jlc3NNb2RhbENvbnRyb2xsZXIsXHJcbiAgICBleHRlbmQgPSBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7IGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHsgaWYgKGhhc1Byb3AuY2FsbChwYXJlbnQsIGtleSkpIGNoaWxkW2tleV0gPSBwYXJlbnRba2V5XTsgfSBmdW5jdGlvbiBjdG9yKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH0gY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlOyBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpOyBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlOyByZXR1cm4gY2hpbGQ7IH0sXHJcbiAgICBoYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHk7XHJcblxyXG4gIE1vZGFsQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vbW9kYWwtY29udHJvbGxlcicpO1xyXG5cclxuICBQcm9ncmVzc01vZGFsQ29udHJvbGxlciA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XHJcbiAgICBleHRlbmQoUHJvZ3Jlc3NNb2RhbENvbnRyb2xsZXIsIHN1cGVyQ2xhc3MpO1xyXG5cclxuICAgIGZ1bmN0aW9uIFByb2dyZXNzTW9kYWxDb250cm9sbGVyKCRzY29wZSwgcHJvZ3Jlc3MpIHtcclxuICAgICAgdGhpcy4kc2NvcGUgPSAkc2NvcGU7XHJcbiAgICAgIHRoaXMucHJvZ3Jlc3MgPSBwcm9ncmVzcztcclxuICAgICAgdGhpcy4kc2NvcGUucHJvZ3Jlc3MgPSB0aGlzLnByb2dyZXNzO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBQcm9ncmVzc01vZGFsQ29udHJvbGxlcjtcclxuXHJcbiAgfSkoTW9kYWxDb250cm9sbGVyKTtcclxuXHJcbiAgYXBwLmNvbnRyb2xsZXIoJ1Byb2dyZXNzTW9kYWxDb250cm9sbGVyJywgWyckc2NvcGUnLCAncHJvZ3Jlc3MnLCBQcm9ncmVzc01vZGFsQ29udHJvbGxlcl0pO1xyXG5cclxuICBtb2R1bGUuZXhwb3J0cyA9IFByb2dyZXNzTW9kYWxDb250cm9sbGVyO1xyXG5cclxufSkuY2FsbCh0aGlzKTtcclxuXHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXByb2dyZXNzLW1vZGFsLWNvbnRyb2xsZXIuanMubWFwXHJcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMC4wXHJcbihmdW5jdGlvbigpIHtcclxuICB2YXIgU2V0dGluZ3NDb250cm9sbGVyLCBhc3luYyxcclxuICAgIGJpbmQgPSBmdW5jdGlvbihmbiwgbWUpeyByZXR1cm4gZnVuY3Rpb24oKXsgcmV0dXJuIGZuLmFwcGx5KG1lLCBhcmd1bWVudHMpOyB9OyB9O1xyXG5cclxuICBhc3luYyA9IHJlcXVpcmUoJ2FzeW5jJyk7XHJcblxyXG4gIFNldHRpbmdzQ29udHJvbGxlciA9IChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEBjb25zdFxyXG4gICAgICogQHR5cGUge09iamVjdH1cclxuICAgICAqL1xyXG4gICAgU2V0dGluZ3NDb250cm9sbGVyLnByb3RvdHlwZS5GSUVMRFMgPSB7XHJcbiAgICAgIHBlcnNvbnM6IHtcclxuICAgICAgICByZVBhcnNlOiB0cnVlLFxyXG4gICAgICAgIHJlbG9hZDogdHJ1ZVxyXG4gICAgICB9LFxyXG4gICAgICBzdGFydFdvcmtpbmdUaW1lOiB7XHJcbiAgICAgICAgaGVhZGluZzogJ1N0YXJ0IFdvcmtpbmcgVGltZScsXHJcbiAgICAgICAgdHlwZTogJ251bWJlcidcclxuICAgICAgfSxcclxuICAgICAgZW5kV29ya2luZ1RpbWU6IHtcclxuICAgICAgICBoZWFkaW5nOiAnRW5kIFdvcmtpbmcgVGltZScsXHJcbiAgICAgICAgdHlwZTogJ251bWJlcidcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcHJvdGVjdGVkXHJcbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxyXG4gICAgICovXHJcblxyXG4gICAgU2V0dGluZ3NDb250cm9sbGVyLnByb3RvdHlwZS5fZWRpdFN0b3JlID0ge307XHJcblxyXG4gICAgZnVuY3Rpb24gU2V0dGluZ3NDb250cm9sbGVyKCRzY29wZSwgJGh0dHAsIGRhdGFTdG9yZSwgZGF0YVRyYW5zY2lldmVyLCBwcm9ncmVzcykge1xyXG4gICAgICB2YXIgZmllbGQsIGtleSwgcmVmO1xyXG4gICAgICB0aGlzLiRzY29wZSA9ICRzY29wZTtcclxuICAgICAgdGhpcy4kaHR0cCA9ICRodHRwO1xyXG4gICAgICB0aGlzLmRhdGFTdG9yZSA9IGRhdGFTdG9yZTtcclxuICAgICAgdGhpcy5kYXRhVHJhbnNjaWV2ZXIgPSBkYXRhVHJhbnNjaWV2ZXI7XHJcbiAgICAgIHRoaXMucHJvZ3Jlc3MgPSBwcm9ncmVzcztcclxuICAgICAgdGhpcy5fb25XYXRjaFNldHRpbmcgPSBiaW5kKHRoaXMuX29uV2F0Y2hTZXR0aW5nLCB0aGlzKTtcclxuICAgICAgdGhpcy5fc3VibWl0ID0gYmluZCh0aGlzLl9zdWJtaXQsIHRoaXMpO1xyXG4gICAgICB0aGlzLl9hZGQgPSBiaW5kKHRoaXMuX2FkZCwgdGhpcyk7XHJcbiAgICAgIHRoaXMuX3JlbW92ZSA9IGJpbmQodGhpcy5fcmVtb3ZlLCB0aGlzKTtcclxuICAgICAgdGhpcy5fZG93biA9IGJpbmQodGhpcy5fZG93biwgdGhpcyk7XHJcbiAgICAgIHRoaXMuX3VwID0gYmluZCh0aGlzLl91cCwgdGhpcyk7XHJcbiAgICAgIHRoaXMuJHNjb3BlLmRhdGFTdG9yZSA9IHRoaXMuZGF0YVN0b3JlO1xyXG4gICAgICB0aGlzLiRzY29wZS5lZGl0U3RvcmUgPSB0aGlzLl9lZGl0U3RvcmU7XHJcbiAgICAgIHRoaXMuJHNjb3BlLmZpZWxkcyA9IHRoaXMuRklFTERTO1xyXG4gICAgICB0aGlzLiRzY29wZS51cCA9IHRoaXMuX3VwO1xyXG4gICAgICB0aGlzLiRzY29wZS5kb3duID0gdGhpcy5fZG93bjtcclxuICAgICAgdGhpcy4kc2NvcGUucmVtb3ZlID0gdGhpcy5fcmVtb3ZlO1xyXG4gICAgICB0aGlzLiRzY29wZS5hZGQgPSB0aGlzLl9hZGQ7XHJcbiAgICAgIHRoaXMuJHNjb3BlLnN1Ym1pdCA9IHRoaXMuX3N1Ym1pdDtcclxuICAgICAgcmVmID0gdGhpcy5GSUVMRFM7XHJcbiAgICAgIGZvciAoa2V5IGluIHJlZikge1xyXG4gICAgICAgIGZpZWxkID0gcmVmW2tleV07XHJcbiAgICAgICAgdGhpcy4kc2NvcGUuJHdhdGNoKFwiZGF0YVN0b3JlLnNldHRpbmdzLlwiICsga2V5LCB0aGlzLl9vbldhdGNoU2V0dGluZyhrZXkpKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIFNldHRpbmdzQ29udHJvbGxlci5wcm90b3R5cGUuX3VwID0gZnVuY3Rpb24oaW5kZXgpIHtcclxuICAgICAgaWYgKGluZGV4ID09PSAwKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0aGlzLl9lZGl0U3RvcmUucGVyc29ucy5zcGxpY2UoaW5kZXggLSAxLCAyLCB0aGlzLl9lZGl0U3RvcmUucGVyc29uc1tpbmRleF0sIHRoaXMuX2VkaXRTdG9yZS5wZXJzb25zW2luZGV4IC0gMV0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBTZXR0aW5nc0NvbnRyb2xsZXIucHJvdG90eXBlLl9kb3duID0gZnVuY3Rpb24oaW5kZXgpIHtcclxuICAgICAgaWYgKGluZGV4ID49IHRoaXMuX2VkaXRTdG9yZS5wZXJzb25zLmxlbmd0aCAtIDEpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRoaXMuX2VkaXRTdG9yZS5wZXJzb25zLnNwbGljZShpbmRleCwgMiwgdGhpcy5fZWRpdFN0b3JlLnBlcnNvbnNbaW5kZXggKyAxXSwgdGhpcy5fZWRpdFN0b3JlLnBlcnNvbnNbaW5kZXhdKTtcclxuICAgIH07XHJcblxyXG4gICAgU2V0dGluZ3NDb250cm9sbGVyLnByb3RvdHlwZS5fcmVtb3ZlID0gZnVuY3Rpb24oaW5kZXgpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX2VkaXRTdG9yZS5wZXJzb25zLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICB9O1xyXG5cclxuICAgIFNldHRpbmdzQ29udHJvbGxlci5wcm90b3R5cGUuX2FkZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgYmFzZTtcclxuICAgICAgaWYgKChiYXNlID0gdGhpcy5fZWRpdFN0b3JlKS5wZXJzb25zID09IG51bGwpIHtcclxuICAgICAgICBiYXNlLnBlcnNvbnMgPSBbXTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdGhpcy5fZWRpdFN0b3JlLnBlcnNvbnMucHVzaCh7XHJcbiAgICAgICAgbmFtZTogXCJQZXJzb24gXCIgKyAodGhpcy5fZWRpdFN0b3JlLnBlcnNvbnMubGVuZ3RoICsgMSlcclxuICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIFNldHRpbmdzQ29udHJvbGxlci5wcm90b3R5cGUuX3N1Ym1pdCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgY291bnQsIHJlUGFyc2UsIHJlbG9hZDtcclxuICAgICAgdGhpcy5wcm9ncmVzcy5vcGVuKCk7XHJcbiAgICAgIGNvdW50ID0gMDtcclxuICAgICAgcmVQYXJzZSA9IGZhbHNlO1xyXG4gICAgICByZWxvYWQgPSBmYWxzZTtcclxuICAgICAgcmV0dXJuIGFzeW5jLmZvckVhY2hPZlNlcmllcyh0aGlzLkZJRUxEUywgKGZ1bmN0aW9uKF90aGlzKSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGZpZWxkLCBrZXksIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICBpZiAoSlNPTi5zdHJpbmdpZnkoYW5ndWxhci5jb3B5KF90aGlzLl9lZGl0U3RvcmVba2V5XSkpID09PSBKU09OLnN0cmluZ2lmeShfdGhpcy5kYXRhU3RvcmUuc2V0dGluZ3Nba2V5XSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoZmllbGQucmVQYXJzZSkge1xyXG4gICAgICAgICAgICByZVBhcnNlID0gdHJ1ZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChmaWVsZC5yZWxvYWQpIHtcclxuICAgICAgICAgICAgcmVsb2FkID0gdHJ1ZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIF90aGlzLnByb2dyZXNzLnNldChcIlNhdmluZyBcIiArIGtleSArIFwiLi4uXCIsIGNvdW50KysgLyBPYmplY3Qua2V5cyhfdGhpcy5GSUVMRFMpLmNvdW50ICogMTAwKTtcclxuICAgICAgICAgIHJldHVybiBfdGhpcy4kaHR0cC5wdXQoJy9zZXR0aW5ncy9zYXZlJywge1xyXG4gICAgICAgICAgICBrZXk6IGtleSxcclxuICAgICAgICAgICAgdmFsdWU6IF90aGlzLl9lZGl0U3RvcmVba2V5XVxyXG4gICAgICAgICAgfSkuc3VjY2VzcyhmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLnNldHRpbmdzW2tleV0gPSBfdGhpcy5fZWRpdFN0b3JlW2tleV07XHJcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgfSkuZXJyb3IoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhcIkVycm9yIHNhdmluZyBcIiArIGtleSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgICB9KSh0aGlzKSwgKGZ1bmN0aW9uKF90aGlzKSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGVycikge1xyXG4gICAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICBhbGVydChlcnIpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgX3RoaXMucHJvZ3Jlc3MuY2xvc2UoKTtcclxuICAgICAgICAgIHJldHVybiBhc3luYy53YXRlcmZhbGwoW1xyXG4gICAgICAgICAgICBmdW5jdGlvbihjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgIGlmIChyZVBhcnNlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXMuZGF0YVRyYW5zY2lldmVyLnJlUGFyc2UoY2FsbGJhY2spO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgaWYgKHJlbG9hZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLmRhdGFUcmFuc2NpZXZlci5yZWxvYWQoY2FsbGJhY2spO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIF0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgIH0pKHRoaXMpKTtcclxuICAgIH07XHJcblxyXG4gICAgU2V0dGluZ3NDb250cm9sbGVyLnByb3RvdHlwZS5fb25XYXRjaFNldHRpbmcgPSBmdW5jdGlvbihrZXkpIHtcclxuICAgICAgcmV0dXJuIChmdW5jdGlvbihfdGhpcykge1xyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHZhciByZWY7XHJcbiAgICAgICAgICByZXR1cm4gX3RoaXMuX2VkaXRTdG9yZVtrZXldID0gYW5ndWxhci5jb3B5KChyZWYgPSBfdGhpcy5kYXRhU3RvcmUuc2V0dGluZ3MpICE9IG51bGwgPyByZWZba2V5XSA6IHZvaWQgMCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgfSkodGhpcyk7XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBTZXR0aW5nc0NvbnRyb2xsZXI7XHJcblxyXG4gIH0pKCk7XHJcblxyXG4gIGFwcC5jb250cm9sbGVyKCdTZXR0aW5nc0NvbnRyb2xsZXInLCBbJyRzY29wZScsICckaHR0cCcsICdkYXRhU3RvcmUnLCAnZGF0YVRyYW5zY2lldmVyJywgJ3Byb2dyZXNzJywgU2V0dGluZ3NDb250cm9sbGVyXSk7XHJcblxyXG4gIG1vZHVsZS5leHBvcnRzID0gU2V0dGluZ3NDb250cm9sbGVyO1xyXG5cclxufSkuY2FsbCh0aGlzKTtcclxuXHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNldHRpbmdzLWNvbnRyb2xsZXIuanMubWFwXHJcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMC4wXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBUaW1lbGluZUNvbnRyb2xsZXIsIGFzeW5jLFxuICAgIGJpbmQgPSBmdW5jdGlvbihmbiwgbWUpeyByZXR1cm4gZnVuY3Rpb24oKXsgcmV0dXJuIGZuLmFwcGx5KG1lLCBhcmd1bWVudHMpOyB9OyB9O1xuXG4gIGFzeW5jID0gcmVxdWlyZSgnYXN5bmMnKTtcblxuICBUaW1lbGluZUNvbnRyb2xsZXIgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gVGltZWxpbmVDb250cm9sbGVyKCRzY29wZSwgJGZpbHRlciwgJGh0dHAsIGRhdGFTdG9yZSwgZGF0YVRyYW5zY2lldmVyKSB7XG4gICAgICB0aGlzLiRzY29wZSA9ICRzY29wZTtcbiAgICAgIHRoaXMuJGZpbHRlciA9ICRmaWx0ZXI7XG4gICAgICB0aGlzLiRodHRwID0gJGh0dHA7XG4gICAgICB0aGlzLmRhdGFTdG9yZSA9IGRhdGFTdG9yZTtcbiAgICAgIHRoaXMuZGF0YVRyYW5zY2lldmVyID0gZGF0YVRyYW5zY2lldmVyO1xuICAgICAgdGhpcy5fb25SZXNpemUgPSBiaW5kKHRoaXMuX29uUmVzaXplLCB0aGlzKTtcbiAgICAgIHRoaXMuX29uUmVsb2FkRW5kID0gYmluZCh0aGlzLl9vblJlbG9hZEVuZCwgdGhpcyk7XG4gICAgICB0aGlzLl9vblJlbG9hZCA9IGJpbmQodGhpcy5fb25SZWxvYWQsIHRoaXMpO1xuICAgICAgdGhpcy5fb25SYW5nZUNoYW5nZWQgPSBiaW5kKHRoaXMuX29uUmFuZ2VDaGFuZ2VkLCB0aGlzKTtcbiAgICAgIHRoaXMuJHNjb3BlLmRhdGFTdG9yZSA9IHRoaXMuZGF0YVN0b3JlO1xuICAgICAgdGhpcy4kc2NvcGUudGltZWxpbmVJdGVtcyA9IG5ldyB2aXMuRGF0YVNldCgpO1xuICAgICAgdGhpcy4kc2NvcGUudGltZWxpbmVHcm91cHMgPSBuZXcgdmlzLkRhdGFTZXQoKTtcbiAgICAgIHRoaXMuJHNjb3BlLnN0YXJ0ID0gbW9tZW50KCkuc3RhcnRPZignZGF5Jyk7XG4gICAgICB0aGlzLiRzY29wZS5lbmQgPSBtb21lbnQoKS5lbmRPZignZGF5Jyk7XG4gICAgICB0aGlzLmRhdGFUcmFuc2NpZXZlci5yZWxvYWQoe1xuICAgICAgICBzdGFydDogdGhpcy4kc2NvcGUuc3RhcnQsXG4gICAgICAgIGVuZDogdGhpcy4kc2NvcGUuZW5kXG4gICAgICB9LCAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBjb250YWluZXIsIGhpZGRlbkRhdGVzLCBpLCBpbmRleCwgbGVuLCBwZXJzb24sIHJlZiwgcmVmMSwgcmVmMiwgcmVmMztcbiAgICAgICAgICBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGltZWxpbmUnKTtcbiAgICAgICAgICBpZiAoKChyZWYgPSBfdGhpcy5kYXRhU3RvcmUuc2V0dGluZ3MpICE9IG51bGwgPyByZWYuc3RhcnRXb3JraW5nVGltZSA6IHZvaWQgMCkgJiYgKChyZWYxID0gX3RoaXMuZGF0YVN0b3JlLnNldHRpbmdzKSAhPSBudWxsID8gcmVmMS5lbmRXb3JraW5nVGltZSA6IHZvaWQgMCkpIHtcbiAgICAgICAgICAgIGhpZGRlbkRhdGVzID0gW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgc3RhcnQ6IG1vbWVudCgpLnN1YnRyYWN0KDEsICdkYXlzJykuc3RhcnRPZignZGF5JykuaG91cihfdGhpcy5kYXRhU3RvcmUuc2V0dGluZ3MuZW5kV29ya2luZ1RpbWUpLFxuICAgICAgICAgICAgICAgIGVuZDogbW9tZW50KCkuc3RhcnRPZignZGF5JykuaG91cihfdGhpcy5kYXRhU3RvcmUuc2V0dGluZ3Muc3RhcnRXb3JraW5nVGltZSksXG4gICAgICAgICAgICAgICAgcmVwZWF0OiAnZGFpbHknXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGhpZGRlbkRhdGVzID0ge307XG4gICAgICAgICAgfVxuICAgICAgICAgIF90aGlzLiRzY29wZS50aW1lbGluZSA9IG5ldyB2aXMuVGltZWxpbmUoY29udGFpbmVyLCBfdGhpcy4kc2NvcGUudGltZWxpbmVJdGVtcywgX3RoaXMuJHNjb3BlLnRpbWVsaW5lR3JvdXBzLCB7XG4gICAgICAgICAgICBtYXJnaW46IHtcbiAgICAgICAgICAgICAgaXRlbTogNVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGhlaWdodDogd2luZG93LmlubmVySGVpZ2h0IC0gODAsXG4gICAgICAgICAgICBvcmllbnRhdGlvbjoge1xuICAgICAgICAgICAgICBheGlzOiAnYm90aCcsXG4gICAgICAgICAgICAgIGl0ZW06ICd0b3AnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhcnQ6IF90aGlzLiRzY29wZS5zdGFydCxcbiAgICAgICAgICAgIGVuZDogX3RoaXMuJHNjb3BlLmVuZCxcbiAgICAgICAgICAgIG9yZGVyOiBmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICAgIHJldHVybiBhLnN0YXJ0IC0gYi5zdGFydDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBoaWRkZW5EYXRlczogaGlkZGVuRGF0ZXNcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAoISgocmVmMiA9IF90aGlzLmRhdGFTdG9yZS5zZXR0aW5ncykgIT0gbnVsbCA/IHJlZjIucGVyc29ucyA6IHZvaWQgMCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVmMyA9IF90aGlzLmRhdGFTdG9yZS5zZXR0aW5ncy5wZXJzb25zO1xuICAgICAgICAgIGZvciAoaW5kZXggPSBpID0gMCwgbGVuID0gcmVmMy5sZW5ndGg7IGkgPCBsZW47IGluZGV4ID0gKytpKSB7XG4gICAgICAgICAgICBwZXJzb24gPSByZWYzW2luZGV4XTtcbiAgICAgICAgICAgIF90aGlzLiRzY29wZS50aW1lbGluZUdyb3Vwcy5hZGQoe1xuICAgICAgICAgICAgICBpZDogcGVyc29uLm5hbWUsXG4gICAgICAgICAgICAgIGNvbnRlbnQ6IHBlcnNvbi5uYW1lXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgX3RoaXMuJHNjb3BlLnRpbWVsaW5lR3JvdXBzLmFkZCh7XG4gICAgICAgICAgICBpZDogJ3VwZGF0ZWQnLFxuICAgICAgICAgICAgY29udGVudDogJ1VwZGF0ZSdcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBfdGhpcy4kc2NvcGUudGltZWxpbmUub24oJ3JhbmdlY2hhbmdlZCcsIF90aGlzLl9vblJhbmdlQ2hhbmdlZCk7XG4gICAgICAgICAgX3RoaXMuJHNjb3BlLiRvbigncmVzaXplOjpyZXNpemUnLCBfdGhpcy5fb25SZXNpemUpO1xuICAgICAgICAgIF90aGlzLiRzY29wZS4kb24oJ2V2ZW50OjpyZWxvYWQnLCBfdGhpcy5fb25SZWxvYWQpO1xuICAgICAgICAgIHJldHVybiBfdGhpcy5fb25SZWxvYWRFbmQoKTtcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpKTtcbiAgICB9XG5cbiAgICBUaW1lbGluZUNvbnRyb2xsZXIucHJvdG90eXBlLl9vblJhbmdlQ2hhbmdlZCA9IGZ1bmN0aW9uKHByb3BlcnRpZXMpIHtcbiAgICAgIHZhciBjdXJyZW50RW5kLCBjdXJyZW50U3RhcnQ7XG4gICAgICBjdXJyZW50U3RhcnQgPSBtb21lbnQocHJvcGVydGllcy5zdGFydCkuc3RhcnRPZignZGF5Jyk7XG4gICAgICBjdXJyZW50RW5kID0gbW9tZW50KHByb3BlcnRpZXMuZW5kKS5lbmRPZignZGF5Jyk7XG4gICAgICBpZiAoY3VycmVudFN0YXJ0LmlzU2FtZU9yQWZ0ZXIodGhpcy4kc2NvcGUuc3RhcnQpICYmIGN1cnJlbnRFbmQuaXNTYW1lT3JCZWZvcmUodGhpcy4kc2NvcGUuZW5kKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoIXRoaXMuJHNjb3BlLnN0YXJ0IHx8IGN1cnJlbnRTdGFydC5pc0JlZm9yZSh0aGlzLiRzY29wZS5zdGFydCkpIHtcbiAgICAgICAgdGhpcy4kc2NvcGUuc3RhcnQgPSBjdXJyZW50U3RhcnQ7XG4gICAgICB9XG4gICAgICBpZiAoIXRoaXMuJHNjb3BlLmVuZCB8fCBjdXJyZW50RW5kLmlzQWZ0ZXIodGhpcy4kc2NvcGUuZW5kKSkge1xuICAgICAgICB0aGlzLiRzY29wZS5lbmQgPSBjdXJyZW50RW5kO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuX29uUmVsb2FkKCk7XG4gICAgfTtcblxuICAgIFRpbWVsaW5lQ29udHJvbGxlci5wcm90b3R5cGUuX29uUmVsb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICBjb25zb2xlLmxvZygndGltZWxpbmUgY29udHJvbGxlciByZWxvYWQnKTtcbiAgICAgIHJldHVybiB0aGlzLmRhdGFUcmFuc2NpZXZlci5yZWxvYWQoe1xuICAgICAgICBzdGFydDogdGhpcy4kc2NvcGUuc3RhcnQsXG4gICAgICAgIGVuZDogdGhpcy4kc2NvcGUuZW5kXG4gICAgICB9LCB0aGlzLl9vblJlbG9hZEVuZCk7XG4gICAgfTtcblxuICAgIFRpbWVsaW5lQ29udHJvbGxlci5wcm90b3R5cGUuX29uUmVsb2FkRW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbm90ZSwgbm90ZUd1aWQsIG5vdGVUaW1lTG9ncywgbm90ZVRpdGxlLCByZWYsIHJlZjEsIHJlc3VsdHMsIHRpbWVMb2csIHRpbWVMb2dJZDtcbiAgICAgIHRoaXMuJHNjb3BlLnRpbWVsaW5lSXRlbXMuY2xlYXIoKTtcbiAgICAgIHJlZiA9IHRoaXMuZGF0YVN0b3JlLm5vdGVzO1xuICAgICAgZm9yIChub3RlR3VpZCBpbiByZWYpIHtcbiAgICAgICAgbm90ZSA9IHJlZltub3RlR3VpZF07XG4gICAgICAgIG5vdGVzW25vdGUuZ3VpZF0gPSBub3RlO1xuICAgICAgICB0aGlzLiRzY29wZS50aW1lbGluZUl0ZW1zLmFkZCh7XG4gICAgICAgICAgaWQ6IG5vdGUuZ3VpZCxcbiAgICAgICAgICBncm91cDogJ3VwZGF0ZWQnLFxuICAgICAgICAgIGNvbnRlbnQ6IFwiPGEgaHJlZj1cXFwiZXZlcm5vdGU6Ly8vdmlldy9cIiArIHRoaXMuZGF0YVN0b3JlLnVzZXIuaWQgKyBcIi9cIiArIHRoaXMuZGF0YVN0b3JlLnVzZXIuc2hhcmRJZCArIFwiL1wiICsgbm90ZS5ndWlkICsgXCIvXCIgKyBub3RlLmd1aWQgKyBcIi9cXFwiIHRpdGxlPVxcXCJcIiArIG5vdGUudGl0bGUgKyBcIlxcXCI+XCIgKyAodGhpcy4kZmlsdGVyKCdhYmJyZXZpYXRlJykobm90ZS50aXRsZSwgNDApKSArIFwiPC9hPlwiLFxuICAgICAgICAgIHN0YXJ0OiBuZXcgRGF0ZShub3RlLnVwZGF0ZWQpLFxuICAgICAgICAgIHR5cGU6ICdwb2ludCdcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZWYxID0gdGhpcy5kYXRhU3RvcmUudGltZUxvZ3M7XG4gICAgICByZXN1bHRzID0gW107XG4gICAgICBmb3IgKG5vdGVHdWlkIGluIHJlZjEpIHtcbiAgICAgICAgbm90ZVRpbWVMb2dzID0gcmVmMVtub3RlR3VpZF07XG4gICAgICAgIHJlc3VsdHMucHVzaCgoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHJlc3VsdHMxO1xuICAgICAgICAgIHJlc3VsdHMxID0gW107XG4gICAgICAgICAgZm9yICh0aW1lTG9nSWQgaW4gbm90ZVRpbWVMb2dzKSB7XG4gICAgICAgICAgICB0aW1lTG9nID0gbm90ZVRpbWVMb2dzW3RpbWVMb2dJZF07XG4gICAgICAgICAgICBub3RlVGl0bGUgPSBub3Rlc1t0aW1lTG9nLm5vdGVHdWlkXS50aXRsZTtcbiAgICAgICAgICAgIHJlc3VsdHMxLnB1c2godGhpcy4kc2NvcGUudGltZWxpbmVJdGVtcy5hZGQoe1xuICAgICAgICAgICAgICBpZDogdGltZUxvZy5faWQsXG4gICAgICAgICAgICAgIGdyb3VwOiB0aW1lTG9nLnBlcnNvbixcbiAgICAgICAgICAgICAgY29udGVudDogXCI8YSBocmVmPVxcXCJldmVybm90ZTovLy92aWV3L1wiICsgdGhpcy5kYXRhU3RvcmUudXNlci5pZCArIFwiL1wiICsgdGhpcy5kYXRhU3RvcmUudXNlci5zaGFyZElkICsgXCIvXCIgKyB0aW1lTG9nLm5vdGVHdWlkICsgXCIvXCIgKyB0aW1lTG9nLm5vdGVHdWlkICsgXCIvXFxcIiB0aXRsZT1cXFwiXCIgKyBub3RlVGl0bGUgKyBcIiBcIiArIHRpbWVMb2cuY29tbWVudCArIFwiXFxcIj5cIiArICh0aGlzLiRmaWx0ZXIoJ2FiYnJldmlhdGUnKShub3RlVGl0bGUsIDIwKSkgKyBcIiBcIiArICh0aGlzLiRmaWx0ZXIoJ2FiYnJldmlhdGUnKSh0aW1lTG9nLmNvbW1lbnQsIDIwKSkgKyBcIjwvYT5cIixcbiAgICAgICAgICAgICAgc3RhcnQ6IG1vbWVudCh0aW1lTG9nLmRhdGUpLFxuICAgICAgICAgICAgICBlbmQ6IHRpbWVMb2cuc3BlbnRUaW1lID8gbW9tZW50KHRpbWVMb2cuZGF0ZSkuYWRkKHRpbWVMb2cuc3BlbnRUaW1lLCAnbWludXRlcycpIDogbnVsbCxcbiAgICAgICAgICAgICAgdHlwZTogdGltZUxvZy5zcGVudFRpbWUgPyAncmFuZ2UnIDogJ3BvaW50J1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmVzdWx0czE7XG4gICAgICAgIH0pLmNhbGwodGhpcykpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfTtcblxuICAgIFRpbWVsaW5lQ29udHJvbGxlci5wcm90b3R5cGUuX29uUmVzaXplID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIHJldHVybiB0aGlzLiRzY29wZS50aW1lbGluZS5zZXRPcHRpb25zKHtcbiAgICAgICAgaGVpZ2h0OiB3aW5kb3cuaW5uZXJIZWlnaHQgLSA5MFxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiBUaW1lbGluZUNvbnRyb2xsZXI7XG5cbiAgfSkoKTtcblxuICBhcHAuY29udHJvbGxlcignVGltZWxpbmVDb250cm9sbGVyJywgWyckc2NvcGUnLCAnJGZpbHRlcicsICckaHR0cCcsICdkYXRhU3RvcmUnLCAnZGF0YVRyYW5zY2lldmVyJywgVGltZWxpbmVDb250cm9sbGVyXSk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBUaW1lbGluZUNvbnRyb2xsZXI7XG5cbn0pLmNhbGwodGhpcyk7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXRpbWVsaW5lLWNvbnRyb2xsZXIuanMubWFwXG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTAuMFxyXG4oZnVuY3Rpb24oKSB7XHJcbiAgYXBwLmRpcmVjdGl2ZSgncmVzaXplJywgZnVuY3Rpb24oJHRpbWVvdXQsICRyb290U2NvcGUsICR3aW5kb3cpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGxpbms6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciB0aW1lcjtcclxuICAgICAgICB0aW1lciA9IGZhbHNlO1xyXG4gICAgICAgIHJldHVybiBhbmd1bGFyLmVsZW1lbnQoJHdpbmRvdykub24oJ2xvYWQgcmVzaXplJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICAgIGlmICh0aW1lcikge1xyXG4gICAgICAgICAgICAkdGltZW91dC5jYW5jZWwodGltZXIpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIHRpbWVyID0gJHRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3Jlc2l6ZTo6cmVzaXplJyk7XHJcbiAgICAgICAgICB9LCAyMDApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gIH0pO1xyXG5cclxufSkuY2FsbCh0aGlzKTtcclxuXHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXJlc2l6ZS5qcy5tYXBcclxuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjEwLjBcclxuKGZ1bmN0aW9uKCkge1xyXG4gIHZhciBhYmJyZXZpYXRlO1xyXG5cclxuICBhYmJyZXZpYXRlID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24odGV4dCwgbGVuLCB0cnVuY2F0aW9uKSB7XHJcbiAgICAgIHZhciBjb3VudCwgaSwgaiwgbiwgcmVmLCBzdHI7XHJcbiAgICAgIGlmIChsZW4gPT0gbnVsbCkge1xyXG4gICAgICAgIGxlbiA9IDEwO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICh0cnVuY2F0aW9uID09IG51bGwpIHtcclxuICAgICAgICB0cnVuY2F0aW9uID0gJy4uLic7XHJcbiAgICAgIH1cclxuICAgICAgY291bnQgPSAwO1xyXG4gICAgICBzdHIgPSAnJztcclxuICAgICAgZm9yIChpID0gaiA9IDAsIHJlZiA9IHRleHQubGVuZ3RoIC0gMTsgMCA8PSByZWYgPyBqIDw9IHJlZiA6IGogPj0gcmVmOyBpID0gMCA8PSByZWYgPyArK2ogOiAtLWopIHtcclxuICAgICAgICBuID0gZXNjYXBlKHRleHQuY2hhckF0KGkpKTtcclxuICAgICAgICBpZiAobi5sZW5ndGggPCA0KSB7XHJcbiAgICAgICAgICBjb3VudCsrO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb3VudCArPSAyO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoY291bnQgPiBsZW4pIHtcclxuICAgICAgICAgIHJldHVybiBzdHIgKyB0cnVuY2F0aW9uO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzdHIgKz0gdGV4dC5jaGFyQXQoaSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRleHQ7XHJcbiAgICB9O1xyXG4gIH07XHJcblxyXG4gIGFwcC5maWx0ZXIoJ2FiYnJldmlhdGUnLCBhYmJyZXZpYXRlKTtcclxuXHJcbiAgbW9kdWxlLmV4cG9ydHMgPSBhYmJyZXZpYXRlO1xyXG5cclxufSkuY2FsbCh0aGlzKTtcclxuXHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFiYnJldmlhdGUuanMubWFwXHJcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMC4wXHJcbihmdW5jdGlvbigpIHtcclxuICB2YXIgY2hlY2tJdGVtTWF0Y2hlcywgZmlsdGVyQnlQcm9wZXJ0eTtcclxuXHJcbiAgY2hlY2tJdGVtTWF0Y2hlcyA9IChmdW5jdGlvbihfdGhpcykge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGl0ZW0sIHByb3BzKSB7XHJcbiAgICAgIHZhciBpdGVtTWF0Y2hlcywgcHJvcCwgdGV4dDtcclxuICAgICAgaXRlbU1hdGNoZXMgPSBmYWxzZTtcclxuICAgICAgZm9yIChwcm9wIGluIHByb3BzKSB7XHJcbiAgICAgICAgdGV4dCA9IHByb3BzW3Byb3BdO1xyXG4gICAgICAgIHRleHQgPSB0ZXh0LnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgaWYgKGl0ZW1bcHJvcF0udG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpLmluZGV4T2YodGV4dCkgIT09IC0xKSB7XHJcbiAgICAgICAgICBpdGVtTWF0Y2hlcyA9IHRydWU7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGl0ZW1NYXRjaGVzO1xyXG4gICAgfTtcclxuICB9KSh0aGlzKTtcclxuXHJcbiAgZmlsdGVyQnlQcm9wZXJ0eSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGl0ZW1zLCBwcm9wcykge1xyXG4gICAgICB2YXIgaSwgaXRlbSwgaXRlbU1hdGNoZXMsIGtleSwgbGVuLCBvdXQ7XHJcbiAgICAgIG91dCA9IFtdO1xyXG4gICAgICBpZiAoYW5ndWxhci5pc0FycmF5KGl0ZW1zKSkge1xyXG4gICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IGl0ZW1zLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgICAgICBpdGVtID0gaXRlbXNbaV07XHJcbiAgICAgICAgICBpdGVtTWF0Y2hlcyA9IGNoZWNrSXRlbU1hdGNoZXMoaXRlbSwgcHJvcHMpO1xyXG4gICAgICAgICAgaWYgKGl0ZW1NYXRjaGVzKSB7XHJcbiAgICAgICAgICAgIG91dC5wdXNoKGl0ZW0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIGlmIChhbmd1bGFyLmlzT2JqZWN0KGl0ZW1zKSkge1xyXG4gICAgICAgIGZvciAoa2V5IGluIGl0ZW1zKSB7XHJcbiAgICAgICAgICBpdGVtID0gaXRlbXNba2V5XTtcclxuICAgICAgICAgIGl0ZW1NYXRjaGVzID0gY2hlY2tJdGVtTWF0Y2hlcyhpdGVtLCBwcm9wcyk7XHJcbiAgICAgICAgICBpZiAoaXRlbU1hdGNoZXMpIHtcclxuICAgICAgICAgICAgb3V0LnB1c2goaXRlbSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG91dCA9IGl0ZW1zO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBvdXQ7XHJcbiAgICB9O1xyXG4gIH07XHJcblxyXG4gIGFwcC5maWx0ZXIoJ2ZpbHRlckJ5UHJvcGVydHknLCBmaWx0ZXJCeVByb3BlcnR5KTtcclxuXHJcbiAgbW9kdWxlLmV4cG9ydHMgPSBmaWx0ZXJCeVByb3BlcnR5O1xyXG5cclxufSkuY2FsbCh0aGlzKTtcclxuXHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWZpbHRlci1ieS1wcm9wZXJ0eS5qcy5tYXBcclxuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjEwLjBcclxuKGZ1bmN0aW9uKCkge1xyXG4gIHZhciBvYmplY3RMZW5ndGg7XHJcblxyXG4gIG9iamVjdExlbmd0aCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIF9vYmplY3RMZW5ndGg7XHJcbiAgICBfb2JqZWN0TGVuZ3RoID0gZnVuY3Rpb24oaW5wdXQsIGRlcHRoKSB7XHJcbiAgICAgIHZhciBrZXksIHJlc3VsdCwgdmFsdWU7XHJcbiAgICAgIGlmIChkZXB0aCA9PSBudWxsKSB7XHJcbiAgICAgICAgZGVwdGggPSAwO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICghYW5ndWxhci5pc09iamVjdChpbnB1dCkpIHtcclxuICAgICAgICB0aHJvdyBFcnJvcihcIlVzYWdlIG9mIG5vbi1vYmplY3RzIHdpdGggb2JqZWN0TGVuZ3RoIGZpbHRlci5cIik7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGRlcHRoID09PSAwKSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKGlucHV0KS5sZW5ndGg7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmVzdWx0ID0gMDtcclxuICAgICAgICBmb3IgKGtleSBpbiBpbnB1dCkge1xyXG4gICAgICAgICAgdmFsdWUgPSBpbnB1dFtrZXldO1xyXG4gICAgICAgICAgcmVzdWx0ICs9IF9vYmplY3RMZW5ndGgodmFsdWUsIGRlcHRoIC0gMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgICByZXR1cm4gX29iamVjdExlbmd0aDtcclxuICB9O1xyXG5cclxuICBhcHAuZmlsdGVyKCdvYmplY3RMZW5ndGgnLCBvYmplY3RMZW5ndGgpO1xyXG5cclxuICBtb2R1bGUuZXhwb3J0cyA9IG9iamVjdExlbmd0aDtcclxuXHJcbn0pLmNhbGwodGhpcyk7XHJcblxyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1vYmplY3QtbGVuZ3RoLmpzLm1hcFxyXG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTAuMFxyXG4oZnVuY3Rpb24oKSB7XHJcbiAgdmFyIG9yZGVyT2JqZWN0Qnk7XHJcblxyXG4gIG9yZGVyT2JqZWN0QnkgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbihpdGVtcywgZmllbGQsIHJldmVyc2UpIHtcclxuICAgICAgdmFyIGZpbHRlcmVkLCByZXN1bHRzO1xyXG4gICAgICBpZiAoZmllbGQgPT0gbnVsbCkge1xyXG4gICAgICAgIGZpZWxkID0gJyR2YWx1ZSc7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHJldmVyc2UgPT0gbnVsbCkge1xyXG4gICAgICAgIHJldmVyc2UgPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICAgIGZpbHRlcmVkID0gW107XHJcbiAgICAgIGFuZ3VsYXIuZm9yRWFjaChpdGVtcywgZnVuY3Rpb24oaXRlbSwga2V5KSB7XHJcbiAgICAgICAgcmV0dXJuIGZpbHRlcmVkLnB1c2goe1xyXG4gICAgICAgICAga2V5OiBrZXksXHJcbiAgICAgICAgICBpdGVtOiBpdGVtXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgICBmaWx0ZXJlZC5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcclxuICAgICAgICBpZiAoZmllbGQgPT09ICcka2V5Jykge1xyXG4gICAgICAgICAgaWYgKGEua2V5ID4gYi5rZXkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIDE7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChmaWVsZCA9PT0gJyR2YWx1ZScpIHtcclxuICAgICAgICAgIGlmIChhLml0ZW0gPiBiLml0ZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIDE7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2YgZmllbGQgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICBpZiAoYVtmaWVsZF0gPiBiW2ZpZWxkXSkge1xyXG4gICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gMTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiBmaWVsZCA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgaWYgKGZpZWxkKGEuaXRlbSwgYS5rZXkpID4gZmllbGQoYi5pdGVtLCBiLmtleSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIDE7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgICAgaWYgKHJldmVyc2UpIHtcclxuICAgICAgICBmaWx0ZXJlZC5yZXZlcnNlKCk7XHJcbiAgICAgIH1cclxuICAgICAgcmVzdWx0cyA9IFtdO1xyXG4gICAgICBhbmd1bGFyLmZvckVhY2goZmlsdGVyZWQsIGZ1bmN0aW9uKGl0ZW0pIHtcclxuICAgICAgICB2YXIgcmVzdWx0O1xyXG4gICAgICAgIHJlc3VsdCA9IGl0ZW0uaXRlbTtcclxuICAgICAgICByZXN1bHRbJyRrZXknXSA9IGl0ZW0ua2V5O1xyXG4gICAgICAgIHJldHVybiByZXN1bHRzLnB1c2gocmVzdWx0KTtcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiByZXN1bHRzO1xyXG4gICAgfTtcclxuICB9O1xyXG5cclxuICBhcHAuZmlsdGVyKCdvcmRlck9iamVjdEJ5Jywgb3JkZXJPYmplY3RCeSk7XHJcblxyXG4gIG1vZHVsZS5leHBvcnRzID0gb3JkZXJPYmplY3RCeTtcclxuXHJcbn0pLmNhbGwodGhpcyk7XHJcblxyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1vcmRlci1vYmplY3QtYnkuanMubWFwXHJcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMC4wXHJcbihmdW5jdGlvbigpIHtcclxuICB2YXIgc3BlbnRUaW1lO1xyXG5cclxuICBzcGVudFRpbWUgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbihpbnB1dCkge1xyXG4gICAgICB2YXIgaG91ciwgbWludXRlO1xyXG4gICAgICBpZiAoaW5wdXQgPT09IHZvaWQgMCkge1xyXG4gICAgICAgIHJldHVybiAnJztcclxuICAgICAgfVxyXG4gICAgICBpZiAoIWlucHV0KSB7XHJcbiAgICAgICAgcmV0dXJuICcwbSc7XHJcbiAgICAgIH1cclxuICAgICAgaG91ciA9IE1hdGguZmxvb3IoaW5wdXQgLyA2MCk7XHJcbiAgICAgIG1pbnV0ZSA9IGlucHV0ICUgNjA7XHJcbiAgICAgIGlmIChob3VyKSB7XHJcbiAgICAgICAgcmV0dXJuIGhvdXIgKyAnaCcgKyBtaW51dGUgKyAnbSc7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIG1pbnV0ZSArICdtJztcclxuICAgIH07XHJcbiAgfTtcclxuXHJcbiAgYXBwLmZpbHRlcignc3BlbnRUaW1lJywgc3BlbnRUaW1lKTtcclxuXHJcbiAgbW9kdWxlLmV4cG9ydHMgPSBzcGVudFRpbWU7XHJcblxyXG59KS5jYWxsKHRoaXMpO1xyXG5cclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c3BlbnQtdGltZS5qcy5tYXBcclxuIiwiIyBhbmd1bGFyLmpzIHNldHRpbmdcclxud2luZG93LmFwcCA9IGFuZ3VsYXIubW9kdWxlKCdBcHAnLCBbJ25nUm91dGUnLCAndWkuYm9vdHN0cmFwJywgJ25nU2FuaXRpemUnLCAndWkuc2VsZWN0J10pXHJcblxyXG5hcHAuY29uZmlnIFsnJGNvbXBpbGVQcm92aWRlcicsICgkY29tcGlsZVByb3ZpZGVyKSAtPlxyXG4gICRjb21waWxlUHJvdmlkZXIuYUhyZWZTYW5pdGl6YXRpb25XaGl0ZWxpc3QoL15cXHMqKGh0dHB8aHR0cHN8bWFpbHRvfGV2ZXJub3RlKTovKTtcclxuXVxyXG5cclxuIyByb3V0ZSBzZXR0aW5nc1xyXG5yZXF1aXJlICcuL3JvdXRlJ1xyXG5cclxuIyBhbmd1bGFyLmpzIGZpbHRlcnNcclxucmVxdWlyZSAnLi9maWx0ZXJzL2FiYnJldmlhdGUnXHJcbnJlcXVpcmUgJy4vZmlsdGVycy9maWx0ZXItYnktcHJvcGVydHknXHJcbnJlcXVpcmUgJy4vZmlsdGVycy9vYmplY3QtbGVuZ3RoJ1xyXG5yZXF1aXJlICcuL2ZpbHRlcnMvb3JkZXItb2JqZWN0LWJ5J1xyXG5yZXF1aXJlICcuL2ZpbHRlcnMvc3BlbnQtdGltZSdcclxuXHJcbiMgYW5ndWxhci5qcyBzZXJ2aWNlc1xyXG5yZXF1aXJlICcuL3NlcnZpY2VzL2RhdGEtc3RvcmUnXHJcbnJlcXVpcmUgJy4vc2VydmljZXMvZGF0YS10cmFuc2NpZXZlcidcclxucmVxdWlyZSAnLi9zZXJ2aWNlcy9wcm9ncmVzcydcclxuXHJcbiMgYW5ndWxhci5qcyBkaXJlY3RpdmVzXHJcbnJlcXVpcmUgJy4vZGlyZWN0aXZlcy9yZXNpemUnXHJcblxyXG4jIGFuZ3VsYXIuanMgY29udHJvbGxlcnNcclxucmVxdWlyZSAnLi9jb250cm9sbGVycy9hdXRoLWNvbnRyb2xsZXInXHJcbnJlcXVpcmUgJy4vY29udHJvbGxlcnMvY29udHJvbGxlcidcclxucmVxdWlyZSAnLi9jb250cm9sbGVycy9tZW51LWNvbnRyb2xsZXInXHJcbnJlcXVpcmUgJy4vY29udHJvbGxlcnMvbmF2aWdhdGlvbi1jb250cm9sbGVyJ1xyXG5yZXF1aXJlICcuL2NvbnRyb2xsZXJzL25vdGVzLWNvbnRyb2xsZXInXHJcbnJlcXVpcmUgJy4vY29udHJvbGxlcnMvcHJvZ3Jlc3MtbW9kYWwtY29udHJvbGxlcidcclxucmVxdWlyZSAnLi9jb250cm9sbGVycy9zZXR0aW5ncy1jb250cm9sbGVyJ1xyXG5yZXF1aXJlICcuL2NvbnRyb2xsZXJzL3RpbWVsaW5lLWNvbnRyb2xsZXInXHJcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMC4wXHJcbihmdW5jdGlvbigpIHtcclxuICBhcHAuY29uZmlnKFtcclxuICAgICckcm91dGVQcm92aWRlcicsIGZ1bmN0aW9uKCRyb3V0ZVByb3ZpZGVyKSB7XHJcbiAgICAgIHJldHVybiAkcm91dGVQcm92aWRlci53aGVuKCcvJywge1xyXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnbWVudSdcclxuICAgICAgfSkud2hlbignL3RpbWVsaW5lJywge1xyXG4gICAgICAgIHRlbXBsYXRlVXJsOiAndGltZWxpbmUnXHJcbiAgICAgIH0pLndoZW4oJy9ub3RlcycsIHtcclxuICAgICAgICB0ZW1wbGF0ZVVybDogJ25vdGVzJ1xyXG4gICAgICB9KS53aGVuKCcvc2V0dGluZ3MnLCB7XHJcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdzZXR0aW5ncydcclxuICAgICAgfSkub3RoZXJ3aXNlKHtcclxuICAgICAgICByZWRpcmVjdFRvOiAnLydcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgXSk7XHJcblxyXG59KS5jYWxsKHRoaXMpO1xyXG5cclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cm91dGUuanMubWFwXHJcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4xMC4wXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBEYXRhU3RvcmVTZXJ2aWNlO1xuXG4gIERhdGFTdG9yZVNlcnZpY2UgPSAoZnVuY3Rpb24oKSB7XG5cbiAgICAvKipcbiAgICAgKiBAcHVibGljXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cbiAgICBEYXRhU3RvcmVTZXJ2aWNlLnByb3RvdHlwZS51c2VyID0gbnVsbDtcblxuXG4gICAgLyoqXG4gICAgICogQHB1YmxpY1xuICAgICAqIEB0eXBlIHtBcnJheX1cbiAgICAgKi9cblxuICAgIERhdGFTdG9yZVNlcnZpY2UucHJvdG90eXBlLnBlcnNvbnMgPSBbXTtcblxuXG4gICAgLyoqXG4gICAgICogQHB1YmxpY1xuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICovXG5cbiAgICBEYXRhU3RvcmVTZXJ2aWNlLnByb3RvdHlwZS5ub3RlYm9va3MgPSB7fTtcblxuXG4gICAgLyoqXG4gICAgICogQHB1YmxpY1xuICAgICAqIEB0eXBlIHtBcnJheX1cbiAgICAgKi9cblxuICAgIERhdGFTdG9yZVNlcnZpY2UucHJvdG90eXBlLnN0YWNrcyA9IFtdO1xuXG5cbiAgICAvKipcbiAgICAgKiBAcHVibGljXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cblxuICAgIERhdGFTdG9yZVNlcnZpY2UucHJvdG90eXBlLm5vdGVzID0ge307XG5cblxuICAgIC8qKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqL1xuXG4gICAgRGF0YVN0b3JlU2VydmljZS5wcm90b3R5cGUudGltZUxvZ3MgPSB7fTtcblxuXG4gICAgLyoqXG4gICAgICogQHB1YmxpY1xuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICovXG5cbiAgICBEYXRhU3RvcmVTZXJ2aWNlLnByb3RvdHlwZS5wcm9maXRMb2dzID0ge307XG5cblxuICAgIC8qKlxuICAgICAqIEBwdWJsaWNcbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqL1xuXG4gICAgRGF0YVN0b3JlU2VydmljZS5wcm90b3R5cGUuc2V0dGluZ3MgPSB7fTtcblxuXG4gICAgLyoqXG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICovXG5cbiAgICBmdW5jdGlvbiBEYXRhU3RvcmVTZXJ2aWNlKCkge31cblxuICAgIHJldHVybiBEYXRhU3RvcmVTZXJ2aWNlO1xuXG4gIH0pKCk7XG5cbiAgYXBwLnNlcnZpY2UoJ2RhdGFTdG9yZScsIFtEYXRhU3RvcmVTZXJ2aWNlXSk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBEYXRhU3RvcmVTZXJ2aWNlO1xuXG59KS5jYWxsKHRoaXMpO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhLXN0b3JlLmpzLm1hcFxuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjEwLjBcbihmdW5jdGlvbigpIHtcbiAgdmFyIERhdGFUcmFuc2NpZXZlclNlcnZpY2UsIGFzeW5jLCBtZXJnZSxcbiAgICBiaW5kID0gZnVuY3Rpb24oZm4sIG1lKXsgcmV0dXJuIGZ1bmN0aW9uKCl7IHJldHVybiBmbi5hcHBseShtZSwgYXJndW1lbnRzKTsgfTsgfTtcblxuICBhc3luYyA9IHJlcXVpcmUoJ2FzeW5jJyk7XG5cbiAgbWVyZ2UgPSByZXF1aXJlKCdtZXJnZScpO1xuXG4gIERhdGFUcmFuc2NpZXZlclNlcnZpY2UgPSAoZnVuY3Rpb24oKSB7XG5cbiAgICAvKipcbiAgICAgKiBAcHVibGljXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cbiAgICBEYXRhVHJhbnNjaWV2ZXJTZXJ2aWNlLnByb3RvdHlwZS5maWx0ZXJQYXJhbXMgPSBudWxsO1xuXG5cbiAgICAvKipcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKiBAcGFyYW0geyRIdHRwUHJvdmlkZXJ9ICRodHRwXG4gICAgICogQHBhcmFtIHtEYXRhU3RvcmVTZXJ2aWNlfSBkYXRhU3RvcmVcbiAgICAgKiBAcGFyYW0ge1Byb2dyZXNzU2VydmljZX0gcHJvZ3Jlc3NcbiAgICAgKi9cblxuICAgIGZ1bmN0aW9uIERhdGFUcmFuc2NpZXZlclNlcnZpY2UoJGh0dHAsIGRhdGFTdG9yZSwgcHJvZ3Jlc3MpIHtcbiAgICAgIHRoaXMuJGh0dHAgPSAkaHR0cDtcbiAgICAgIHRoaXMuZGF0YVN0b3JlID0gZGF0YVN0b3JlO1xuICAgICAgdGhpcy5wcm9ncmVzcyA9IHByb2dyZXNzO1xuICAgICAgdGhpcy5fbWFrZVRpbWVMb2dRdWVyeSA9IGJpbmQodGhpcy5fbWFrZVRpbWVMb2dRdWVyeSwgdGhpcyk7XG4gICAgICB0aGlzLl9tYWtlTm90ZVF1ZXJ5ID0gYmluZCh0aGlzLl9tYWtlTm90ZVF1ZXJ5LCB0aGlzKTtcbiAgICAgIHRoaXMuY291bnRUaW1lTG9ncyA9IGJpbmQodGhpcy5jb3VudFRpbWVMb2dzLCB0aGlzKTtcbiAgICAgIHRoaXMuY291bnROb3RlcyA9IGJpbmQodGhpcy5jb3VudE5vdGVzLCB0aGlzKTtcbiAgICAgIHRoaXMucmVsb2FkID0gYmluZCh0aGlzLnJlbG9hZCwgdGhpcyk7XG4gICAgICB0aGlzLmZpbHRlclBhcmFtcyA9IHtcbiAgICAgICAgbm90ZWJvb2tHdWlkczogW10sXG4gICAgICAgIHN0YWNrczogW11cbiAgICAgIH07XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBAcHVibGljXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2tcbiAgICAgKi9cblxuICAgIERhdGFUcmFuc2NpZXZlclNlcnZpY2UucHJvdG90eXBlLnJlbG9hZCA9IGZ1bmN0aW9uKHBhcmFtcywgY2FsbGJhY2spIHtcbiAgICAgIHZhciBub3RlQ291bnQsIG5vdGVRdWVyeTtcbiAgICAgIGlmIChwYXJhbXMgPT0gbnVsbCkge1xuICAgICAgICBwYXJhbXMgPSB7fTtcbiAgICAgIH1cbiAgICAgIGlmICghY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sgPSAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7fTtcbiAgICAgICAgfSkodGhpcyk7XG4gICAgICB9XG4gICAgICBub3RlUXVlcnkgPSB0aGlzLl9tYWtlTm90ZVF1ZXJ5KHBhcmFtcyAhPSBudWxsID8gcGFyYW1zIDoge30pO1xuICAgICAgbm90ZUNvdW50ID0gMDtcbiAgICAgIHRoaXMucHJvZ3Jlc3Mub3BlbigpO1xuICAgICAgcmV0dXJuIGFzeW5jLnNlcmllcyhbXG4gICAgICAgIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgaWYgKF90aGlzLmRhdGFTdG9yZS51c2VyKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3Muc2V0KCdHZXR0aW5nIHVzZXIgZGF0YS4nLCAwKTtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy4kaHR0cC5nZXQoJy91c2VyJykuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgIF90aGlzLmRhdGFTdG9yZS51c2VyID0gZGF0YTtcbiAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9KS5lcnJvcihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCdFcnJvciAkaHR0cCByZXF1ZXN0Jyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9O1xuICAgICAgICB9KSh0aGlzKSwgKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5zZXQoJ0dldHRpbmcgc2V0dGluZ3MgZGF0YS4nLCAxMCk7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuJGh0dHAuZ2V0KCcvc2V0dGluZ3MnKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLnNldHRpbmdzID0gZGF0YTtcbiAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9KS5lcnJvcihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCdFcnJvciAkaHR0cCByZXF1ZXN0Jyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9O1xuICAgICAgICB9KSh0aGlzKSwgKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpZiAoIV90aGlzLmRhdGFTdG9yZS5zZXR0aW5ncy5wZXJzb25zIHx8IF90aGlzLmRhdGFTdG9yZS5zZXR0aW5ncy5wZXJzb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soJ1RoaXMgYXBwIG5lZWQgcGVyc29ucyBzZXR0aW5nLiBQbGVhc2Ugc3dpdGNoIFwiU2V0dGluZ3MgUGFnZVwiIGFuZCBzZXQgeW91ciBwZXJzb25zIGRhdGEuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9KSh0aGlzKSwgKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5zZXQoJ1N5bmNpbmcgcmVtb3RlIHNlcnZlci4nLCAyMCk7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuJGh0dHAuZ2V0KCcvc3luYycpLnN1Y2Nlc3MoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfSkuZXJyb3IoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygnRXJyb3IgJGh0dHAgcmVxdWVzdCcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSkodGhpcyksIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3Muc2V0KCdHZXR0aW5nIG5vdGVib29rcyBkYXRhLicsIDMwKTtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy4kaHR0cC5nZXQoJy9ub3RlYm9va3MnKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgdmFyIGksIGxlbiwgbm90ZWJvb2ssIHN0YWNrSGFzaDtcbiAgICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLm5vdGVib29rcyA9IHt9O1xuICAgICAgICAgICAgICBzdGFja0hhc2ggPSB7fTtcbiAgICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuID0gZGF0YS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIG5vdGVib29rID0gZGF0YVtpXTtcbiAgICAgICAgICAgICAgICBfdGhpcy5kYXRhU3RvcmUubm90ZWJvb2tzW25vdGVib29rLmd1aWRdID0gbm90ZWJvb2s7XG4gICAgICAgICAgICAgICAgaWYgKG5vdGVib29rLnN0YWNrKSB7XG4gICAgICAgICAgICAgICAgICBzdGFja0hhc2hbbm90ZWJvb2suc3RhY2tdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLnN0YWNrcyA9IE9iamVjdC5rZXlzKHN0YWNrSGFzaCk7XG4gICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfSkuZXJyb3IoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygnRXJyb3IgJGh0dHAgcmVxdWVzdCcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSkodGhpcyksIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3Muc2V0KCdHZXR0aW5nIG5vdGVzIGNvdW50LicsIDQwKTtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy4kaHR0cC5nZXQoJy9ub3Rlcy9jb3VudCcsIHtcbiAgICAgICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICAgICAgcXVlcnk6IG5vdGVRdWVyeVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgbm90ZUNvdW50ID0gZGF0YTtcbiAgICAgICAgICAgICAgaWYgKG5vdGVDb3VudCA+IDEwMCkge1xuICAgICAgICAgICAgICAgIGlmICh3aW5kb3cuY29uZmlybShcIkN1cnJlbnQgcXVlcnkgZmluZCBcIiArIG5vdGVDb3VudCArIFwiIG5vdGVzLiBJdCBpcyB0b28gbWFueS4gQ29udGludWUgYW55d2F5P1wiKSkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygnVXNlciBDYW5jZWxlZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkuZXJyb3IoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygnRXJyb3IgJGh0dHAgcmVxdWVzdCcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSkodGhpcyksIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3Muc2V0KCdSZXF1ZXN0IHJlbW90ZSBjb250ZW50cy4nLCA1MCk7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuJGh0dHAuZ2V0KCcvbm90ZXMvZ2V0LWNvbnRlbnQnLCB7XG4gICAgICAgICAgICAgIHBhcmFtczoge1xuICAgICAgICAgICAgICAgIHF1ZXJ5OiBub3RlUXVlcnlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkuc3VjY2VzcyhmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9KS5lcnJvcihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCdFcnJvciAkaHR0cCByZXF1ZXN0Jyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9O1xuICAgICAgICB9KSh0aGlzKSwgKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5zZXQoJ0dldHRpbmcgbm90ZXMuJywgNzApO1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzLiRodHRwLmdldCgnL25vdGVzJywge1xuICAgICAgICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICAgICAgICBxdWVyeTogbm90ZVF1ZXJ5LFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGZhbHNlXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICB2YXIgaSwgbGVuLCBub3RlO1xuICAgICAgICAgICAgICBfdGhpcy5kYXRhU3RvcmUubm90ZXMgPSB7fTtcbiAgICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuID0gZGF0YS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIG5vdGUgPSBkYXRhW2ldO1xuICAgICAgICAgICAgICAgIF90aGlzLmRhdGFTdG9yZS5ub3Rlc1tub3RlLmd1aWRdID0gbm90ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH0pLmVycm9yKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soJ0Vycm9yICRodHRwIHJlcXVlc3QnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH07XG4gICAgICAgIH0pKHRoaXMpLCAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBndWlkcywgbm90ZSwgbm90ZUd1aWQsIHRpbWVMb2dRdWVyeTtcbiAgICAgICAgICAgIF90aGlzLnByb2dyZXNzLnNldCgnR2V0dGluZyB0aW1lIGxvZ3MuJywgODApO1xuICAgICAgICAgICAgZ3VpZHMgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHZhciByZWYsIHJlc3VsdHM7XG4gICAgICAgICAgICAgIHJlZiA9IHRoaXMuZGF0YVN0b3JlLm5vdGVzO1xuICAgICAgICAgICAgICByZXN1bHRzID0gW107XG4gICAgICAgICAgICAgIGZvciAobm90ZUd1aWQgaW4gcmVmKSB7XG4gICAgICAgICAgICAgICAgbm90ZSA9IHJlZltub3RlR3VpZF07XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKG5vdGUuZ3VpZCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICAgICAgICB9KS5jYWxsKF90aGlzKTtcbiAgICAgICAgICAgIHRpbWVMb2dRdWVyeSA9IF90aGlzLl9tYWtlVGltZUxvZ1F1ZXJ5KG1lcmdlKHRydWUsIHBhcmFtcywge1xuICAgICAgICAgICAgICBub3RlR3VpZHM6IGd1aWRzXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuJGh0dHAucG9zdCgnL3RpbWUtbG9ncycsIHtcbiAgICAgICAgICAgICAgcXVlcnk6IHRpbWVMb2dRdWVyeVxuICAgICAgICAgICAgfSkuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgIHZhciBiYXNlLCBpLCBsZW4sIG5hbWUsIHRpbWVMb2c7XG4gICAgICAgICAgICAgIF90aGlzLmRhdGFTdG9yZS50aW1lTG9ncyA9IHt9O1xuICAgICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBkYXRhLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGltZUxvZyA9IGRhdGFbaV07XG4gICAgICAgICAgICAgICAgaWYgKChiYXNlID0gX3RoaXMuZGF0YVN0b3JlLnRpbWVMb2dzKVtuYW1lID0gdGltZUxvZy5ub3RlR3VpZF0gPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgYmFzZVtuYW1lXSA9IHt9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfdGhpcy5kYXRhU3RvcmUudGltZUxvZ3NbdGltZUxvZy5ub3RlR3VpZF1bdGltZUxvZy5faWRdID0gdGltZUxvZztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH0pLmVycm9yKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soJ0Vycm9yICRodHRwIHJlcXVlc3QnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH07XG4gICAgICAgIH0pKHRoaXMpLCAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBndWlkcywgbm90ZSwgbm90ZUd1aWQ7XG4gICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5zZXQoJ0dldHRpbmcgcHJvZml0IGxvZ3MuJywgOTApO1xuICAgICAgICAgICAgZ3VpZHMgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHZhciByZWYsIHJlc3VsdHM7XG4gICAgICAgICAgICAgIHJlZiA9IHRoaXMuZGF0YVN0b3JlLm5vdGVzO1xuICAgICAgICAgICAgICByZXN1bHRzID0gW107XG4gICAgICAgICAgICAgIGZvciAobm90ZUd1aWQgaW4gcmVmKSB7XG4gICAgICAgICAgICAgICAgbm90ZSA9IHJlZltub3RlR3VpZF07XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKG5vdGUuZ3VpZCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICAgICAgICB9KS5jYWxsKF90aGlzKTtcbiAgICAgICAgICAgIHJldHVybiBfdGhpcy4kaHR0cC5wb3N0KCcvcHJvZml0LWxvZ3MnLCB7XG4gICAgICAgICAgICAgIHF1ZXJ5OiB7XG4gICAgICAgICAgICAgICAgbm90ZUd1aWQ6IHtcbiAgICAgICAgICAgICAgICAgICRpbjogZ3VpZHNcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICB2YXIgYmFzZSwgaSwgbGVuLCBuYW1lLCBwcm9maXRMb2c7XG4gICAgICAgICAgICAgIF90aGlzLmRhdGFTdG9yZS5wcm9maXRMb2dzID0ge307XG4gICAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBwcm9maXRMb2cgPSBkYXRhW2ldO1xuICAgICAgICAgICAgICAgIGlmICgoYmFzZSA9IF90aGlzLmRhdGFTdG9yZS5wcm9maXRMb2dzKVtuYW1lID0gcHJvZml0TG9nLm5vdGVHdWlkXSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICBiYXNlW25hbWVdID0ge307XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF90aGlzLmRhdGFTdG9yZS5wcm9maXRMb2dzW3Byb2ZpdExvZy5ub3RlR3VpZF1bcHJvZml0TG9nLl9pZF0gPSBwcm9maXRMb2c7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9KS5lcnJvcihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCdFcnJvciAkaHR0cCByZXF1ZXN0Jyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9O1xuICAgICAgICB9KSh0aGlzKVxuICAgICAgXSwgKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBhbGVydChlcnIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5zZXQoJ0RvbmUuJywgMTAwKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgX3RoaXMucHJvZ3Jlc3MuY2xvc2UoKTtcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpKTtcbiAgICB9O1xuXG4gICAgRGF0YVRyYW5zY2lldmVyU2VydmljZS5wcm90b3R5cGUucmVQYXJzZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICBpZiAoIWNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge307XG4gICAgICAgIH0pKHRoaXMpO1xuICAgICAgfVxuICAgICAgdGhpcy5wcm9ncmVzcy5vcGVuKCk7XG4gICAgICB0aGlzLnByb2dyZXNzLnNldCgnUmUgUGFyc2Ugbm90ZXMuLi4nLCA1MCk7XG4gICAgICByZXR1cm4gYXN5bmMud2F0ZXJmYWxsKFtcbiAgICAgICAgKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuJGh0dHAuZ2V0KCcvbm90ZXMvcmUtcGFyc2UnKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9KS5lcnJvcihmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygnRXJyb3IgJGh0dHAgcmVxdWVzdCcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSkodGhpcylcbiAgICAgIF0sIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgX3RoaXMucHJvZ3Jlc3Muc2V0KCdEb25lLicsIDEwMCk7XG4gICAgICAgICAgX3RoaXMucHJvZ3Jlc3MuY2xvc2UoKTtcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpKTtcbiAgICB9O1xuXG4gICAgRGF0YVRyYW5zY2lldmVyU2VydmljZS5wcm90b3R5cGUuY291bnROb3RlcyA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICB2YXIgcXVlcnk7XG4gICAgICBxdWVyeSA9IHRoaXMuX21ha2VOb3RlUXVlcnkoKTtcbiAgICAgIHJldHVybiB0aGlzLiRodHRwLmdldCgnL25vdGVzL2NvdW50Jywge1xuICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICBxdWVyeTogcXVlcnlcbiAgICAgICAgfVxuICAgICAgfSkuc3VjY2VzcygoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgZGF0YSk7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSkuZXJyb3IoKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2soJ0Vycm9yICRodHRwIHJlcXVlc3QnKTtcbiAgICAgICAgfTtcbiAgICAgIH0pKHRoaXMpKTtcbiAgICB9O1xuXG4gICAgRGF0YVRyYW5zY2lldmVyU2VydmljZS5wcm90b3R5cGUuY291bnRUaW1lTG9ncyA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICB2YXIgcXVlcnk7XG4gICAgICBxdWVyeSA9IHRoaXMuX21ha2VUaW1lTG9nUXVlcnkoKTtcbiAgICAgIHJldHVybiB0aGlzLiRodHRwLmdldCgnL3RpbWUtbG9ncy9jb3VudCcsIHtcbiAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgcXVlcnk6IHF1ZXJ5XG4gICAgICAgIH1cbiAgICAgIH0pLnN1Y2Nlc3MoKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIGRhdGEpO1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcykpLmVycm9yKChmdW5jdGlvbihfdGhpcykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCdFcnJvciAkaHR0cCByZXF1ZXN0Jyk7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgfTtcblxuXG4gICAgLyoqXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXNcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAgICovXG5cbiAgICBEYXRhVHJhbnNjaWV2ZXJTZXJ2aWNlLnByb3RvdHlwZS5fbWFrZU5vdGVRdWVyeSA9IGZ1bmN0aW9uKHBhcmFtcykge1xuICAgICAgdmFyIGksIGosIGxlbiwgbGVuMSwgbm90ZWJvb2ssIG5vdGVib29rR3VpZCwgbm90ZWJvb2tzQXJyYXksIG5vdGVib29rc0hhc2gsIHJlZiwgcmVmMSwgcmVmMiwgcmVzdWx0LCBzdGFjaztcbiAgICAgIGlmIChwYXJhbXMgPT0gbnVsbCkge1xuICAgICAgICBwYXJhbXMgPSB7fTtcbiAgICAgIH1cbiAgICAgIHJlc3VsdCA9IHt9O1xuICAgICAgaWYgKHBhcmFtcy5zdGFydCkge1xuICAgICAgICBtZXJnZShyZXN1bHQsIHtcbiAgICAgICAgICB1cGRhdGVkOiB7XG4gICAgICAgICAgICAkZ3RlOiBwYXJhbXMuc3RhcnQudmFsdWVPZigpXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIG5vdGVib29rc0hhc2ggPSB7fTtcbiAgICAgIGlmICh0aGlzLmZpbHRlclBhcmFtcy5ub3RlYm9va0d1aWRzICYmIHRoaXMuZmlsdGVyUGFyYW1zLm5vdGVib29rR3VpZHMubGVuZ3RoID4gMCkge1xuICAgICAgICByZWYgPSB0aGlzLmZpbHRlclBhcmFtcy5ub3RlYm9va0d1aWRzO1xuICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSByZWYubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICBub3RlYm9va0d1aWQgPSByZWZbaV07XG4gICAgICAgICAgbm90ZWJvb2tzSGFzaFtub3RlYm9va0d1aWRdID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMuZmlsdGVyUGFyYW1zLnN0YWNrcyAmJiB0aGlzLmZpbHRlclBhcmFtcy5zdGFja3MubGVuZ3RoID4gMCkge1xuICAgICAgICByZWYxID0gdGhpcy5maWx0ZXJQYXJhbXMuc3RhY2tzO1xuICAgICAgICBmb3IgKGogPSAwLCBsZW4xID0gcmVmMS5sZW5ndGg7IGogPCBsZW4xOyBqKyspIHtcbiAgICAgICAgICBzdGFjayA9IHJlZjFbal07XG4gICAgICAgICAgcmVmMiA9IHRoaXMuZGF0YVN0b3JlLm5vdGVib29rcztcbiAgICAgICAgICBmb3IgKG5vdGVib29rR3VpZCBpbiByZWYyKSB7XG4gICAgICAgICAgICBub3RlYm9vayA9IHJlZjJbbm90ZWJvb2tHdWlkXTtcbiAgICAgICAgICAgIGlmIChzdGFjayA9PT0gbm90ZWJvb2suc3RhY2spIHtcbiAgICAgICAgICAgICAgbm90ZWJvb2tzSGFzaFtub3RlYm9vay5ndWlkXSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBub3RlYm9va3NBcnJheSA9IE9iamVjdC5rZXlzKG5vdGVib29rc0hhc2gpO1xuICAgICAgaWYgKG5vdGVib29rc0FycmF5Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgbWVyZ2UocmVzdWx0LCB7XG4gICAgICAgICAgbm90ZWJvb2tHdWlkOiB7XG4gICAgICAgICAgICAkaW46IG5vdGVib29rc0FycmF5XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcblxuXG4gICAgLyoqXG4gICAgICogQHB1YmxpY1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXNcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAgICovXG5cbiAgICBEYXRhVHJhbnNjaWV2ZXJTZXJ2aWNlLnByb3RvdHlwZS5fbWFrZVRpbWVMb2dRdWVyeSA9IGZ1bmN0aW9uKHBhcmFtcykge1xuICAgICAgdmFyIHJlc3VsdDtcbiAgICAgIGlmIChwYXJhbXMgPT0gbnVsbCkge1xuICAgICAgICBwYXJhbXMgPSB7fTtcbiAgICAgIH1cbiAgICAgIHJlc3VsdCA9IHt9O1xuICAgICAgaWYgKHBhcmFtcy5zdGFydCkge1xuICAgICAgICBtZXJnZS5yZWN1cnNpdmUocmVzdWx0LCB7XG4gICAgICAgICAgZGF0ZToge1xuICAgICAgICAgICAgJGd0ZTogcGFyYW1zLnN0YXJ0LnZhbHVlT2YoKVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBpZiAocGFyYW1zLmVuZCkge1xuICAgICAgICBtZXJnZS5yZWN1cnNpdmUocmVzdWx0LCB7XG4gICAgICAgICAgZGF0ZToge1xuICAgICAgICAgICAgJGx0ZTogcGFyYW1zLmVuZC52YWx1ZU9mKClcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaWYgKHBhcmFtcy5ub3RlR3VpZHMpIHtcbiAgICAgICAgbWVyZ2UocmVzdWx0LCB7XG4gICAgICAgICAgbm90ZUd1aWQ6IHtcbiAgICAgICAgICAgICRpbjogcGFyYW1zLm5vdGVHdWlkc1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG5cbiAgICByZXR1cm4gRGF0YVRyYW5zY2lldmVyU2VydmljZTtcblxuICB9KSgpO1xuXG4gIGFwcC5zZXJ2aWNlKCdkYXRhVHJhbnNjaWV2ZXInLCBbJyRodHRwJywgJ2RhdGFTdG9yZScsICdwcm9ncmVzcycsIERhdGFUcmFuc2NpZXZlclNlcnZpY2VdKTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IERhdGFUcmFuc2NpZXZlclNlcnZpY2U7XG5cbn0pLmNhbGwodGhpcyk7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGEtdHJhbnNjaWV2ZXIuanMubWFwXG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuMTAuMFxyXG4oZnVuY3Rpb24oKSB7XHJcbiAgdmFyIFByb2dyZXNzU2VydmljZSxcclxuICAgIGJpbmQgPSBmdW5jdGlvbihmbiwgbWUpeyByZXR1cm4gZnVuY3Rpb24oKXsgcmV0dXJuIGZuLmFwcGx5KG1lLCBhcmd1bWVudHMpOyB9OyB9O1xyXG5cclxuICBQcm9ncmVzc1NlcnZpY2UgPSAoZnVuY3Rpb24oKSB7XHJcbiAgICBQcm9ncmVzc1NlcnZpY2UucHJvdG90eXBlLm1vZGFsSW5zdGFuY2UgPSBudWxsO1xyXG5cclxuICAgIFByb2dyZXNzU2VydmljZS5wcm90b3R5cGUudmFsdWUgPSAwO1xyXG5cclxuICAgIFByb2dyZXNzU2VydmljZS5wcm90b3R5cGUubWVzc2FnZSA9ICcnO1xyXG5cclxuICAgIGZ1bmN0aW9uIFByb2dyZXNzU2VydmljZSgkbW9kYWwpIHtcclxuICAgICAgdGhpcy4kbW9kYWwgPSAkbW9kYWw7XHJcbiAgICAgIHRoaXMuc2V0ID0gYmluZCh0aGlzLnNldCwgdGhpcyk7XHJcbiAgICAgIHRoaXMuY2xvc2UgPSBiaW5kKHRoaXMuY2xvc2UsIHRoaXMpO1xyXG4gICAgICB0aGlzLm9wZW4gPSBiaW5kKHRoaXMub3BlbiwgdGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgUHJvZ3Jlc3NTZXJ2aWNlLnByb3RvdHlwZS5vcGVuID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMubWVzc2FnZSA9ICdwcm9jZXNzaW5nLi4uJztcclxuICAgICAgdGhpcy52YWx1ZSA9IDA7XHJcbiAgICAgIHJldHVybiB0aGlzLm1vZGFsSW5zdGFuY2UgPSB0aGlzLiRtb2RhbC5vcGVuKHtcclxuICAgICAgICB0ZW1wbGF0ZVVybDogJ3Byb2dyZXNzLW1vZGFsJyxcclxuICAgICAgICBjb250cm9sbGVyOiAnUHJvZ3Jlc3NNb2RhbENvbnRyb2xsZXInLFxyXG4gICAgICAgIGJhY2tkcm9wOiAnc3RhdGljJyxcclxuICAgICAgICBrZXlib2FyZDogZmFsc2UsXHJcbiAgICAgICAgc2l6ZTogJ3NtJyxcclxuICAgICAgICBhbmltYXRpb246IGZhbHNlXHJcbiAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBQcm9ncmVzc1NlcnZpY2UucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLm1vZGFsSW5zdGFuY2UuY2xvc2UoKTtcclxuICAgIH07XHJcblxyXG4gICAgUHJvZ3Jlc3NTZXJ2aWNlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihtZXNzYWdlLCB2YWx1ZSkge1xyXG4gICAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xyXG4gICAgICAgIHZhbHVlID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xyXG4gICAgICBpZiAodmFsdWUgIT09IG51bGwpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZSA9IHZhbHVlO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBQcm9ncmVzc1NlcnZpY2U7XHJcblxyXG4gIH0pKCk7XHJcblxyXG4gIGFwcC5zZXJ2aWNlKCdwcm9ncmVzcycsIFsnJG1vZGFsJywgUHJvZ3Jlc3NTZXJ2aWNlXSk7XHJcblxyXG4gIG1vZHVsZS5leHBvcnRzID0gUHJvZ3Jlc3NTZXJ2aWNlO1xyXG5cclxufSkuY2FsbCh0aGlzKTtcclxuXHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXByb2dyZXNzLmpzLm1hcFxyXG4iXX0=
