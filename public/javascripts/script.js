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
                _this.$scope.production = data;
                _this.$http.post('/auth/token', { sandbox: true })
                    .error(function (data) {
                    throw new Error(data);
                })
                    .success(function (data) {
                    _this.$scope.sandbox = data;
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
                    _this.$scope.sandbox = data;
                else
                    _this.$scope.production = data;
                if (!data)
                    alert('Token is invalid.');
            })
                .error(function (data) {
                alert('Set token failed.');
            });
        };
        this.$scope.message = null;
        this.$scope.isDeveloper = false;
        this.$scope.sandbox = { token: null, username: null };
        this.$scope.production = { token: null, username: null };
        this.$scope.setToken = this._setToken;
        this._init();
    }
    return AuthController;
})();
angular.module('App').controller('AuthController', ['$scope', '$http', AuthController]);

},{}],5:[function(require,module,exports){
var Controller = (function () {
    function Controller($scope) {
        this.$scope = $scope;
    }
    return Controller;
})();
angular.module('App').controller('Controller', ['$scope', Controller]);

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
                _this.$scope.noteCount = count;
            });
        };
        this.$scope.dataStore = this.dataStore;
        this.$scope.dataTransciever = this.dataTransciever;
        this.$scope.noteCount = null;
        this.$scope.$watchGroup(['dataTransciever.filterParams.notebookGuids', 'dataTransciever.filterParams.stacks'], this._onWatchFilterParams);
        this.$scope.$on('event::reload', this._onReload);
    }
    return MenuController;
})();
angular.module('App').controller('MenuController', ['$scope', '$http', 'dataStore', 'dataTransciever', MenuController]);

},{}],7:[function(require,module,exports){
var ModalController = (function () {
    function ModalController($scope) {
        this.$scope = $scope;
    }
    return ModalController;
})();
exports.ModalController = ModalController;
angular.module('App').controller('ModalController', ['$scope', ModalController]);

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
        this.$scope.navCollapse = true;
        this.$scope.$route = this.$route;
        this.$scope.reload = this._reload;
    }
    return NavigationController;
})();
angular.module('App').controller('NavigationController', ['$scope', '$rootScope', '$route', NavigationController]);

},{}],9:[function(require,module,exports){
var NotesController = (function () {
    function NotesController($scope, dataStore) {
        var _this = this;
        this.$scope = $scope;
        this.dataStore = dataStore;
        this._onWatchTimeLogs = function (timeLogs) {
            _this.$scope.notesSpentTimes = {};
            var personsHash = {};
            for (var noteGuid in timeLogs) {
                var noteTimeLog = timeLogs[noteGuid];
                for (var timeLogId in noteTimeLog) {
                    var timeLog = noteTimeLog[timeLogId];
                    if (!_this.$scope.notesSpentTimes[timeLog.noteGuid])
                        _this.$scope.notesSpentTimes[timeLog.noteGuid] = { $total: 0 };
                    _this.$scope.notesSpentTimes[timeLog.noteGuid]['$total'] += timeLog.spentTime;
                    if (!_this.$scope.notesSpentTimes[timeLog.noteGuid][timeLog.person])
                        _this.$scope.notesSpentTimes[timeLog.noteGuid][timeLog.person] = 0;
                    _this.$scope.notesSpentTimes[timeLog.noteGuid][timeLog.person] += timeLog.spentTime;
                    if (!_this.$scope.notesSpentTimes['$total'])
                        _this.$scope.notesSpentTimes['$total'] = { $total: 0 };
                    _this.$scope.notesSpentTimes['$total']['$total'] += timeLog.spentTime;
                    if (!_this.$scope.notesSpentTimes['$total'][timeLog.person])
                        _this.$scope.notesSpentTimes['$total'][timeLog.person] = 0;
                    _this.$scope.notesSpentTimes['$total'][timeLog.person] += timeLog.spentTime;
                    if (timeLog.spentTime > 0)
                        personsHash[timeLog.person] = true;
                }
            }
            _this.$scope.existPersons = Object.keys(personsHash);
        };
        this._onWatchProfitLogs = function (profitLogs) {
            _this.$scope.notesProfits = {};
            for (var noteGuid in profitLogs) {
                var noteProfitLog = profitLogs[noteGuid];
                for (var profitLogId in noteProfitLog) {
                    var profitLog = noteProfitLog[profitLogId];
                    if (!_this.$scope.notesProfits[profitLog.noteGuid])
                        _this.$scope.notesProfits[profitLog.noteGuid] = { $total: 0 };
                    _this.$scope.notesProfits[profitLog.noteGuid]['$total'] += profitLog.profit;
                    if (!_this.$scope.notesProfits['$total'])
                        _this.$scope.notesProfits['$total'] = { $total: 0 };
                    _this.$scope.notesProfits['$total']['$total'] += profitLog.profit;
                    for (var _i = 0, _a = _this.$scope.existPersons; _i < _a.length; _i++) {
                        var person = _a[_i];
                        if (!_this.$scope.notesSpentTimes[noteGuid] || !_this.$scope.notesSpentTimes[noteGuid][person] || !_this.$scope.notesSpentTimes[noteGuid]['$total'])
                            _this.$scope.notesProfits[noteGuid][person] = null;
                        else
                            _this.$scope.notesProfits[noteGuid][person] = Math.round(_this.$scope.notesProfits[noteGuid]['$total'] * _this.$scope.notesSpentTimes[noteGuid][person] / _this.$scope.notesSpentTimes[noteGuid]['$total']);
                    }
                    if (!_this.$scope.notesProfits['$total'][person])
                        _this.$scope.notesProfits['$total'][person] = 0;
                    _this.$scope.notesProfits['$total'][person] += _this.$scope.notesProfits[noteGuid][person];
                }
            }
        };
        this.$scope.dataStore = this.dataStore;
        this.$scope.notesSpentTimes = {};
        this.$scope.notesProfits = {};
        this.$scope.existPersons = [];
        this.$scope.$watchCollection('dataStore.timeLogs', this._onWatchTimeLogs);
        this.$scope.$watchCollection('dataStore.profitLogs', this._onWatchProfitLogs);
    }
    return NotesController;
})();
angular.module('App').controller('NotesController', ['$scope', 'dataStore', NotesController]);

},{}],10:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var modal_controller_1 = require("./modal-controller");
var ProgressModalController = (function (_super) {
    __extends(ProgressModalController, _super);
    function ProgressModalController($scope, progress) {
        _super.call(this, $scope);
        this.$scope = $scope;
        this.progress = progress;
        this.$scope.progress = this.progress;
    }
    return ProgressModalController;
})(modal_controller_1.ModalController);
exports.ProgressModalController = ProgressModalController;
angular.module('App').controller('ProgressModalController', ['$scope', 'progress', ProgressModalController]);

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
        this._up = function (index) {
            if (index == 0)
                return;
            _this.$scope.editStore['persons'].splice(index - 1, 2, _this.$scope.editStore['persons'][index], _this.$scope.editStore['persons'][index - 1]);
        };
        this._down = function (index) {
            if (index >= _this.$scope.editStore['persons'].length - 1)
                return;
            _this.$scope.editStore['persons'].splice(index, 2, _this.$scope.editStore['persons'][index + 1], _this.$scope.editStore['persons'][index]);
        };
        this._remove = function (index) {
            _this.$scope.editStore['persons'].splice(index, 1);
        };
        this._add = function () {
            if (!_this.$scope.editStore['persons'])
                _this.$scope.editStore['persons'] = [];
            _this.$scope.editStore['persons'].push({ name: "Person " + (_this.$scope.editStore['persons'].length + 1) });
        };
        this._submit = function () {
            _this.progress.open(1);
            var count = 0;
            var reParse = false;
            var reload = false;
            async.forEachOfSeries(_this.constructor.FIELDS, function (field, key, callback) {
                if (JSON.stringify(angular.copy(_this.$scope.editStore[key])) == JSON.stringify(_this.dataStore.settings[key]))
                    return callback();
                if (field.reParse)
                    reParse = true;
                if (field.reload)
                    reload = true;
                _this.progress.set("Saving " + key + "...", count++ / Object.keys(_this.constructor.FIELDS).length * 100);
                _this.$http.put('/settings/save', { key: key, value: _this.$scope.editStore[key] })
                    .success(function () {
                    _this.dataStore.settings[key] = _this.$scope.editStore[key];
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
                _this.$scope.editStore[key] = angular.copy(_this.dataStore.settings[key]);
            };
        };
        this.$scope.dataStore = this.dataStore;
        this.$scope.editStore = {};
        this.$scope.fields = this.constructor.FIELDS;
        this.$scope.up = this._up;
        this.$scope.down = this._down;
        this.$scope.remove = this._remove;
        this.$scope.add = this._add;
        this.$scope.submit = this._submit;
        for (var fieldName in this.constructor.FIELDS)
            this.$scope.$watch("dataStore.settings." + fieldName, this._onWatchSetting(fieldName));
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
            if (currentStart.isSameOrAfter(_this.$scope.start) && currentEnd.isSameOrBefore(_this.$scope.end))
                return;
            if (!_this.$scope.start || currentStart.isBefore(_this.$scope.start))
                _this.$scope.start = currentStart;
            if (!_this.$scope.end || currentEnd.isAfter(_this.$scope.end))
                _this.$scope.end = currentEnd;
            _this._onReload();
        };
        this._onReload = function () {
            _this.dataTransciever.reload({ start: _this.$scope.start, end: _this.$scope.end }, _this._onReloadEnd);
        };
        this._onReloadEnd = function () {
            _this.$scope.timelineItems.clear();
            var notes = {};
            for (var noteGuid in _this.dataStore.notes) {
                var note = _this.dataStore.notes[noteGuid];
                notes[note.guid] = note;
                var timelineItem = {
                    id: note.guid,
                    group: 'updated',
                    content: "<a href=\"evernote:///view/" + _this.dataStore.user.id + "/" + _this.dataStore.user.shardId + "/" + note.guid + "/" + note.guid + "/\" title=\"" + note.title + "\">" + _this.$filter('abbreviate')(note.title, 40) + "</a>",
                    start: moment(note.updated).toDate(),
                    type: 'point'
                };
                _this.$scope.timelineItems.add(timelineItem);
            }
            for (var noteGuid in _this.dataStore.timeLogs) {
                var noteTimeLogs = _this.dataStore.timeLogs[noteGuid];
                for (var timeLogId in noteTimeLogs) {
                    var timeLog = noteTimeLogs[timeLogId];
                    var noteTitle = notes[timeLog.noteGuid].title;
                    var timelineItem = {
                        id: timeLog._id,
                        group: timeLog.person,
                        content: "<a href=\"evernote:///view/" + _this.dataStore.user['id'] + "/" + _this.dataStore.user['shardId'] + "/" + timeLog.noteGuid + "/" + timeLog.noteGuid + "/\" title=\"" + noteTitle + " " + timeLog.comment + "\">" + _this.$filter('abbreviate')(noteTitle, 20) + " " + _this.$filter('abbreviate')(timeLog.comment, 20) + "</a>",
                        start: moment(timeLog.date).toDate(),
                        end: timeLog.spentTime ? moment(timeLog.date).add(timeLog.spentTime, 'minutes').toDate() : null,
                        type: timeLog.spentTime ? 'range' : 'point'
                    };
                    _this.$scope.timelineItems.add(timelineItem);
                }
            }
        };
        this._onResize = function () {
            _this.$scope['timeline'].setOptions({
                height: window.innerHeight - 90
            });
        };
        this.$scope.dataStore = this.dataStore;
        this.$scope.timelineItems = new vis.DataSet();
        this.$scope.timelineGroups = new vis.DataSet();
        this.$scope.start = moment().startOf('day');
        this.$scope.end = moment().endOf('day');
        this.dataTransciever.reload({ start: this.$scope.start, end: this.$scope.end }, function () {
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
                hiddenDates = [];
            // generate timeline object
            _this.$scope['timeline'] = new vis.Timeline(container, _this.$scope.timelineItems, _this.$scope.timelineGroups, {
                margin: { item: 5 },
                height: window.innerHeight - 80,
                orientation: { axis: 'both', item: 'top' },
                start: _this.$scope.start,
                end: _this.$scope.end,
                order: function (a, b) {
                    return a.start.getTime() - b.start.getTime();
                },
                hiddenDates: hiddenDates
            });
            // set person data
            if (!_this.dataStore.settings || !_this.dataStore.settings['persons'])
                return;
            for (var _i = 0, _a = _this.dataStore.settings['persons']; _i < _a.length; _i++) {
                var person = _a[_i];
                _this.$scope.timelineGroups.add({
                    id: person.name,
                    content: person.name
                });
            }
            _this.$scope.timelineGroups.add({
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
            for (var key in input)
                var value = input[key];
            result += _objectLength(value, depth - 1);
            return result;
        }
    };
    return _objectLength;
};
angular.module('App').filter('objectLength', objectLength);

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
exports.DataStoreService = DataStoreService;
angular.module('App').service('dataStore', [DataStoreService]);

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
                        callback(new Error('Error $http request'));
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
                callback(new Error('Error $http request'));
            });
        };
        this.countTimeLogs = function (callback) {
            var query = _this._makeTimeLogQuery();
            _this.$http.get('/time-logs/count', { params: { query: query } })
                .success(function (data) {
                callback(null, data);
            })
                .error(function () {
                callback(new Error('Error $http request'));
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
exports.DataTranscieverService = DataTranscieverService;
angular.module('App').service('dataTransciever', ['$http', 'dataStore', 'progress', DataTranscieverService]);

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
exports.ProgressService = ProgressService;
angular.module('App').service('progress', ['$modal', ProgressService]);

},{}]},{},[19])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvYXN5bmMvbGliL2FzeW5jLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL21lcmdlL21lcmdlLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsInNyYy9jb250cm9sbGVycy9hdXRoLWNvbnRyb2xsZXIuanMiLCJzcmMvY29udHJvbGxlcnMvY29udHJvbGxlci5qcyIsInNyYy9jb250cm9sbGVycy9tZW51LWNvbnRyb2xsZXIuanMiLCJzcmMvY29udHJvbGxlcnMvbW9kYWwtY29udHJvbGxlci5qcyIsInNyYy9jb250cm9sbGVycy9uYXZpZ2F0aW9uLWNvbnRyb2xsZXIuanMiLCJzcmMvY29udHJvbGxlcnMvbm90ZXMtY29udHJvbGxlci5qcyIsInNyYy9jb250cm9sbGVycy9wcm9ncmVzcy1tb2RhbC1jb250cm9sbGVyLmpzIiwic3JjL2NvbnRyb2xsZXJzL3NldHRpbmdzLWNvbnRyb2xsZXIuanMiLCJzcmMvY29udHJvbGxlcnMvdGltZWxpbmUtY29udHJvbGxlci5qcyIsInNyYy9kaXJlY3RpdmVzL3Jlc2l6ZS5qcyIsInNyYy9maWx0ZXJzL2FiYnJldmlhdGUuanMiLCJzcmMvZmlsdGVycy9maWx0ZXItYnktcHJvcGVydHkuanMiLCJzcmMvZmlsdGVycy9vYmplY3QtbGVuZ3RoLmpzIiwic3JjL2ZpbHRlcnMvb3JkZXItb2JqZWN0LWJ5LmpzIiwic3JjL2ZpbHRlcnMvc3BlbnQtdGltZS5qcyIsInNyYy9pbmRleC5qcyIsInNyYy9yb3V0ZS5qcyIsInNyYy9zZXJ2aWNlcy9kYXRhLXN0b3JlLmpzIiwic3JjL3NlcnZpY2VzL2RhdGEtdHJhbnNjaWV2ZXIuanMiLCJzcmMvc2VydmljZXMvcHJvZ3Jlc3MuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2h2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyohXG4gKiBhc3luY1xuICogaHR0cHM6Ly9naXRodWIuY29tL2Nhb2xhbi9hc3luY1xuICpcbiAqIENvcHlyaWdodCAyMDEwLTIwMTQgQ2FvbGFuIE1jTWFob25cbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZVxuICovXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGFzeW5jID0ge307XG4gICAgZnVuY3Rpb24gbm9vcCgpIHt9XG4gICAgZnVuY3Rpb24gaWRlbnRpdHkodikge1xuICAgICAgICByZXR1cm4gdjtcbiAgICB9XG4gICAgZnVuY3Rpb24gdG9Cb29sKHYpIHtcbiAgICAgICAgcmV0dXJuICEhdjtcbiAgICB9XG4gICAgZnVuY3Rpb24gbm90SWQodikge1xuICAgICAgICByZXR1cm4gIXY7XG4gICAgfVxuXG4gICAgLy8gZ2xvYmFsIG9uIHRoZSBzZXJ2ZXIsIHdpbmRvdyBpbiB0aGUgYnJvd3NlclxuICAgIHZhciBwcmV2aW91c19hc3luYztcblxuICAgIC8vIEVzdGFibGlzaCB0aGUgcm9vdCBvYmplY3QsIGB3aW5kb3dgIChgc2VsZmApIGluIHRoZSBicm93c2VyLCBgZ2xvYmFsYFxuICAgIC8vIG9uIHRoZSBzZXJ2ZXIsIG9yIGB0aGlzYCBpbiBzb21lIHZpcnR1YWwgbWFjaGluZXMuIFdlIHVzZSBgc2VsZmBcbiAgICAvLyBpbnN0ZWFkIG9mIGB3aW5kb3dgIGZvciBgV2ViV29ya2VyYCBzdXBwb3J0LlxuICAgIHZhciByb290ID0gdHlwZW9mIHNlbGYgPT09ICdvYmplY3QnICYmIHNlbGYuc2VsZiA9PT0gc2VsZiAmJiBzZWxmIHx8XG4gICAgICAgICAgICB0eXBlb2YgZ2xvYmFsID09PSAnb2JqZWN0JyAmJiBnbG9iYWwuZ2xvYmFsID09PSBnbG9iYWwgJiYgZ2xvYmFsIHx8XG4gICAgICAgICAgICB0aGlzO1xuXG4gICAgaWYgKHJvb3QgIT0gbnVsbCkge1xuICAgICAgICBwcmV2aW91c19hc3luYyA9IHJvb3QuYXN5bmM7XG4gICAgfVxuXG4gICAgYXN5bmMubm9Db25mbGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcm9vdC5hc3luYyA9IHByZXZpb3VzX2FzeW5jO1xuICAgICAgICByZXR1cm4gYXN5bmM7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIG9ubHlfb25jZShmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoZm4gPT09IG51bGwpIHRocm93IG5ldyBFcnJvcihcIkNhbGxiYWNrIHdhcyBhbHJlYWR5IGNhbGxlZC5cIik7XG4gICAgICAgICAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgZm4gPSBudWxsO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9vbmNlKGZuKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChmbiA9PT0gbnVsbCkgcmV0dXJuO1xuICAgICAgICAgICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGZuID0gbnVsbDtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLy8vIGNyb3NzLWJyb3dzZXIgY29tcGF0aWJsaXR5IGZ1bmN0aW9ucyAvLy8vXG5cbiAgICB2YXIgX3RvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxuICAgIHZhciBfaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKG9iaikge1xuICAgICAgICByZXR1cm4gX3RvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgICB9O1xuXG4gICAgLy8gUG9ydGVkIGZyb20gdW5kZXJzY29yZS5qcyBpc09iamVjdFxuICAgIHZhciBfaXNPYmplY3QgPSBmdW5jdGlvbihvYmopIHtcbiAgICAgICAgdmFyIHR5cGUgPSB0eXBlb2Ygb2JqO1xuICAgICAgICByZXR1cm4gdHlwZSA9PT0gJ2Z1bmN0aW9uJyB8fCB0eXBlID09PSAnb2JqZWN0JyAmJiAhIW9iajtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gX2lzQXJyYXlMaWtlKGFycikge1xuICAgICAgICByZXR1cm4gX2lzQXJyYXkoYXJyKSB8fCAoXG4gICAgICAgICAgICAvLyBoYXMgYSBwb3NpdGl2ZSBpbnRlZ2VyIGxlbmd0aCBwcm9wZXJ0eVxuICAgICAgICAgICAgdHlwZW9mIGFyci5sZW5ndGggPT09IFwibnVtYmVyXCIgJiZcbiAgICAgICAgICAgIGFyci5sZW5ndGggPj0gMCAmJlxuICAgICAgICAgICAgYXJyLmxlbmd0aCAlIDEgPT09IDBcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfYXJyYXlFYWNoKGFyciwgaXRlcmF0b3IpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgICAgICBsZW5ndGggPSBhcnIubGVuZ3RoO1xuXG4gICAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICBpdGVyYXRvcihhcnJbaW5kZXhdLCBpbmRleCwgYXJyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9tYXAoYXJyLCBpdGVyYXRvcikge1xuICAgICAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgICAgIGxlbmd0aCA9IGFyci5sZW5ndGgsXG4gICAgICAgICAgICByZXN1bHQgPSBBcnJheShsZW5ndGgpO1xuXG4gICAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICByZXN1bHRbaW5kZXhdID0gaXRlcmF0b3IoYXJyW2luZGV4XSwgaW5kZXgsIGFycik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfcmFuZ2UoY291bnQpIHtcbiAgICAgICAgcmV0dXJuIF9tYXAoQXJyYXkoY291bnQpLCBmdW5jdGlvbiAodiwgaSkgeyByZXR1cm4gaTsgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3JlZHVjZShhcnIsIGl0ZXJhdG9yLCBtZW1vKSB7XG4gICAgICAgIF9hcnJheUVhY2goYXJyLCBmdW5jdGlvbiAoeCwgaSwgYSkge1xuICAgICAgICAgICAgbWVtbyA9IGl0ZXJhdG9yKG1lbW8sIHgsIGksIGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG1lbW87XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2ZvckVhY2hPZihvYmplY3QsIGl0ZXJhdG9yKSB7XG4gICAgICAgIF9hcnJheUVhY2goX2tleXMob2JqZWN0KSwgZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgaXRlcmF0b3Iob2JqZWN0W2tleV0sIGtleSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9pbmRleE9mKGFyciwgaXRlbSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGFycltpXSA9PT0gaXRlbSkgcmV0dXJuIGk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIH1cblxuICAgIHZhciBfa2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgdmFyIGtleXMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgayBpbiBvYmopIHtcbiAgICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoaykpIHtcbiAgICAgICAgICAgICAgICBrZXlzLnB1c2goayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGtleXM7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIF9rZXlJdGVyYXRvcihjb2xsKSB7XG4gICAgICAgIHZhciBpID0gLTE7XG4gICAgICAgIHZhciBsZW47XG4gICAgICAgIHZhciBrZXlzO1xuICAgICAgICBpZiAoX2lzQXJyYXlMaWtlKGNvbGwpKSB7XG4gICAgICAgICAgICBsZW4gPSBjb2xsLmxlbmd0aDtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0KCkge1xuICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICByZXR1cm4gaSA8IGxlbiA/IGkgOiBudWxsO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGtleXMgPSBfa2V5cyhjb2xsKTtcbiAgICAgICAgICAgIGxlbiA9IGtleXMubGVuZ3RoO1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHQoKSB7XG4gICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIHJldHVybiBpIDwgbGVuID8ga2V5c1tpXSA6IG51bGw7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gU2ltaWxhciB0byBFUzYncyByZXN0IHBhcmFtIChodHRwOi8vYXJpeWEub2ZpbGFicy5jb20vMjAxMy8wMy9lczYtYW5kLXJlc3QtcGFyYW1ldGVyLmh0bWwpXG4gICAgLy8gVGhpcyBhY2N1bXVsYXRlcyB0aGUgYXJndW1lbnRzIHBhc3NlZCBpbnRvIGFuIGFycmF5LCBhZnRlciBhIGdpdmVuIGluZGV4LlxuICAgIC8vIEZyb20gdW5kZXJzY29yZS5qcyAoaHR0cHM6Ly9naXRodWIuY29tL2phc2hrZW5hcy91bmRlcnNjb3JlL3B1bGwvMjE0MCkuXG4gICAgZnVuY3Rpb24gX3Jlc3RQYXJhbShmdW5jLCBzdGFydEluZGV4KSB7XG4gICAgICAgIHN0YXJ0SW5kZXggPSBzdGFydEluZGV4ID09IG51bGwgPyBmdW5jLmxlbmd0aCAtIDEgOiArc3RhcnRJbmRleDtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGxlbmd0aCA9IE1hdGgubWF4KGFyZ3VtZW50cy5sZW5ndGggLSBzdGFydEluZGV4LCAwKTtcbiAgICAgICAgICAgIHZhciByZXN0ID0gQXJyYXkobGVuZ3RoKTtcbiAgICAgICAgICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgICAgICByZXN0W2luZGV4XSA9IGFyZ3VtZW50c1tpbmRleCArIHN0YXJ0SW5kZXhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3dpdGNoIChzdGFydEluZGV4KSB7XG4gICAgICAgICAgICAgICAgY2FzZSAwOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIHJlc3QpO1xuICAgICAgICAgICAgICAgIGNhc2UgMTogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCBhcmd1bWVudHNbMF0sIHJlc3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gQ3VycmVudGx5IHVudXNlZCBidXQgaGFuZGxlIGNhc2VzIG91dHNpZGUgb2YgdGhlIHN3aXRjaCBzdGF0ZW1lbnQ6XG4gICAgICAgICAgICAvLyB2YXIgYXJncyA9IEFycmF5KHN0YXJ0SW5kZXggKyAxKTtcbiAgICAgICAgICAgIC8vIGZvciAoaW5kZXggPSAwOyBpbmRleCA8IHN0YXJ0SW5kZXg7IGluZGV4KyspIHtcbiAgICAgICAgICAgIC8vICAgICBhcmdzW2luZGV4XSA9IGFyZ3VtZW50c1tpbmRleF07XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAvLyBhcmdzW3N0YXJ0SW5kZXhdID0gcmVzdDtcbiAgICAgICAgICAgIC8vIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF93aXRob3V0SW5kZXgoaXRlcmF0b3IpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gaXRlcmF0b3IodmFsdWUsIGNhbGxiYWNrKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLy8vIGV4cG9ydGVkIGFzeW5jIG1vZHVsZSBmdW5jdGlvbnMgLy8vL1xuXG4gICAgLy8vLyBuZXh0VGljayBpbXBsZW1lbnRhdGlvbiB3aXRoIGJyb3dzZXItY29tcGF0aWJsZSBmYWxsYmFjayAvLy8vXG5cbiAgICAvLyBjYXB0dXJlIHRoZSBnbG9iYWwgcmVmZXJlbmNlIHRvIGd1YXJkIGFnYWluc3QgZmFrZVRpbWVyIG1vY2tzXG4gICAgdmFyIF9zZXRJbW1lZGlhdGUgPSB0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSAnZnVuY3Rpb24nICYmIHNldEltbWVkaWF0ZTtcblxuICAgIHZhciBfZGVsYXkgPSBfc2V0SW1tZWRpYXRlID8gZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgLy8gbm90IGEgZGlyZWN0IGFsaWFzIGZvciBJRTEwIGNvbXBhdGliaWxpdHlcbiAgICAgICAgX3NldEltbWVkaWF0ZShmbik7XG4gICAgfSA6IGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG5cbiAgICBpZiAodHlwZW9mIHByb2Nlc3MgPT09ICdvYmplY3QnICYmIHR5cGVvZiBwcm9jZXNzLm5leHRUaWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGFzeW5jLm5leHRUaWNrID0gcHJvY2Vzcy5uZXh0VGljaztcbiAgICB9IGVsc2Uge1xuICAgICAgICBhc3luYy5uZXh0VGljayA9IF9kZWxheTtcbiAgICB9XG4gICAgYXN5bmMuc2V0SW1tZWRpYXRlID0gX3NldEltbWVkaWF0ZSA/IF9kZWxheSA6IGFzeW5jLm5leHRUaWNrO1xuXG5cbiAgICBhc3luYy5mb3JFYWNoID1cbiAgICBhc3luYy5lYWNoID0gZnVuY3Rpb24gKGFyciwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiBhc3luYy5lYWNoT2YoYXJyLCBfd2l0aG91dEluZGV4KGl0ZXJhdG9yKSwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy5mb3JFYWNoU2VyaWVzID1cbiAgICBhc3luYy5lYWNoU2VyaWVzID0gZnVuY3Rpb24gKGFyciwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiBhc3luYy5lYWNoT2ZTZXJpZXMoYXJyLCBfd2l0aG91dEluZGV4KGl0ZXJhdG9yKSwgY2FsbGJhY2spO1xuICAgIH07XG5cblxuICAgIGFzeW5jLmZvckVhY2hMaW1pdCA9XG4gICAgYXN5bmMuZWFjaExpbWl0ID0gZnVuY3Rpb24gKGFyciwgbGltaXQsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gX2VhY2hPZkxpbWl0KGxpbWl0KShhcnIsIF93aXRob3V0SW5kZXgoaXRlcmF0b3IpLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLmZvckVhY2hPZiA9XG4gICAgYXN5bmMuZWFjaE9mID0gZnVuY3Rpb24gKG9iamVjdCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gX29uY2UoY2FsbGJhY2sgfHwgbm9vcCk7XG4gICAgICAgIG9iamVjdCA9IG9iamVjdCB8fCBbXTtcblxuICAgICAgICB2YXIgaXRlciA9IF9rZXlJdGVyYXRvcihvYmplY3QpO1xuICAgICAgICB2YXIga2V5LCBjb21wbGV0ZWQgPSAwO1xuXG4gICAgICAgIHdoaWxlICgoa2V5ID0gaXRlcigpKSAhPSBudWxsKSB7XG4gICAgICAgICAgICBjb21wbGV0ZWQgKz0gMTtcbiAgICAgICAgICAgIGl0ZXJhdG9yKG9iamVjdFtrZXldLCBrZXksIG9ubHlfb25jZShkb25lKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29tcGxldGVkID09PSAwKSBjYWxsYmFjayhudWxsKTtcblxuICAgICAgICBmdW5jdGlvbiBkb25lKGVycikge1xuICAgICAgICAgICAgY29tcGxldGVkLS07XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIENoZWNrIGtleSBpcyBudWxsIGluIGNhc2UgaXRlcmF0b3IgaXNuJ3QgZXhoYXVzdGVkXG4gICAgICAgICAgICAvLyBhbmQgZG9uZSByZXNvbHZlZCBzeW5jaHJvbm91c2x5LlxuICAgICAgICAgICAgZWxzZSBpZiAoa2V5ID09PSBudWxsICYmIGNvbXBsZXRlZCA8PSAwKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgYXN5bmMuZm9yRWFjaE9mU2VyaWVzID1cbiAgICBhc3luYy5lYWNoT2ZTZXJpZXMgPSBmdW5jdGlvbiAob2JqLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sgPSBfb25jZShjYWxsYmFjayB8fCBub29wKTtcbiAgICAgICAgb2JqID0gb2JqIHx8IFtdO1xuICAgICAgICB2YXIgbmV4dEtleSA9IF9rZXlJdGVyYXRvcihvYmopO1xuICAgICAgICB2YXIga2V5ID0gbmV4dEtleSgpO1xuICAgICAgICBmdW5jdGlvbiBpdGVyYXRlKCkge1xuICAgICAgICAgICAgdmFyIHN5bmMgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKGtleSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGl0ZXJhdG9yKG9ialtrZXldLCBrZXksIG9ubHlfb25jZShmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAga2V5ID0gbmV4dEtleSgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3luYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzeW5jLnNldEltbWVkaWF0ZShpdGVyYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlcmF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgc3luYyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGl0ZXJhdGUoKTtcbiAgICB9O1xuXG5cblxuICAgIGFzeW5jLmZvckVhY2hPZkxpbWl0ID1cbiAgICBhc3luYy5lYWNoT2ZMaW1pdCA9IGZ1bmN0aW9uIChvYmosIGxpbWl0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgX2VhY2hPZkxpbWl0KGxpbWl0KShvYmosIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIF9lYWNoT2ZMaW1pdChsaW1pdCkge1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAob2JqLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gX29uY2UoY2FsbGJhY2sgfHwgbm9vcCk7XG4gICAgICAgICAgICBvYmogPSBvYmogfHwgW107XG4gICAgICAgICAgICB2YXIgbmV4dEtleSA9IF9rZXlJdGVyYXRvcihvYmopO1xuICAgICAgICAgICAgaWYgKGxpbWl0IDw9IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgZG9uZSA9IGZhbHNlO1xuICAgICAgICAgICAgdmFyIHJ1bm5pbmcgPSAwO1xuICAgICAgICAgICAgdmFyIGVycm9yZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgKGZ1bmN0aW9uIHJlcGxlbmlzaCAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRvbmUgJiYgcnVubmluZyA8PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB3aGlsZSAocnVubmluZyA8IGxpbWl0ICYmICFlcnJvcmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBrZXkgPSBuZXh0S2V5KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvbmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJ1bm5pbmcgPD0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJ1bm5pbmcgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgaXRlcmF0b3Iob2JqW2tleV0sIGtleSwgb25seV9vbmNlKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bm5pbmcgLT0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVwbGVuaXNoKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSgpO1xuICAgICAgICB9O1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gZG9QYXJhbGxlbChmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9iaiwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gZm4oYXN5bmMuZWFjaE9mLCBvYmosIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGRvUGFyYWxsZWxMaW1pdChmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9iaiwgbGltaXQsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGZuKF9lYWNoT2ZMaW1pdChsaW1pdCksIG9iaiwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZG9TZXJpZXMoZm4pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChvYmosIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGZuKGFzeW5jLmVhY2hPZlNlcmllcywgb2JqLCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9hc3luY01hcChlYWNoZm4sIGFyciwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gX29uY2UoY2FsbGJhY2sgfHwgbm9vcCk7XG4gICAgICAgIGFyciA9IGFyciB8fCBbXTtcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBfaXNBcnJheUxpa2UoYXJyKSA/IFtdIDoge307XG4gICAgICAgIGVhY2hmbihhcnIsIGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpdGVyYXRvcih2YWx1ZSwgZnVuY3Rpb24gKGVyciwgdikge1xuICAgICAgICAgICAgICAgIHJlc3VsdHNbaW5kZXhdID0gdjtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgcmVzdWx0cyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jLm1hcCA9IGRvUGFyYWxsZWwoX2FzeW5jTWFwKTtcbiAgICBhc3luYy5tYXBTZXJpZXMgPSBkb1NlcmllcyhfYXN5bmNNYXApO1xuICAgIGFzeW5jLm1hcExpbWl0ID0gZG9QYXJhbGxlbExpbWl0KF9hc3luY01hcCk7XG5cbiAgICAvLyByZWR1Y2Ugb25seSBoYXMgYSBzZXJpZXMgdmVyc2lvbiwgYXMgZG9pbmcgcmVkdWNlIGluIHBhcmFsbGVsIHdvbid0XG4gICAgLy8gd29yayBpbiBtYW55IHNpdHVhdGlvbnMuXG4gICAgYXN5bmMuaW5qZWN0ID1cbiAgICBhc3luYy5mb2xkbCA9XG4gICAgYXN5bmMucmVkdWNlID0gZnVuY3Rpb24gKGFyciwgbWVtbywgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGFzeW5jLmVhY2hPZlNlcmllcyhhcnIsIGZ1bmN0aW9uICh4LCBpLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgaXRlcmF0b3IobWVtbywgeCwgZnVuY3Rpb24gKGVyciwgdikge1xuICAgICAgICAgICAgICAgIG1lbW8gPSB2O1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgY2FsbGJhY2soZXJyLCBtZW1vKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGFzeW5jLmZvbGRyID1cbiAgICBhc3luYy5yZWR1Y2VSaWdodCA9IGZ1bmN0aW9uIChhcnIsIG1lbW8sIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgcmV2ZXJzZWQgPSBfbWFwKGFyciwgaWRlbnRpdHkpLnJldmVyc2UoKTtcbiAgICAgICAgYXN5bmMucmVkdWNlKHJldmVyc2VkLCBtZW1vLCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy50cmFuc2Zvcm0gPSBmdW5jdGlvbiAoYXJyLCBtZW1vLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDMpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gaXRlcmF0b3I7XG4gICAgICAgICAgICBpdGVyYXRvciA9IG1lbW87XG4gICAgICAgICAgICBtZW1vID0gX2lzQXJyYXkoYXJyKSA/IFtdIDoge307XG4gICAgICAgIH1cblxuICAgICAgICBhc3luYy5lYWNoT2YoYXJyLCBmdW5jdGlvbih2LCBrLCBjYikge1xuICAgICAgICAgICAgaXRlcmF0b3IobWVtbywgdiwgaywgY2IpO1xuICAgICAgICB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgbWVtbyk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBfZmlsdGVyKGVhY2hmbiwgYXJyLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgZWFjaGZuKGFyciwgZnVuY3Rpb24gKHgsIGluZGV4LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgaXRlcmF0b3IoeCwgZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgICAgICBpZiAodikge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goe2luZGV4OiBpbmRleCwgdmFsdWU6IHh9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhfbWFwKHJlc3VsdHMuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgICAgIHJldHVybiBhLmluZGV4IC0gYi5pbmRleDtcbiAgICAgICAgICAgIH0pLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB4LnZhbHVlO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYy5zZWxlY3QgPVxuICAgIGFzeW5jLmZpbHRlciA9IGRvUGFyYWxsZWwoX2ZpbHRlcik7XG5cbiAgICBhc3luYy5zZWxlY3RMaW1pdCA9XG4gICAgYXN5bmMuZmlsdGVyTGltaXQgPSBkb1BhcmFsbGVsTGltaXQoX2ZpbHRlcik7XG5cbiAgICBhc3luYy5zZWxlY3RTZXJpZXMgPVxuICAgIGFzeW5jLmZpbHRlclNlcmllcyA9IGRvU2VyaWVzKF9maWx0ZXIpO1xuXG4gICAgZnVuY3Rpb24gX3JlamVjdChlYWNoZm4sIGFyciwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIF9maWx0ZXIoZWFjaGZuLCBhcnIsIGZ1bmN0aW9uKHZhbHVlLCBjYikge1xuICAgICAgICAgICAgaXRlcmF0b3IodmFsdWUsIGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICAgICAgICBjYighdik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgY2FsbGJhY2spO1xuICAgIH1cbiAgICBhc3luYy5yZWplY3QgPSBkb1BhcmFsbGVsKF9yZWplY3QpO1xuICAgIGFzeW5jLnJlamVjdExpbWl0ID0gZG9QYXJhbGxlbExpbWl0KF9yZWplY3QpO1xuICAgIGFzeW5jLnJlamVjdFNlcmllcyA9IGRvU2VyaWVzKF9yZWplY3QpO1xuXG4gICAgZnVuY3Rpb24gX2NyZWF0ZVRlc3RlcihlYWNoZm4sIGNoZWNrLCBnZXRSZXN1bHQpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGFyciwgbGltaXQsIGl0ZXJhdG9yLCBjYikge1xuICAgICAgICAgICAgZnVuY3Rpb24gZG9uZSgpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2IpIGNiKGdldFJlc3VsdChmYWxzZSwgdm9pZCAwKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmdW5jdGlvbiBpdGVyYXRlZSh4LCBfLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGlmICghY2IpIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIGl0ZXJhdG9yKHgsIGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYiAmJiBjaGVjayh2KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2IoZ2V0UmVzdWx0KHRydWUsIHgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNiID0gaXRlcmF0b3IgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAzKSB7XG4gICAgICAgICAgICAgICAgZWFjaGZuKGFyciwgbGltaXQsIGl0ZXJhdGVlLCBkb25lKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2IgPSBpdGVyYXRvcjtcbiAgICAgICAgICAgICAgICBpdGVyYXRvciA9IGxpbWl0O1xuICAgICAgICAgICAgICAgIGVhY2hmbihhcnIsIGl0ZXJhdGVlLCBkb25lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhc3luYy5hbnkgPVxuICAgIGFzeW5jLnNvbWUgPSBfY3JlYXRlVGVzdGVyKGFzeW5jLmVhY2hPZiwgdG9Cb29sLCBpZGVudGl0eSk7XG5cbiAgICBhc3luYy5zb21lTGltaXQgPSBfY3JlYXRlVGVzdGVyKGFzeW5jLmVhY2hPZkxpbWl0LCB0b0Jvb2wsIGlkZW50aXR5KTtcblxuICAgIGFzeW5jLmFsbCA9XG4gICAgYXN5bmMuZXZlcnkgPSBfY3JlYXRlVGVzdGVyKGFzeW5jLmVhY2hPZiwgbm90SWQsIG5vdElkKTtcblxuICAgIGFzeW5jLmV2ZXJ5TGltaXQgPSBfY3JlYXRlVGVzdGVyKGFzeW5jLmVhY2hPZkxpbWl0LCBub3RJZCwgbm90SWQpO1xuXG4gICAgZnVuY3Rpb24gX2ZpbmRHZXRSZXN1bHQodiwgeCkge1xuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gICAgYXN5bmMuZGV0ZWN0ID0gX2NyZWF0ZVRlc3Rlcihhc3luYy5lYWNoT2YsIGlkZW50aXR5LCBfZmluZEdldFJlc3VsdCk7XG4gICAgYXN5bmMuZGV0ZWN0U2VyaWVzID0gX2NyZWF0ZVRlc3Rlcihhc3luYy5lYWNoT2ZTZXJpZXMsIGlkZW50aXR5LCBfZmluZEdldFJlc3VsdCk7XG4gICAgYXN5bmMuZGV0ZWN0TGltaXQgPSBfY3JlYXRlVGVzdGVyKGFzeW5jLmVhY2hPZkxpbWl0LCBpZGVudGl0eSwgX2ZpbmRHZXRSZXN1bHQpO1xuXG4gICAgYXN5bmMuc29ydEJ5ID0gZnVuY3Rpb24gKGFyciwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGFzeW5jLm1hcChhcnIsIGZ1bmN0aW9uICh4LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgaXRlcmF0b3IoeCwgZnVuY3Rpb24gKGVyciwgY3JpdGVyaWEpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCB7dmFsdWU6IHgsIGNyaXRlcmlhOiBjcml0ZXJpYX0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyLCByZXN1bHRzKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCBfbWFwKHJlc3VsdHMuc29ydChjb21wYXJhdG9yKSwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHgudmFsdWU7XG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGZ1bmN0aW9uIGNvbXBhcmF0b3IobGVmdCwgcmlnaHQpIHtcbiAgICAgICAgICAgIHZhciBhID0gbGVmdC5jcml0ZXJpYSwgYiA9IHJpZ2h0LmNyaXRlcmlhO1xuICAgICAgICAgICAgcmV0dXJuIGEgPCBiID8gLTEgOiBhID4gYiA/IDEgOiAwO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGFzeW5jLmF1dG8gPSBmdW5jdGlvbiAodGFza3MsIGNvbmN1cnJlbmN5LCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGFyZ3VtZW50c1sxXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgLy8gY29uY3VycmVuY3kgaXMgb3B0aW9uYWwsIHNoaWZ0IHRoZSBhcmdzLlxuICAgICAgICAgICAgY2FsbGJhY2sgPSBjb25jdXJyZW5jeTtcbiAgICAgICAgICAgIGNvbmN1cnJlbmN5ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjayA9IF9vbmNlKGNhbGxiYWNrIHx8IG5vb3ApO1xuICAgICAgICB2YXIga2V5cyA9IF9rZXlzKHRhc2tzKTtcbiAgICAgICAgdmFyIHJlbWFpbmluZ1Rhc2tzID0ga2V5cy5sZW5ndGg7XG4gICAgICAgIGlmICghcmVtYWluaW5nVGFza3MpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWNvbmN1cnJlbmN5KSB7XG4gICAgICAgICAgICBjb25jdXJyZW5jeSA9IHJlbWFpbmluZ1Rhc2tzO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJlc3VsdHMgPSB7fTtcbiAgICAgICAgdmFyIHJ1bm5pbmdUYXNrcyA9IDA7XG5cbiAgICAgICAgdmFyIGhhc0Vycm9yID0gZmFsc2U7XG5cbiAgICAgICAgdmFyIGxpc3RlbmVycyA9IFtdO1xuICAgICAgICBmdW5jdGlvbiBhZGRMaXN0ZW5lcihmbikge1xuICAgICAgICAgICAgbGlzdGVuZXJzLnVuc2hpZnQoZm4pO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKGZuKSB7XG4gICAgICAgICAgICB2YXIgaWR4ID0gX2luZGV4T2YobGlzdGVuZXJzLCBmbik7XG4gICAgICAgICAgICBpZiAoaWR4ID49IDApIGxpc3RlbmVycy5zcGxpY2UoaWR4LCAxKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiB0YXNrQ29tcGxldGUoKSB7XG4gICAgICAgICAgICByZW1haW5pbmdUYXNrcy0tO1xuICAgICAgICAgICAgX2FycmF5RWFjaChsaXN0ZW5lcnMuc2xpY2UoMCksIGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFkZExpc3RlbmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghcmVtYWluaW5nVGFza3MpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgX2FycmF5RWFjaChrZXlzLCBmdW5jdGlvbiAoaykge1xuICAgICAgICAgICAgaWYgKGhhc0Vycm9yKSByZXR1cm47XG4gICAgICAgICAgICB2YXIgdGFzayA9IF9pc0FycmF5KHRhc2tzW2tdKSA/IHRhc2tzW2tdOiBbdGFza3Nba11dO1xuICAgICAgICAgICAgdmFyIHRhc2tDYWxsYmFjayA9IF9yZXN0UGFyYW0oZnVuY3Rpb24oZXJyLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcnVubmluZ1Rhc2tzLS07XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoIDw9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgYXJncyA9IGFyZ3NbMF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNhZmVSZXN1bHRzID0ge307XG4gICAgICAgICAgICAgICAgICAgIF9mb3JFYWNoT2YocmVzdWx0cywgZnVuY3Rpb24odmFsLCBya2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzYWZlUmVzdWx0c1tya2V5XSA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHNhZmVSZXN1bHRzW2tdID0gYXJncztcbiAgICAgICAgICAgICAgICAgICAgaGFzRXJyb3IgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgc2FmZVJlc3VsdHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0c1trXSA9IGFyZ3M7XG4gICAgICAgICAgICAgICAgICAgIGFzeW5jLnNldEltbWVkaWF0ZSh0YXNrQ29tcGxldGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdmFyIHJlcXVpcmVzID0gdGFzay5zbGljZSgwLCB0YXNrLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgLy8gcHJldmVudCBkZWFkLWxvY2tzXG4gICAgICAgICAgICB2YXIgbGVuID0gcmVxdWlyZXMubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIGRlcDtcbiAgICAgICAgICAgIHdoaWxlIChsZW4tLSkge1xuICAgICAgICAgICAgICAgIGlmICghKGRlcCA9IHRhc2tzW3JlcXVpcmVzW2xlbl1dKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0hhcyBpbmV4aXN0YW50IGRlcGVuZGVuY3knKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKF9pc0FycmF5KGRlcCkgJiYgX2luZGV4T2YoZGVwLCBrKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSGFzIGN5Y2xpYyBkZXBlbmRlbmNpZXMnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmdW5jdGlvbiByZWFkeSgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcnVubmluZ1Rhc2tzIDwgY29uY3VycmVuY3kgJiYgX3JlZHVjZShyZXF1aXJlcywgZnVuY3Rpb24gKGEsIHgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChhICYmIHJlc3VsdHMuaGFzT3duUHJvcGVydHkoeCkpO1xuICAgICAgICAgICAgICAgIH0sIHRydWUpICYmICFyZXN1bHRzLmhhc093blByb3BlcnR5KGspO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlYWR5KCkpIHtcbiAgICAgICAgICAgICAgICBydW5uaW5nVGFza3MrKztcbiAgICAgICAgICAgICAgICB0YXNrW3Rhc2subGVuZ3RoIC0gMV0odGFza0NhbGxiYWNrLCByZXN1bHRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZ1bmN0aW9uIGxpc3RlbmVyKCkge1xuICAgICAgICAgICAgICAgIGlmIChyZWFkeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJ1bm5pbmdUYXNrcysrO1xuICAgICAgICAgICAgICAgICAgICByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgICAgIHRhc2tbdGFzay5sZW5ndGggLSAxXSh0YXNrQ2FsbGJhY2ssIHJlc3VsdHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuXG5cbiAgICBhc3luYy5yZXRyeSA9IGZ1bmN0aW9uKHRpbWVzLCB0YXNrLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgREVGQVVMVF9USU1FUyA9IDU7XG4gICAgICAgIHZhciBERUZBVUxUX0lOVEVSVkFMID0gMDtcblxuICAgICAgICB2YXIgYXR0ZW1wdHMgPSBbXTtcblxuICAgICAgICB2YXIgb3B0cyA9IHtcbiAgICAgICAgICAgIHRpbWVzOiBERUZBVUxUX1RJTUVTLFxuICAgICAgICAgICAgaW50ZXJ2YWw6IERFRkFVTFRfSU5URVJWQUxcbiAgICAgICAgfTtcblxuICAgICAgICBmdW5jdGlvbiBwYXJzZVRpbWVzKGFjYywgdCl7XG4gICAgICAgICAgICBpZih0eXBlb2YgdCA9PT0gJ251bWJlcicpe1xuICAgICAgICAgICAgICAgIGFjYy50aW1lcyA9IHBhcnNlSW50KHQsIDEwKSB8fCBERUZBVUxUX1RJTUVTO1xuICAgICAgICAgICAgfSBlbHNlIGlmKHR5cGVvZiB0ID09PSAnb2JqZWN0Jyl7XG4gICAgICAgICAgICAgICAgYWNjLnRpbWVzID0gcGFyc2VJbnQodC50aW1lcywgMTApIHx8IERFRkFVTFRfVElNRVM7XG4gICAgICAgICAgICAgICAgYWNjLmludGVydmFsID0gcGFyc2VJbnQodC5pbnRlcnZhbCwgMTApIHx8IERFRkFVTFRfSU5URVJWQUw7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5zdXBwb3J0ZWQgYXJndW1lbnQgdHlwZSBmb3IgXFwndGltZXNcXCc6ICcgKyB0eXBlb2YgdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgaWYgKGxlbmd0aCA8IDEgfHwgbGVuZ3RoID4gMykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGFyZ3VtZW50cyAtIG11c3QgYmUgZWl0aGVyICh0YXNrKSwgKHRhc2ssIGNhbGxiYWNrKSwgKHRpbWVzLCB0YXNrKSBvciAodGltZXMsIHRhc2ssIGNhbGxiYWNrKScpO1xuICAgICAgICB9IGVsc2UgaWYgKGxlbmd0aCA8PSAyICYmIHR5cGVvZiB0aW1lcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FsbGJhY2sgPSB0YXNrO1xuICAgICAgICAgICAgdGFzayA9IHRpbWVzO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgdGltZXMgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHBhcnNlVGltZXMob3B0cywgdGltZXMpO1xuICAgICAgICB9XG4gICAgICAgIG9wdHMuY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgb3B0cy50YXNrID0gdGFzaztcblxuICAgICAgICBmdW5jdGlvbiB3cmFwcGVkVGFzayh3cmFwcGVkQ2FsbGJhY2ssIHdyYXBwZWRSZXN1bHRzKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiByZXRyeUF0dGVtcHQodGFzaywgZmluYWxBdHRlbXB0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHNlcmllc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhc2soZnVuY3Rpb24oZXJyLCByZXN1bHQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VyaWVzQ2FsbGJhY2soIWVyciB8fCBmaW5hbEF0dGVtcHQsIHtlcnI6IGVyciwgcmVzdWx0OiByZXN1bHR9KTtcbiAgICAgICAgICAgICAgICAgICAgfSwgd3JhcHBlZFJlc3VsdHMpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHJldHJ5SW50ZXJ2YWwoaW50ZXJ2YWwpe1xuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbihzZXJpZXNDYWxsYmFjayl7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcmllc0NhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICB9LCBpbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgd2hpbGUgKG9wdHMudGltZXMpIHtcblxuICAgICAgICAgICAgICAgIHZhciBmaW5hbEF0dGVtcHQgPSAhKG9wdHMudGltZXMtPTEpO1xuICAgICAgICAgICAgICAgIGF0dGVtcHRzLnB1c2gocmV0cnlBdHRlbXB0KG9wdHMudGFzaywgZmluYWxBdHRlbXB0KSk7XG4gICAgICAgICAgICAgICAgaWYoIWZpbmFsQXR0ZW1wdCAmJiBvcHRzLmludGVydmFsID4gMCl7XG4gICAgICAgICAgICAgICAgICAgIGF0dGVtcHRzLnB1c2gocmV0cnlJbnRlcnZhbChvcHRzLmludGVydmFsKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhc3luYy5zZXJpZXMoYXR0ZW1wdHMsIGZ1bmN0aW9uKGRvbmUsIGRhdGEpe1xuICAgICAgICAgICAgICAgIGRhdGEgPSBkYXRhW2RhdGEubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgKHdyYXBwZWRDYWxsYmFjayB8fCBvcHRzLmNhbGxiYWNrKShkYXRhLmVyciwgZGF0YS5yZXN1bHQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBhIGNhbGxiYWNrIGlzIHBhc3NlZCwgcnVuIHRoaXMgYXMgYSBjb250cm9sbCBmbG93XG4gICAgICAgIHJldHVybiBvcHRzLmNhbGxiYWNrID8gd3JhcHBlZFRhc2soKSA6IHdyYXBwZWRUYXNrO1xuICAgIH07XG5cbiAgICBhc3luYy53YXRlcmZhbGwgPSBmdW5jdGlvbiAodGFza3MsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gX29uY2UoY2FsbGJhY2sgfHwgbm9vcCk7XG4gICAgICAgIGlmICghX2lzQXJyYXkodGFza3MpKSB7XG4gICAgICAgICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdGaXJzdCBhcmd1bWVudCB0byB3YXRlcmZhbGwgbXVzdCBiZSBhbiBhcnJheSBvZiBmdW5jdGlvbnMnKTtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGFza3MubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiB3cmFwSXRlcmF0b3IoaXRlcmF0b3IpIHtcbiAgICAgICAgICAgIHJldHVybiBfcmVzdFBhcmFtKGZ1bmN0aW9uIChlcnIsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIFtlcnJdLmNvbmNhdChhcmdzKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmV4dCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5leHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MucHVzaCh3cmFwSXRlcmF0b3IobmV4dCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJncy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbnN1cmVBc3luYyhpdGVyYXRvcikuYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgd3JhcEl0ZXJhdG9yKGFzeW5jLml0ZXJhdG9yKHRhc2tzKSkoKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gX3BhcmFsbGVsKGVhY2hmbiwgdGFza3MsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgbm9vcDtcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBfaXNBcnJheUxpa2UodGFza3MpID8gW10gOiB7fTtcblxuICAgICAgICBlYWNoZm4odGFza3MsIGZ1bmN0aW9uICh0YXNrLCBrZXksIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICB0YXNrKF9yZXN0UGFyYW0oZnVuY3Rpb24gKGVyciwgYXJncykge1xuICAgICAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA8PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXN1bHRzW2tleV0gPSBhcmdzO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgcmVzdWx0cyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jLnBhcmFsbGVsID0gZnVuY3Rpb24gKHRhc2tzLCBjYWxsYmFjaykge1xuICAgICAgICBfcGFyYWxsZWwoYXN5bmMuZWFjaE9mLCB0YXNrcywgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy5wYXJhbGxlbExpbWl0ID0gZnVuY3Rpb24odGFza3MsIGxpbWl0LCBjYWxsYmFjaykge1xuICAgICAgICBfcGFyYWxsZWwoX2VhY2hPZkxpbWl0KGxpbWl0KSwgdGFza3MsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMuc2VyaWVzID0gZnVuY3Rpb24odGFza3MsIGNhbGxiYWNrKSB7XG4gICAgICAgIF9wYXJhbGxlbChhc3luYy5lYWNoT2ZTZXJpZXMsIHRhc2tzLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLml0ZXJhdG9yID0gZnVuY3Rpb24gKHRhc2tzKSB7XG4gICAgICAgIGZ1bmN0aW9uIG1ha2VDYWxsYmFjayhpbmRleCkge1xuICAgICAgICAgICAgZnVuY3Rpb24gZm4oKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRhc2tzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB0YXNrc1tpbmRleF0uYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLm5leHQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZuLm5leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChpbmRleCA8IHRhc2tzLmxlbmd0aCAtIDEpID8gbWFrZUNhbGxiYWNrKGluZGV4ICsgMSk6IG51bGw7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIGZuO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYWtlQ2FsbGJhY2soMCk7XG4gICAgfTtcblxuICAgIGFzeW5jLmFwcGx5ID0gX3Jlc3RQYXJhbShmdW5jdGlvbiAoZm4sIGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIF9yZXN0UGFyYW0oZnVuY3Rpb24gKGNhbGxBcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4gZm4uYXBwbHkoXG4gICAgICAgICAgICAgICAgbnVsbCwgYXJncy5jb25jYXQoY2FsbEFyZ3MpXG4gICAgICAgICAgICApO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIF9jb25jYXQoZWFjaGZuLCBhcnIsIGZuLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgIGVhY2hmbihhcnIsIGZ1bmN0aW9uICh4LCBpbmRleCwgY2IpIHtcbiAgICAgICAgICAgIGZuKHgsIGZ1bmN0aW9uIChlcnIsIHkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0KHkgfHwgW10pO1xuICAgICAgICAgICAgICAgIGNiKGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgY2FsbGJhY2soZXJyLCByZXN1bHQpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMuY29uY2F0ID0gZG9QYXJhbGxlbChfY29uY2F0KTtcbiAgICBhc3luYy5jb25jYXRTZXJpZXMgPSBkb1NlcmllcyhfY29uY2F0KTtcblxuICAgIGFzeW5jLndoaWxzdCA9IGZ1bmN0aW9uICh0ZXN0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBub29wO1xuICAgICAgICBpZiAodGVzdCgpKSB7XG4gICAgICAgICAgICB2YXIgbmV4dCA9IF9yZXN0UGFyYW0oZnVuY3Rpb24oZXJyLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGVzdC5hcHBseSh0aGlzLCBhcmdzKSkge1xuICAgICAgICAgICAgICAgICAgICBpdGVyYXRvcihuZXh0KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseShudWxsLCBbbnVsbF0uY29uY2F0KGFyZ3MpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGl0ZXJhdG9yKG5leHQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FsbGJhY2sobnVsbCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgYXN5bmMuZG9XaGlsc3QgPSBmdW5jdGlvbiAoaXRlcmF0b3IsIHRlc3QsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBjYWxscyA9IDA7XG4gICAgICAgIHJldHVybiBhc3luYy53aGlsc3QoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gKytjYWxscyA8PSAxIHx8IHRlc3QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfSwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMudW50aWwgPSBmdW5jdGlvbiAodGVzdCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiBhc3luYy53aGlsc3QoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gIXRlc3QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfSwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMuZG9VbnRpbCA9IGZ1bmN0aW9uIChpdGVyYXRvciwgdGVzdCwgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jLmRvV2hpbHN0KGl0ZXJhdG9yLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiAhdGVzdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9LCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLmR1cmluZyA9IGZ1bmN0aW9uICh0ZXN0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBub29wO1xuXG4gICAgICAgIHZhciBuZXh0ID0gX3Jlc3RQYXJhbShmdW5jdGlvbihlcnIsIGFyZ3MpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2goY2hlY2spO1xuICAgICAgICAgICAgICAgIHRlc3QuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBjaGVjayA9IGZ1bmN0aW9uKGVyciwgdHJ1dGgpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0cnV0aCkge1xuICAgICAgICAgICAgICAgIGl0ZXJhdG9yKG5leHQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB0ZXN0KGNoZWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMuZG9EdXJpbmcgPSBmdW5jdGlvbiAoaXRlcmF0b3IsIHRlc3QsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBjYWxscyA9IDA7XG4gICAgICAgIGFzeW5jLmR1cmluZyhmdW5jdGlvbihuZXh0KSB7XG4gICAgICAgICAgICBpZiAoY2FsbHMrKyA8IDEpIHtcbiAgICAgICAgICAgICAgICBuZXh0KG51bGwsIHRydWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0ZXN0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIF9xdWV1ZSh3b3JrZXIsIGNvbmN1cnJlbmN5LCBwYXlsb2FkKSB7XG4gICAgICAgIGlmIChjb25jdXJyZW5jeSA9PSBudWxsKSB7XG4gICAgICAgICAgICBjb25jdXJyZW5jeSA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZihjb25jdXJyZW5jeSA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb25jdXJyZW5jeSBtdXN0IG5vdCBiZSB6ZXJvJyk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gX2luc2VydChxLCBkYXRhLCBwb3MsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2sgIT0gbnVsbCAmJiB0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInRhc2sgY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcS5zdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmICghX2lzQXJyYXkoZGF0YSkpIHtcbiAgICAgICAgICAgICAgICBkYXRhID0gW2RhdGFdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoZGF0YS5sZW5ndGggPT09IDAgJiYgcS5pZGxlKCkpIHtcbiAgICAgICAgICAgICAgICAvLyBjYWxsIGRyYWluIGltbWVkaWF0ZWx5IGlmIHRoZXJlIGFyZSBubyB0YXNrc1xuICAgICAgICAgICAgICAgIHJldHVybiBhc3luYy5zZXRJbW1lZGlhdGUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHEuZHJhaW4oKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF9hcnJheUVhY2goZGF0YSwgZnVuY3Rpb24odGFzaykge1xuICAgICAgICAgICAgICAgIHZhciBpdGVtID0ge1xuICAgICAgICAgICAgICAgICAgICBkYXRhOiB0YXNrLFxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogY2FsbGJhY2sgfHwgbm9vcFxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBpZiAocG9zKSB7XG4gICAgICAgICAgICAgICAgICAgIHEudGFza3MudW5zaGlmdChpdGVtKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBxLnRhc2tzLnB1c2goaXRlbSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHEudGFza3MubGVuZ3RoID09PSBxLmNvbmN1cnJlbmN5KSB7XG4gICAgICAgICAgICAgICAgICAgIHEuc2F0dXJhdGVkKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUocS5wcm9jZXNzKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBfbmV4dChxLCB0YXNrcykge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgd29ya2VycyAtPSAxO1xuXG4gICAgICAgICAgICAgICAgdmFyIHJlbW92ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgICAgICBfYXJyYXlFYWNoKHRhc2tzLCBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICAgICAgICAgICAgICBfYXJyYXlFYWNoKHdvcmtlcnNMaXN0LCBmdW5jdGlvbiAod29ya2VyLCBpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdvcmtlciA9PT0gdGFzayAmJiAhcmVtb3ZlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtlcnNMaXN0LnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIHRhc2suY2FsbGJhY2suYXBwbHkodGFzaywgYXJncyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKHEudGFza3MubGVuZ3RoICsgd29ya2VycyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBxLmRyYWluKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHEucHJvY2VzcygpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB3b3JrZXJzID0gMDtcbiAgICAgICAgdmFyIHdvcmtlcnNMaXN0ID0gW107XG4gICAgICAgIHZhciBxID0ge1xuICAgICAgICAgICAgdGFza3M6IFtdLFxuICAgICAgICAgICAgY29uY3VycmVuY3k6IGNvbmN1cnJlbmN5LFxuICAgICAgICAgICAgcGF5bG9hZDogcGF5bG9hZCxcbiAgICAgICAgICAgIHNhdHVyYXRlZDogbm9vcCxcbiAgICAgICAgICAgIGVtcHR5OiBub29wLFxuICAgICAgICAgICAgZHJhaW46IG5vb3AsXG4gICAgICAgICAgICBzdGFydGVkOiBmYWxzZSxcbiAgICAgICAgICAgIHBhdXNlZDogZmFsc2UsXG4gICAgICAgICAgICBwdXNoOiBmdW5jdGlvbiAoZGF0YSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBfaW5zZXJ0KHEsIGRhdGEsIGZhbHNlLCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAga2lsbDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHEuZHJhaW4gPSBub29wO1xuICAgICAgICAgICAgICAgIHEudGFza3MgPSBbXTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1bnNoaWZ0OiBmdW5jdGlvbiAoZGF0YSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBfaW5zZXJ0KHEsIGRhdGEsIHRydWUsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgd2hpbGUoIXEucGF1c2VkICYmIHdvcmtlcnMgPCBxLmNvbmN1cnJlbmN5ICYmIHEudGFza3MubGVuZ3RoKXtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgdGFza3MgPSBxLnBheWxvYWQgP1xuICAgICAgICAgICAgICAgICAgICAgICAgcS50YXNrcy5zcGxpY2UoMCwgcS5wYXlsb2FkKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICBxLnRhc2tzLnNwbGljZSgwLCBxLnRhc2tzLmxlbmd0aCk7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGEgPSBfbWFwKHRhc2tzLCBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRhc2suZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHEudGFza3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxLmVtcHR5KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgd29ya2VycyArPSAxO1xuICAgICAgICAgICAgICAgICAgICB3b3JrZXJzTGlzdC5wdXNoKHRhc2tzWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNiID0gb25seV9vbmNlKF9uZXh0KHEsIHRhc2tzKSk7XG4gICAgICAgICAgICAgICAgICAgIHdvcmtlcihkYXRhLCBjYik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxlbmd0aDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBxLnRhc2tzLmxlbmd0aDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBydW5uaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHdvcmtlcnM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgd29ya2Vyc0xpc3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gd29ya2Vyc0xpc3Q7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaWRsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHEudGFza3MubGVuZ3RoICsgd29ya2VycyA9PT0gMDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwYXVzZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHEucGF1c2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXN1bWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAocS5wYXVzZWQgPT09IGZhbHNlKSB7IHJldHVybjsgfVxuICAgICAgICAgICAgICAgIHEucGF1c2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VtZUNvdW50ID0gTWF0aC5taW4ocS5jb25jdXJyZW5jeSwgcS50YXNrcy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIC8vIE5lZWQgdG8gY2FsbCBxLnByb2Nlc3Mgb25jZSBwZXIgY29uY3VycmVudFxuICAgICAgICAgICAgICAgIC8vIHdvcmtlciB0byBwcmVzZXJ2ZSBmdWxsIGNvbmN1cnJlbmN5IGFmdGVyIHBhdXNlXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgdyA9IDE7IHcgPD0gcmVzdW1lQ291bnQ7IHcrKykge1xuICAgICAgICAgICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUocS5wcm9jZXNzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBxO1xuICAgIH1cblxuICAgIGFzeW5jLnF1ZXVlID0gZnVuY3Rpb24gKHdvcmtlciwgY29uY3VycmVuY3kpIHtcbiAgICAgICAgdmFyIHEgPSBfcXVldWUoZnVuY3Rpb24gKGl0ZW1zLCBjYikge1xuICAgICAgICAgICAgd29ya2VyKGl0ZW1zWzBdLCBjYik7XG4gICAgICAgIH0sIGNvbmN1cnJlbmN5LCAxKTtcblxuICAgICAgICByZXR1cm4gcTtcbiAgICB9O1xuXG4gICAgYXN5bmMucHJpb3JpdHlRdWV1ZSA9IGZ1bmN0aW9uICh3b3JrZXIsIGNvbmN1cnJlbmN5KSB7XG5cbiAgICAgICAgZnVuY3Rpb24gX2NvbXBhcmVUYXNrcyhhLCBiKXtcbiAgICAgICAgICAgIHJldHVybiBhLnByaW9yaXR5IC0gYi5wcmlvcml0eTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIF9iaW5hcnlTZWFyY2goc2VxdWVuY2UsIGl0ZW0sIGNvbXBhcmUpIHtcbiAgICAgICAgICAgIHZhciBiZWcgPSAtMSxcbiAgICAgICAgICAgICAgICBlbmQgPSBzZXF1ZW5jZS5sZW5ndGggLSAxO1xuICAgICAgICAgICAgd2hpbGUgKGJlZyA8IGVuZCkge1xuICAgICAgICAgICAgICAgIHZhciBtaWQgPSBiZWcgKyAoKGVuZCAtIGJlZyArIDEpID4+PiAxKTtcbiAgICAgICAgICAgICAgICBpZiAoY29tcGFyZShpdGVtLCBzZXF1ZW5jZVttaWRdKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGJlZyA9IG1pZDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlbmQgPSBtaWQgLSAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBiZWc7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBfaW5zZXJ0KHEsIGRhdGEsIHByaW9yaXR5LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrICE9IG51bGwgJiYgdHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ0YXNrIGNhbGxiYWNrIG11c3QgYmUgYSBmdW5jdGlvblwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHEuc3RhcnRlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAoIV9pc0FycmF5KGRhdGEpKSB7XG4gICAgICAgICAgICAgICAgZGF0YSA9IFtkYXRhXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGRhdGEubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgLy8gY2FsbCBkcmFpbiBpbW1lZGlhdGVseSBpZiB0aGVyZSBhcmUgbm8gdGFza3NcbiAgICAgICAgICAgICAgICByZXR1cm4gYXN5bmMuc2V0SW1tZWRpYXRlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBxLmRyYWluKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfYXJyYXlFYWNoKGRhdGEsIGZ1bmN0aW9uKHRhc2spIHtcbiAgICAgICAgICAgICAgICB2YXIgaXRlbSA9IHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogdGFzayxcbiAgICAgICAgICAgICAgICAgICAgcHJpb3JpdHk6IHByaW9yaXR5LFxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nID8gY2FsbGJhY2sgOiBub29wXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHEudGFza3Muc3BsaWNlKF9iaW5hcnlTZWFyY2gocS50YXNrcywgaXRlbSwgX2NvbXBhcmVUYXNrcykgKyAxLCAwLCBpdGVtKTtcblxuICAgICAgICAgICAgICAgIGlmIChxLnRhc2tzLmxlbmd0aCA9PT0gcS5jb25jdXJyZW5jeSkge1xuICAgICAgICAgICAgICAgICAgICBxLnNhdHVyYXRlZCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUocS5wcm9jZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU3RhcnQgd2l0aCBhIG5vcm1hbCBxdWV1ZVxuICAgICAgICB2YXIgcSA9IGFzeW5jLnF1ZXVlKHdvcmtlciwgY29uY3VycmVuY3kpO1xuXG4gICAgICAgIC8vIE92ZXJyaWRlIHB1c2ggdG8gYWNjZXB0IHNlY29uZCBwYXJhbWV0ZXIgcmVwcmVzZW50aW5nIHByaW9yaXR5XG4gICAgICAgIHEucHVzaCA9IGZ1bmN0aW9uIChkYXRhLCBwcmlvcml0eSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIF9pbnNlcnQocSwgZGF0YSwgcHJpb3JpdHksIGNhbGxiYWNrKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBSZW1vdmUgdW5zaGlmdCBmdW5jdGlvblxuICAgICAgICBkZWxldGUgcS51bnNoaWZ0O1xuXG4gICAgICAgIHJldHVybiBxO1xuICAgIH07XG5cbiAgICBhc3luYy5jYXJnbyA9IGZ1bmN0aW9uICh3b3JrZXIsIHBheWxvYWQpIHtcbiAgICAgICAgcmV0dXJuIF9xdWV1ZSh3b3JrZXIsIDEsIHBheWxvYWQpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBfY29uc29sZV9mbihuYW1lKSB7XG4gICAgICAgIHJldHVybiBfcmVzdFBhcmFtKGZ1bmN0aW9uIChmbiwgYXJncykge1xuICAgICAgICAgICAgZm4uYXBwbHkobnVsbCwgYXJncy5jb25jYXQoW19yZXN0UGFyYW0oZnVuY3Rpb24gKGVyciwgYXJncykge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY29uc29sZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnNvbGUuZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoY29uc29sZVtuYW1lXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgX2FycmF5RWFjaChhcmdzLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGVbbmFtZV0oeCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXSkpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXN5bmMubG9nID0gX2NvbnNvbGVfZm4oJ2xvZycpO1xuICAgIGFzeW5jLmRpciA9IF9jb25zb2xlX2ZuKCdkaXInKTtcbiAgICAvKmFzeW5jLmluZm8gPSBfY29uc29sZV9mbignaW5mbycpO1xuICAgIGFzeW5jLndhcm4gPSBfY29uc29sZV9mbignd2FybicpO1xuICAgIGFzeW5jLmVycm9yID0gX2NvbnNvbGVfZm4oJ2Vycm9yJyk7Ki9cblxuICAgIGFzeW5jLm1lbW9pemUgPSBmdW5jdGlvbiAoZm4sIGhhc2hlcikge1xuICAgICAgICB2YXIgbWVtbyA9IHt9O1xuICAgICAgICB2YXIgcXVldWVzID0ge307XG4gICAgICAgIGhhc2hlciA9IGhhc2hlciB8fCBpZGVudGl0eTtcbiAgICAgICAgdmFyIG1lbW9pemVkID0gX3Jlc3RQYXJhbShmdW5jdGlvbiBtZW1vaXplZChhcmdzKSB7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBhcmdzLnBvcCgpO1xuICAgICAgICAgICAgdmFyIGtleSA9IGhhc2hlci5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgICAgICAgIGlmIChrZXkgaW4gbWVtbykge1xuICAgICAgICAgICAgICAgIGFzeW5jLnNldEltbWVkaWF0ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIG1lbW9ba2V5XSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChrZXkgaW4gcXVldWVzKSB7XG4gICAgICAgICAgICAgICAgcXVldWVzW2tleV0ucHVzaChjYWxsYmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBxdWV1ZXNba2V5XSA9IFtjYWxsYmFja107XG4gICAgICAgICAgICAgICAgZm4uYXBwbHkobnVsbCwgYXJncy5jb25jYXQoW19yZXN0UGFyYW0oZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgbWVtb1trZXldID0gYXJncztcbiAgICAgICAgICAgICAgICAgICAgdmFyIHEgPSBxdWV1ZXNba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHF1ZXVlc1trZXldO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHEubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxW2ldLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSldKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBtZW1vaXplZC5tZW1vID0gbWVtbztcbiAgICAgICAgbWVtb2l6ZWQudW5tZW1vaXplZCA9IGZuO1xuICAgICAgICByZXR1cm4gbWVtb2l6ZWQ7XG4gICAgfTtcblxuICAgIGFzeW5jLnVubWVtb2l6ZSA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIChmbi51bm1lbW9pemVkIHx8IGZuKS5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBfdGltZXMobWFwcGVyKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoY291bnQsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgbWFwcGVyKF9yYW5nZShjb3VudCksIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYXN5bmMudGltZXMgPSBfdGltZXMoYXN5bmMubWFwKTtcbiAgICBhc3luYy50aW1lc1NlcmllcyA9IF90aW1lcyhhc3luYy5tYXBTZXJpZXMpO1xuICAgIGFzeW5jLnRpbWVzTGltaXQgPSBmdW5jdGlvbiAoY291bnQsIGxpbWl0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jLm1hcExpbWl0KF9yYW5nZShjb3VudCksIGxpbWl0LCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy5zZXEgPSBmdW5jdGlvbiAoLyogZnVuY3Rpb25zLi4uICovKSB7XG4gICAgICAgIHZhciBmbnMgPSBhcmd1bWVudHM7XG4gICAgICAgIHJldHVybiBfcmVzdFBhcmFtKGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3NbYXJncy5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGFyZ3MucG9wKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrID0gbm9vcDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXN5bmMucmVkdWNlKGZucywgYXJncywgZnVuY3Rpb24gKG5ld2FyZ3MsIGZuLCBjYikge1xuICAgICAgICAgICAgICAgIGZuLmFwcGx5KHRoYXQsIG5ld2FyZ3MuY29uY2F0KFtfcmVzdFBhcmFtKGZ1bmN0aW9uIChlcnIsIG5leHRhcmdzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNiKGVyciwgbmV4dGFyZ3MpO1xuICAgICAgICAgICAgICAgIH0pXSkpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChlcnIsIHJlc3VsdHMpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseSh0aGF0LCBbZXJyXS5jb25jYXQocmVzdWx0cykpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBhc3luYy5jb21wb3NlID0gZnVuY3Rpb24gKC8qIGZ1bmN0aW9ucy4uLiAqLykge1xuICAgICAgICByZXR1cm4gYXN5bmMuc2VxLmFwcGx5KG51bGwsIEFycmF5LnByb3RvdHlwZS5yZXZlcnNlLmNhbGwoYXJndW1lbnRzKSk7XG4gICAgfTtcblxuXG4gICAgZnVuY3Rpb24gX2FwcGx5RWFjaChlYWNoZm4pIHtcbiAgICAgICAgcmV0dXJuIF9yZXN0UGFyYW0oZnVuY3Rpb24oZm5zLCBhcmdzKSB7XG4gICAgICAgICAgICB2YXIgZ28gPSBfcmVzdFBhcmFtKGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gYXJncy5wb3AoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWFjaGZuKGZucywgZnVuY3Rpb24gKGZuLCBfLCBjYikge1xuICAgICAgICAgICAgICAgICAgICBmbi5hcHBseSh0aGF0LCBhcmdzLmNvbmNhdChbY2JdKSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjYWxsYmFjayk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBnby5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBnbztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMuYXBwbHlFYWNoID0gX2FwcGx5RWFjaChhc3luYy5lYWNoT2YpO1xuICAgIGFzeW5jLmFwcGx5RWFjaFNlcmllcyA9IF9hcHBseUVhY2goYXN5bmMuZWFjaE9mU2VyaWVzKTtcblxuXG4gICAgYXN5bmMuZm9yZXZlciA9IGZ1bmN0aW9uIChmbiwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGRvbmUgPSBvbmx5X29uY2UoY2FsbGJhY2sgfHwgbm9vcCk7XG4gICAgICAgIHZhciB0YXNrID0gZW5zdXJlQXN5bmMoZm4pO1xuICAgICAgICBmdW5jdGlvbiBuZXh0KGVycikge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiBkb25lKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0YXNrKG5leHQpO1xuICAgICAgICB9XG4gICAgICAgIG5leHQoKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gZW5zdXJlQXN5bmMoZm4pIHtcbiAgICAgICAgcmV0dXJuIF9yZXN0UGFyYW0oZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3MucG9wKCk7XG4gICAgICAgICAgICBhcmdzLnB1c2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBpbm5lckFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICAgICAgICAgICAgaWYgKHN5bmMpIHtcbiAgICAgICAgICAgICAgICAgICAgYXN5bmMuc2V0SW1tZWRpYXRlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIGlubmVyQXJncyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIGlubmVyQXJncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YXIgc3luYyA9IHRydWU7XG4gICAgICAgICAgICBmbi5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICAgIHN5bmMgPSBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMuZW5zdXJlQXN5bmMgPSBlbnN1cmVBc3luYztcblxuICAgIGFzeW5jLmNvbnN0YW50ID0gX3Jlc3RQYXJhbShmdW5jdGlvbih2YWx1ZXMpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbbnVsbF0uY29uY2F0KHZhbHVlcyk7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjay5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGFzeW5jLndyYXBTeW5jID1cbiAgICBhc3luYy5hc3luY2lmeSA9IGZ1bmN0aW9uIGFzeW5jaWZ5KGZ1bmMpIHtcbiAgICAgICAgcmV0dXJuIF9yZXN0UGFyYW0oZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3MucG9wKCk7XG4gICAgICAgICAgICB2YXIgcmVzdWx0O1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGlmIHJlc3VsdCBpcyBQcm9taXNlIG9iamVjdFxuICAgICAgICAgICAgaWYgKF9pc09iamVjdChyZXN1bHQpICYmIHR5cGVvZiByZXN1bHQudGhlbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnRoZW4oZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIH0pW1wiY2F0Y2hcIl0oZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVyci5tZXNzYWdlID8gZXJyIDogbmV3IEVycm9yKGVycikpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLy8gTm9kZS5qc1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGFzeW5jO1xuICAgIH1cbiAgICAvLyBBTUQgLyBSZXF1aXJlSlNcbiAgICBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKFtdLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gYXN5bmM7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvLyBpbmNsdWRlZCBkaXJlY3RseSB2aWEgPHNjcmlwdD4gdGFnXG4gICAgZWxzZSB7XG4gICAgICAgIHJvb3QuYXN5bmMgPSBhc3luYztcbiAgICB9XG5cbn0oKSk7XG4iLCIvKiFcclxuICogQG5hbWUgSmF2YVNjcmlwdC9Ob2RlSlMgTWVyZ2UgdjEuMi4wXHJcbiAqIEBhdXRob3IgeWVpa29zXHJcbiAqIEByZXBvc2l0b3J5IGh0dHBzOi8vZ2l0aHViLmNvbS95ZWlrb3MvanMubWVyZ2VcclxuXHJcbiAqIENvcHlyaWdodCAyMDE0IHllaWtvcyAtIE1JVCBsaWNlbnNlXHJcbiAqIGh0dHBzOi8vcmF3LmdpdGh1Yi5jb20veWVpa29zL2pzLm1lcmdlL21hc3Rlci9MSUNFTlNFXHJcbiAqL1xyXG5cclxuOyhmdW5jdGlvbihpc05vZGUpIHtcclxuXHJcblx0LyoqXHJcblx0ICogTWVyZ2Ugb25lIG9yIG1vcmUgb2JqZWN0cyBcclxuXHQgKiBAcGFyYW0gYm9vbD8gY2xvbmVcclxuXHQgKiBAcGFyYW0gbWl4ZWQsLi4uIGFyZ3VtZW50c1xyXG5cdCAqIEByZXR1cm4gb2JqZWN0XHJcblx0ICovXHJcblxyXG5cdHZhciBQdWJsaWMgPSBmdW5jdGlvbihjbG9uZSkge1xyXG5cclxuXHRcdHJldHVybiBtZXJnZShjbG9uZSA9PT0gdHJ1ZSwgZmFsc2UsIGFyZ3VtZW50cyk7XHJcblxyXG5cdH0sIHB1YmxpY05hbWUgPSAnbWVyZ2UnO1xyXG5cclxuXHQvKipcclxuXHQgKiBNZXJnZSB0d28gb3IgbW9yZSBvYmplY3RzIHJlY3Vyc2l2ZWx5IFxyXG5cdCAqIEBwYXJhbSBib29sPyBjbG9uZVxyXG5cdCAqIEBwYXJhbSBtaXhlZCwuLi4gYXJndW1lbnRzXHJcblx0ICogQHJldHVybiBvYmplY3RcclxuXHQgKi9cclxuXHJcblx0UHVibGljLnJlY3Vyc2l2ZSA9IGZ1bmN0aW9uKGNsb25lKSB7XHJcblxyXG5cdFx0cmV0dXJuIG1lcmdlKGNsb25lID09PSB0cnVlLCB0cnVlLCBhcmd1bWVudHMpO1xyXG5cclxuXHR9O1xyXG5cclxuXHQvKipcclxuXHQgKiBDbG9uZSB0aGUgaW5wdXQgcmVtb3ZpbmcgYW55IHJlZmVyZW5jZVxyXG5cdCAqIEBwYXJhbSBtaXhlZCBpbnB1dFxyXG5cdCAqIEByZXR1cm4gbWl4ZWRcclxuXHQgKi9cclxuXHJcblx0UHVibGljLmNsb25lID0gZnVuY3Rpb24oaW5wdXQpIHtcclxuXHJcblx0XHR2YXIgb3V0cHV0ID0gaW5wdXQsXHJcblx0XHRcdHR5cGUgPSB0eXBlT2YoaW5wdXQpLFxyXG5cdFx0XHRpbmRleCwgc2l6ZTtcclxuXHJcblx0XHRpZiAodHlwZSA9PT0gJ2FycmF5Jykge1xyXG5cclxuXHRcdFx0b3V0cHV0ID0gW107XHJcblx0XHRcdHNpemUgPSBpbnB1dC5sZW5ndGg7XHJcblxyXG5cdFx0XHRmb3IgKGluZGV4PTA7aW5kZXg8c2l6ZTsrK2luZGV4KVxyXG5cclxuXHRcdFx0XHRvdXRwdXRbaW5kZXhdID0gUHVibGljLmNsb25lKGlucHV0W2luZGV4XSk7XHJcblxyXG5cdFx0fSBlbHNlIGlmICh0eXBlID09PSAnb2JqZWN0Jykge1xyXG5cclxuXHRcdFx0b3V0cHV0ID0ge307XHJcblxyXG5cdFx0XHRmb3IgKGluZGV4IGluIGlucHV0KVxyXG5cclxuXHRcdFx0XHRvdXRwdXRbaW5kZXhdID0gUHVibGljLmNsb25lKGlucHV0W2luZGV4XSk7XHJcblxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBvdXRwdXQ7XHJcblxyXG5cdH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIE1lcmdlIHR3byBvYmplY3RzIHJlY3Vyc2l2ZWx5XHJcblx0ICogQHBhcmFtIG1peGVkIGlucHV0XHJcblx0ICogQHBhcmFtIG1peGVkIGV4dGVuZFxyXG5cdCAqIEByZXR1cm4gbWl4ZWRcclxuXHQgKi9cclxuXHJcblx0ZnVuY3Rpb24gbWVyZ2VfcmVjdXJzaXZlKGJhc2UsIGV4dGVuZCkge1xyXG5cclxuXHRcdGlmICh0eXBlT2YoYmFzZSkgIT09ICdvYmplY3QnKVxyXG5cclxuXHRcdFx0cmV0dXJuIGV4dGVuZDtcclxuXHJcblx0XHRmb3IgKHZhciBrZXkgaW4gZXh0ZW5kKSB7XHJcblxyXG5cdFx0XHRpZiAodHlwZU9mKGJhc2Vba2V5XSkgPT09ICdvYmplY3QnICYmIHR5cGVPZihleHRlbmRba2V5XSkgPT09ICdvYmplY3QnKSB7XHJcblxyXG5cdFx0XHRcdGJhc2Vba2V5XSA9IG1lcmdlX3JlY3Vyc2l2ZShiYXNlW2tleV0sIGV4dGVuZFtrZXldKTtcclxuXHJcblx0XHRcdH0gZWxzZSB7XHJcblxyXG5cdFx0XHRcdGJhc2Vba2V5XSA9IGV4dGVuZFtrZXldO1xyXG5cclxuXHRcdFx0fVxyXG5cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gYmFzZTtcclxuXHJcblx0fVxyXG5cclxuXHQvKipcclxuXHQgKiBNZXJnZSB0d28gb3IgbW9yZSBvYmplY3RzXHJcblx0ICogQHBhcmFtIGJvb2wgY2xvbmVcclxuXHQgKiBAcGFyYW0gYm9vbCByZWN1cnNpdmVcclxuXHQgKiBAcGFyYW0gYXJyYXkgYXJndlxyXG5cdCAqIEByZXR1cm4gb2JqZWN0XHJcblx0ICovXHJcblxyXG5cdGZ1bmN0aW9uIG1lcmdlKGNsb25lLCByZWN1cnNpdmUsIGFyZ3YpIHtcclxuXHJcblx0XHR2YXIgcmVzdWx0ID0gYXJndlswXSxcclxuXHRcdFx0c2l6ZSA9IGFyZ3YubGVuZ3RoO1xyXG5cclxuXHRcdGlmIChjbG9uZSB8fCB0eXBlT2YocmVzdWx0KSAhPT0gJ29iamVjdCcpXHJcblxyXG5cdFx0XHRyZXN1bHQgPSB7fTtcclxuXHJcblx0XHRmb3IgKHZhciBpbmRleD0wO2luZGV4PHNpemU7KytpbmRleCkge1xyXG5cclxuXHRcdFx0dmFyIGl0ZW0gPSBhcmd2W2luZGV4XSxcclxuXHJcblx0XHRcdFx0dHlwZSA9IHR5cGVPZihpdGVtKTtcclxuXHJcblx0XHRcdGlmICh0eXBlICE9PSAnb2JqZWN0JykgY29udGludWU7XHJcblxyXG5cdFx0XHRmb3IgKHZhciBrZXkgaW4gaXRlbSkge1xyXG5cclxuXHRcdFx0XHR2YXIgc2l0ZW0gPSBjbG9uZSA/IFB1YmxpYy5jbG9uZShpdGVtW2tleV0pIDogaXRlbVtrZXldO1xyXG5cclxuXHRcdFx0XHRpZiAocmVjdXJzaXZlKSB7XHJcblxyXG5cdFx0XHRcdFx0cmVzdWx0W2tleV0gPSBtZXJnZV9yZWN1cnNpdmUocmVzdWx0W2tleV0sIHNpdGVtKTtcclxuXHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHJcblx0XHRcdFx0XHRyZXN1bHRba2V5XSA9IHNpdGVtO1xyXG5cclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHR9XHJcblxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiByZXN1bHQ7XHJcblxyXG5cdH1cclxuXHJcblx0LyoqXHJcblx0ICogR2V0IHR5cGUgb2YgdmFyaWFibGVcclxuXHQgKiBAcGFyYW0gbWl4ZWQgaW5wdXRcclxuXHQgKiBAcmV0dXJuIHN0cmluZ1xyXG5cdCAqXHJcblx0ICogQHNlZSBodHRwOi8vanNwZXJmLmNvbS90eXBlb2Z2YXJcclxuXHQgKi9cclxuXHJcblx0ZnVuY3Rpb24gdHlwZU9mKGlucHV0KSB7XHJcblxyXG5cdFx0cmV0dXJuICh7fSkudG9TdHJpbmcuY2FsbChpbnB1dCkuc2xpY2UoOCwgLTEpLnRvTG93ZXJDYXNlKCk7XHJcblxyXG5cdH1cclxuXHJcblx0aWYgKGlzTm9kZSkge1xyXG5cclxuXHRcdG1vZHVsZS5leHBvcnRzID0gUHVibGljO1xyXG5cclxuXHR9IGVsc2Uge1xyXG5cclxuXHRcdHdpbmRvd1twdWJsaWNOYW1lXSA9IFB1YmxpYztcclxuXHJcblx0fVxyXG5cclxufSkodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgbW9kdWxlICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpOyIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwidmFyIEF1dGhDb250cm9sbGVyID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIEF1dGhDb250cm9sbGVyKCRzY29wZSwgJGh0dHApIHtcclxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xyXG4gICAgICAgIHRoaXMuJGh0dHAgPSAkaHR0cDtcclxuICAgICAgICB0aGlzLl9pbml0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBfdGhpcy4kaHR0cC5nZXQoJy9hdXRoL3Rva2VuJylcclxuICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGRhdGEpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIF90aGlzLiRzY29wZS5wcm9kdWN0aW9uID0gZGF0YTtcclxuICAgICAgICAgICAgICAgIF90aGlzLiRodHRwLnBvc3QoJy9hdXRoL3Rva2VuJywgeyBzYW5kYm94OiB0cnVlIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLiRzY29wZS5zYW5kYm94ID0gZGF0YTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuX3NldFRva2VuID0gZnVuY3Rpb24gKHNhbmRib3gpIHtcclxuICAgICAgICAgICAgdmFyIHRva2VuID0gcHJvbXB0KFwiSW5wdXQgZGV2ZWxvcGVyIHRva2VuIChcIiArIChzYW5kYm94ID8gJ3NhbmRib3gnIDogJ3Byb2R1Y3Rpb24nKSArIFwiKVwiKTtcclxuICAgICAgICAgICAgaWYgKCF0b2tlbilcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgX3RoaXMuJGh0dHAucG9zdCgnL2F1dGgvdG9rZW4nLCB7IHNhbmRib3g6IHNhbmRib3gsIHRva2VuOiB0b2tlbiB9KVxyXG4gICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzYW5kYm94KVxyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLiRzY29wZS5zYW5kYm94ID0gZGF0YTtcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy4kc2NvcGUucHJvZHVjdGlvbiA9IGRhdGE7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWRhdGEpXHJcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ1Rva2VuIGlzIGludmFsaWQuJyk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIGFsZXJ0KCdTZXQgdG9rZW4gZmFpbGVkLicpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuJHNjb3BlLm1lc3NhZ2UgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlLmlzRGV2ZWxvcGVyID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy4kc2NvcGUuc2FuZGJveCA9IHsgdG9rZW46IG51bGwsIHVzZXJuYW1lOiBudWxsIH07XHJcbiAgICAgICAgdGhpcy4kc2NvcGUucHJvZHVjdGlvbiA9IHsgdG9rZW46IG51bGwsIHVzZXJuYW1lOiBudWxsIH07XHJcbiAgICAgICAgdGhpcy4kc2NvcGUuc2V0VG9rZW4gPSB0aGlzLl9zZXRUb2tlbjtcclxuICAgICAgICB0aGlzLl9pbml0KCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gQXV0aENvbnRyb2xsZXI7XHJcbn0pKCk7XHJcbmFuZ3VsYXIubW9kdWxlKCdBcHAnKS5jb250cm9sbGVyKCdBdXRoQ29udHJvbGxlcicsIFsnJHNjb3BlJywgJyRodHRwJywgQXV0aENvbnRyb2xsZXJdKTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXV0aC1jb250cm9sbGVyLmpzLm1hcCIsInZhciBDb250cm9sbGVyID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIENvbnRyb2xsZXIoJHNjb3BlKSB7XHJcbiAgICAgICAgdGhpcy4kc2NvcGUgPSAkc2NvcGU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gQ29udHJvbGxlcjtcclxufSkoKTtcclxuYW5ndWxhci5tb2R1bGUoJ0FwcCcpLmNvbnRyb2xsZXIoJ0NvbnRyb2xsZXInLCBbJyRzY29wZScsIENvbnRyb2xsZXJdKTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y29udHJvbGxlci5qcy5tYXAiLCJ2YXIgTWVudUNvbnRyb2xsZXIgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gTWVudUNvbnRyb2xsZXIoJHNjb3BlLCAkaHR0cCwgZGF0YVN0b3JlLCBkYXRhVHJhbnNjaWV2ZXIpIHtcclxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xyXG4gICAgICAgIHRoaXMuJGh0dHAgPSAkaHR0cDtcclxuICAgICAgICB0aGlzLmRhdGFTdG9yZSA9IGRhdGFTdG9yZTtcclxuICAgICAgICB0aGlzLmRhdGFUcmFuc2NpZXZlciA9IGRhdGFUcmFuc2NpZXZlcjtcclxuICAgICAgICB0aGlzLl9vblJlbG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgX3RoaXMuZGF0YVRyYW5zY2lldmVyLnJlbG9hZCgpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5fb25XYXRjaEZpbHRlclBhcmFtcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgX3RoaXMuZGF0YVRyYW5zY2lldmVyLmNvdW50Tm90ZXMoZnVuY3Rpb24gKGVyciwgY291bnQpIHtcclxuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICBhbGVydChlcnIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIF90aGlzLiRzY29wZS5ub3RlQ291bnQgPSBjb3VudDtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLiRzY29wZS5kYXRhU3RvcmUgPSB0aGlzLmRhdGFTdG9yZTtcclxuICAgICAgICB0aGlzLiRzY29wZS5kYXRhVHJhbnNjaWV2ZXIgPSB0aGlzLmRhdGFUcmFuc2NpZXZlcjtcclxuICAgICAgICB0aGlzLiRzY29wZS5ub3RlQ291bnQgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlLiR3YXRjaEdyb3VwKFsnZGF0YVRyYW5zY2lldmVyLmZpbHRlclBhcmFtcy5ub3RlYm9va0d1aWRzJywgJ2RhdGFUcmFuc2NpZXZlci5maWx0ZXJQYXJhbXMuc3RhY2tzJ10sIHRoaXMuX29uV2F0Y2hGaWx0ZXJQYXJhbXMpO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlLiRvbignZXZlbnQ6OnJlbG9hZCcsIHRoaXMuX29uUmVsb2FkKTtcclxuICAgIH1cclxuICAgIHJldHVybiBNZW51Q29udHJvbGxlcjtcclxufSkoKTtcclxuYW5ndWxhci5tb2R1bGUoJ0FwcCcpLmNvbnRyb2xsZXIoJ01lbnVDb250cm9sbGVyJywgWyckc2NvcGUnLCAnJGh0dHAnLCAnZGF0YVN0b3JlJywgJ2RhdGFUcmFuc2NpZXZlcicsIE1lbnVDb250cm9sbGVyXSk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1lbnUtY29udHJvbGxlci5qcy5tYXAiLCJ2YXIgTW9kYWxDb250cm9sbGVyID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIE1vZGFsQ29udHJvbGxlcigkc2NvcGUpIHtcclxuICAgICAgICB0aGlzLiRzY29wZSA9ICRzY29wZTtcclxuICAgIH1cclxuICAgIHJldHVybiBNb2RhbENvbnRyb2xsZXI7XHJcbn0pKCk7XHJcbmV4cG9ydHMuTW9kYWxDb250cm9sbGVyID0gTW9kYWxDb250cm9sbGVyO1xyXG5hbmd1bGFyLm1vZHVsZSgnQXBwJykuY29udHJvbGxlcignTW9kYWxDb250cm9sbGVyJywgWyckc2NvcGUnLCBNb2RhbENvbnRyb2xsZXJdKTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bW9kYWwtY29udHJvbGxlci5qcy5tYXAiLCJ2YXIgTmF2aWdhdGlvbkNvbnRyb2xsZXIgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gTmF2aWdhdGlvbkNvbnRyb2xsZXIoJHNjb3BlLCAkcm9vdFNjb3BlLCAkcm91dGUpIHtcclxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xyXG4gICAgICAgIHRoaXMuJHJvb3RTY29wZSA9ICRyb290U2NvcGU7XHJcbiAgICAgICAgdGhpcy4kcm91dGUgPSAkcm91dGU7XHJcbiAgICAgICAgdGhpcy5fcmVsb2FkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBfdGhpcy4kcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2V2ZW50OjpyZWxvYWQnKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuJHNjb3BlLm5hdkNvbGxhcHNlID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLiRzY29wZS4kcm91dGUgPSB0aGlzLiRyb3V0ZTtcclxuICAgICAgICB0aGlzLiRzY29wZS5yZWxvYWQgPSB0aGlzLl9yZWxvYWQ7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gTmF2aWdhdGlvbkNvbnRyb2xsZXI7XHJcbn0pKCk7XHJcbmFuZ3VsYXIubW9kdWxlKCdBcHAnKS5jb250cm9sbGVyKCdOYXZpZ2F0aW9uQ29udHJvbGxlcicsIFsnJHNjb3BlJywgJyRyb290U2NvcGUnLCAnJHJvdXRlJywgTmF2aWdhdGlvbkNvbnRyb2xsZXJdKTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bmF2aWdhdGlvbi1jb250cm9sbGVyLmpzLm1hcCIsInZhciBOb3Rlc0NvbnRyb2xsZXIgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gTm90ZXNDb250cm9sbGVyKCRzY29wZSwgZGF0YVN0b3JlKSB7XHJcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICB0aGlzLiRzY29wZSA9ICRzY29wZTtcclxuICAgICAgICB0aGlzLmRhdGFTdG9yZSA9IGRhdGFTdG9yZTtcclxuICAgICAgICB0aGlzLl9vbldhdGNoVGltZUxvZ3MgPSBmdW5jdGlvbiAodGltZUxvZ3MpIHtcclxuICAgICAgICAgICAgX3RoaXMuJHNjb3BlLm5vdGVzU3BlbnRUaW1lcyA9IHt9O1xyXG4gICAgICAgICAgICB2YXIgcGVyc29uc0hhc2ggPSB7fTtcclxuICAgICAgICAgICAgZm9yICh2YXIgbm90ZUd1aWQgaW4gdGltZUxvZ3MpIHtcclxuICAgICAgICAgICAgICAgIHZhciBub3RlVGltZUxvZyA9IHRpbWVMb2dzW25vdGVHdWlkXTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIHRpbWVMb2dJZCBpbiBub3RlVGltZUxvZykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0aW1lTG9nID0gbm90ZVRpbWVMb2dbdGltZUxvZ0lkXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIV90aGlzLiRzY29wZS5ub3Rlc1NwZW50VGltZXNbdGltZUxvZy5ub3RlR3VpZF0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLiRzY29wZS5ub3Rlc1NwZW50VGltZXNbdGltZUxvZy5ub3RlR3VpZF0gPSB7ICR0b3RhbDogMCB9O1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLiRzY29wZS5ub3Rlc1NwZW50VGltZXNbdGltZUxvZy5ub3RlR3VpZF1bJyR0b3RhbCddICs9IHRpbWVMb2cuc3BlbnRUaW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghX3RoaXMuJHNjb3BlLm5vdGVzU3BlbnRUaW1lc1t0aW1lTG9nLm5vdGVHdWlkXVt0aW1lTG9nLnBlcnNvbl0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLiRzY29wZS5ub3Rlc1NwZW50VGltZXNbdGltZUxvZy5ub3RlR3VpZF1bdGltZUxvZy5wZXJzb25dID0gMDtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzW3RpbWVMb2cubm90ZUd1aWRdW3RpbWVMb2cucGVyc29uXSArPSB0aW1lTG9nLnNwZW50VGltZTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIV90aGlzLiRzY29wZS5ub3Rlc1NwZW50VGltZXNbJyR0b3RhbCddKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzWyckdG90YWwnXSA9IHsgJHRvdGFsOiAwIH07XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuJHNjb3BlLm5vdGVzU3BlbnRUaW1lc1snJHRvdGFsJ11bJyR0b3RhbCddICs9IHRpbWVMb2cuc3BlbnRUaW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghX3RoaXMuJHNjb3BlLm5vdGVzU3BlbnRUaW1lc1snJHRvdGFsJ11bdGltZUxvZy5wZXJzb25dKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzWyckdG90YWwnXVt0aW1lTG9nLnBlcnNvbl0gPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLiRzY29wZS5ub3Rlc1NwZW50VGltZXNbJyR0b3RhbCddW3RpbWVMb2cucGVyc29uXSArPSB0aW1lTG9nLnNwZW50VGltZTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGltZUxvZy5zcGVudFRpbWUgPiAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwZXJzb25zSGFzaFt0aW1lTG9nLnBlcnNvbl0gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF90aGlzLiRzY29wZS5leGlzdFBlcnNvbnMgPSBPYmplY3Qua2V5cyhwZXJzb25zSGFzaCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLl9vbldhdGNoUHJvZml0TG9ncyA9IGZ1bmN0aW9uIChwcm9maXRMb2dzKSB7XHJcbiAgICAgICAgICAgIF90aGlzLiRzY29wZS5ub3Rlc1Byb2ZpdHMgPSB7fTtcclxuICAgICAgICAgICAgZm9yICh2YXIgbm90ZUd1aWQgaW4gcHJvZml0TG9ncykge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5vdGVQcm9maXRMb2cgPSBwcm9maXRMb2dzW25vdGVHdWlkXTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIHByb2ZpdExvZ0lkIGluIG5vdGVQcm9maXRMb2cpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJvZml0TG9nID0gbm90ZVByb2ZpdExvZ1twcm9maXRMb2dJZF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFfdGhpcy4kc2NvcGUubm90ZXNQcm9maXRzW3Byb2ZpdExvZy5ub3RlR3VpZF0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLiRzY29wZS5ub3Rlc1Byb2ZpdHNbcHJvZml0TG9nLm5vdGVHdWlkXSA9IHsgJHRvdGFsOiAwIH07XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuJHNjb3BlLm5vdGVzUHJvZml0c1twcm9maXRMb2cubm90ZUd1aWRdWyckdG90YWwnXSArPSBwcm9maXRMb2cucHJvZml0O1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghX3RoaXMuJHNjb3BlLm5vdGVzUHJvZml0c1snJHRvdGFsJ10pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLiRzY29wZS5ub3Rlc1Byb2ZpdHNbJyR0b3RhbCddID0geyAkdG90YWw6IDAgfTtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy4kc2NvcGUubm90ZXNQcm9maXRzWyckdG90YWwnXVsnJHRvdGFsJ10gKz0gcHJvZml0TG9nLnByb2ZpdDtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gX3RoaXMuJHNjb3BlLmV4aXN0UGVyc29uczsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBlcnNvbiA9IF9hW19pXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFfdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzW25vdGVHdWlkXSB8fCAhX3RoaXMuJHNjb3BlLm5vdGVzU3BlbnRUaW1lc1tub3RlR3VpZF1bcGVyc29uXSB8fCAhX3RoaXMuJHNjb3BlLm5vdGVzU3BlbnRUaW1lc1tub3RlR3VpZF1bJyR0b3RhbCddKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuJHNjb3BlLm5vdGVzUHJvZml0c1tub3RlR3VpZF1bcGVyc29uXSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLiRzY29wZS5ub3Rlc1Byb2ZpdHNbbm90ZUd1aWRdW3BlcnNvbl0gPSBNYXRoLnJvdW5kKF90aGlzLiRzY29wZS5ub3Rlc1Byb2ZpdHNbbm90ZUd1aWRdWyckdG90YWwnXSAqIF90aGlzLiRzY29wZS5ub3Rlc1NwZW50VGltZXNbbm90ZUd1aWRdW3BlcnNvbl0gLyBfdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzW25vdGVHdWlkXVsnJHRvdGFsJ10pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIV90aGlzLiRzY29wZS5ub3Rlc1Byb2ZpdHNbJyR0b3RhbCddW3BlcnNvbl0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLiRzY29wZS5ub3Rlc1Byb2ZpdHNbJyR0b3RhbCddW3BlcnNvbl0gPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLiRzY29wZS5ub3Rlc1Byb2ZpdHNbJyR0b3RhbCddW3BlcnNvbl0gKz0gX3RoaXMuJHNjb3BlLm5vdGVzUHJvZml0c1tub3RlR3VpZF1bcGVyc29uXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy4kc2NvcGUuZGF0YVN0b3JlID0gdGhpcy5kYXRhU3RvcmU7XHJcbiAgICAgICAgdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzID0ge307XHJcbiAgICAgICAgdGhpcy4kc2NvcGUubm90ZXNQcm9maXRzID0ge307XHJcbiAgICAgICAgdGhpcy4kc2NvcGUuZXhpc3RQZXJzb25zID0gW107XHJcbiAgICAgICAgdGhpcy4kc2NvcGUuJHdhdGNoQ29sbGVjdGlvbignZGF0YVN0b3JlLnRpbWVMb2dzJywgdGhpcy5fb25XYXRjaFRpbWVMb2dzKTtcclxuICAgICAgICB0aGlzLiRzY29wZS4kd2F0Y2hDb2xsZWN0aW9uKCdkYXRhU3RvcmUucHJvZml0TG9ncycsIHRoaXMuX29uV2F0Y2hQcm9maXRMb2dzKTtcclxuICAgIH1cclxuICAgIHJldHVybiBOb3Rlc0NvbnRyb2xsZXI7XHJcbn0pKCk7XHJcbmFuZ3VsYXIubW9kdWxlKCdBcHAnKS5jb250cm9sbGVyKCdOb3Rlc0NvbnRyb2xsZXInLCBbJyRzY29wZScsICdkYXRhU3RvcmUnLCBOb3Rlc0NvbnRyb2xsZXJdKTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bm90ZXMtY29udHJvbGxlci5qcy5tYXAiLCJ2YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IGZ1bmN0aW9uIChkLCBiKSB7XHJcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcclxuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxyXG4gICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xyXG59O1xyXG52YXIgbW9kYWxfY29udHJvbGxlcl8xID0gcmVxdWlyZShcIi4vbW9kYWwtY29udHJvbGxlclwiKTtcclxudmFyIFByb2dyZXNzTW9kYWxDb250cm9sbGVyID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcclxuICAgIF9fZXh0ZW5kcyhQcm9ncmVzc01vZGFsQ29udHJvbGxlciwgX3N1cGVyKTtcclxuICAgIGZ1bmN0aW9uIFByb2dyZXNzTW9kYWxDb250cm9sbGVyKCRzY29wZSwgcHJvZ3Jlc3MpIHtcclxuICAgICAgICBfc3VwZXIuY2FsbCh0aGlzLCAkc2NvcGUpO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xyXG4gICAgICAgIHRoaXMucHJvZ3Jlc3MgPSBwcm9ncmVzcztcclxuICAgICAgICB0aGlzLiRzY29wZS5wcm9ncmVzcyA9IHRoaXMucHJvZ3Jlc3M7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gUHJvZ3Jlc3NNb2RhbENvbnRyb2xsZXI7XHJcbn0pKG1vZGFsX2NvbnRyb2xsZXJfMS5Nb2RhbENvbnRyb2xsZXIpO1xyXG5leHBvcnRzLlByb2dyZXNzTW9kYWxDb250cm9sbGVyID0gUHJvZ3Jlc3NNb2RhbENvbnRyb2xsZXI7XHJcbmFuZ3VsYXIubW9kdWxlKCdBcHAnKS5jb250cm9sbGVyKCdQcm9ncmVzc01vZGFsQ29udHJvbGxlcicsIFsnJHNjb3BlJywgJ3Byb2dyZXNzJywgUHJvZ3Jlc3NNb2RhbENvbnRyb2xsZXJdKTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cHJvZ3Jlc3MtbW9kYWwtY29udHJvbGxlci5qcy5tYXAiLCJ2YXIgYXN5bmMgPSByZXF1aXJlKCdhc3luYycpO1xyXG52YXIgU2V0dGluZ3NDb250cm9sbGVyID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIFNldHRpbmdzQ29udHJvbGxlcigkc2NvcGUsICRodHRwLCBkYXRhU3RvcmUsIGRhdGFUcmFuc2NpZXZlciwgcHJvZ3Jlc3MpIHtcclxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xyXG4gICAgICAgIHRoaXMuJGh0dHAgPSAkaHR0cDtcclxuICAgICAgICB0aGlzLmRhdGFTdG9yZSA9IGRhdGFTdG9yZTtcclxuICAgICAgICB0aGlzLmRhdGFUcmFuc2NpZXZlciA9IGRhdGFUcmFuc2NpZXZlcjtcclxuICAgICAgICB0aGlzLnByb2dyZXNzID0gcHJvZ3Jlc3M7XHJcbiAgICAgICAgdGhpcy5fdXAgPSBmdW5jdGlvbiAoaW5kZXgpIHtcclxuICAgICAgICAgICAgaWYgKGluZGV4ID09IDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIF90aGlzLiRzY29wZS5lZGl0U3RvcmVbJ3BlcnNvbnMnXS5zcGxpY2UoaW5kZXggLSAxLCAyLCBfdGhpcy4kc2NvcGUuZWRpdFN0b3JlWydwZXJzb25zJ11baW5kZXhdLCBfdGhpcy4kc2NvcGUuZWRpdFN0b3JlWydwZXJzb25zJ11baW5kZXggLSAxXSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLl9kb3duID0gZnVuY3Rpb24gKGluZGV4KSB7XHJcbiAgICAgICAgICAgIGlmIChpbmRleCA+PSBfdGhpcy4kc2NvcGUuZWRpdFN0b3JlWydwZXJzb25zJ10ubGVuZ3RoIC0gMSlcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgX3RoaXMuJHNjb3BlLmVkaXRTdG9yZVsncGVyc29ucyddLnNwbGljZShpbmRleCwgMiwgX3RoaXMuJHNjb3BlLmVkaXRTdG9yZVsncGVyc29ucyddW2luZGV4ICsgMV0sIF90aGlzLiRzY29wZS5lZGl0U3RvcmVbJ3BlcnNvbnMnXVtpbmRleF0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5fcmVtb3ZlID0gZnVuY3Rpb24gKGluZGV4KSB7XHJcbiAgICAgICAgICAgIF90aGlzLiRzY29wZS5lZGl0U3RvcmVbJ3BlcnNvbnMnXS5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5fYWRkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoIV90aGlzLiRzY29wZS5lZGl0U3RvcmVbJ3BlcnNvbnMnXSlcclxuICAgICAgICAgICAgICAgIF90aGlzLiRzY29wZS5lZGl0U3RvcmVbJ3BlcnNvbnMnXSA9IFtdO1xyXG4gICAgICAgICAgICBfdGhpcy4kc2NvcGUuZWRpdFN0b3JlWydwZXJzb25zJ10ucHVzaCh7IG5hbWU6IFwiUGVyc29uIFwiICsgKF90aGlzLiRzY29wZS5lZGl0U3RvcmVbJ3BlcnNvbnMnXS5sZW5ndGggKyAxKSB9KTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuX3N1Ym1pdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3Mub3BlbigxKTtcclxuICAgICAgICAgICAgdmFyIGNvdW50ID0gMDtcclxuICAgICAgICAgICAgdmFyIHJlUGFyc2UgPSBmYWxzZTtcclxuICAgICAgICAgICAgdmFyIHJlbG9hZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBhc3luYy5mb3JFYWNoT2ZTZXJpZXMoX3RoaXMuY29uc3RydWN0b3IuRklFTERTLCBmdW5jdGlvbiAoZmllbGQsIGtleSwgY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgIGlmIChKU09OLnN0cmluZ2lmeShhbmd1bGFyLmNvcHkoX3RoaXMuJHNjb3BlLmVkaXRTdG9yZVtrZXldKSkgPT0gSlNPTi5zdHJpbmdpZnkoX3RoaXMuZGF0YVN0b3JlLnNldHRpbmdzW2tleV0pKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLnJlUGFyc2UpXHJcbiAgICAgICAgICAgICAgICAgICAgcmVQYXJzZSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBpZiAoZmllbGQucmVsb2FkKVxyXG4gICAgICAgICAgICAgICAgICAgIHJlbG9hZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5zZXQoXCJTYXZpbmcgXCIgKyBrZXkgKyBcIi4uLlwiLCBjb3VudCsrIC8gT2JqZWN0LmtleXMoX3RoaXMuY29uc3RydWN0b3IuRklFTERTKS5sZW5ndGggKiAxMDApO1xyXG4gICAgICAgICAgICAgICAgX3RoaXMuJGh0dHAucHV0KCcvc2V0dGluZ3Mvc2F2ZScsIHsga2V5OiBrZXksIHZhbHVlOiBfdGhpcy4kc2NvcGUuZWRpdFN0b3JlW2tleV0gfSlcclxuICAgICAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLnNldHRpbmdzW2tleV0gPSBfdGhpcy4kc2NvcGUuZWRpdFN0b3JlW2tleV07XHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhuZXcgRXJyb3IoXCJFcnJvciBzYXZpbmcgXCIgKyBrZXkpKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZXJyKVxyXG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KGVycik7XHJcbiAgICAgICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgYXN5bmMud2F0ZXJmYWxsKFtcclxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlUGFyc2UpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5kYXRhVHJhbnNjaWV2ZXIucmVQYXJzZShjYWxsYmFjayk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlbG9hZClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmRhdGFUcmFuc2NpZXZlci5yZWxvYWQoY2FsbGJhY2spO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1dKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLl9vbldhdGNoU2V0dGluZyA9IGZ1bmN0aW9uIChrZXkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIF90aGlzLiRzY29wZS5lZGl0U3RvcmVba2V5XSA9IGFuZ3VsYXIuY29weShfdGhpcy5kYXRhU3RvcmUuc2V0dGluZ3Nba2V5XSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLiRzY29wZS5kYXRhU3RvcmUgPSB0aGlzLmRhdGFTdG9yZTtcclxuICAgICAgICB0aGlzLiRzY29wZS5lZGl0U3RvcmUgPSB7fTtcclxuICAgICAgICB0aGlzLiRzY29wZS5maWVsZHMgPSB0aGlzLmNvbnN0cnVjdG9yLkZJRUxEUztcclxuICAgICAgICB0aGlzLiRzY29wZS51cCA9IHRoaXMuX3VwO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlLmRvd24gPSB0aGlzLl9kb3duO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlLnJlbW92ZSA9IHRoaXMuX3JlbW92ZTtcclxuICAgICAgICB0aGlzLiRzY29wZS5hZGQgPSB0aGlzLl9hZGQ7XHJcbiAgICAgICAgdGhpcy4kc2NvcGUuc3VibWl0ID0gdGhpcy5fc3VibWl0O1xyXG4gICAgICAgIGZvciAodmFyIGZpZWxkTmFtZSBpbiB0aGlzLmNvbnN0cnVjdG9yLkZJRUxEUylcclxuICAgICAgICAgICAgdGhpcy4kc2NvcGUuJHdhdGNoKFwiZGF0YVN0b3JlLnNldHRpbmdzLlwiICsgZmllbGROYW1lLCB0aGlzLl9vbldhdGNoU2V0dGluZyhmaWVsZE5hbWUpKTtcclxuICAgIH1cclxuICAgIFNldHRpbmdzQ29udHJvbGxlci5GSUVMRFMgPSB7XHJcbiAgICAgICAgcGVyc29uczoge1xyXG4gICAgICAgICAgICByZVBhcnNlOiB0cnVlLFxyXG4gICAgICAgICAgICByZWxvYWQ6IHRydWVcclxuICAgICAgICB9LFxyXG4gICAgICAgIHN0YXJ0V29ya2luZ1RpbWU6IHtcclxuICAgICAgICAgICAgaGVhZGluZzogJ1N0YXJ0IFdvcmtpbmcgVGltZScsXHJcbiAgICAgICAgICAgIHR5cGU6ICdudW1iZXInXHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbmRXb3JraW5nVGltZToge1xyXG4gICAgICAgICAgICBoZWFkaW5nOiAnRW5kIFdvcmtpbmcgVGltZScsXHJcbiAgICAgICAgICAgIHR5cGU6ICdudW1iZXInXHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIHJldHVybiBTZXR0aW5nc0NvbnRyb2xsZXI7XHJcbn0pKCk7XHJcbmFuZ3VsYXIubW9kdWxlKCdBcHAnKS5jb250cm9sbGVyKCdTZXR0aW5nc0NvbnRyb2xsZXInLCBbJyRzY29wZScsICckaHR0cCcsICdkYXRhU3RvcmUnLCAnZGF0YVRyYW5zY2lldmVyJywgJ3Byb2dyZXNzJywgU2V0dGluZ3NDb250cm9sbGVyXSk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNldHRpbmdzLWNvbnRyb2xsZXIuanMubWFwIiwidmFyIFRpbWVsaW5lQ29udHJvbGxlciA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBUaW1lbGluZUNvbnRyb2xsZXIoJHNjb3BlLCAkZmlsdGVyLCAkaHR0cCwgZGF0YVN0b3JlLCBkYXRhVHJhbnNjaWV2ZXIpIHtcclxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xyXG4gICAgICAgIHRoaXMuJGZpbHRlciA9ICRmaWx0ZXI7XHJcbiAgICAgICAgdGhpcy4kaHR0cCA9ICRodHRwO1xyXG4gICAgICAgIHRoaXMuZGF0YVN0b3JlID0gZGF0YVN0b3JlO1xyXG4gICAgICAgIHRoaXMuZGF0YVRyYW5zY2lldmVyID0gZGF0YVRyYW5zY2lldmVyO1xyXG4gICAgICAgIHRoaXMuX29uUmFuZ2VDaGFuZ2VkID0gZnVuY3Rpb24gKHByb3BlcnRpZXMpIHtcclxuICAgICAgICAgICAgdmFyIGN1cnJlbnRTdGFydCA9IG1vbWVudChwcm9wZXJ0aWVzLnN0YXJ0KS5zdGFydE9mKCdkYXknKTtcclxuICAgICAgICAgICAgdmFyIGN1cnJlbnRFbmQgPSBtb21lbnQocHJvcGVydGllcy5lbmQpLmVuZE9mKCdkYXknKTtcclxuICAgICAgICAgICAgaWYgKGN1cnJlbnRTdGFydC5pc1NhbWVPckFmdGVyKF90aGlzLiRzY29wZS5zdGFydCkgJiYgY3VycmVudEVuZC5pc1NhbWVPckJlZm9yZShfdGhpcy4kc2NvcGUuZW5kKSlcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgaWYgKCFfdGhpcy4kc2NvcGUuc3RhcnQgfHwgY3VycmVudFN0YXJ0LmlzQmVmb3JlKF90aGlzLiRzY29wZS5zdGFydCkpXHJcbiAgICAgICAgICAgICAgICBfdGhpcy4kc2NvcGUuc3RhcnQgPSBjdXJyZW50U3RhcnQ7XHJcbiAgICAgICAgICAgIGlmICghX3RoaXMuJHNjb3BlLmVuZCB8fCBjdXJyZW50RW5kLmlzQWZ0ZXIoX3RoaXMuJHNjb3BlLmVuZCkpXHJcbiAgICAgICAgICAgICAgICBfdGhpcy4kc2NvcGUuZW5kID0gY3VycmVudEVuZDtcclxuICAgICAgICAgICAgX3RoaXMuX29uUmVsb2FkKCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLl9vblJlbG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgX3RoaXMuZGF0YVRyYW5zY2lldmVyLnJlbG9hZCh7IHN0YXJ0OiBfdGhpcy4kc2NvcGUuc3RhcnQsIGVuZDogX3RoaXMuJHNjb3BlLmVuZCB9LCBfdGhpcy5fb25SZWxvYWRFbmQpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5fb25SZWxvYWRFbmQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIF90aGlzLiRzY29wZS50aW1lbGluZUl0ZW1zLmNsZWFyKCk7XHJcbiAgICAgICAgICAgIHZhciBub3RlcyA9IHt9O1xyXG4gICAgICAgICAgICBmb3IgKHZhciBub3RlR3VpZCBpbiBfdGhpcy5kYXRhU3RvcmUubm90ZXMpIHtcclxuICAgICAgICAgICAgICAgIHZhciBub3RlID0gX3RoaXMuZGF0YVN0b3JlLm5vdGVzW25vdGVHdWlkXTtcclxuICAgICAgICAgICAgICAgIG5vdGVzW25vdGUuZ3VpZF0gPSBub3RlO1xyXG4gICAgICAgICAgICAgICAgdmFyIHRpbWVsaW5lSXRlbSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogbm90ZS5ndWlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwOiAndXBkYXRlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgY29udGVudDogXCI8YSBocmVmPVxcXCJldmVybm90ZTovLy92aWV3L1wiICsgX3RoaXMuZGF0YVN0b3JlLnVzZXIuaWQgKyBcIi9cIiArIF90aGlzLmRhdGFTdG9yZS51c2VyLnNoYXJkSWQgKyBcIi9cIiArIG5vdGUuZ3VpZCArIFwiL1wiICsgbm90ZS5ndWlkICsgXCIvXFxcIiB0aXRsZT1cXFwiXCIgKyBub3RlLnRpdGxlICsgXCJcXFwiPlwiICsgX3RoaXMuJGZpbHRlcignYWJicmV2aWF0ZScpKG5vdGUudGl0bGUsIDQwKSArIFwiPC9hPlwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBtb21lbnQobm90ZS51cGRhdGVkKS50b0RhdGUoKSxcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAncG9pbnQnXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgX3RoaXMuJHNjb3BlLnRpbWVsaW5lSXRlbXMuYWRkKHRpbWVsaW5lSXRlbSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZm9yICh2YXIgbm90ZUd1aWQgaW4gX3RoaXMuZGF0YVN0b3JlLnRpbWVMb2dzKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbm90ZVRpbWVMb2dzID0gX3RoaXMuZGF0YVN0b3JlLnRpbWVMb2dzW25vdGVHdWlkXTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIHRpbWVMb2dJZCBpbiBub3RlVGltZUxvZ3MpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGltZUxvZyA9IG5vdGVUaW1lTG9nc1t0aW1lTG9nSWRdO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBub3RlVGl0bGUgPSBub3Rlc1t0aW1lTG9nLm5vdGVHdWlkXS50aXRsZTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGltZWxpbmVJdGVtID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogdGltZUxvZy5faWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwOiB0aW1lTG9nLnBlcnNvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogXCI8YSBocmVmPVxcXCJldmVybm90ZTovLy92aWV3L1wiICsgX3RoaXMuZGF0YVN0b3JlLnVzZXJbJ2lkJ10gKyBcIi9cIiArIF90aGlzLmRhdGFTdG9yZS51c2VyWydzaGFyZElkJ10gKyBcIi9cIiArIHRpbWVMb2cubm90ZUd1aWQgKyBcIi9cIiArIHRpbWVMb2cubm90ZUd1aWQgKyBcIi9cXFwiIHRpdGxlPVxcXCJcIiArIG5vdGVUaXRsZSArIFwiIFwiICsgdGltZUxvZy5jb21tZW50ICsgXCJcXFwiPlwiICsgX3RoaXMuJGZpbHRlcignYWJicmV2aWF0ZScpKG5vdGVUaXRsZSwgMjApICsgXCIgXCIgKyBfdGhpcy4kZmlsdGVyKCdhYmJyZXZpYXRlJykodGltZUxvZy5jb21tZW50LCAyMCkgKyBcIjwvYT5cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IG1vbWVudCh0aW1lTG9nLmRhdGUpLnRvRGF0ZSgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmQ6IHRpbWVMb2cuc3BlbnRUaW1lID8gbW9tZW50KHRpbWVMb2cuZGF0ZSkuYWRkKHRpbWVMb2cuc3BlbnRUaW1lLCAnbWludXRlcycpLnRvRGF0ZSgpIDogbnVsbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogdGltZUxvZy5zcGVudFRpbWUgPyAncmFuZ2UnIDogJ3BvaW50J1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuJHNjb3BlLnRpbWVsaW5lSXRlbXMuYWRkKHRpbWVsaW5lSXRlbSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuX29uUmVzaXplID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBfdGhpcy4kc2NvcGVbJ3RpbWVsaW5lJ10uc2V0T3B0aW9ucyh7XHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IHdpbmRvdy5pbm5lckhlaWdodCAtIDkwXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy4kc2NvcGUuZGF0YVN0b3JlID0gdGhpcy5kYXRhU3RvcmU7XHJcbiAgICAgICAgdGhpcy4kc2NvcGUudGltZWxpbmVJdGVtcyA9IG5ldyB2aXMuRGF0YVNldCgpO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlLnRpbWVsaW5lR3JvdXBzID0gbmV3IHZpcy5EYXRhU2V0KCk7XHJcbiAgICAgICAgdGhpcy4kc2NvcGUuc3RhcnQgPSBtb21lbnQoKS5zdGFydE9mKCdkYXknKTtcclxuICAgICAgICB0aGlzLiRzY29wZS5lbmQgPSBtb21lbnQoKS5lbmRPZignZGF5Jyk7XHJcbiAgICAgICAgdGhpcy5kYXRhVHJhbnNjaWV2ZXIucmVsb2FkKHsgc3RhcnQ6IHRoaXMuJHNjb3BlLnN0YXJ0LCBlbmQ6IHRoaXMuJHNjb3BlLmVuZCB9LCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGltZWxpbmUnKTtcclxuICAgICAgICAgICAgLy8gc2V0IHdvcmtpbmcgdGltZVxyXG4gICAgICAgICAgICB2YXIgaGlkZGVuRGF0ZXM7XHJcbiAgICAgICAgICAgIGlmIChfdGhpcy5kYXRhU3RvcmUuc2V0dGluZ3MgJiYgX3RoaXMuZGF0YVN0b3JlLnNldHRpbmdzWydzdGFydFdvcmtpbmdUaW1lJ10gJiYgX3RoaXMuZGF0YVN0b3JlLnNldHRpbmdzWydlbmRXb3JraW5nVGltZSddKVxyXG4gICAgICAgICAgICAgICAgaGlkZGVuRGF0ZXMgPSBbe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydDogbW9tZW50KCkuc3VidHJhY3QoMSwgJ2RheXMnKS5zdGFydE9mKCdkYXknKS5ob3VyKF90aGlzLmRhdGFTdG9yZS5zZXR0aW5nc1snZW5kV29ya2luZ1RpbWUnXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZDogbW9tZW50KCkuc3RhcnRPZignZGF5JykuaG91cihfdGhpcy5kYXRhU3RvcmUuc2V0dGluZ3NbJ3N0YXJ0V29ya2luZ1RpbWUnXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcGVhdDogJ2RhaWx5J1xyXG4gICAgICAgICAgICAgICAgICAgIH1dO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBoaWRkZW5EYXRlcyA9IFtdO1xyXG4gICAgICAgICAgICAvLyBnZW5lcmF0ZSB0aW1lbGluZSBvYmplY3RcclxuICAgICAgICAgICAgX3RoaXMuJHNjb3BlWyd0aW1lbGluZSddID0gbmV3IHZpcy5UaW1lbGluZShjb250YWluZXIsIF90aGlzLiRzY29wZS50aW1lbGluZUl0ZW1zLCBfdGhpcy4kc2NvcGUudGltZWxpbmVHcm91cHMsIHtcclxuICAgICAgICAgICAgICAgIG1hcmdpbjogeyBpdGVtOiA1IH0sXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IHdpbmRvdy5pbm5lckhlaWdodCAtIDgwLFxyXG4gICAgICAgICAgICAgICAgb3JpZW50YXRpb246IHsgYXhpczogJ2JvdGgnLCBpdGVtOiAndG9wJyB9LFxyXG4gICAgICAgICAgICAgICAgc3RhcnQ6IF90aGlzLiRzY29wZS5zdGFydCxcclxuICAgICAgICAgICAgICAgIGVuZDogX3RoaXMuJHNjb3BlLmVuZCxcclxuICAgICAgICAgICAgICAgIG9yZGVyOiBmdW5jdGlvbiAoYSwgYikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhLnN0YXJ0LmdldFRpbWUoKSAtIGIuc3RhcnQuZ2V0VGltZSgpO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGhpZGRlbkRhdGVzOiBoaWRkZW5EYXRlc1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgLy8gc2V0IHBlcnNvbiBkYXRhXHJcbiAgICAgICAgICAgIGlmICghX3RoaXMuZGF0YVN0b3JlLnNldHRpbmdzIHx8ICFfdGhpcy5kYXRhU3RvcmUuc2V0dGluZ3NbJ3BlcnNvbnMnXSlcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IF90aGlzLmRhdGFTdG9yZS5zZXR0aW5nc1sncGVyc29ucyddOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHBlcnNvbiA9IF9hW19pXTtcclxuICAgICAgICAgICAgICAgIF90aGlzLiRzY29wZS50aW1lbGluZUdyb3Vwcy5hZGQoe1xyXG4gICAgICAgICAgICAgICAgICAgIGlkOiBwZXJzb24ubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBwZXJzb24ubmFtZVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgX3RoaXMuJHNjb3BlLnRpbWVsaW5lR3JvdXBzLmFkZCh7XHJcbiAgICAgICAgICAgICAgICBpZDogJ3VwZGF0ZWQnLFxyXG4gICAgICAgICAgICAgICAgY29udGVudDogJ1VwZGF0ZSdcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIC8vIGFkZCBldmVudHNcclxuICAgICAgICAgICAgX3RoaXMuJHNjb3BlWyd0aW1lbGluZSddLm9uKCdyYW5nZWNoYW5nZWQnLCBfdGhpcy5fb25SYW5nZUNoYW5nZWQpO1xyXG4gICAgICAgICAgICBfdGhpcy4kc2NvcGUuJG9uKCdyZXNpemU6OnJlc2l6ZScsIF90aGlzLl9vblJlc2l6ZSk7XHJcbiAgICAgICAgICAgIF90aGlzLiRzY29wZS4kb24oJ2V2ZW50OjpyZWxvYWQnLCBfdGhpcy5fb25SZWxvYWQpO1xyXG4gICAgICAgICAgICAvLyByZWxvYWRcclxuICAgICAgICAgICAgX3RoaXMuX29uUmVsb2FkRW5kKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gVGltZWxpbmVDb250cm9sbGVyO1xyXG59KSgpO1xyXG5hbmd1bGFyLm1vZHVsZSgnQXBwJykuY29udHJvbGxlcignVGltZWxpbmVDb250cm9sbGVyJywgWyckc2NvcGUnLCAnJGZpbHRlcicsICckaHR0cCcsICdkYXRhU3RvcmUnLCAnZGF0YVRyYW5zY2lldmVyJywgVGltZWxpbmVDb250cm9sbGVyXSk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXRpbWVsaW5lLWNvbnRyb2xsZXIuanMubWFwIiwiYW5ndWxhci5tb2R1bGUoJ0FwcCcpLmRpcmVjdGl2ZSgncmVzaXplJywgZnVuY3Rpb24gKCR0aW1lb3V0LCAkcm9vdFNjb3BlLCAkd2luZG93KSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHRpbWVyID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGFuZ3VsYXIuZWxlbWVudCgkd2luZG93KS5vbignbG9hZCByZXNpemUnLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aW1lcilcclxuICAgICAgICAgICAgICAgICAgICAkdGltZW91dC5jYW5jZWwodGltZXIpO1xyXG4gICAgICAgICAgICAgICAgdGltZXIgPSAkdGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdyZXNpemU6OnJlc2l6ZScpO1xyXG4gICAgICAgICAgICAgICAgfSwgMjAwKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufSk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXJlc2l6ZS5qcy5tYXAiLCJ2YXIgYWJicmV2aWF0ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAodGV4dCwgbGVuLCB0cnVuY2F0aW9uKSB7XHJcbiAgICAgICAgaWYgKGxlbiA9PT0gdm9pZCAwKSB7IGxlbiA9IDEwOyB9XHJcbiAgICAgICAgaWYgKHRydW5jYXRpb24gPT09IHZvaWQgMCkgeyB0cnVuY2F0aW9uID0gJy4uLic7IH1cclxuICAgICAgICB2YXIgY291bnQgPSAwO1xyXG4gICAgICAgIHZhciBzdHIgPSAnJztcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRleHQubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIG4gPSBlbmNvZGVVUkkodGV4dC5jaGFyQXQoaSkpO1xyXG4gICAgICAgICAgICBpZiAobi5sZW5ndGggPCA0KVxyXG4gICAgICAgICAgICAgICAgY291bnQrKztcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgY291bnQgKz0gMjtcclxuICAgICAgICAgICAgaWYgKGNvdW50ID4gbGVuKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0ciArIHRydW5jYXRpb247XHJcbiAgICAgICAgICAgIHN0ciArPSB0ZXh0LmNoYXJBdChpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRleHQ7XHJcbiAgICB9O1xyXG59O1xyXG5hbmd1bGFyLm1vZHVsZSgnQXBwJykuZmlsdGVyKCdhYmJyZXZpYXRlJywgYWJicmV2aWF0ZSk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFiYnJldmlhdGUuanMubWFwIiwidmFyIGNoZWNrSXRlbU1hdGNoZXMgPSBmdW5jdGlvbiAoaXRlbSwgcHJvcHMpIHtcclxuICAgIHZhciBpdGVtTWF0Y2hlcyA9IGZhbHNlO1xyXG4gICAgZm9yICh2YXIgcHJvcCBpbiBwcm9wcykge1xyXG4gICAgICAgIHZhciB0ZXh0ID0gcHJvcHNbcHJvcF07XHJcbiAgICAgICAgdGV4dCA9IHRleHQudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICBpZiAoaXRlbVtwcm9wXS50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkuaW5kZXhPZih0ZXh0KSAhPSAtMSkge1xyXG4gICAgICAgICAgICBpdGVtTWF0Y2hlcyA9IHRydWU7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBpdGVtTWF0Y2hlcztcclxufTtcclxudmFyIGZpbHRlckJ5UHJvcGVydHkgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKGl0ZW1zLCBwcm9wcykge1xyXG4gICAgICAgIHZhciBvdXQgPSBbXTtcclxuICAgICAgICBpZiAoYW5ndWxhci5pc0FycmF5KGl0ZW1zKSlcclxuICAgICAgICAgICAgZm9yICh2YXIgaXRlbSBpbiBpdGVtcykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGl0ZW1NYXRjaGVzID0gY2hlY2tJdGVtTWF0Y2hlcyhpdGVtLCBwcm9wcyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlbU1hdGNoZXMpXHJcbiAgICAgICAgICAgICAgICAgICAgb3V0LnB1c2goaXRlbSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChhbmd1bGFyLmlzT2JqZWN0KGl0ZW1zKSlcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgaXRlbXMubGVuZ3RoOyBfaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBpdGVtc1tfaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1NYXRjaGVzID0gY2hlY2tJdGVtTWF0Y2hlcyhpdGVtLCBwcm9wcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpdGVtTWF0Y2hlcylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dC5wdXNoKGl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICBvdXQgPSBpdGVtcztcclxuICAgICAgICAgICAgICAgIHJldHVybiBvdXQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgIH07XHJcbn07XHJcbmFuZ3VsYXIubW9kdWxlKCdBcHAnKS5maWx0ZXIoJ2ZpbHRlckJ5UHJvcGVydHknLCBmaWx0ZXJCeVByb3BlcnR5KTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZmlsdGVyLWJ5LXByb3BlcnR5LmpzLm1hcCIsInZhciBvYmplY3RMZW5ndGggPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgX29iamVjdExlbmd0aCA9IGZ1bmN0aW9uIChpbnB1dCwgZGVwdGgpIHtcclxuICAgICAgICBpZiAoZGVwdGggPT09IHZvaWQgMCkgeyBkZXB0aCA9IDA7IH1cclxuICAgICAgICBpZiAoIWFuZ3VsYXIuaXNPYmplY3QoaW5wdXQpKVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVc2FnZSBvZiBub24tb2JqZWN0cyB3aXRoIG9iamVjdExlbmd0aCBmaWx0ZXIuXCIpO1xyXG4gICAgICAgIGlmIChkZXB0aCA9PSAwKVxyXG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMoaW5wdXQpLmxlbmd0aDtcclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IDA7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBpbnB1dClcclxuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGlucHV0W2tleV07XHJcbiAgICAgICAgICAgIHJlc3VsdCArPSBfb2JqZWN0TGVuZ3RoKHZhbHVlLCBkZXB0aCAtIDEpO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICByZXR1cm4gX29iamVjdExlbmd0aDtcclxufTtcclxuYW5ndWxhci5tb2R1bGUoJ0FwcCcpLmZpbHRlcignb2JqZWN0TGVuZ3RoJywgb2JqZWN0TGVuZ3RoKTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9b2JqZWN0LWxlbmd0aC5qcy5tYXAiLCJ2YXIgb3JkZXJPYmplY3RCeSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAoaXRlbXMsIGZpZWxkLCByZXZlcnNlKSB7XHJcbiAgICAgICAgaWYgKGZpZWxkID09PSB2b2lkIDApIHsgZmllbGQgPSAnJHZhbHVlJzsgfVxyXG4gICAgICAgIGlmIChyZXZlcnNlID09PSB2b2lkIDApIHsgcmV2ZXJzZSA9IHRydWU7IH1cclxuICAgICAgICB2YXIgZmlsdGVyZWQgPSBbXTtcclxuICAgICAgICBhbmd1bGFyLmZvckVhY2goaXRlbXMsIGZ1bmN0aW9uIChpdGVtLCBrZXkpIHtcclxuICAgICAgICAgICAgZmlsdGVyZWQucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBrZXk6IGtleSxcclxuICAgICAgICAgICAgICAgIGl0ZW06IGl0ZW1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZmlsdGVyZWQuc29ydChmdW5jdGlvbiAoYSwgYikge1xyXG4gICAgICAgICAgICBpZiAoZmllbGQgPT0gJyRrZXknKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIChhLmtleSA+IGIua2V5KSA/IC0xIDogMTtcclxuICAgICAgICAgICAgaWYgKGZpZWxkID09ICckdmFsdWUnKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIChhLml0ZW0gPiBiLml0ZW0pID8gLTEgOiAxO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGZpZWxkID09ICdzdHJpbmcnKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIChhW2ZpZWxkXSA+IGJbZmllbGRdKSA/IC0xIDogMTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBmaWVsZCA9PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIChmaWVsZChhLml0ZW0sIGEua2V5KSA+IGZpZWxkKGIuaXRlbSwgYi5rZXkpKSA/IC0xIDogMTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBpZiAocmV2ZXJzZSlcclxuICAgICAgICAgICAgZmlsdGVyZWQucmV2ZXJzZSgpO1xyXG4gICAgICAgIHZhciByZXN1bHRzID0gW107XHJcbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKGZpbHRlcmVkLCBmdW5jdGlvbiAoaXRlbSkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gaXRlbS5pdGVtO1xyXG4gICAgICAgICAgICByZXN1bHRbJyRrZXknXSA9IGl0ZW0ua2V5O1xyXG4gICAgICAgICAgICByZXN1bHRzLnB1c2gocmVzdWx0KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0cztcclxuICAgIH07XHJcbn07XHJcbmFuZ3VsYXIubW9kdWxlKCdBcHAnKS5maWx0ZXIoJ29yZGVyT2JqZWN0QnknLCBvcmRlck9iamVjdEJ5KTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9b3JkZXItb2JqZWN0LWJ5LmpzLm1hcCIsInZhciBzcGVudFRpbWUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKGlucHV0KSB7XHJcbiAgICAgICAgaWYgKGlucHV0ID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIHJldHVybiAnJztcclxuICAgICAgICBpZiAoIWlucHV0KVxyXG4gICAgICAgICAgICByZXR1cm4gJzBtJztcclxuICAgICAgICB2YXIgaG91ciA9IE1hdGguZmxvb3IoaW5wdXQgLyA2MCk7XHJcbiAgICAgICAgdmFyIG1pbnV0ZSA9IGlucHV0ICUgNjA7XHJcbiAgICAgICAgaWYgKGhvdXIpXHJcbiAgICAgICAgICAgIHJldHVybiBob3VyICsgJ2gnICsgbWludXRlICsgJ20nO1xyXG4gICAgICAgIHJldHVybiBtaW51dGUgKyAnbSc7XHJcbiAgICB9O1xyXG59O1xyXG5hbmd1bGFyLm1vZHVsZSgnQXBwJykuZmlsdGVyKCdzcGVudFRpbWUnLCBzcGVudFRpbWUpO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1zcGVudC10aW1lLmpzLm1hcCIsIi8vIGFuZ3VsYXIuanMgc2V0dGluZ1xyXG5hbmd1bGFyLm1vZHVsZSgnQXBwJywgWyduZ1JvdXRlJywgJ3VpLmJvb3RzdHJhcCcsICduZ1Nhbml0aXplJywgJ3VpLnNlbGVjdCddKTtcclxuYW5ndWxhci5tb2R1bGUoJ0FwcCcpLmNvbmZpZyhbJyRjb21waWxlUHJvdmlkZXInLCBmdW5jdGlvbiAoJGNvbXBpbGVQcm92aWRlcikge1xyXG4gICAgICAgICRjb21waWxlUHJvdmlkZXIuYUhyZWZTYW5pdGl6YXRpb25XaGl0ZWxpc3QoL15cXHMqKGh0dHB8aHR0cHN8bWFpbHRvfGV2ZXJub3RlKTovKTtcclxuICAgIH1dKTtcclxuLy8gcm91dGUgc2V0dGluZ3NcclxucmVxdWlyZSgnLi9yb3V0ZScpO1xyXG4vLyBhbmd1bGFyLmpzIGZpbHRlcnNcclxucmVxdWlyZSgnLi9maWx0ZXJzL2FiYnJldmlhdGUnKTtcclxucmVxdWlyZSgnLi9maWx0ZXJzL2ZpbHRlci1ieS1wcm9wZXJ0eScpO1xyXG5yZXF1aXJlKCcuL2ZpbHRlcnMvb2JqZWN0LWxlbmd0aCcpO1xyXG5yZXF1aXJlKCcuL2ZpbHRlcnMvb3JkZXItb2JqZWN0LWJ5Jyk7XHJcbnJlcXVpcmUoJy4vZmlsdGVycy9zcGVudC10aW1lJyk7XHJcbi8vIGFuZ3VsYXIuanMgc2VydmljZXNcclxucmVxdWlyZSgnLi9zZXJ2aWNlcy9kYXRhLXN0b3JlJyk7XHJcbnJlcXVpcmUoJy4vc2VydmljZXMvZGF0YS10cmFuc2NpZXZlcicpO1xyXG5yZXF1aXJlKCcuL3NlcnZpY2VzL3Byb2dyZXNzJyk7XHJcbi8vIGFuZ3VsYXIuanMgZGlyZWN0aXZlc1xyXG5yZXF1aXJlKCcuL2RpcmVjdGl2ZXMvcmVzaXplJyk7XHJcbi8vIGFuZ3VsYXIuanMgY29udHJvbGxlcnNcclxucmVxdWlyZSgnLi9jb250cm9sbGVycy9hdXRoLWNvbnRyb2xsZXInKTtcclxucmVxdWlyZSgnLi9jb250cm9sbGVycy9jb250cm9sbGVyJyk7XHJcbnJlcXVpcmUoJy4vY29udHJvbGxlcnMvbWVudS1jb250cm9sbGVyJyk7XHJcbnJlcXVpcmUoJy4vY29udHJvbGxlcnMvbmF2aWdhdGlvbi1jb250cm9sbGVyJyk7XHJcbnJlcXVpcmUoJy4vY29udHJvbGxlcnMvbm90ZXMtY29udHJvbGxlcicpO1xyXG5yZXF1aXJlKCcuL2NvbnRyb2xsZXJzL3Byb2dyZXNzLW1vZGFsLWNvbnRyb2xsZXInKTtcclxucmVxdWlyZSgnLi9jb250cm9sbGVycy9zZXR0aW5ncy1jb250cm9sbGVyJyk7XHJcbnJlcXVpcmUoJy4vY29udHJvbGxlcnMvdGltZWxpbmUtY29udHJvbGxlcicpO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJhbmd1bGFyLm1vZHVsZSgnQXBwJykuY29uZmlnKFsnJHJvdXRlUHJvdmlkZXInLCBmdW5jdGlvbiAoJHJvdXRlUHJvdmlkZXIpIHtcclxuICAgICAgICAkcm91dGVQcm92aWRlclxyXG4gICAgICAgICAgICAud2hlbignLycsIHtcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdtZW51J1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgICAgIC53aGVuKCcvdGltZWxpbmUnLCB7XHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndGltZWxpbmUnXHJcbiAgICAgICAgfSlcclxuICAgICAgICAgICAgLndoZW4oJy9ub3RlcycsIHtcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdub3RlcydcclxuICAgICAgICB9KVxyXG4gICAgICAgICAgICAud2hlbignL3NldHRpbmdzJywge1xyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3NldHRpbmdzJ1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5vdGhlcndpc2Uoe1xyXG4gICAgICAgICAgICByZWRpcmVjdFRvOiAnLydcclxuICAgICAgICB9KTtcclxuICAgIH1dKTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cm91dGUuanMubWFwIiwidmFyIERhdGFTdG9yZVNlcnZpY2UgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gRGF0YVN0b3JlU2VydmljZSgpIHtcclxuICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xyXG4gICAgICAgIHRoaXMucGVyc29ucyA9IFtdO1xyXG4gICAgICAgIHRoaXMubm90ZWJvb2tzID0ge307XHJcbiAgICAgICAgdGhpcy5zdGFja3MgPSBbXTtcclxuICAgICAgICB0aGlzLm5vdGVzID0ge307XHJcbiAgICAgICAgdGhpcy50aW1lTG9ncyA9IHt9O1xyXG4gICAgICAgIHRoaXMucHJvZml0TG9ncyA9IHt9O1xyXG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSB7fTtcclxuICAgIH1cclxuICAgIHJldHVybiBEYXRhU3RvcmVTZXJ2aWNlO1xyXG59KSgpO1xyXG5leHBvcnRzLkRhdGFTdG9yZVNlcnZpY2UgPSBEYXRhU3RvcmVTZXJ2aWNlO1xyXG5hbmd1bGFyLm1vZHVsZSgnQXBwJykuc2VydmljZSgnZGF0YVN0b3JlJywgW0RhdGFTdG9yZVNlcnZpY2VdKTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YS1zdG9yZS5qcy5tYXAiLCJ2YXIgYXN5bmMgPSByZXF1aXJlKCdhc3luYycpO1xyXG52YXIgbWVyZ2UgPSByZXF1aXJlKCdtZXJnZScpO1xyXG52YXIgRGF0YVRyYW5zY2lldmVyU2VydmljZSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBEYXRhVHJhbnNjaWV2ZXJTZXJ2aWNlKCRodHRwLCBkYXRhU3RvcmUsIHByb2dyZXNzKSB7XHJcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICB0aGlzLiRodHRwID0gJGh0dHA7XHJcbiAgICAgICAgdGhpcy5kYXRhU3RvcmUgPSBkYXRhU3RvcmU7XHJcbiAgICAgICAgdGhpcy5wcm9ncmVzcyA9IHByb2dyZXNzO1xyXG4gICAgICAgIHRoaXMuZmlsdGVyUGFyYW1zID0gbnVsbDtcclxuICAgICAgICB0aGlzLnJlbG9hZCA9IGZ1bmN0aW9uIChwYXJhbXMsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJhbXMgPT09IHZvaWQgMCkgeyBwYXJhbXMgPSB7fTsgfVxyXG4gICAgICAgICAgICBpZiAoIWNhbGxiYWNrKVxyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB2YXIgbm90ZVF1ZXJ5ID0gX3RoaXMuX21ha2VOb3RlUXVlcnkocGFyYW1zIHx8IHt9KTtcclxuICAgICAgICAgICAgdmFyIG5vdGVDb3VudCA9IDA7XHJcbiAgICAgICAgICAgIF90aGlzLnByb2dyZXNzLm9wZW4oMTApO1xyXG4gICAgICAgICAgICBhc3luYy5zZXJpZXMoW1xyXG4gICAgICAgICAgICAgICAgLy8gZ2V0IHVzZXJcclxuICAgICAgICAgICAgICAgIC8vIGdldCB1c2VyXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoX3RoaXMuZGF0YVN0b3JlLnVzZXIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnByb2dyZXNzLm5leHQoJ0dldHRpbmcgdXNlciBkYXRhLicpO1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLiRodHRwLmdldCgnL3VzZXInKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5kYXRhU3RvcmUudXNlciA9IGRhdGE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobmV3IEVycm9yKCdFcnJvciAkaHR0cCByZXF1ZXN0JykpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIC8vIGdldCBzZXR0aW5nc1xyXG4gICAgICAgICAgICAgICAgLy8gZ2V0IHNldHRpbmdzXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5uZXh0KCdHZXR0aW5nIHNldHRpbmdzIGRhdGEuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuJGh0dHAuZ2V0KCcvc2V0dGluZ3MnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5kYXRhU3RvcmUuc2V0dGluZ3MgPSBkYXRhO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcignRXJyb3IgJGh0dHAgcmVxdWVzdCcpKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAvLyBjaGVjayBzZXR0aW5nc1xyXG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgc2V0dGluZ3NcclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghX3RoaXMuZGF0YVN0b3JlLnNldHRpbmdzWydwZXJzb25zJ10gfHwgX3RoaXMuZGF0YVN0b3JlLnNldHRpbmdzWydwZXJzb25zJ10ubGVuZ3RoID09IDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoJ1RoaXMgYXBwIG5lZWQgcGVyc29ucyBzZXR0aW5nLiBQbGVhc2Ugc3dpdGNoIFwiU2V0dGluZ3MgUGFnZVwiIGFuZCBzZXQgeW91ciBwZXJzb25zIGRhdGEuJykpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgLy8gc3luY1xyXG4gICAgICAgICAgICAgICAgLy8gc3luY1xyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3MubmV4dCgnU3luY2luZyByZW1vdGUgc2VydmVyLicpO1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLiRodHRwLmdldCgnL3N5bmMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobmV3IEVycm9yKCdFcnJvciAkaHR0cCByZXF1ZXN0JykpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIC8vIGdldCBub3RlYm9va3NcclxuICAgICAgICAgICAgICAgIC8vIGdldCBub3RlYm9va3NcclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnByb2dyZXNzLm5leHQoJ0dldHRpbmcgbm90ZWJvb2tzIGRhdGEuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuJGh0dHAuZ2V0KCcvbm90ZWJvb2tzJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLm5vdGVib29rcyA9IHt9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3RhY2tIYXNoID0ge307XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBkYXRhLmxlbmd0aDsgX2krKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5vdGVib29rID0gZGF0YVtfaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5kYXRhU3RvcmUubm90ZWJvb2tzW25vdGVib29rLmd1aWRdID0gbm90ZWJvb2s7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobm90ZWJvb2suc3RhY2spXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2tIYXNoW25vdGVib29rLnN0YWNrXSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLnN0YWNrcyA9IE9iamVjdC5rZXlzKHN0YWNrSGFzaCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobmV3IEVycm9yKCdFcnJvciAkaHR0cCByZXF1ZXN0JykpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnByb2dyZXNzLm5leHQoJ0dldHRpbmcgbm90ZXMgY291bnQuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuJGh0dHAuZ2V0KCcvbm90ZXMvY291bnQnLCB7IHBhcmFtczogeyBxdWVyeTogbm90ZVF1ZXJ5IH0gfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbm90ZUNvdW50ID0gZGF0YTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5vdGVDb3VudCA+IDEwMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3aW5kb3cuY29uZmlybShcIkN1cnJlbnQgcXVlcnkgZmluZCBcIiArIG5vdGVDb3VudCArIFwiIG5vdGVzLiBJdCBpcyB0b28gbWFueS4gQ29udGludWUgYW55d2F5P1wiKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcignVXNlciBDYW5jZWxlZCcpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhuZXcgRXJyb3IoJ0Vycm9yICRodHRwIHJlcXVlc3QnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgLy8gZ2V0IG5vdGVzXHJcbiAgICAgICAgICAgICAgICAvLyBnZXQgbm90ZXNcclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnByb2dyZXNzLm5leHQoJ0dldHRpbmcgbm90ZXMuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuJGh0dHAuZ2V0KCcvbm90ZXMnLCB7IHBhcmFtczogeyBxdWVyeTogbm90ZVF1ZXJ5IH0gfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLm5vdGVzID0ge307XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBkYXRhLmxlbmd0aDsgX2krKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5vdGUgPSBkYXRhW19pXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmRhdGFTdG9yZS5ub3Rlc1tub3RlLmd1aWRdID0gbm90ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcignRXJyb3IgJGh0dHAgcmVxdWVzdCcpKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAvLyBnZXQgY29udGVudCBmcm9tIHJlbW90ZVxyXG4gICAgICAgICAgICAgICAgLy8gZ2V0IGNvbnRlbnQgZnJvbSByZW1vdGVcclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnByb2dyZXNzLm5leHQoJ1JlcXVlc3QgcmVtb3RlIGNvbnRlbnRzLicpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb3VudCA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgYXN5bmMuZm9yRWFjaE9mU2VyaWVzKF90aGlzLmRhdGFTdG9yZS5ub3RlcywgZnVuY3Rpb24gKG5vdGUsIG5vdGVHdWlkLCBjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5zZXQoXCJSZXF1ZXN0IHJlbW90ZSBjb250ZW50cy4gXCIgKyArK2NvdW50ICsgXCIgLyBcIiArIE9iamVjdC5rZXlzKF90aGlzLmRhdGFTdG9yZS5ub3RlcykubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFub3RlLmhhc0NvbnRlbnQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy4kaHR0cC5nZXQoJy9ub3Rlcy9nZXQtY29udGVudCcsIHsgcGFyYW1zOiB7IHF1ZXJ5OiB7IGd1aWQ6IG5vdGVHdWlkIH0gfSB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGRhdGEubGVuZ3RoOyBfaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGUgPSBkYXRhW19pXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLm5vdGVzW25vdGUuZ3VpZF0gPSBub3RlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcignRXJyb3IgJGh0dHAgcmVxdWVzdCcpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAvLyBnZXQgdGltZSBsb2dzXHJcbiAgICAgICAgICAgICAgICAvLyBnZXQgdGltZSBsb2dzXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5uZXh0KCdHZXR0aW5nIHRpbWUgbG9ncy4nKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZ3VpZHMgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBub3RlR3VpZCBpbiBfdGhpcy5kYXRhU3RvcmUubm90ZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5vdGUgPSBfdGhpcy5kYXRhU3RvcmUubm90ZXNbbm90ZUd1aWRdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBndWlkcy5wdXNoKG5vdGUuZ3VpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0aW1lTG9nUXVlcnkgPSBfdGhpcy5fbWFrZVRpbWVMb2dRdWVyeShtZXJnZSh0cnVlLCBwYXJhbXMsIHsgbm90ZUd1aWRzOiBndWlkcyB9KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuJGh0dHAucG9zdCgnL3RpbWUtbG9ncycsIHsgcXVlcnk6IHRpbWVMb2dRdWVyeSB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5kYXRhU3RvcmUudGltZUxvZ3MgPSB7fTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGRhdGEubGVuZ3RoOyBfaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGltZUxvZyA9IGRhdGFbX2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFfdGhpcy5kYXRhU3RvcmUudGltZUxvZ3NbdGltZUxvZy5ub3RlR3VpZF0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLnRpbWVMb2dzW3RpbWVMb2cubm90ZUd1aWRdID0ge307XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5kYXRhU3RvcmUudGltZUxvZ3NbdGltZUxvZy5ub3RlR3VpZF1bdGltZUxvZy5faWRdID0gdGltZUxvZztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcignRXJyb3IgJGh0dHAgcmVxdWVzdCcpKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAvLyBnZXQgcHJvZml0IGxvZ3NcclxuICAgICAgICAgICAgICAgIC8vIGdldCBwcm9maXQgbG9nc1xyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3MubmV4dCgnR2V0dGluZyBwcm9maXQgbG9ncy4nKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZ3VpZHMgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBub3RlR3VpZCBpbiBfdGhpcy5kYXRhU3RvcmUubm90ZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5vdGUgPSBfdGhpcy5kYXRhU3RvcmUubm90ZXNbbm90ZUd1aWRdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBndWlkcy5wdXNoKG5vdGUuZ3VpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLiRodHRwLnBvc3QoJy9wcm9maXQtbG9ncycsIHsgcXVlcnk6IHsgbm90ZUd1aWQ6IHsgJGluOiBndWlkcyB9IH0gfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLnByb2ZpdExvZ3MgPSB7fTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGRhdGEubGVuZ3RoOyBfaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJvZml0TG9nID0gZGF0YVtfaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIV90aGlzLmRhdGFTdG9yZS5wcm9maXRMb2dzW3Byb2ZpdExvZy5ub3RlR3VpZF0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLnByb2ZpdExvZ3NbcHJvZml0TG9nLm5vdGVHdWlkXSA9IHt9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLnByb2ZpdExvZ3NbcHJvZml0TG9nLm5vdGVHdWlkXVtwcm9maXRMb2cuX2lkXSA9IHByb2ZpdExvZztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcignRXJyb3IgJGh0dHAgcmVxdWVzdCcpKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIF0sIGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgICAgICAgICAgIGlmIChlcnIpXHJcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoZXJyKTtcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5uZXh0KCdEb25lLicpO1xyXG4gICAgICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3MuY2xvc2UoKTtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5yZVBhcnNlID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIGlmICghY2FsbGJhY2spXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIF90aGlzLnByb2dyZXNzLm9wZW4oMik7XHJcbiAgICAgICAgICAgIF90aGlzLnByb2dyZXNzLm5leHQoJ1JlIFBhcnNlIG5vdGVzLi4uJyk7XHJcbiAgICAgICAgICAgIGFzeW5jLndhdGVyZmFsbChbXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy4kaHR0cC5nZXQoJy9ub3Rlcy9yZS1wYXJzZScpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcignRXJyb3IgJGh0dHAgcmVxdWVzdCcpKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1dLCBmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5uZXh0KCdEb25lLicpO1xyXG4gICAgICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3MuY2xvc2UoKTtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5jb3VudE5vdGVzID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIHZhciBxdWVyeSA9IF90aGlzLl9tYWtlTm90ZVF1ZXJ5KCk7XHJcbiAgICAgICAgICAgIF90aGlzLiRodHRwLmdldCgnL25vdGVzL2NvdW50JywgeyBwYXJhbXM6IHsgcXVlcnk6IHF1ZXJ5IH0gfSlcclxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCBkYXRhKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhuZXcgRXJyb3IoJ0Vycm9yICRodHRwIHJlcXVlc3QnKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5jb3VudFRpbWVMb2dzID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIHZhciBxdWVyeSA9IF90aGlzLl9tYWtlVGltZUxvZ1F1ZXJ5KCk7XHJcbiAgICAgICAgICAgIF90aGlzLiRodHRwLmdldCgnL3RpbWUtbG9ncy9jb3VudCcsIHsgcGFyYW1zOiB7IHF1ZXJ5OiBxdWVyeSB9IH0pXHJcbiAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgZGF0YSk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobmV3IEVycm9yKCdFcnJvciAkaHR0cCByZXF1ZXN0JykpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuX21ha2VOb3RlUXVlcnkgPSBmdW5jdGlvbiAocGFyYW1zKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJhbXMgPT09IHZvaWQgMCkgeyBwYXJhbXMgPSB7fTsgfVxyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0ge307XHJcbiAgICAgICAgICAgIC8vIHNldCB1cGRhdGVkIHF1ZXJ5XHJcbiAgICAgICAgICAgIGlmIChwYXJhbXMuc3RhcnQpXHJcbiAgICAgICAgICAgICAgICBtZXJnZShyZXN1bHQsIHsgdXBkYXRlZDogeyAkZ3RlOiBwYXJhbXMuc3RhcnQudmFsdWVPZigpIH0gfSk7XHJcbiAgICAgICAgICAgIC8vIGNoZWNrIG5vdGVib29rc1xyXG4gICAgICAgICAgICB2YXIgbm90ZWJvb2tzSGFzaCA9IHt9O1xyXG4gICAgICAgICAgICBpZiAoX3RoaXMuZmlsdGVyUGFyYW1zLm5vdGVib29rR3VpZHMgJiYgX3RoaXMuZmlsdGVyUGFyYW1zLm5vdGVib29rR3VpZHMubGVuZ3RoID4gMClcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSBfdGhpcy5maWx0ZXJQYXJhbXMubm90ZWJvb2tHdWlkczsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbm90ZWJvb2tHdWlkID0gX2FbX2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIG5vdGVib29rc0hhc2hbbm90ZWJvb2tHdWlkXSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIGNoZWNrIHN0YWNrc1xyXG4gICAgICAgICAgICBpZiAoX3RoaXMuZmlsdGVyUGFyYW1zLnN0YWNrcyAmJiBfdGhpcy5maWx0ZXJQYXJhbXMuc3RhY2tzLmxlbmd0aCA+IDApXHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfYiA9IDAsIF9jID0gX3RoaXMuZmlsdGVyUGFyYW1zLnN0YWNrczsgX2IgPCBfYy5sZW5ndGg7IF9iKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgc3RhY2sgPSBfY1tfYl07XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbm90ZWJvb2tHdWlkXzEgaW4gX3RoaXMuZGF0YVN0b3JlLm5vdGVib29rcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbm90ZWJvb2sgPSBfdGhpcy5kYXRhU3RvcmUubm90ZWJvb2tzW25vdGVib29rR3VpZF8xXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0YWNrID09IG5vdGVib29rLnN0YWNrKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90ZWJvb2tzSGFzaFtub3RlYm9vay5ndWlkXSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBzZXQgbm90ZWJvb2tzIHF1ZXJ5IGNoZWNrZWQgYmVmb3JlXHJcbiAgICAgICAgICAgIHZhciBub3RlYm9va3NBcnJheSA9IE9iamVjdC5rZXlzKG5vdGVib29rc0hhc2gpO1xyXG4gICAgICAgICAgICBpZiAobm90ZWJvb2tzQXJyYXkubGVuZ3RoID4gMClcclxuICAgICAgICAgICAgICAgIG1lcmdlKHJlc3VsdCwgeyBub3RlYm9va0d1aWQ6IHsgJGluOiBub3RlYm9va3NBcnJheSB9IH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5fbWFrZVRpbWVMb2dRdWVyeSA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcclxuICAgICAgICAgICAgaWYgKHBhcmFtcyA9PT0gdm9pZCAwKSB7IHBhcmFtcyA9IHt9OyB9XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSB7fTtcclxuICAgICAgICAgICAgLy8gc2V0IGRhdGUgcXVlcnlcclxuICAgICAgICAgICAgaWYgKHBhcmFtcy5zdGFydClcclxuICAgICAgICAgICAgICAgIG1lcmdlLnJlY3Vyc2l2ZShyZXN1bHQsIHsgZGF0ZTogeyAkZ3RlOiBwYXJhbXMuc3RhcnQudmFsdWVPZigpIH0gfSk7XHJcbiAgICAgICAgICAgIGlmIChwYXJhbXMuZW5kKVxyXG4gICAgICAgICAgICAgICAgbWVyZ2UucmVjdXJzaXZlKHJlc3VsdCwgeyBkYXRlOiB7ICRsdGU6IHBhcmFtcy5lbmQudmFsdWVPZigpIH0gfSk7XHJcbiAgICAgICAgICAgIC8vIHNldCBub3RlIGd1aWRzIHF1ZXJ5XHJcbiAgICAgICAgICAgIGlmIChwYXJhbXMubm90ZUd1aWRzKVxyXG4gICAgICAgICAgICAgICAgbWVyZ2UocmVzdWx0LCB7IG5vdGVHdWlkOiB7ICRpbjogcGFyYW1zLm5vdGVHdWlkcyB9IH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5maWx0ZXJQYXJhbXMgPSB7XHJcbiAgICAgICAgICAgIG5vdGVib29rR3VpZHM6IFtdLFxyXG4gICAgICAgICAgICBzdGFja3M6IFtdXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIHJldHVybiBEYXRhVHJhbnNjaWV2ZXJTZXJ2aWNlO1xyXG59KSgpO1xyXG5leHBvcnRzLkRhdGFUcmFuc2NpZXZlclNlcnZpY2UgPSBEYXRhVHJhbnNjaWV2ZXJTZXJ2aWNlO1xyXG5hbmd1bGFyLm1vZHVsZSgnQXBwJykuc2VydmljZSgnZGF0YVRyYW5zY2lldmVyJywgWyckaHR0cCcsICdkYXRhU3RvcmUnLCAncHJvZ3Jlc3MnLCBEYXRhVHJhbnNjaWV2ZXJTZXJ2aWNlXSk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGEtdHJhbnNjaWV2ZXIuanMubWFwIiwidmFyIFByb2dyZXNzU2VydmljZSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBQcm9ncmVzc1NlcnZpY2UoJG1vZGFsKSB7XHJcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICB0aGlzLiRtb2RhbCA9ICRtb2RhbDtcclxuICAgICAgICB0aGlzLm1vZGFsSW5zdGFuY2UgPSBudWxsO1xyXG4gICAgICAgIHRoaXMudmFsdWUgPSAwO1xyXG4gICAgICAgIHRoaXMuY29tcGxldGVDb3VudCA9IDA7XHJcbiAgICAgICAgdGhpcy5hbGxDb3VudCA9IDA7XHJcbiAgICAgICAgdGhpcy5tZXNzYWdlID0gJyc7XHJcbiAgICAgICAgdGhpcy5vcGVuID0gZnVuY3Rpb24gKGFsbENvdW50KSB7XHJcbiAgICAgICAgICAgIF90aGlzLm1lc3NhZ2UgPSAncHJvY2Vzc2luZy4uLic7XHJcbiAgICAgICAgICAgIF90aGlzLnZhbHVlID0gMDtcclxuICAgICAgICAgICAgX3RoaXMuY29tcGxldGVDb3VudCA9IDA7XHJcbiAgICAgICAgICAgIF90aGlzLmFsbENvdW50ID0gYWxsQ291bnQ7XHJcbiAgICAgICAgICAgIF90aGlzLm1vZGFsSW5zdGFuY2UgPSBfdGhpcy4kbW9kYWwub3Blbih7XHJcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3Byb2dyZXNzLW1vZGFsJyxcclxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdQcm9ncmVzc01vZGFsQ29udHJvbGxlcicsXHJcbiAgICAgICAgICAgICAgICBiYWNrZHJvcDogJ3N0YXRpYycsXHJcbiAgICAgICAgICAgICAgICBrZXlib2FyZDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBzaXplOiAnc20nLFxyXG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uOiBmYWxzZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuY2xvc2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIF90aGlzLm1vZGFsSW5zdGFuY2UuY2xvc2UoKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuc2V0ID0gZnVuY3Rpb24gKG1lc3NhZ2UsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdm9pZCAwKSB7IHZhbHVlID0gbnVsbDsgfVxyXG4gICAgICAgICAgICBfdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcclxuICAgICAgICAgICAgaWYgKHZhbHVlICE9PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgX3RoaXMudmFsdWUgPSB2YWx1ZTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMubmV4dCA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XHJcbiAgICAgICAgICAgIF90aGlzLmNvbXBsZXRlQ291bnQrKztcclxuICAgICAgICAgICAgX3RoaXMuc2V0KG1lc3NhZ2UsIF90aGlzLmNvbXBsZXRlQ291bnQgLyBfdGhpcy5hbGxDb3VudCAqIDEwMCk7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIHJldHVybiBQcm9ncmVzc1NlcnZpY2U7XHJcbn0pKCk7XHJcbmV4cG9ydHMuUHJvZ3Jlc3NTZXJ2aWNlID0gUHJvZ3Jlc3NTZXJ2aWNlO1xyXG5hbmd1bGFyLm1vZHVsZSgnQXBwJykuc2VydmljZSgncHJvZ3Jlc3MnLCBbJyRtb2RhbCcsIFByb2dyZXNzU2VydmljZV0pO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1wcm9ncmVzcy5qcy5tYXAiXX0=
