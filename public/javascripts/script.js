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
                _this.$scope.timelineItems.add({
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
                    _this.$scope.timelineItems.add({
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
                hiddenDates = {};
            // generate timeline object
            _this.$scope['timeline'] = new vis.Timeline(container, _this.$scope.timelineItems, _this.$scope.timelineGroups, {
                margin: { item: 5 },
                height: window.innerHeight - 80,
                orientation: { axis: 'both', item: 'top' },
                start: _this.$scope.start,
                end: _this.$scope.end,
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvYXN5bmMvbGliL2FzeW5jLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL21lcmdlL21lcmdlLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsInNyYy9jb250cm9sbGVycy9hdXRoLWNvbnRyb2xsZXIuanMiLCJzcmMvY29udHJvbGxlcnMvY29udHJvbGxlci5qcyIsInNyYy9jb250cm9sbGVycy9tZW51LWNvbnRyb2xsZXIuanMiLCJzcmMvY29udHJvbGxlcnMvbW9kYWwtY29udHJvbGxlci5qcyIsInNyYy9jb250cm9sbGVycy9uYXZpZ2F0aW9uLWNvbnRyb2xsZXIuanMiLCJzcmMvY29udHJvbGxlcnMvbm90ZXMtY29udHJvbGxlci5qcyIsInNyYy9jb250cm9sbGVycy9wcm9ncmVzcy1tb2RhbC1jb250cm9sbGVyLmpzIiwic3JjL2NvbnRyb2xsZXJzL3NldHRpbmdzLWNvbnRyb2xsZXIuanMiLCJzcmMvY29udHJvbGxlcnMvdGltZWxpbmUtY29udHJvbGxlci5qcyIsInNyYy9kaXJlY3RpdmVzL3Jlc2l6ZS5qcyIsInNyYy9maWx0ZXJzL2FiYnJldmlhdGUuanMiLCJzcmMvZmlsdGVycy9maWx0ZXItYnktcHJvcGVydHkuanMiLCJzcmMvZmlsdGVycy9vYmplY3QtbGVuZ3RoLmpzIiwic3JjL2ZpbHRlcnMvb3JkZXItb2JqZWN0LWJ5LmpzIiwic3JjL2ZpbHRlcnMvc3BlbnQtdGltZS5qcyIsInNyYy9pbmRleC5qcyIsInNyYy9yb3V0ZS5qcyIsInNyYy9zZXJ2aWNlcy9kYXRhLXN0b3JlLmpzIiwic3JjL3NlcnZpY2VzL2RhdGEtdHJhbnNjaWV2ZXIuanMiLCJzcmMvc2VydmljZXMvcHJvZ3Jlc3MuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2h2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdlNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiFcbiAqIGFzeW5jXG4gKiBodHRwczovL2dpdGh1Yi5jb20vY2FvbGFuL2FzeW5jXG4gKlxuICogQ29weXJpZ2h0IDIwMTAtMjAxNCBDYW9sYW4gTWNNYWhvblxuICogUmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlXG4gKi9cbihmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgYXN5bmMgPSB7fTtcbiAgICBmdW5jdGlvbiBub29wKCkge31cbiAgICBmdW5jdGlvbiBpZGVudGl0eSh2KSB7XG4gICAgICAgIHJldHVybiB2O1xuICAgIH1cbiAgICBmdW5jdGlvbiB0b0Jvb2wodikge1xuICAgICAgICByZXR1cm4gISF2O1xuICAgIH1cbiAgICBmdW5jdGlvbiBub3RJZCh2KSB7XG4gICAgICAgIHJldHVybiAhdjtcbiAgICB9XG5cbiAgICAvLyBnbG9iYWwgb24gdGhlIHNlcnZlciwgd2luZG93IGluIHRoZSBicm93c2VyXG4gICAgdmFyIHByZXZpb3VzX2FzeW5jO1xuXG4gICAgLy8gRXN0YWJsaXNoIHRoZSByb290IG9iamVjdCwgYHdpbmRvd2AgKGBzZWxmYCkgaW4gdGhlIGJyb3dzZXIsIGBnbG9iYWxgXG4gICAgLy8gb24gdGhlIHNlcnZlciwgb3IgYHRoaXNgIGluIHNvbWUgdmlydHVhbCBtYWNoaW5lcy4gV2UgdXNlIGBzZWxmYFxuICAgIC8vIGluc3RlYWQgb2YgYHdpbmRvd2AgZm9yIGBXZWJXb3JrZXJgIHN1cHBvcnQuXG4gICAgdmFyIHJvb3QgPSB0eXBlb2Ygc2VsZiA9PT0gJ29iamVjdCcgJiYgc2VsZi5zZWxmID09PSBzZWxmICYmIHNlbGYgfHxcbiAgICAgICAgICAgIHR5cGVvZiBnbG9iYWwgPT09ICdvYmplY3QnICYmIGdsb2JhbC5nbG9iYWwgPT09IGdsb2JhbCAmJiBnbG9iYWwgfHxcbiAgICAgICAgICAgIHRoaXM7XG5cbiAgICBpZiAocm9vdCAhPSBudWxsKSB7XG4gICAgICAgIHByZXZpb3VzX2FzeW5jID0gcm9vdC5hc3luYztcbiAgICB9XG5cbiAgICBhc3luYy5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByb290LmFzeW5jID0gcHJldmlvdXNfYXN5bmM7XG4gICAgICAgIHJldHVybiBhc3luYztcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gb25seV9vbmNlKGZuKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChmbiA9PT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKFwiQ2FsbGJhY2sgd2FzIGFscmVhZHkgY2FsbGVkLlwiKTtcbiAgICAgICAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICBmbiA9IG51bGw7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX29uY2UoZm4pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKGZuID09PSBudWxsKSByZXR1cm47XG4gICAgICAgICAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgZm4gPSBudWxsO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vLy8gY3Jvc3MtYnJvd3NlciBjb21wYXRpYmxpdHkgZnVuY3Rpb25zIC8vLy9cblxuICAgIHZhciBfdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4gICAgdmFyIF9pc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHJldHVybiBfdG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBBcnJheV0nO1xuICAgIH07XG5cbiAgICAvLyBQb3J0ZWQgZnJvbSB1bmRlcnNjb3JlLmpzIGlzT2JqZWN0XG4gICAgdmFyIF9pc09iamVjdCA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgICB2YXIgdHlwZSA9IHR5cGVvZiBvYmo7XG4gICAgICAgIHJldHVybiB0eXBlID09PSAnZnVuY3Rpb24nIHx8IHR5cGUgPT09ICdvYmplY3QnICYmICEhb2JqO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBfaXNBcnJheUxpa2UoYXJyKSB7XG4gICAgICAgIHJldHVybiBfaXNBcnJheShhcnIpIHx8IChcbiAgICAgICAgICAgIC8vIGhhcyBhIHBvc2l0aXZlIGludGVnZXIgbGVuZ3RoIHByb3BlcnR5XG4gICAgICAgICAgICB0eXBlb2YgYXJyLmxlbmd0aCA9PT0gXCJudW1iZXJcIiAmJlxuICAgICAgICAgICAgYXJyLmxlbmd0aCA+PSAwICYmXG4gICAgICAgICAgICBhcnIubGVuZ3RoICUgMSA9PT0gMFxuICAgICAgICApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9hcnJheUVhY2goYXJyLCBpdGVyYXRvcikge1xuICAgICAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgICAgIGxlbmd0aCA9IGFyci5sZW5ndGg7XG5cbiAgICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKGFycltpbmRleF0sIGluZGV4LCBhcnIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX21hcChhcnIsIGl0ZXJhdG9yKSB7XG4gICAgICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICAgICAgbGVuZ3RoID0gYXJyLmxlbmd0aCxcbiAgICAgICAgICAgIHJlc3VsdCA9IEFycmF5KGxlbmd0aCk7XG5cbiAgICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgIHJlc3VsdFtpbmRleF0gPSBpdGVyYXRvcihhcnJbaW5kZXhdLCBpbmRleCwgYXJyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9yYW5nZShjb3VudCkge1xuICAgICAgICByZXR1cm4gX21hcChBcnJheShjb3VudCksIGZ1bmN0aW9uICh2LCBpKSB7IHJldHVybiBpOyB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfcmVkdWNlKGFyciwgaXRlcmF0b3IsIG1lbW8pIHtcbiAgICAgICAgX2FycmF5RWFjaChhcnIsIGZ1bmN0aW9uICh4LCBpLCBhKSB7XG4gICAgICAgICAgICBtZW1vID0gaXRlcmF0b3IobWVtbywgeCwgaSwgYSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbWVtbztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfZm9yRWFjaE9mKG9iamVjdCwgaXRlcmF0b3IpIHtcbiAgICAgICAgX2FycmF5RWFjaChfa2V5cyhvYmplY3QpLCBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICBpdGVyYXRvcihvYmplY3Rba2V5XSwga2V5KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2luZGV4T2YoYXJyLCBpdGVtKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoYXJyW2ldID09PSBpdGVtKSByZXR1cm4gaTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gLTE7XG4gICAgfVxuXG4gICAgdmFyIF9rZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICAgICAgICB2YXIga2V5cyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBrIGluIG9iaikge1xuICAgICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrKSkge1xuICAgICAgICAgICAgICAgIGtleXMucHVzaChrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ga2V5cztcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gX2tleUl0ZXJhdG9yKGNvbGwpIHtcbiAgICAgICAgdmFyIGkgPSAtMTtcbiAgICAgICAgdmFyIGxlbjtcbiAgICAgICAgdmFyIGtleXM7XG4gICAgICAgIGlmIChfaXNBcnJheUxpa2UoY29sbCkpIHtcbiAgICAgICAgICAgIGxlbiA9IGNvbGwubGVuZ3RoO1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHQoKSB7XG4gICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIHJldHVybiBpIDwgbGVuID8gaSA6IG51bGw7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAga2V5cyA9IF9rZXlzKGNvbGwpO1xuICAgICAgICAgICAgbGVuID0ga2V5cy5sZW5ndGg7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dCgpIHtcbiAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGkgPCBsZW4gPyBrZXlzW2ldIDogbnVsbDtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBTaW1pbGFyIHRvIEVTNidzIHJlc3QgcGFyYW0gKGh0dHA6Ly9hcml5YS5vZmlsYWJzLmNvbS8yMDEzLzAzL2VzNi1hbmQtcmVzdC1wYXJhbWV0ZXIuaHRtbClcbiAgICAvLyBUaGlzIGFjY3VtdWxhdGVzIHRoZSBhcmd1bWVudHMgcGFzc2VkIGludG8gYW4gYXJyYXksIGFmdGVyIGEgZ2l2ZW4gaW5kZXguXG4gICAgLy8gRnJvbSB1bmRlcnNjb3JlLmpzIChodHRwczovL2dpdGh1Yi5jb20vamFzaGtlbmFzL3VuZGVyc2NvcmUvcHVsbC8yMTQwKS5cbiAgICBmdW5jdGlvbiBfcmVzdFBhcmFtKGZ1bmMsIHN0YXJ0SW5kZXgpIHtcbiAgICAgICAgc3RhcnRJbmRleCA9IHN0YXJ0SW5kZXggPT0gbnVsbCA/IGZ1bmMubGVuZ3RoIC0gMSA6ICtzdGFydEluZGV4O1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgbGVuZ3RoID0gTWF0aC5tYXgoYXJndW1lbnRzLmxlbmd0aCAtIHN0YXJ0SW5kZXgsIDApO1xuICAgICAgICAgICAgdmFyIHJlc3QgPSBBcnJheShsZW5ndGgpO1xuICAgICAgICAgICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgICAgIHJlc3RbaW5kZXhdID0gYXJndW1lbnRzW2luZGV4ICsgc3RhcnRJbmRleF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzd2l0Y2ggKHN0YXJ0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICBjYXNlIDA6IHJldHVybiBmdW5jLmNhbGwodGhpcywgcmVzdCk7XG4gICAgICAgICAgICAgICAgY2FzZSAxOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIGFyZ3VtZW50c1swXSwgcmVzdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBDdXJyZW50bHkgdW51c2VkIGJ1dCBoYW5kbGUgY2FzZXMgb3V0c2lkZSBvZiB0aGUgc3dpdGNoIHN0YXRlbWVudDpcbiAgICAgICAgICAgIC8vIHZhciBhcmdzID0gQXJyYXkoc3RhcnRJbmRleCArIDEpO1xuICAgICAgICAgICAgLy8gZm9yIChpbmRleCA9IDA7IGluZGV4IDwgc3RhcnRJbmRleDsgaW5kZXgrKykge1xuICAgICAgICAgICAgLy8gICAgIGFyZ3NbaW5kZXhdID0gYXJndW1lbnRzW2luZGV4XTtcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIC8vIGFyZ3Nbc3RhcnRJbmRleF0gPSByZXN0O1xuICAgICAgICAgICAgLy8gcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3dpdGhvdXRJbmRleChpdGVyYXRvcikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlLCBpbmRleCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHJldHVybiBpdGVyYXRvcih2YWx1ZSwgY2FsbGJhY2spO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vLy8gZXhwb3J0ZWQgYXN5bmMgbW9kdWxlIGZ1bmN0aW9ucyAvLy8vXG5cbiAgICAvLy8vIG5leHRUaWNrIGltcGxlbWVudGF0aW9uIHdpdGggYnJvd3Nlci1jb21wYXRpYmxlIGZhbGxiYWNrIC8vLy9cblxuICAgIC8vIGNhcHR1cmUgdGhlIGdsb2JhbCByZWZlcmVuY2UgdG8gZ3VhcmQgYWdhaW5zdCBmYWtlVGltZXIgbW9ja3NcbiAgICB2YXIgX3NldEltbWVkaWF0ZSA9IHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09ICdmdW5jdGlvbicgJiYgc2V0SW1tZWRpYXRlO1xuXG4gICAgdmFyIF9kZWxheSA9IF9zZXRJbW1lZGlhdGUgPyBmdW5jdGlvbihmbikge1xuICAgICAgICAvLyBub3QgYSBkaXJlY3QgYWxpYXMgZm9yIElFMTAgY29tcGF0aWJpbGl0eVxuICAgICAgICBfc2V0SW1tZWRpYXRlKGZuKTtcbiAgICB9IDogZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcblxuICAgIGlmICh0eXBlb2YgcHJvY2VzcyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIHByb2Nlc3MubmV4dFRpY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgYXN5bmMubmV4dFRpY2sgPSBwcm9jZXNzLm5leHRUaWNrO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGFzeW5jLm5leHRUaWNrID0gX2RlbGF5O1xuICAgIH1cbiAgICBhc3luYy5zZXRJbW1lZGlhdGUgPSBfc2V0SW1tZWRpYXRlID8gX2RlbGF5IDogYXN5bmMubmV4dFRpY2s7XG5cblxuICAgIGFzeW5jLmZvckVhY2ggPVxuICAgIGFzeW5jLmVhY2ggPSBmdW5jdGlvbiAoYXJyLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jLmVhY2hPZihhcnIsIF93aXRob3V0SW5kZXgoaXRlcmF0b3IpLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLmZvckVhY2hTZXJpZXMgPVxuICAgIGFzeW5jLmVhY2hTZXJpZXMgPSBmdW5jdGlvbiAoYXJyLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jLmVhY2hPZlNlcmllcyhhcnIsIF93aXRob3V0SW5kZXgoaXRlcmF0b3IpLCBjYWxsYmFjayk7XG4gICAgfTtcblxuXG4gICAgYXN5bmMuZm9yRWFjaExpbWl0ID1cbiAgICBhc3luYy5lYWNoTGltaXQgPSBmdW5jdGlvbiAoYXJyLCBsaW1pdCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiBfZWFjaE9mTGltaXQobGltaXQpKGFyciwgX3dpdGhvdXRJbmRleChpdGVyYXRvciksIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMuZm9yRWFjaE9mID1cbiAgICBhc3luYy5lYWNoT2YgPSBmdW5jdGlvbiAob2JqZWN0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sgPSBfb25jZShjYWxsYmFjayB8fCBub29wKTtcbiAgICAgICAgb2JqZWN0ID0gb2JqZWN0IHx8IFtdO1xuXG4gICAgICAgIHZhciBpdGVyID0gX2tleUl0ZXJhdG9yKG9iamVjdCk7XG4gICAgICAgIHZhciBrZXksIGNvbXBsZXRlZCA9IDA7XG5cbiAgICAgICAgd2hpbGUgKChrZXkgPSBpdGVyKCkpICE9IG51bGwpIHtcbiAgICAgICAgICAgIGNvbXBsZXRlZCArPSAxO1xuICAgICAgICAgICAgaXRlcmF0b3Iob2JqZWN0W2tleV0sIGtleSwgb25seV9vbmNlKGRvbmUpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb21wbGV0ZWQgPT09IDApIGNhbGxiYWNrKG51bGwpO1xuXG4gICAgICAgIGZ1bmN0aW9uIGRvbmUoZXJyKSB7XG4gICAgICAgICAgICBjb21wbGV0ZWQtLTtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gQ2hlY2sga2V5IGlzIG51bGwgaW4gY2FzZSBpdGVyYXRvciBpc24ndCBleGhhdXN0ZWRcbiAgICAgICAgICAgIC8vIGFuZCBkb25lIHJlc29sdmVkIHN5bmNocm9ub3VzbHkuXG4gICAgICAgICAgICBlbHNlIGlmIChrZXkgPT09IG51bGwgJiYgY29tcGxldGVkIDw9IDApIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBhc3luYy5mb3JFYWNoT2ZTZXJpZXMgPVxuICAgIGFzeW5jLmVhY2hPZlNlcmllcyA9IGZ1bmN0aW9uIChvYmosIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IF9vbmNlKGNhbGxiYWNrIHx8IG5vb3ApO1xuICAgICAgICBvYmogPSBvYmogfHwgW107XG4gICAgICAgIHZhciBuZXh0S2V5ID0gX2tleUl0ZXJhdG9yKG9iaik7XG4gICAgICAgIHZhciBrZXkgPSBuZXh0S2V5KCk7XG4gICAgICAgIGZ1bmN0aW9uIGl0ZXJhdGUoKSB7XG4gICAgICAgICAgICB2YXIgc3luYyA9IHRydWU7XG4gICAgICAgICAgICBpZiAoa2V5ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaXRlcmF0b3Iob2JqW2tleV0sIGtleSwgb25seV9vbmNlKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBrZXkgPSBuZXh0S2V5KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzeW5jKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXN5bmMuc2V0SW1tZWRpYXRlKGl0ZXJhdGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVyYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBzeW5jID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaXRlcmF0ZSgpO1xuICAgIH07XG5cblxuXG4gICAgYXN5bmMuZm9yRWFjaE9mTGltaXQgPVxuICAgIGFzeW5jLmVhY2hPZkxpbWl0ID0gZnVuY3Rpb24gKG9iaiwgbGltaXQsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBfZWFjaE9mTGltaXQobGltaXQpKG9iaiwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gX2VhY2hPZkxpbWl0KGxpbWl0KSB7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChvYmosIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2sgPSBfb25jZShjYWxsYmFjayB8fCBub29wKTtcbiAgICAgICAgICAgIG9iaiA9IG9iaiB8fCBbXTtcbiAgICAgICAgICAgIHZhciBuZXh0S2V5ID0gX2tleUl0ZXJhdG9yKG9iaik7XG4gICAgICAgICAgICBpZiAobGltaXQgPD0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBkb25lID0gZmFsc2U7XG4gICAgICAgICAgICB2YXIgcnVubmluZyA9IDA7XG4gICAgICAgICAgICB2YXIgZXJyb3JlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAoZnVuY3Rpb24gcmVwbGVuaXNoICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoZG9uZSAmJiBydW5uaW5nIDw9IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHdoaWxlIChydW5uaW5nIDwgbGltaXQgJiYgIWVycm9yZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGtleSA9IG5leHRLZXkoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9uZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocnVubmluZyA8PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcnVubmluZyArPSAxO1xuICAgICAgICAgICAgICAgICAgICBpdGVyYXRvcihvYmpba2V5XSwga2V5LCBvbmx5X29uY2UoZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcnVubmluZyAtPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXBsZW5pc2goKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKCk7XG4gICAgICAgIH07XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBkb1BhcmFsbGVsKGZuKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAob2JqLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHJldHVybiBmbihhc3luYy5lYWNoT2YsIG9iaiwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZG9QYXJhbGxlbExpbWl0KGZuKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAob2JqLCBsaW1pdCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gZm4oX2VhY2hPZkxpbWl0KGxpbWl0KSwgb2JqLCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBkb1Nlcmllcyhmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG9iaiwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gZm4oYXN5bmMuZWFjaE9mU2VyaWVzLCBvYmosIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX2FzeW5jTWFwKGVhY2hmbiwgYXJyLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sgPSBfb25jZShjYWxsYmFjayB8fCBub29wKTtcbiAgICAgICAgYXJyID0gYXJyIHx8IFtdO1xuICAgICAgICB2YXIgcmVzdWx0cyA9IF9pc0FycmF5TGlrZShhcnIpID8gW10gOiB7fTtcbiAgICAgICAgZWFjaGZuKGFyciwgZnVuY3Rpb24gKHZhbHVlLCBpbmRleCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKHZhbHVlLCBmdW5jdGlvbiAoZXJyLCB2KSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0c1tpbmRleF0gPSB2O1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgY2FsbGJhY2soZXJyLCByZXN1bHRzKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMubWFwID0gZG9QYXJhbGxlbChfYXN5bmNNYXApO1xuICAgIGFzeW5jLm1hcFNlcmllcyA9IGRvU2VyaWVzKF9hc3luY01hcCk7XG4gICAgYXN5bmMubWFwTGltaXQgPSBkb1BhcmFsbGVsTGltaXQoX2FzeW5jTWFwKTtcblxuICAgIC8vIHJlZHVjZSBvbmx5IGhhcyBhIHNlcmllcyB2ZXJzaW9uLCBhcyBkb2luZyByZWR1Y2UgaW4gcGFyYWxsZWwgd29uJ3RcbiAgICAvLyB3b3JrIGluIG1hbnkgc2l0dWF0aW9ucy5cbiAgICBhc3luYy5pbmplY3QgPVxuICAgIGFzeW5jLmZvbGRsID1cbiAgICBhc3luYy5yZWR1Y2UgPSBmdW5jdGlvbiAoYXJyLCBtZW1vLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgYXN5bmMuZWFjaE9mU2VyaWVzKGFyciwgZnVuY3Rpb24gKHgsIGksIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpdGVyYXRvcihtZW1vLCB4LCBmdW5jdGlvbiAoZXJyLCB2KSB7XG4gICAgICAgICAgICAgICAgbWVtbyA9IHY7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnIsIG1lbW8pO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgYXN5bmMuZm9sZHIgPVxuICAgIGFzeW5jLnJlZHVjZVJpZ2h0ID0gZnVuY3Rpb24gKGFyciwgbWVtbywgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciByZXZlcnNlZCA9IF9tYXAoYXJyLCBpZGVudGl0eSkucmV2ZXJzZSgpO1xuICAgICAgICBhc3luYy5yZWR1Y2UocmV2ZXJzZWQsIG1lbW8sIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLnRyYW5zZm9ybSA9IGZ1bmN0aW9uIChhcnIsIG1lbW8sIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMykge1xuICAgICAgICAgICAgY2FsbGJhY2sgPSBpdGVyYXRvcjtcbiAgICAgICAgICAgIGl0ZXJhdG9yID0gbWVtbztcbiAgICAgICAgICAgIG1lbW8gPSBfaXNBcnJheShhcnIpID8gW10gOiB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFzeW5jLmVhY2hPZihhcnIsIGZ1bmN0aW9uKHYsIGssIGNiKSB7XG4gICAgICAgICAgICBpdGVyYXRvcihtZW1vLCB2LCBrLCBjYik7XG4gICAgICAgIH0sIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgY2FsbGJhY2soZXJyLCBtZW1vKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIF9maWx0ZXIoZWFjaGZuLCBhcnIsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgICAgICBlYWNoZm4oYXJyLCBmdW5jdGlvbiAoeCwgaW5kZXgsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpdGVyYXRvcih4LCBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgIGlmICh2KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7aW5kZXg6IGluZGV4LCB2YWx1ZTogeH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKF9tYXAocmVzdWx0cy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGEuaW5kZXggLSBiLmluZGV4O1xuICAgICAgICAgICAgfSksIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHgudmFsdWU7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jLnNlbGVjdCA9XG4gICAgYXN5bmMuZmlsdGVyID0gZG9QYXJhbGxlbChfZmlsdGVyKTtcblxuICAgIGFzeW5jLnNlbGVjdExpbWl0ID1cbiAgICBhc3luYy5maWx0ZXJMaW1pdCA9IGRvUGFyYWxsZWxMaW1pdChfZmlsdGVyKTtcblxuICAgIGFzeW5jLnNlbGVjdFNlcmllcyA9XG4gICAgYXN5bmMuZmlsdGVyU2VyaWVzID0gZG9TZXJpZXMoX2ZpbHRlcik7XG5cbiAgICBmdW5jdGlvbiBfcmVqZWN0KGVhY2hmbiwgYXJyLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgX2ZpbHRlcihlYWNoZm4sIGFyciwgZnVuY3Rpb24odmFsdWUsIGNiKSB7XG4gICAgICAgICAgICBpdGVyYXRvcih2YWx1ZSwgZnVuY3Rpb24odikge1xuICAgICAgICAgICAgICAgIGNiKCF2KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBjYWxsYmFjayk7XG4gICAgfVxuICAgIGFzeW5jLnJlamVjdCA9IGRvUGFyYWxsZWwoX3JlamVjdCk7XG4gICAgYXN5bmMucmVqZWN0TGltaXQgPSBkb1BhcmFsbGVsTGltaXQoX3JlamVjdCk7XG4gICAgYXN5bmMucmVqZWN0U2VyaWVzID0gZG9TZXJpZXMoX3JlamVjdCk7XG5cbiAgICBmdW5jdGlvbiBfY3JlYXRlVGVzdGVyKGVhY2hmbiwgY2hlY2ssIGdldFJlc3VsdCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oYXJyLCBsaW1pdCwgaXRlcmF0b3IsIGNiKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiBkb25lKCkge1xuICAgICAgICAgICAgICAgIGlmIChjYikgY2IoZ2V0UmVzdWx0KGZhbHNlLCB2b2lkIDApKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZ1bmN0aW9uIGl0ZXJhdGVlKHgsIF8sIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFjYikgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgaXRlcmF0b3IoeCwgZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNiICYmIGNoZWNrKHYpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYihnZXRSZXN1bHQodHJ1ZSwgeCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2IgPSBpdGVyYXRvciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDMpIHtcbiAgICAgICAgICAgICAgICBlYWNoZm4oYXJyLCBsaW1pdCwgaXRlcmF0ZWUsIGRvbmUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYiA9IGl0ZXJhdG9yO1xuICAgICAgICAgICAgICAgIGl0ZXJhdG9yID0gbGltaXQ7XG4gICAgICAgICAgICAgICAgZWFjaGZuKGFyciwgaXRlcmF0ZWUsIGRvbmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFzeW5jLmFueSA9XG4gICAgYXN5bmMuc29tZSA9IF9jcmVhdGVUZXN0ZXIoYXN5bmMuZWFjaE9mLCB0b0Jvb2wsIGlkZW50aXR5KTtcblxuICAgIGFzeW5jLnNvbWVMaW1pdCA9IF9jcmVhdGVUZXN0ZXIoYXN5bmMuZWFjaE9mTGltaXQsIHRvQm9vbCwgaWRlbnRpdHkpO1xuXG4gICAgYXN5bmMuYWxsID1cbiAgICBhc3luYy5ldmVyeSA9IF9jcmVhdGVUZXN0ZXIoYXN5bmMuZWFjaE9mLCBub3RJZCwgbm90SWQpO1xuXG4gICAgYXN5bmMuZXZlcnlMaW1pdCA9IF9jcmVhdGVUZXN0ZXIoYXN5bmMuZWFjaE9mTGltaXQsIG5vdElkLCBub3RJZCk7XG5cbiAgICBmdW5jdGlvbiBfZmluZEdldFJlc3VsdCh2LCB4KSB7XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgICBhc3luYy5kZXRlY3QgPSBfY3JlYXRlVGVzdGVyKGFzeW5jLmVhY2hPZiwgaWRlbnRpdHksIF9maW5kR2V0UmVzdWx0KTtcbiAgICBhc3luYy5kZXRlY3RTZXJpZXMgPSBfY3JlYXRlVGVzdGVyKGFzeW5jLmVhY2hPZlNlcmllcywgaWRlbnRpdHksIF9maW5kR2V0UmVzdWx0KTtcbiAgICBhc3luYy5kZXRlY3RMaW1pdCA9IF9jcmVhdGVUZXN0ZXIoYXN5bmMuZWFjaE9mTGltaXQsIGlkZW50aXR5LCBfZmluZEdldFJlc3VsdCk7XG5cbiAgICBhc3luYy5zb3J0QnkgPSBmdW5jdGlvbiAoYXJyLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgYXN5bmMubWFwKGFyciwgZnVuY3Rpb24gKHgsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpdGVyYXRvcih4LCBmdW5jdGlvbiAoZXJyLCBjcml0ZXJpYSkge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHt2YWx1ZTogeCwgY3JpdGVyaWE6IGNyaXRlcmlhfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIsIHJlc3VsdHMpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIF9tYXAocmVzdWx0cy5zb3J0KGNvbXBhcmF0b3IpLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geC52YWx1ZTtcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgZnVuY3Rpb24gY29tcGFyYXRvcihsZWZ0LCByaWdodCkge1xuICAgICAgICAgICAgdmFyIGEgPSBsZWZ0LmNyaXRlcmlhLCBiID0gcmlnaHQuY3JpdGVyaWE7XG4gICAgICAgICAgICByZXR1cm4gYSA8IGIgPyAtMSA6IGEgPiBiID8gMSA6IDA7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgYXN5bmMuYXV0byA9IGZ1bmN0aW9uICh0YXNrcywgY29uY3VycmVuY3ksIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgYXJndW1lbnRzWzFdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAvLyBjb25jdXJyZW5jeSBpcyBvcHRpb25hbCwgc2hpZnQgdGhlIGFyZ3MuXG4gICAgICAgICAgICBjYWxsYmFjayA9IGNvbmN1cnJlbmN5O1xuICAgICAgICAgICAgY29uY3VycmVuY3kgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrID0gX29uY2UoY2FsbGJhY2sgfHwgbm9vcCk7XG4gICAgICAgIHZhciBrZXlzID0gX2tleXModGFza3MpO1xuICAgICAgICB2YXIgcmVtYWluaW5nVGFza3MgPSBrZXlzLmxlbmd0aDtcbiAgICAgICAgaWYgKCFyZW1haW5pbmdUYXNrcykge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghY29uY3VycmVuY3kpIHtcbiAgICAgICAgICAgIGNvbmN1cnJlbmN5ID0gcmVtYWluaW5nVGFza3M7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVzdWx0cyA9IHt9O1xuICAgICAgICB2YXIgcnVubmluZ1Rhc2tzID0gMDtcblxuICAgICAgICB2YXIgaGFzRXJyb3IgPSBmYWxzZTtcblxuICAgICAgICB2YXIgbGlzdGVuZXJzID0gW107XG4gICAgICAgIGZ1bmN0aW9uIGFkZExpc3RlbmVyKGZuKSB7XG4gICAgICAgICAgICBsaXN0ZW5lcnMudW5zaGlmdChmbik7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIoZm4pIHtcbiAgICAgICAgICAgIHZhciBpZHggPSBfaW5kZXhPZihsaXN0ZW5lcnMsIGZuKTtcbiAgICAgICAgICAgIGlmIChpZHggPj0gMCkgbGlzdGVuZXJzLnNwbGljZShpZHgsIDEpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHRhc2tDb21wbGV0ZSgpIHtcbiAgICAgICAgICAgIHJlbWFpbmluZ1Rhc2tzLS07XG4gICAgICAgICAgICBfYXJyYXlFYWNoKGxpc3RlbmVycy5zbGljZSgwKSwgZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgYWRkTGlzdGVuZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCFyZW1haW5pbmdUYXNrcykge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBfYXJyYXlFYWNoKGtleXMsIGZ1bmN0aW9uIChrKSB7XG4gICAgICAgICAgICBpZiAoaGFzRXJyb3IpIHJldHVybjtcbiAgICAgICAgICAgIHZhciB0YXNrID0gX2lzQXJyYXkodGFza3Nba10pID8gdGFza3Nba106IFt0YXNrc1trXV07XG4gICAgICAgICAgICB2YXIgdGFza0NhbGxiYWNrID0gX3Jlc3RQYXJhbShmdW5jdGlvbihlcnIsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBydW5uaW5nVGFza3MtLTtcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5sZW5ndGggPD0gMSkge1xuICAgICAgICAgICAgICAgICAgICBhcmdzID0gYXJnc1swXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2FmZVJlc3VsdHMgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgX2ZvckVhY2hPZihyZXN1bHRzLCBmdW5jdGlvbih2YWwsIHJrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNhZmVSZXN1bHRzW3JrZXldID0gdmFsO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgc2FmZVJlc3VsdHNba10gPSBhcmdzO1xuICAgICAgICAgICAgICAgICAgICBoYXNFcnJvciA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyLCBzYWZlUmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzW2tdID0gYXJncztcbiAgICAgICAgICAgICAgICAgICAgYXN5bmMuc2V0SW1tZWRpYXRlKHRhc2tDb21wbGV0ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YXIgcmVxdWlyZXMgPSB0YXNrLnNsaWNlKDAsIHRhc2subGVuZ3RoIC0gMSk7XG4gICAgICAgICAgICAvLyBwcmV2ZW50IGRlYWQtbG9ja3NcbiAgICAgICAgICAgIHZhciBsZW4gPSByZXF1aXJlcy5sZW5ndGg7XG4gICAgICAgICAgICB2YXIgZGVwO1xuICAgICAgICAgICAgd2hpbGUgKGxlbi0tKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEoZGVwID0gdGFza3NbcmVxdWlyZXNbbGVuXV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSGFzIGluZXhpc3RhbnQgZGVwZW5kZW5jeScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoX2lzQXJyYXkoZGVwKSAmJiBfaW5kZXhPZihkZXAsIGspID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdIYXMgY3ljbGljIGRlcGVuZGVuY2llcycpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZ1bmN0aW9uIHJlYWR5KCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBydW5uaW5nVGFza3MgPCBjb25jdXJyZW5jeSAmJiBfcmVkdWNlKHJlcXVpcmVzLCBmdW5jdGlvbiAoYSwgeCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKGEgJiYgcmVzdWx0cy5oYXNPd25Qcm9wZXJ0eSh4KSk7XG4gICAgICAgICAgICAgICAgfSwgdHJ1ZSkgJiYgIXJlc3VsdHMuaGFzT3duUHJvcGVydHkoayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVhZHkoKSkge1xuICAgICAgICAgICAgICAgIHJ1bm5pbmdUYXNrcysrO1xuICAgICAgICAgICAgICAgIHRhc2tbdGFzay5sZW5ndGggLSAxXSh0YXNrQ2FsbGJhY2ssIHJlc3VsdHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnVuY3Rpb24gbGlzdGVuZXIoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlYWR5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcnVubmluZ1Rhc2tzKys7XG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGFza1t0YXNrLmxlbmd0aCAtIDFdKHRhc2tDYWxsYmFjaywgcmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG5cblxuICAgIGFzeW5jLnJldHJ5ID0gZnVuY3Rpb24odGltZXMsIHRhc2ssIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBERUZBVUxUX1RJTUVTID0gNTtcbiAgICAgICAgdmFyIERFRkFVTFRfSU5URVJWQUwgPSAwO1xuXG4gICAgICAgIHZhciBhdHRlbXB0cyA9IFtdO1xuXG4gICAgICAgIHZhciBvcHRzID0ge1xuICAgICAgICAgICAgdGltZXM6IERFRkFVTFRfVElNRVMsXG4gICAgICAgICAgICBpbnRlcnZhbDogREVGQVVMVF9JTlRFUlZBTFxuICAgICAgICB9O1xuXG4gICAgICAgIGZ1bmN0aW9uIHBhcnNlVGltZXMoYWNjLCB0KXtcbiAgICAgICAgICAgIGlmKHR5cGVvZiB0ID09PSAnbnVtYmVyJyl7XG4gICAgICAgICAgICAgICAgYWNjLnRpbWVzID0gcGFyc2VJbnQodCwgMTApIHx8IERFRkFVTFRfVElNRVM7XG4gICAgICAgICAgICB9IGVsc2UgaWYodHlwZW9mIHQgPT09ICdvYmplY3QnKXtcbiAgICAgICAgICAgICAgICBhY2MudGltZXMgPSBwYXJzZUludCh0LnRpbWVzLCAxMCkgfHwgREVGQVVMVF9USU1FUztcbiAgICAgICAgICAgICAgICBhY2MuaW50ZXJ2YWwgPSBwYXJzZUludCh0LmludGVydmFsLCAxMCkgfHwgREVGQVVMVF9JTlRFUlZBTDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbnN1cHBvcnRlZCBhcmd1bWVudCB0eXBlIGZvciBcXCd0aW1lc1xcJzogJyArIHR5cGVvZiB0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICBpZiAobGVuZ3RoIDwgMSB8fCBsZW5ndGggPiAzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgYXJndW1lbnRzIC0gbXVzdCBiZSBlaXRoZXIgKHRhc2spLCAodGFzaywgY2FsbGJhY2spLCAodGltZXMsIHRhc2spIG9yICh0aW1lcywgdGFzaywgY2FsbGJhY2spJyk7XG4gICAgICAgIH0gZWxzZSBpZiAobGVuZ3RoIDw9IDIgJiYgdHlwZW9mIHRpbWVzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IHRhc2s7XG4gICAgICAgICAgICB0YXNrID0gdGltZXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiB0aW1lcyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcGFyc2VUaW1lcyhvcHRzLCB0aW1lcyk7XG4gICAgICAgIH1cbiAgICAgICAgb3B0cy5jYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgICAgICBvcHRzLnRhc2sgPSB0YXNrO1xuXG4gICAgICAgIGZ1bmN0aW9uIHdyYXBwZWRUYXNrKHdyYXBwZWRDYWxsYmFjaywgd3JhcHBlZFJlc3VsdHMpIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIHJldHJ5QXR0ZW1wdCh0YXNrLCBmaW5hbEF0dGVtcHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oc2VyaWVzQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgdGFzayhmdW5jdGlvbihlcnIsIHJlc3VsdCl7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJpZXNDYWxsYmFjayghZXJyIHx8IGZpbmFsQXR0ZW1wdCwge2VycjogZXJyLCByZXN1bHQ6IHJlc3VsdH0pO1xuICAgICAgICAgICAgICAgICAgICB9LCB3cmFwcGVkUmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gcmV0cnlJbnRlcnZhbChpbnRlcnZhbCl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHNlcmllc0NhbGxiYWNrKXtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VyaWVzQ2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIGludGVydmFsKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB3aGlsZSAob3B0cy50aW1lcykge1xuXG4gICAgICAgICAgICAgICAgdmFyIGZpbmFsQXR0ZW1wdCA9ICEob3B0cy50aW1lcy09MSk7XG4gICAgICAgICAgICAgICAgYXR0ZW1wdHMucHVzaChyZXRyeUF0dGVtcHQob3B0cy50YXNrLCBmaW5hbEF0dGVtcHQpKTtcbiAgICAgICAgICAgICAgICBpZighZmluYWxBdHRlbXB0ICYmIG9wdHMuaW50ZXJ2YWwgPiAwKXtcbiAgICAgICAgICAgICAgICAgICAgYXR0ZW1wdHMucHVzaChyZXRyeUludGVydmFsKG9wdHMuaW50ZXJ2YWwpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGFzeW5jLnNlcmllcyhhdHRlbXB0cywgZnVuY3Rpb24oZG9uZSwgZGF0YSl7XG4gICAgICAgICAgICAgICAgZGF0YSA9IGRhdGFbZGF0YS5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgICAgICAod3JhcHBlZENhbGxiYWNrIHx8IG9wdHMuY2FsbGJhY2spKGRhdGEuZXJyLCBkYXRhLnJlc3VsdCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIGEgY2FsbGJhY2sgaXMgcGFzc2VkLCBydW4gdGhpcyBhcyBhIGNvbnRyb2xsIGZsb3dcbiAgICAgICAgcmV0dXJuIG9wdHMuY2FsbGJhY2sgPyB3cmFwcGVkVGFzaygpIDogd3JhcHBlZFRhc2s7XG4gICAgfTtcblxuICAgIGFzeW5jLndhdGVyZmFsbCA9IGZ1bmN0aW9uICh0YXNrcywgY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sgPSBfb25jZShjYWxsYmFjayB8fCBub29wKTtcbiAgICAgICAgaWYgKCFfaXNBcnJheSh0YXNrcykpIHtcbiAgICAgICAgICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoJ0ZpcnN0IGFyZ3VtZW50IHRvIHdhdGVyZmFsbCBtdXN0IGJlIGFuIGFycmF5IG9mIGZ1bmN0aW9ucycpO1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0YXNrcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHdyYXBJdGVyYXRvcihpdGVyYXRvcikge1xuICAgICAgICAgICAgcmV0dXJuIF9yZXN0UGFyYW0oZnVuY3Rpb24gKGVyciwgYXJncykge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgW2Vycl0uY29uY2F0KGFyZ3MpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXh0ID0gaXRlcmF0b3IubmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobmV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJncy5wdXNoKHdyYXBJdGVyYXRvcihuZXh0KSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVuc3VyZUFzeW5jKGl0ZXJhdG9yKS5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB3cmFwSXRlcmF0b3IoYXN5bmMuaXRlcmF0b3IodGFza3MpKSgpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBfcGFyYWxsZWwoZWFjaGZuLCB0YXNrcywgY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBub29wO1xuICAgICAgICB2YXIgcmVzdWx0cyA9IF9pc0FycmF5TGlrZSh0YXNrcykgPyBbXSA6IHt9O1xuXG4gICAgICAgIGVhY2hmbih0YXNrcywgZnVuY3Rpb24gKHRhc2ssIGtleSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRhc2soX3Jlc3RQYXJhbShmdW5jdGlvbiAoZXJyLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoIDw9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgYXJncyA9IGFyZ3NbMF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3VsdHNba2V5XSA9IGFyZ3M7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgY2FsbGJhY2soZXJyLCByZXN1bHRzKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMucGFyYWxsZWwgPSBmdW5jdGlvbiAodGFza3MsIGNhbGxiYWNrKSB7XG4gICAgICAgIF9wYXJhbGxlbChhc3luYy5lYWNoT2YsIHRhc2tzLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLnBhcmFsbGVsTGltaXQgPSBmdW5jdGlvbih0YXNrcywgbGltaXQsIGNhbGxiYWNrKSB7XG4gICAgICAgIF9wYXJhbGxlbChfZWFjaE9mTGltaXQobGltaXQpLCB0YXNrcywgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy5zZXJpZXMgPSBmdW5jdGlvbih0YXNrcywgY2FsbGJhY2spIHtcbiAgICAgICAgX3BhcmFsbGVsKGFzeW5jLmVhY2hPZlNlcmllcywgdGFza3MsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMuaXRlcmF0b3IgPSBmdW5jdGlvbiAodGFza3MpIHtcbiAgICAgICAgZnVuY3Rpb24gbWFrZUNhbGxiYWNrKGluZGV4KSB7XG4gICAgICAgICAgICBmdW5jdGlvbiBmbigpIHtcbiAgICAgICAgICAgICAgICBpZiAodGFza3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhc2tzW2luZGV4XS5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZm4ubmV4dCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm4ubmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKGluZGV4IDwgdGFza3MubGVuZ3RoIC0gMSkgPyBtYWtlQ2FsbGJhY2soaW5kZXggKyAxKTogbnVsbDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gZm47XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1ha2VDYWxsYmFjaygwKTtcbiAgICB9O1xuXG4gICAgYXN5bmMuYXBwbHkgPSBfcmVzdFBhcmFtKGZ1bmN0aW9uIChmbiwgYXJncykge1xuICAgICAgICByZXR1cm4gX3Jlc3RQYXJhbShmdW5jdGlvbiAoY2FsbEFyZ3MpIHtcbiAgICAgICAgICAgIHJldHVybiBmbi5hcHBseShcbiAgICAgICAgICAgICAgICBudWxsLCBhcmdzLmNvbmNhdChjYWxsQXJncylcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gX2NvbmNhdChlYWNoZm4sIGFyciwgZm4sIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgZWFjaGZuKGFyciwgZnVuY3Rpb24gKHgsIGluZGV4LCBjYikge1xuICAgICAgICAgICAgZm4oeCwgZnVuY3Rpb24gKGVyciwgeSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQoeSB8fCBbXSk7XG4gICAgICAgICAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnIsIHJlc3VsdCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYy5jb25jYXQgPSBkb1BhcmFsbGVsKF9jb25jYXQpO1xuICAgIGFzeW5jLmNvbmNhdFNlcmllcyA9IGRvU2VyaWVzKF9jb25jYXQpO1xuXG4gICAgYXN5bmMud2hpbHN0ID0gZnVuY3Rpb24gKHRlc3QsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IGNhbGxiYWNrIHx8IG5vb3A7XG4gICAgICAgIGlmICh0ZXN0KCkpIHtcbiAgICAgICAgICAgIHZhciBuZXh0ID0gX3Jlc3RQYXJhbShmdW5jdGlvbihlcnIsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0ZXN0LmFwcGx5KHRoaXMsIGFyZ3MpKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZXJhdG9yKG5leHQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIFtudWxsXS5jb25jYXQoYXJncykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaXRlcmF0b3IobmV4dCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBhc3luYy5kb1doaWxzdCA9IGZ1bmN0aW9uIChpdGVyYXRvciwgdGVzdCwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGNhbGxzID0gMDtcbiAgICAgICAgcmV0dXJuIGFzeW5jLndoaWxzdChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiArK2NhbGxzIDw9IDEgfHwgdGVzdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9LCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy51bnRpbCA9IGZ1bmN0aW9uICh0ZXN0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jLndoaWxzdChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiAhdGVzdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9LCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBhc3luYy5kb1VudGlsID0gZnVuY3Rpb24gKGl0ZXJhdG9yLCB0ZXN0LCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gYXN5bmMuZG9XaGlsc3QoaXRlcmF0b3IsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuICF0ZXN0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0sIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMuZHVyaW5nID0gZnVuY3Rpb24gKHRlc3QsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IGNhbGxiYWNrIHx8IG5vb3A7XG5cbiAgICAgICAgdmFyIG5leHQgPSBfcmVzdFBhcmFtKGZ1bmN0aW9uKGVyciwgYXJncykge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGFyZ3MucHVzaChjaGVjayk7XG4gICAgICAgICAgICAgICAgdGVzdC5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGNoZWNrID0gZnVuY3Rpb24oZXJyLCB0cnV0aCkge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRydXRoKSB7XG4gICAgICAgICAgICAgICAgaXRlcmF0b3IobmV4dCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHRlc3QoY2hlY2spO1xuICAgIH07XG5cbiAgICBhc3luYy5kb0R1cmluZyA9IGZ1bmN0aW9uIChpdGVyYXRvciwgdGVzdCwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGNhbGxzID0gMDtcbiAgICAgICAgYXN5bmMuZHVyaW5nKGZ1bmN0aW9uKG5leHQpIHtcbiAgICAgICAgICAgIGlmIChjYWxscysrIDwgMSkge1xuICAgICAgICAgICAgICAgIG5leHQobnVsbCwgdHJ1ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRlc3QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gX3F1ZXVlKHdvcmtlciwgY29uY3VycmVuY3ksIHBheWxvYWQpIHtcbiAgICAgICAgaWYgKGNvbmN1cnJlbmN5ID09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbmN1cnJlbmN5ID0gMTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKGNvbmN1cnJlbmN5ID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbmN1cnJlbmN5IG11c3Qgbm90IGJlIHplcm8nKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBfaW5zZXJ0KHEsIGRhdGEsIHBvcywgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjayAhPSBudWxsICYmIHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidGFzayBjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb25cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBxLnN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKCFfaXNBcnJheShkYXRhKSkge1xuICAgICAgICAgICAgICAgIGRhdGEgPSBbZGF0YV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihkYXRhLmxlbmd0aCA9PT0gMCAmJiBxLmlkbGUoKSkge1xuICAgICAgICAgICAgICAgIC8vIGNhbGwgZHJhaW4gaW1tZWRpYXRlbHkgaWYgdGhlcmUgYXJlIG5vIHRhc2tzXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFzeW5jLnNldEltbWVkaWF0ZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgcS5kcmFpbigpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX2FycmF5RWFjaChkYXRhLCBmdW5jdGlvbih0YXNrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGl0ZW0gPSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHRhc2ssXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiBjYWxsYmFjayB8fCBub29wXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGlmIChwb3MpIHtcbiAgICAgICAgICAgICAgICAgICAgcS50YXNrcy51bnNoaWZ0KGl0ZW0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHEudGFza3MucHVzaChpdGVtKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAocS50YXNrcy5sZW5ndGggPT09IHEuY29uY3VycmVuY3kpIHtcbiAgICAgICAgICAgICAgICAgICAgcS5zYXR1cmF0ZWQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGFzeW5jLnNldEltbWVkaWF0ZShxLnByb2Nlc3MpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIF9uZXh0KHEsIHRhc2tzKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICB3b3JrZXJzIC09IDE7XG5cbiAgICAgICAgICAgICAgICB2YXIgcmVtb3ZlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICAgICAgICAgIF9hcnJheUVhY2godGFza3MsIGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgICAgICAgICAgICAgIF9hcnJheUVhY2god29ya2Vyc0xpc3QsIGZ1bmN0aW9uICh3b3JrZXIsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAod29ya2VyID09PSB0YXNrICYmICFyZW1vdmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd29ya2Vyc0xpc3Quc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGFzay5jYWxsYmFjay5hcHBseSh0YXNrLCBhcmdzKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAocS50YXNrcy5sZW5ndGggKyB3b3JrZXJzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHEuZHJhaW4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcS5wcm9jZXNzKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHdvcmtlcnMgPSAwO1xuICAgICAgICB2YXIgd29ya2Vyc0xpc3QgPSBbXTtcbiAgICAgICAgdmFyIHEgPSB7XG4gICAgICAgICAgICB0YXNrczogW10sXG4gICAgICAgICAgICBjb25jdXJyZW5jeTogY29uY3VycmVuY3ksXG4gICAgICAgICAgICBwYXlsb2FkOiBwYXlsb2FkLFxuICAgICAgICAgICAgc2F0dXJhdGVkOiBub29wLFxuICAgICAgICAgICAgZW1wdHk6IG5vb3AsXG4gICAgICAgICAgICBkcmFpbjogbm9vcCxcbiAgICAgICAgICAgIHN0YXJ0ZWQ6IGZhbHNlLFxuICAgICAgICAgICAgcGF1c2VkOiBmYWxzZSxcbiAgICAgICAgICAgIHB1c2g6IGZ1bmN0aW9uIChkYXRhLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIF9pbnNlcnQocSwgZGF0YSwgZmFsc2UsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBraWxsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcS5kcmFpbiA9IG5vb3A7XG4gICAgICAgICAgICAgICAgcS50YXNrcyA9IFtdO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVuc2hpZnQ6IGZ1bmN0aW9uIChkYXRhLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIF9pbnNlcnQocSwgZGF0YSwgdHJ1ZSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB3aGlsZSghcS5wYXVzZWQgJiYgd29ya2VycyA8IHEuY29uY3VycmVuY3kgJiYgcS50YXNrcy5sZW5ndGgpe1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciB0YXNrcyA9IHEucGF5bG9hZCA/XG4gICAgICAgICAgICAgICAgICAgICAgICBxLnRhc2tzLnNwbGljZSgwLCBxLnBheWxvYWQpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHEudGFza3Muc3BsaWNlKDAsIHEudGFza3MubGVuZ3RoKTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IF9tYXAodGFza3MsIGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGFzay5kYXRhO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAocS50YXNrcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHEuZW1wdHkoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB3b3JrZXJzICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIHdvcmtlcnNMaXN0LnB1c2godGFza3NbMF0pO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2IgPSBvbmx5X29uY2UoX25leHQocSwgdGFza3MpKTtcbiAgICAgICAgICAgICAgICAgICAgd29ya2VyKGRhdGEsIGNiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGVuZ3RoOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHEudGFza3MubGVuZ3RoO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJ1bm5pbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gd29ya2VycztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB3b3JrZXJzTGlzdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB3b3JrZXJzTGlzdDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpZGxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcS50YXNrcy5sZW5ndGggKyB3b3JrZXJzID09PSAwO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBhdXNlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcS5wYXVzZWQgPSB0cnVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlc3VtZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChxLnBhdXNlZCA9PT0gZmFsc2UpIHsgcmV0dXJuOyB9XG4gICAgICAgICAgICAgICAgcS5wYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdW1lQ291bnQgPSBNYXRoLm1pbihxLmNvbmN1cnJlbmN5LCBxLnRhc2tzLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgLy8gTmVlZCB0byBjYWxsIHEucHJvY2VzcyBvbmNlIHBlciBjb25jdXJyZW50XG4gICAgICAgICAgICAgICAgLy8gd29ya2VyIHRvIHByZXNlcnZlIGZ1bGwgY29uY3VycmVuY3kgYWZ0ZXIgcGF1c2VcbiAgICAgICAgICAgICAgICBmb3IgKHZhciB3ID0gMTsgdyA8PSByZXN1bWVDb3VudDsgdysrKSB7XG4gICAgICAgICAgICAgICAgICAgIGFzeW5jLnNldEltbWVkaWF0ZShxLnByb2Nlc3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHE7XG4gICAgfVxuXG4gICAgYXN5bmMucXVldWUgPSBmdW5jdGlvbiAod29ya2VyLCBjb25jdXJyZW5jeSkge1xuICAgICAgICB2YXIgcSA9IF9xdWV1ZShmdW5jdGlvbiAoaXRlbXMsIGNiKSB7XG4gICAgICAgICAgICB3b3JrZXIoaXRlbXNbMF0sIGNiKTtcbiAgICAgICAgfSwgY29uY3VycmVuY3ksIDEpO1xuXG4gICAgICAgIHJldHVybiBxO1xuICAgIH07XG5cbiAgICBhc3luYy5wcmlvcml0eVF1ZXVlID0gZnVuY3Rpb24gKHdvcmtlciwgY29uY3VycmVuY3kpIHtcblxuICAgICAgICBmdW5jdGlvbiBfY29tcGFyZVRhc2tzKGEsIGIpe1xuICAgICAgICAgICAgcmV0dXJuIGEucHJpb3JpdHkgLSBiLnByaW9yaXR5O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gX2JpbmFyeVNlYXJjaChzZXF1ZW5jZSwgaXRlbSwgY29tcGFyZSkge1xuICAgICAgICAgICAgdmFyIGJlZyA9IC0xLFxuICAgICAgICAgICAgICAgIGVuZCA9IHNlcXVlbmNlLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICB3aGlsZSAoYmVnIDwgZW5kKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1pZCA9IGJlZyArICgoZW5kIC0gYmVnICsgMSkgPj4+IDEpO1xuICAgICAgICAgICAgICAgIGlmIChjb21wYXJlKGl0ZW0sIHNlcXVlbmNlW21pZF0pID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgYmVnID0gbWlkO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGVuZCA9IG1pZCAtIDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGJlZztcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIF9pbnNlcnQocSwgZGF0YSwgcHJpb3JpdHksIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2sgIT0gbnVsbCAmJiB0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInRhc2sgY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcS5zdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmICghX2lzQXJyYXkoZGF0YSkpIHtcbiAgICAgICAgICAgICAgICBkYXRhID0gW2RhdGFdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoZGF0YS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAvLyBjYWxsIGRyYWluIGltbWVkaWF0ZWx5IGlmIHRoZXJlIGFyZSBubyB0YXNrc1xuICAgICAgICAgICAgICAgIHJldHVybiBhc3luYy5zZXRJbW1lZGlhdGUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHEuZHJhaW4oKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF9hcnJheUVhY2goZGF0YSwgZnVuY3Rpb24odGFzaykge1xuICAgICAgICAgICAgICAgIHZhciBpdGVtID0ge1xuICAgICAgICAgICAgICAgICAgICBkYXRhOiB0YXNrLFxuICAgICAgICAgICAgICAgICAgICBwcmlvcml0eTogcHJpb3JpdHksXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiB0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicgPyBjYWxsYmFjayA6IG5vb3BcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgcS50YXNrcy5zcGxpY2UoX2JpbmFyeVNlYXJjaChxLnRhc2tzLCBpdGVtLCBfY29tcGFyZVRhc2tzKSArIDEsIDAsIGl0ZW0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKHEudGFza3MubGVuZ3RoID09PSBxLmNvbmN1cnJlbmN5KSB7XG4gICAgICAgICAgICAgICAgICAgIHEuc2F0dXJhdGVkKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGFzeW5jLnNldEltbWVkaWF0ZShxLnByb2Nlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTdGFydCB3aXRoIGEgbm9ybWFsIHF1ZXVlXG4gICAgICAgIHZhciBxID0gYXN5bmMucXVldWUod29ya2VyLCBjb25jdXJyZW5jeSk7XG5cbiAgICAgICAgLy8gT3ZlcnJpZGUgcHVzaCB0byBhY2NlcHQgc2Vjb25kIHBhcmFtZXRlciByZXByZXNlbnRpbmcgcHJpb3JpdHlcbiAgICAgICAgcS5wdXNoID0gZnVuY3Rpb24gKGRhdGEsIHByaW9yaXR5LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgX2luc2VydChxLCBkYXRhLCBwcmlvcml0eSwgY2FsbGJhY2spO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIFJlbW92ZSB1bnNoaWZ0IGZ1bmN0aW9uXG4gICAgICAgIGRlbGV0ZSBxLnVuc2hpZnQ7XG5cbiAgICAgICAgcmV0dXJuIHE7XG4gICAgfTtcblxuICAgIGFzeW5jLmNhcmdvID0gZnVuY3Rpb24gKHdvcmtlciwgcGF5bG9hZCkge1xuICAgICAgICByZXR1cm4gX3F1ZXVlKHdvcmtlciwgMSwgcGF5bG9hZCk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIF9jb25zb2xlX2ZuKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIF9yZXN0UGFyYW0oZnVuY3Rpb24gKGZuLCBhcmdzKSB7XG4gICAgICAgICAgICBmbi5hcHBseShudWxsLCBhcmdzLmNvbmNhdChbX3Jlc3RQYXJhbShmdW5jdGlvbiAoZXJyLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uc29sZS5lcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChjb25zb2xlW25hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfYXJyYXlFYWNoKGFyZ3MsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZVtuYW1lXSh4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSldKSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhc3luYy5sb2cgPSBfY29uc29sZV9mbignbG9nJyk7XG4gICAgYXN5bmMuZGlyID0gX2NvbnNvbGVfZm4oJ2RpcicpO1xuICAgIC8qYXN5bmMuaW5mbyA9IF9jb25zb2xlX2ZuKCdpbmZvJyk7XG4gICAgYXN5bmMud2FybiA9IF9jb25zb2xlX2ZuKCd3YXJuJyk7XG4gICAgYXN5bmMuZXJyb3IgPSBfY29uc29sZV9mbignZXJyb3InKTsqL1xuXG4gICAgYXN5bmMubWVtb2l6ZSA9IGZ1bmN0aW9uIChmbiwgaGFzaGVyKSB7XG4gICAgICAgIHZhciBtZW1vID0ge307XG4gICAgICAgIHZhciBxdWV1ZXMgPSB7fTtcbiAgICAgICAgaGFzaGVyID0gaGFzaGVyIHx8IGlkZW50aXR5O1xuICAgICAgICB2YXIgbWVtb2l6ZWQgPSBfcmVzdFBhcmFtKGZ1bmN0aW9uIG1lbW9pemVkKGFyZ3MpIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3MucG9wKCk7XG4gICAgICAgICAgICB2YXIga2V5ID0gaGFzaGVyLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgICAgICAgaWYgKGtleSBpbiBtZW1vKSB7XG4gICAgICAgICAgICAgICAgYXN5bmMuc2V0SW1tZWRpYXRlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgbWVtb1trZXldKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGtleSBpbiBxdWV1ZXMpIHtcbiAgICAgICAgICAgICAgICBxdWV1ZXNba2V5XS5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHF1ZXVlc1trZXldID0gW2NhbGxiYWNrXTtcbiAgICAgICAgICAgICAgICBmbi5hcHBseShudWxsLCBhcmdzLmNvbmNhdChbX3Jlc3RQYXJhbShmdW5jdGlvbiAoYXJncykge1xuICAgICAgICAgICAgICAgICAgICBtZW1vW2tleV0gPSBhcmdzO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcSA9IHF1ZXVlc1trZXldO1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgcXVldWVzW2tleV07XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gcS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHFbaV0uYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KV0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIG1lbW9pemVkLm1lbW8gPSBtZW1vO1xuICAgICAgICBtZW1vaXplZC51bm1lbW9pemVkID0gZm47XG4gICAgICAgIHJldHVybiBtZW1vaXplZDtcbiAgICB9O1xuXG4gICAgYXN5bmMudW5tZW1vaXplID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gKGZuLnVubWVtb2l6ZWQgfHwgZm4pLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIF90aW1lcyhtYXBwZXIpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChjb3VudCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBtYXBwZXIoX3JhbmdlKGNvdW50KSwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhc3luYy50aW1lcyA9IF90aW1lcyhhc3luYy5tYXApO1xuICAgIGFzeW5jLnRpbWVzU2VyaWVzID0gX3RpbWVzKGFzeW5jLm1hcFNlcmllcyk7XG4gICAgYXN5bmMudGltZXNMaW1pdCA9IGZ1bmN0aW9uIChjb3VudCwgbGltaXQsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gYXN5bmMubWFwTGltaXQoX3JhbmdlKGNvdW50KSwgbGltaXQsIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLnNlcSA9IGZ1bmN0aW9uICgvKiBmdW5jdGlvbnMuLi4gKi8pIHtcbiAgICAgICAgdmFyIGZucyA9IGFyZ3VtZW50cztcbiAgICAgICAgcmV0dXJuIF9yZXN0UGFyYW0oZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gYXJnc1thcmdzLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgYXJncy5wb3AoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sgPSBub29wO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhc3luYy5yZWR1Y2UoZm5zLCBhcmdzLCBmdW5jdGlvbiAobmV3YXJncywgZm4sIGNiKSB7XG4gICAgICAgICAgICAgICAgZm4uYXBwbHkodGhhdCwgbmV3YXJncy5jb25jYXQoW19yZXN0UGFyYW0oZnVuY3Rpb24gKGVyciwgbmV4dGFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgY2IoZXJyLCBuZXh0YXJncyk7XG4gICAgICAgICAgICAgICAgfSldKSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVuY3Rpb24gKGVyciwgcmVzdWx0cykge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KHRoYXQsIFtlcnJdLmNvbmNhdChyZXN1bHRzKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGFzeW5jLmNvbXBvc2UgPSBmdW5jdGlvbiAoLyogZnVuY3Rpb25zLi4uICovKSB7XG4gICAgICAgIHJldHVybiBhc3luYy5zZXEuYXBwbHkobnVsbCwgQXJyYXkucHJvdG90eXBlLnJldmVyc2UuY2FsbChhcmd1bWVudHMpKTtcbiAgICB9O1xuXG5cbiAgICBmdW5jdGlvbiBfYXBwbHlFYWNoKGVhY2hmbikge1xuICAgICAgICByZXR1cm4gX3Jlc3RQYXJhbShmdW5jdGlvbihmbnMsIGFyZ3MpIHtcbiAgICAgICAgICAgIHZhciBnbyA9IF9yZXN0UGFyYW0oZnVuY3Rpb24oYXJncykge1xuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBhcmdzLnBvcCgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBlYWNoZm4oZm5zLCBmdW5jdGlvbiAoZm4sIF8sIGNiKSB7XG4gICAgICAgICAgICAgICAgICAgIGZuLmFwcGx5KHRoYXQsIGFyZ3MuY29uY2F0KFtjYl0pKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdvLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdvO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYy5hcHBseUVhY2ggPSBfYXBwbHlFYWNoKGFzeW5jLmVhY2hPZik7XG4gICAgYXN5bmMuYXBwbHlFYWNoU2VyaWVzID0gX2FwcGx5RWFjaChhc3luYy5lYWNoT2ZTZXJpZXMpO1xuXG5cbiAgICBhc3luYy5mb3JldmVyID0gZnVuY3Rpb24gKGZuLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgZG9uZSA9IG9ubHlfb25jZShjYWxsYmFjayB8fCBub29wKTtcbiAgICAgICAgdmFyIHRhc2sgPSBlbnN1cmVBc3luYyhmbik7XG4gICAgICAgIGZ1bmN0aW9uIG5leHQoZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRvbmUoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRhc2sobmV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgbmV4dCgpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBlbnN1cmVBc3luYyhmbikge1xuICAgICAgICByZXR1cm4gX3Jlc3RQYXJhbShmdW5jdGlvbiAoYXJncykge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gYXJncy5wb3AoKTtcbiAgICAgICAgICAgIGFyZ3MucHVzaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGlubmVyQXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgICAgICBpZiAoc3luYykge1xuICAgICAgICAgICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgaW5uZXJBcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgaW5uZXJBcmdzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciBzeW5jID0gdHJ1ZTtcbiAgICAgICAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgc3luYyA9IGZhbHNlO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYy5lbnN1cmVBc3luYyA9IGVuc3VyZUFzeW5jO1xuXG4gICAgYXN5bmMuY29uc3RhbnQgPSBfcmVzdFBhcmFtKGZ1bmN0aW9uKHZhbHVlcykge1xuICAgICAgICB2YXIgYXJncyA9IFtudWxsXS5jb25jYXQodmFsdWVzKTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgYXN5bmMud3JhcFN5bmMgPVxuICAgIGFzeW5jLmFzeW5jaWZ5ID0gZnVuY3Rpb24gYXN5bmNpZnkoZnVuYykge1xuICAgICAgICByZXR1cm4gX3Jlc3RQYXJhbShmdW5jdGlvbiAoYXJncykge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gYXJncy5wb3AoKTtcbiAgICAgICAgICAgIHZhciByZXN1bHQ7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gaWYgcmVzdWx0IGlzIFByb21pc2Ugb2JqZWN0XG4gICAgICAgICAgICBpZiAoX2lzT2JqZWN0KHJlc3VsdCkgJiYgdHlwZW9mIHJlc3VsdC50aGVuID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQudGhlbihmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfSlbXCJjYXRjaFwiXShmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyLm1lc3NhZ2UgPyBlcnIgOiBuZXcgRXJyb3IoZXJyKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLyBOb2RlLmpzXG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gYXN5bmM7XG4gICAgfVxuICAgIC8vIEFNRCAvIFJlcXVpcmVKU1xuICAgIGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoW10sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBhc3luYztcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8vIGluY2x1ZGVkIGRpcmVjdGx5IHZpYSA8c2NyaXB0PiB0YWdcbiAgICBlbHNlIHtcbiAgICAgICAgcm9vdC5hc3luYyA9IGFzeW5jO1xuICAgIH1cblxufSgpKTtcbiIsIi8qIVxyXG4gKiBAbmFtZSBKYXZhU2NyaXB0L05vZGVKUyBNZXJnZSB2MS4yLjBcclxuICogQGF1dGhvciB5ZWlrb3NcclxuICogQHJlcG9zaXRvcnkgaHR0cHM6Ly9naXRodWIuY29tL3llaWtvcy9qcy5tZXJnZVxyXG5cclxuICogQ29weXJpZ2h0IDIwMTQgeWVpa29zIC0gTUlUIGxpY2Vuc2VcclxuICogaHR0cHM6Ly9yYXcuZ2l0aHViLmNvbS95ZWlrb3MvanMubWVyZ2UvbWFzdGVyL0xJQ0VOU0VcclxuICovXHJcblxyXG47KGZ1bmN0aW9uKGlzTm9kZSkge1xyXG5cclxuXHQvKipcclxuXHQgKiBNZXJnZSBvbmUgb3IgbW9yZSBvYmplY3RzIFxyXG5cdCAqIEBwYXJhbSBib29sPyBjbG9uZVxyXG5cdCAqIEBwYXJhbSBtaXhlZCwuLi4gYXJndW1lbnRzXHJcblx0ICogQHJldHVybiBvYmplY3RcclxuXHQgKi9cclxuXHJcblx0dmFyIFB1YmxpYyA9IGZ1bmN0aW9uKGNsb25lKSB7XHJcblxyXG5cdFx0cmV0dXJuIG1lcmdlKGNsb25lID09PSB0cnVlLCBmYWxzZSwgYXJndW1lbnRzKTtcclxuXHJcblx0fSwgcHVibGljTmFtZSA9ICdtZXJnZSc7XHJcblxyXG5cdC8qKlxyXG5cdCAqIE1lcmdlIHR3byBvciBtb3JlIG9iamVjdHMgcmVjdXJzaXZlbHkgXHJcblx0ICogQHBhcmFtIGJvb2w/IGNsb25lXHJcblx0ICogQHBhcmFtIG1peGVkLC4uLiBhcmd1bWVudHNcclxuXHQgKiBAcmV0dXJuIG9iamVjdFxyXG5cdCAqL1xyXG5cclxuXHRQdWJsaWMucmVjdXJzaXZlID0gZnVuY3Rpb24oY2xvbmUpIHtcclxuXHJcblx0XHRyZXR1cm4gbWVyZ2UoY2xvbmUgPT09IHRydWUsIHRydWUsIGFyZ3VtZW50cyk7XHJcblxyXG5cdH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIENsb25lIHRoZSBpbnB1dCByZW1vdmluZyBhbnkgcmVmZXJlbmNlXHJcblx0ICogQHBhcmFtIG1peGVkIGlucHV0XHJcblx0ICogQHJldHVybiBtaXhlZFxyXG5cdCAqL1xyXG5cclxuXHRQdWJsaWMuY2xvbmUgPSBmdW5jdGlvbihpbnB1dCkge1xyXG5cclxuXHRcdHZhciBvdXRwdXQgPSBpbnB1dCxcclxuXHRcdFx0dHlwZSA9IHR5cGVPZihpbnB1dCksXHJcblx0XHRcdGluZGV4LCBzaXplO1xyXG5cclxuXHRcdGlmICh0eXBlID09PSAnYXJyYXknKSB7XHJcblxyXG5cdFx0XHRvdXRwdXQgPSBbXTtcclxuXHRcdFx0c2l6ZSA9IGlucHV0Lmxlbmd0aDtcclxuXHJcblx0XHRcdGZvciAoaW5kZXg9MDtpbmRleDxzaXplOysraW5kZXgpXHJcblxyXG5cdFx0XHRcdG91dHB1dFtpbmRleF0gPSBQdWJsaWMuY2xvbmUoaW5wdXRbaW5kZXhdKTtcclxuXHJcblx0XHR9IGVsc2UgaWYgKHR5cGUgPT09ICdvYmplY3QnKSB7XHJcblxyXG5cdFx0XHRvdXRwdXQgPSB7fTtcclxuXHJcblx0XHRcdGZvciAoaW5kZXggaW4gaW5wdXQpXHJcblxyXG5cdFx0XHRcdG91dHB1dFtpbmRleF0gPSBQdWJsaWMuY2xvbmUoaW5wdXRbaW5kZXhdKTtcclxuXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIG91dHB1dDtcclxuXHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogTWVyZ2UgdHdvIG9iamVjdHMgcmVjdXJzaXZlbHlcclxuXHQgKiBAcGFyYW0gbWl4ZWQgaW5wdXRcclxuXHQgKiBAcGFyYW0gbWl4ZWQgZXh0ZW5kXHJcblx0ICogQHJldHVybiBtaXhlZFxyXG5cdCAqL1xyXG5cclxuXHRmdW5jdGlvbiBtZXJnZV9yZWN1cnNpdmUoYmFzZSwgZXh0ZW5kKSB7XHJcblxyXG5cdFx0aWYgKHR5cGVPZihiYXNlKSAhPT0gJ29iamVjdCcpXHJcblxyXG5cdFx0XHRyZXR1cm4gZXh0ZW5kO1xyXG5cclxuXHRcdGZvciAodmFyIGtleSBpbiBleHRlbmQpIHtcclxuXHJcblx0XHRcdGlmICh0eXBlT2YoYmFzZVtrZXldKSA9PT0gJ29iamVjdCcgJiYgdHlwZU9mKGV4dGVuZFtrZXldKSA9PT0gJ29iamVjdCcpIHtcclxuXHJcblx0XHRcdFx0YmFzZVtrZXldID0gbWVyZ2VfcmVjdXJzaXZlKGJhc2Vba2V5XSwgZXh0ZW5kW2tleV0pO1xyXG5cclxuXHRcdFx0fSBlbHNlIHtcclxuXHJcblx0XHRcdFx0YmFzZVtrZXldID0gZXh0ZW5kW2tleV07XHJcblxyXG5cdFx0XHR9XHJcblxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBiYXNlO1xyXG5cclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIE1lcmdlIHR3byBvciBtb3JlIG9iamVjdHNcclxuXHQgKiBAcGFyYW0gYm9vbCBjbG9uZVxyXG5cdCAqIEBwYXJhbSBib29sIHJlY3Vyc2l2ZVxyXG5cdCAqIEBwYXJhbSBhcnJheSBhcmd2XHJcblx0ICogQHJldHVybiBvYmplY3RcclxuXHQgKi9cclxuXHJcblx0ZnVuY3Rpb24gbWVyZ2UoY2xvbmUsIHJlY3Vyc2l2ZSwgYXJndikge1xyXG5cclxuXHRcdHZhciByZXN1bHQgPSBhcmd2WzBdLFxyXG5cdFx0XHRzaXplID0gYXJndi5sZW5ndGg7XHJcblxyXG5cdFx0aWYgKGNsb25lIHx8IHR5cGVPZihyZXN1bHQpICE9PSAnb2JqZWN0JylcclxuXHJcblx0XHRcdHJlc3VsdCA9IHt9O1xyXG5cclxuXHRcdGZvciAodmFyIGluZGV4PTA7aW5kZXg8c2l6ZTsrK2luZGV4KSB7XHJcblxyXG5cdFx0XHR2YXIgaXRlbSA9IGFyZ3ZbaW5kZXhdLFxyXG5cclxuXHRcdFx0XHR0eXBlID0gdHlwZU9mKGl0ZW0pO1xyXG5cclxuXHRcdFx0aWYgKHR5cGUgIT09ICdvYmplY3QnKSBjb250aW51ZTtcclxuXHJcblx0XHRcdGZvciAodmFyIGtleSBpbiBpdGVtKSB7XHJcblxyXG5cdFx0XHRcdHZhciBzaXRlbSA9IGNsb25lID8gUHVibGljLmNsb25lKGl0ZW1ba2V5XSkgOiBpdGVtW2tleV07XHJcblxyXG5cdFx0XHRcdGlmIChyZWN1cnNpdmUpIHtcclxuXHJcblx0XHRcdFx0XHRyZXN1bHRba2V5XSA9IG1lcmdlX3JlY3Vyc2l2ZShyZXN1bHRba2V5XSwgc2l0ZW0pO1xyXG5cclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cclxuXHRcdFx0XHRcdHJlc3VsdFtrZXldID0gc2l0ZW07XHJcblxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdH1cclxuXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHJlc3VsdDtcclxuXHJcblx0fVxyXG5cclxuXHQvKipcclxuXHQgKiBHZXQgdHlwZSBvZiB2YXJpYWJsZVxyXG5cdCAqIEBwYXJhbSBtaXhlZCBpbnB1dFxyXG5cdCAqIEByZXR1cm4gc3RyaW5nXHJcblx0ICpcclxuXHQgKiBAc2VlIGh0dHA6Ly9qc3BlcmYuY29tL3R5cGVvZnZhclxyXG5cdCAqL1xyXG5cclxuXHRmdW5jdGlvbiB0eXBlT2YoaW5wdXQpIHtcclxuXHJcblx0XHRyZXR1cm4gKHt9KS50b1N0cmluZy5jYWxsKGlucHV0KS5zbGljZSg4LCAtMSkudG9Mb3dlckNhc2UoKTtcclxuXHJcblx0fVxyXG5cclxuXHRpZiAoaXNOb2RlKSB7XHJcblxyXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBQdWJsaWM7XHJcblxyXG5cdH0gZWxzZSB7XHJcblxyXG5cdFx0d2luZG93W3B1YmxpY05hbWVdID0gUHVibGljO1xyXG5cclxuXHR9XHJcblxyXG59KSh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzID09PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cyk7IiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJ2YXIgQXV0aENvbnRyb2xsZXIgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gQXV0aENvbnRyb2xsZXIoJHNjb3BlLCAkaHR0cCkge1xyXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy4kc2NvcGUgPSAkc2NvcGU7XHJcbiAgICAgICAgdGhpcy4kaHR0cCA9ICRodHRwO1xyXG4gICAgICAgIHRoaXMuX2luaXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIF90aGlzLiRodHRwLmdldCgnL2F1dGgvdG9rZW4nKVxyXG4gICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZGF0YSk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgX3RoaXMuJHNjb3BlLnByb2R1Y3Rpb24gPSBkYXRhO1xyXG4gICAgICAgICAgICAgICAgX3RoaXMuJGh0dHAucG9zdCgnL2F1dGgvdG9rZW4nLCB7IHNhbmRib3g6IHRydWUgfSlcclxuICAgICAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZGF0YSk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuJHNjb3BlLnNhbmRib3ggPSBkYXRhO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5fc2V0VG9rZW4gPSBmdW5jdGlvbiAoc2FuZGJveCkge1xyXG4gICAgICAgICAgICB2YXIgdG9rZW4gPSBwcm9tcHQoXCJJbnB1dCBkZXZlbG9wZXIgdG9rZW4gKFwiICsgKHNhbmRib3ggPyAnc2FuZGJveCcgOiAncHJvZHVjdGlvbicpICsgXCIpXCIpO1xyXG4gICAgICAgICAgICBpZiAoIXRva2VuKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICBfdGhpcy4kaHR0cC5wb3N0KCcvYXV0aC90b2tlbicsIHsgc2FuZGJveDogc2FuZGJveCwgdG9rZW46IHRva2VuIH0pXHJcbiAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNhbmRib3gpXHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuJHNjb3BlLnNhbmRib3ggPSBkYXRhO1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLiRzY29wZS5wcm9kdWN0aW9uID0gZGF0YTtcclxuICAgICAgICAgICAgICAgIGlmICghZGF0YSlcclxuICAgICAgICAgICAgICAgICAgICBhbGVydCgnVG9rZW4gaXMgaW52YWxpZC4nKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgYWxlcnQoJ1NldCB0b2tlbiBmYWlsZWQuJyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy4kc2NvcGUubWVzc2FnZSA9IG51bGw7XHJcbiAgICAgICAgdGhpcy4kc2NvcGUuaXNEZXZlbG9wZXIgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLiRzY29wZS5zYW5kYm94ID0geyB0b2tlbjogbnVsbCwgdXNlcm5hbWU6IG51bGwgfTtcclxuICAgICAgICB0aGlzLiRzY29wZS5wcm9kdWN0aW9uID0geyB0b2tlbjogbnVsbCwgdXNlcm5hbWU6IG51bGwgfTtcclxuICAgICAgICB0aGlzLiRzY29wZS5zZXRUb2tlbiA9IHRoaXMuX3NldFRva2VuO1xyXG4gICAgICAgIHRoaXMuX2luaXQoKTtcclxuICAgIH1cclxuICAgIHJldHVybiBBdXRoQ29udHJvbGxlcjtcclxufSkoKTtcclxuYW5ndWxhci5tb2R1bGUoJ0FwcCcpLmNvbnRyb2xsZXIoJ0F1dGhDb250cm9sbGVyJywgWyckc2NvcGUnLCAnJGh0dHAnLCBBdXRoQ29udHJvbGxlcl0pO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hdXRoLWNvbnRyb2xsZXIuanMubWFwIiwidmFyIENvbnRyb2xsZXIgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gQ29udHJvbGxlcigkc2NvcGUpIHtcclxuICAgICAgICB0aGlzLiRzY29wZSA9ICRzY29wZTtcclxuICAgIH1cclxuICAgIHJldHVybiBDb250cm9sbGVyO1xyXG59KSgpO1xyXG5hbmd1bGFyLm1vZHVsZSgnQXBwJykuY29udHJvbGxlcignQ29udHJvbGxlcicsIFsnJHNjb3BlJywgQ29udHJvbGxlcl0pO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1jb250cm9sbGVyLmpzLm1hcCIsInZhciBNZW51Q29udHJvbGxlciA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBNZW51Q29udHJvbGxlcigkc2NvcGUsICRodHRwLCBkYXRhU3RvcmUsIGRhdGFUcmFuc2NpZXZlcikge1xyXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy4kc2NvcGUgPSAkc2NvcGU7XHJcbiAgICAgICAgdGhpcy4kaHR0cCA9ICRodHRwO1xyXG4gICAgICAgIHRoaXMuZGF0YVN0b3JlID0gZGF0YVN0b3JlO1xyXG4gICAgICAgIHRoaXMuZGF0YVRyYW5zY2lldmVyID0gZGF0YVRyYW5zY2lldmVyO1xyXG4gICAgICAgIHRoaXMuX29uUmVsb2FkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBfdGhpcy5kYXRhVHJhbnNjaWV2ZXIucmVsb2FkKCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLl9vbldhdGNoRmlsdGVyUGFyYW1zID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBfdGhpcy5kYXRhVHJhbnNjaWV2ZXIuY291bnROb3RlcyhmdW5jdGlvbiAoZXJyLCBjb3VudCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KGVycik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgX3RoaXMuJHNjb3BlLm5vdGVDb3VudCA9IGNvdW50O1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuJHNjb3BlLmRhdGFTdG9yZSA9IHRoaXMuZGF0YVN0b3JlO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlLmRhdGFUcmFuc2NpZXZlciA9IHRoaXMuZGF0YVRyYW5zY2lldmVyO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlLm5vdGVDb3VudCA9IG51bGw7XHJcbiAgICAgICAgdGhpcy4kc2NvcGUuJHdhdGNoR3JvdXAoWydkYXRhVHJhbnNjaWV2ZXIuZmlsdGVyUGFyYW1zLm5vdGVib29rR3VpZHMnLCAnZGF0YVRyYW5zY2lldmVyLmZpbHRlclBhcmFtcy5zdGFja3MnXSwgdGhpcy5fb25XYXRjaEZpbHRlclBhcmFtcyk7XHJcbiAgICAgICAgdGhpcy4kc2NvcGUuJG9uKCdldmVudDo6cmVsb2FkJywgdGhpcy5fb25SZWxvYWQpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIE1lbnVDb250cm9sbGVyO1xyXG59KSgpO1xyXG5hbmd1bGFyLm1vZHVsZSgnQXBwJykuY29udHJvbGxlcignTWVudUNvbnRyb2xsZXInLCBbJyRzY29wZScsICckaHR0cCcsICdkYXRhU3RvcmUnLCAnZGF0YVRyYW5zY2lldmVyJywgTWVudUNvbnRyb2xsZXJdKTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bWVudS1jb250cm9sbGVyLmpzLm1hcCIsInZhciBNb2RhbENvbnRyb2xsZXIgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gTW9kYWxDb250cm9sbGVyKCRzY29wZSkge1xyXG4gICAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIE1vZGFsQ29udHJvbGxlcjtcclxufSkoKTtcclxuZXhwb3J0cy5Nb2RhbENvbnRyb2xsZXIgPSBNb2RhbENvbnRyb2xsZXI7XHJcbmFuZ3VsYXIubW9kdWxlKCdBcHAnKS5jb250cm9sbGVyKCdNb2RhbENvbnRyb2xsZXInLCBbJyRzY29wZScsIE1vZGFsQ29udHJvbGxlcl0pO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1tb2RhbC1jb250cm9sbGVyLmpzLm1hcCIsInZhciBOYXZpZ2F0aW9uQ29udHJvbGxlciA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBOYXZpZ2F0aW9uQ29udHJvbGxlcigkc2NvcGUsICRyb290U2NvcGUsICRyb3V0ZSkge1xyXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy4kc2NvcGUgPSAkc2NvcGU7XHJcbiAgICAgICAgdGhpcy4kcm9vdFNjb3BlID0gJHJvb3RTY29wZTtcclxuICAgICAgICB0aGlzLiRyb3V0ZSA9ICRyb3V0ZTtcclxuICAgICAgICB0aGlzLl9yZWxvYWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIF90aGlzLiRyb290U2NvcGUuJGJyb2FkY2FzdCgnZXZlbnQ6OnJlbG9hZCcpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy4kc2NvcGUubmF2Q29sbGFwc2UgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlLiRyb3V0ZSA9IHRoaXMuJHJvdXRlO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlLnJlbG9hZCA9IHRoaXMuX3JlbG9hZDtcclxuICAgIH1cclxuICAgIHJldHVybiBOYXZpZ2F0aW9uQ29udHJvbGxlcjtcclxufSkoKTtcclxuYW5ndWxhci5tb2R1bGUoJ0FwcCcpLmNvbnRyb2xsZXIoJ05hdmlnYXRpb25Db250cm9sbGVyJywgWyckc2NvcGUnLCAnJHJvb3RTY29wZScsICckcm91dGUnLCBOYXZpZ2F0aW9uQ29udHJvbGxlcl0pO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1uYXZpZ2F0aW9uLWNvbnRyb2xsZXIuanMubWFwIiwidmFyIE5vdGVzQ29udHJvbGxlciA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBOb3Rlc0NvbnRyb2xsZXIoJHNjb3BlLCBkYXRhU3RvcmUpIHtcclxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xyXG4gICAgICAgIHRoaXMuZGF0YVN0b3JlID0gZGF0YVN0b3JlO1xyXG4gICAgICAgIHRoaXMuX29uV2F0Y2hUaW1lTG9ncyA9IGZ1bmN0aW9uICh0aW1lTG9ncykge1xyXG4gICAgICAgICAgICBfdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzID0ge307XHJcbiAgICAgICAgICAgIHZhciBwZXJzb25zSGFzaCA9IHt9O1xyXG4gICAgICAgICAgICBmb3IgKHZhciBub3RlR3VpZCBpbiB0aW1lTG9ncykge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5vdGVUaW1lTG9nID0gdGltZUxvZ3Nbbm90ZUd1aWRdO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgdGltZUxvZ0lkIGluIG5vdGVUaW1lTG9nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRpbWVMb2cgPSBub3RlVGltZUxvZ1t0aW1lTG9nSWRdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghX3RoaXMuJHNjb3BlLm5vdGVzU3BlbnRUaW1lc1t0aW1lTG9nLm5vdGVHdWlkXSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuJHNjb3BlLm5vdGVzU3BlbnRUaW1lc1t0aW1lTG9nLm5vdGVHdWlkXSA9IHsgJHRvdGFsOiAwIH07XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuJHNjb3BlLm5vdGVzU3BlbnRUaW1lc1t0aW1lTG9nLm5vdGVHdWlkXVsnJHRvdGFsJ10gKz0gdGltZUxvZy5zcGVudFRpbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFfdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzW3RpbWVMb2cubm90ZUd1aWRdW3RpbWVMb2cucGVyc29uXSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuJHNjb3BlLm5vdGVzU3BlbnRUaW1lc1t0aW1lTG9nLm5vdGVHdWlkXVt0aW1lTG9nLnBlcnNvbl0gPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLiRzY29wZS5ub3Rlc1NwZW50VGltZXNbdGltZUxvZy5ub3RlR3VpZF1bdGltZUxvZy5wZXJzb25dICs9IHRpbWVMb2cuc3BlbnRUaW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghX3RoaXMuJHNjb3BlLm5vdGVzU3BlbnRUaW1lc1snJHRvdGFsJ10pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLiRzY29wZS5ub3Rlc1NwZW50VGltZXNbJyR0b3RhbCddID0geyAkdG90YWw6IDAgfTtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzWyckdG90YWwnXVsnJHRvdGFsJ10gKz0gdGltZUxvZy5zcGVudFRpbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFfdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzWyckdG90YWwnXVt0aW1lTG9nLnBlcnNvbl0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLiRzY29wZS5ub3Rlc1NwZW50VGltZXNbJyR0b3RhbCddW3RpbWVMb2cucGVyc29uXSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuJHNjb3BlLm5vdGVzU3BlbnRUaW1lc1snJHRvdGFsJ11bdGltZUxvZy5wZXJzb25dICs9IHRpbWVMb2cuc3BlbnRUaW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aW1lTG9nLnNwZW50VGltZSA+IDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBlcnNvbnNIYXNoW3RpbWVMb2cucGVyc29uXSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgX3RoaXMuJHNjb3BlLmV4aXN0UGVyc29ucyA9IE9iamVjdC5rZXlzKHBlcnNvbnNIYXNoKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuX29uV2F0Y2hQcm9maXRMb2dzID0gZnVuY3Rpb24gKHByb2ZpdExvZ3MpIHtcclxuICAgICAgICAgICAgX3RoaXMuJHNjb3BlLm5vdGVzUHJvZml0cyA9IHt9O1xyXG4gICAgICAgICAgICBmb3IgKHZhciBub3RlR3VpZCBpbiBwcm9maXRMb2dzKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbm90ZVByb2ZpdExvZyA9IHByb2ZpdExvZ3Nbbm90ZUd1aWRdO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvZml0TG9nSWQgaW4gbm90ZVByb2ZpdExvZykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwcm9maXRMb2cgPSBub3RlUHJvZml0TG9nW3Byb2ZpdExvZ0lkXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIV90aGlzLiRzY29wZS5ub3Rlc1Byb2ZpdHNbcHJvZml0TG9nLm5vdGVHdWlkXSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuJHNjb3BlLm5vdGVzUHJvZml0c1twcm9maXRMb2cubm90ZUd1aWRdID0geyAkdG90YWw6IDAgfTtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy4kc2NvcGUubm90ZXNQcm9maXRzW3Byb2ZpdExvZy5ub3RlR3VpZF1bJyR0b3RhbCddICs9IHByb2ZpdExvZy5wcm9maXQ7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFfdGhpcy4kc2NvcGUubm90ZXNQcm9maXRzWyckdG90YWwnXSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuJHNjb3BlLm5vdGVzUHJvZml0c1snJHRvdGFsJ10gPSB7ICR0b3RhbDogMCB9O1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLiRzY29wZS5ub3Rlc1Byb2ZpdHNbJyR0b3RhbCddWyckdG90YWwnXSArPSBwcm9maXRMb2cucHJvZml0O1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSBfdGhpcy4kc2NvcGUuZXhpc3RQZXJzb25zOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGVyc29uID0gX2FbX2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIV90aGlzLiRzY29wZS5ub3Rlc1NwZW50VGltZXNbbm90ZUd1aWRdIHx8ICFfdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzW25vdGVHdWlkXVtwZXJzb25dIHx8ICFfdGhpcy4kc2NvcGUubm90ZXNTcGVudFRpbWVzW25vdGVHdWlkXVsnJHRvdGFsJ10pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy4kc2NvcGUubm90ZXNQcm9maXRzW25vdGVHdWlkXVtwZXJzb25dID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuJHNjb3BlLm5vdGVzUHJvZml0c1tub3RlR3VpZF1bcGVyc29uXSA9IE1hdGgucm91bmQoX3RoaXMuJHNjb3BlLm5vdGVzUHJvZml0c1tub3RlR3VpZF1bJyR0b3RhbCddICogX3RoaXMuJHNjb3BlLm5vdGVzU3BlbnRUaW1lc1tub3RlR3VpZF1bcGVyc29uXSAvIF90aGlzLiRzY29wZS5ub3Rlc1NwZW50VGltZXNbbm90ZUd1aWRdWyckdG90YWwnXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghX3RoaXMuJHNjb3BlLm5vdGVzUHJvZml0c1snJHRvdGFsJ11bcGVyc29uXSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuJHNjb3BlLm5vdGVzUHJvZml0c1snJHRvdGFsJ11bcGVyc29uXSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuJHNjb3BlLm5vdGVzUHJvZml0c1snJHRvdGFsJ11bcGVyc29uXSArPSBfdGhpcy4kc2NvcGUubm90ZXNQcm9maXRzW25vdGVHdWlkXVtwZXJzb25dO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLiRzY29wZS5kYXRhU3RvcmUgPSB0aGlzLmRhdGFTdG9yZTtcclxuICAgICAgICB0aGlzLiRzY29wZS5ub3Rlc1NwZW50VGltZXMgPSB7fTtcclxuICAgICAgICB0aGlzLiRzY29wZS5ub3Rlc1Byb2ZpdHMgPSB7fTtcclxuICAgICAgICB0aGlzLiRzY29wZS5leGlzdFBlcnNvbnMgPSBbXTtcclxuICAgICAgICB0aGlzLiRzY29wZS4kd2F0Y2hDb2xsZWN0aW9uKCdkYXRhU3RvcmUudGltZUxvZ3MnLCB0aGlzLl9vbldhdGNoVGltZUxvZ3MpO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlLiR3YXRjaENvbGxlY3Rpb24oJ2RhdGFTdG9yZS5wcm9maXRMb2dzJywgdGhpcy5fb25XYXRjaFByb2ZpdExvZ3MpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIE5vdGVzQ29udHJvbGxlcjtcclxufSkoKTtcclxuYW5ndWxhci5tb2R1bGUoJ0FwcCcpLmNvbnRyb2xsZXIoJ05vdGVzQ29udHJvbGxlcicsIFsnJHNjb3BlJywgJ2RhdGFTdG9yZScsIE5vdGVzQ29udHJvbGxlcl0pO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1ub3Rlcy1jb250cm9sbGVyLmpzLm1hcCIsInZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgZnVuY3Rpb24gKGQsIGIpIHtcclxuICAgIGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdO1xyXG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XHJcbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XHJcbn07XHJcbnZhciBtb2RhbF9jb250cm9sbGVyXzEgPSByZXF1aXJlKFwiLi9tb2RhbC1jb250cm9sbGVyXCIpO1xyXG52YXIgUHJvZ3Jlc3NNb2RhbENvbnRyb2xsZXIgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xyXG4gICAgX19leHRlbmRzKFByb2dyZXNzTW9kYWxDb250cm9sbGVyLCBfc3VwZXIpO1xyXG4gICAgZnVuY3Rpb24gUHJvZ3Jlc3NNb2RhbENvbnRyb2xsZXIoJHNjb3BlLCBwcm9ncmVzcykge1xyXG4gICAgICAgIF9zdXBlci5jYWxsKHRoaXMsICRzY29wZSk7XHJcbiAgICAgICAgdGhpcy4kc2NvcGUgPSAkc2NvcGU7XHJcbiAgICAgICAgdGhpcy5wcm9ncmVzcyA9IHByb2dyZXNzO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlLnByb2dyZXNzID0gdGhpcy5wcm9ncmVzcztcclxuICAgIH1cclxuICAgIHJldHVybiBQcm9ncmVzc01vZGFsQ29udHJvbGxlcjtcclxufSkobW9kYWxfY29udHJvbGxlcl8xLk1vZGFsQ29udHJvbGxlcik7XHJcbmFuZ3VsYXIubW9kdWxlKCdBcHAnKS5jb250cm9sbGVyKCdQcm9ncmVzc01vZGFsQ29udHJvbGxlcicsIFsnJHNjb3BlJywgJ3Byb2dyZXNzJywgUHJvZ3Jlc3NNb2RhbENvbnRyb2xsZXJdKTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cHJvZ3Jlc3MtbW9kYWwtY29udHJvbGxlci5qcy5tYXAiLCJ2YXIgYXN5bmMgPSByZXF1aXJlKCdhc3luYycpO1xyXG52YXIgU2V0dGluZ3NDb250cm9sbGVyID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIFNldHRpbmdzQ29udHJvbGxlcigkc2NvcGUsICRodHRwLCBkYXRhU3RvcmUsIGRhdGFUcmFuc2NpZXZlciwgcHJvZ3Jlc3MpIHtcclxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xyXG4gICAgICAgIHRoaXMuJGh0dHAgPSAkaHR0cDtcclxuICAgICAgICB0aGlzLmRhdGFTdG9yZSA9IGRhdGFTdG9yZTtcclxuICAgICAgICB0aGlzLmRhdGFUcmFuc2NpZXZlciA9IGRhdGFUcmFuc2NpZXZlcjtcclxuICAgICAgICB0aGlzLnByb2dyZXNzID0gcHJvZ3Jlc3M7XHJcbiAgICAgICAgdGhpcy5fdXAgPSBmdW5jdGlvbiAoaW5kZXgpIHtcclxuICAgICAgICAgICAgaWYgKGluZGV4ID09IDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIF90aGlzLiRzY29wZS5lZGl0U3RvcmVbJ3BlcnNvbnMnXS5zcGxpY2UoaW5kZXggLSAxLCAyLCBfdGhpcy4kc2NvcGUuZWRpdFN0b3JlWydwZXJzb25zJ11baW5kZXhdLCBfdGhpcy4kc2NvcGUuZWRpdFN0b3JlWydwZXJzb25zJ11baW5kZXggLSAxXSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLl9kb3duID0gZnVuY3Rpb24gKGluZGV4KSB7XHJcbiAgICAgICAgICAgIGlmIChpbmRleCA+PSBfdGhpcy4kc2NvcGUuZWRpdFN0b3JlWydwZXJzb25zJ10ubGVuZ3RoIC0gMSlcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgX3RoaXMuJHNjb3BlLmVkaXRTdG9yZVsncGVyc29ucyddLnNwbGljZShpbmRleCwgMiwgX3RoaXMuJHNjb3BlLmVkaXRTdG9yZVsncGVyc29ucyddW2luZGV4ICsgMV0sIF90aGlzLiRzY29wZS5lZGl0U3RvcmVbJ3BlcnNvbnMnXVtpbmRleF0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5fcmVtb3ZlID0gZnVuY3Rpb24gKGluZGV4KSB7XHJcbiAgICAgICAgICAgIF90aGlzLiRzY29wZS5lZGl0U3RvcmVbJ3BlcnNvbnMnXS5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5fYWRkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoIV90aGlzLiRzY29wZS5lZGl0U3RvcmVbJ3BlcnNvbnMnXSlcclxuICAgICAgICAgICAgICAgIF90aGlzLiRzY29wZS5lZGl0U3RvcmVbJ3BlcnNvbnMnXSA9IFtdO1xyXG4gICAgICAgICAgICBfdGhpcy4kc2NvcGUuZWRpdFN0b3JlWydwZXJzb25zJ10ucHVzaCh7IG5hbWU6IFwiUGVyc29uIFwiICsgKF90aGlzLiRzY29wZS5lZGl0U3RvcmVbJ3BlcnNvbnMnXS5sZW5ndGggKyAxKSB9KTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuX3N1Ym1pdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3Mub3BlbigxKTtcclxuICAgICAgICAgICAgdmFyIGNvdW50ID0gMDtcclxuICAgICAgICAgICAgdmFyIHJlUGFyc2UgPSBmYWxzZTtcclxuICAgICAgICAgICAgdmFyIHJlbG9hZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBhc3luYy5mb3JFYWNoT2ZTZXJpZXMoX3RoaXMuY29uc3RydWN0b3IuRklFTERTLCBmdW5jdGlvbiAoZmllbGQsIGtleSwgY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgIGlmIChKU09OLnN0cmluZ2lmeShhbmd1bGFyLmNvcHkoX3RoaXMuJHNjb3BlLmVkaXRTdG9yZVtrZXldKSkgPT0gSlNPTi5zdHJpbmdpZnkoX3RoaXMuZGF0YVN0b3JlLnNldHRpbmdzW2tleV0pKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLnJlUGFyc2UpXHJcbiAgICAgICAgICAgICAgICAgICAgcmVQYXJzZSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBpZiAoZmllbGQucmVsb2FkKVxyXG4gICAgICAgICAgICAgICAgICAgIHJlbG9hZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5zZXQoXCJTYXZpbmcgXCIgKyBrZXkgKyBcIi4uLlwiLCBjb3VudCsrIC8gT2JqZWN0LmtleXMoX3RoaXMuY29uc3RydWN0b3IuRklFTERTKS5sZW5ndGggKiAxMDApO1xyXG4gICAgICAgICAgICAgICAgX3RoaXMuJGh0dHAucHV0KCcvc2V0dGluZ3Mvc2F2ZScsIHsga2V5OiBrZXksIHZhbHVlOiBfdGhpcy4kc2NvcGUuZWRpdFN0b3JlW2tleV0gfSlcclxuICAgICAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLnNldHRpbmdzW2tleV0gPSBfdGhpcy4kc2NvcGUuZWRpdFN0b3JlW2tleV07XHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhuZXcgRXJyb3IoXCJFcnJvciBzYXZpbmcgXCIgKyBrZXkpKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZXJyKVxyXG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KGVycik7XHJcbiAgICAgICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgYXN5bmMud2F0ZXJmYWxsKFtcclxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlUGFyc2UpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5kYXRhVHJhbnNjaWV2ZXIucmVQYXJzZShjYWxsYmFjayk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlbG9hZClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmRhdGFUcmFuc2NpZXZlci5yZWxvYWQoY2FsbGJhY2spO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1dKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLl9vbldhdGNoU2V0dGluZyA9IGZ1bmN0aW9uIChrZXkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIF90aGlzLiRzY29wZS5lZGl0U3RvcmVba2V5XSA9IGFuZ3VsYXIuY29weShfdGhpcy5kYXRhU3RvcmUuc2V0dGluZ3Nba2V5XSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLiRzY29wZS5kYXRhU3RvcmUgPSB0aGlzLmRhdGFTdG9yZTtcclxuICAgICAgICB0aGlzLiRzY29wZS5lZGl0U3RvcmUgPSB7fTtcclxuICAgICAgICB0aGlzLiRzY29wZS5maWVsZHMgPSB0aGlzLmNvbnN0cnVjdG9yLkZJRUxEUztcclxuICAgICAgICB0aGlzLiRzY29wZS51cCA9IHRoaXMuX3VwO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlLmRvd24gPSB0aGlzLl9kb3duO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlLnJlbW92ZSA9IHRoaXMuX3JlbW92ZTtcclxuICAgICAgICB0aGlzLiRzY29wZS5hZGQgPSB0aGlzLl9hZGQ7XHJcbiAgICAgICAgdGhpcy4kc2NvcGUuc3VibWl0ID0gdGhpcy5fc3VibWl0O1xyXG4gICAgICAgIGZvciAodmFyIGZpZWxkTmFtZSBpbiB0aGlzLmNvbnN0cnVjdG9yLkZJRUxEUylcclxuICAgICAgICAgICAgdGhpcy4kc2NvcGUuJHdhdGNoKFwiZGF0YVN0b3JlLnNldHRpbmdzLlwiICsgZmllbGROYW1lLCB0aGlzLl9vbldhdGNoU2V0dGluZyhmaWVsZE5hbWUpKTtcclxuICAgIH1cclxuICAgIFNldHRpbmdzQ29udHJvbGxlci5GSUVMRFMgPSB7XHJcbiAgICAgICAgcGVyc29uczoge1xyXG4gICAgICAgICAgICByZVBhcnNlOiB0cnVlLFxyXG4gICAgICAgICAgICByZWxvYWQ6IHRydWVcclxuICAgICAgICB9LFxyXG4gICAgICAgIHN0YXJ0V29ya2luZ1RpbWU6IHtcclxuICAgICAgICAgICAgaGVhZGluZzogJ1N0YXJ0IFdvcmtpbmcgVGltZScsXHJcbiAgICAgICAgICAgIHR5cGU6ICdudW1iZXInXHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbmRXb3JraW5nVGltZToge1xyXG4gICAgICAgICAgICBoZWFkaW5nOiAnRW5kIFdvcmtpbmcgVGltZScsXHJcbiAgICAgICAgICAgIHR5cGU6ICdudW1iZXInXHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIHJldHVybiBTZXR0aW5nc0NvbnRyb2xsZXI7XHJcbn0pKCk7XHJcbmFuZ3VsYXIubW9kdWxlKCdBcHAnKS5jb250cm9sbGVyKCdTZXR0aW5nc0NvbnRyb2xsZXInLCBbJyRzY29wZScsICckaHR0cCcsICdkYXRhU3RvcmUnLCAnZGF0YVRyYW5zY2lldmVyJywgJ3Byb2dyZXNzJywgU2V0dGluZ3NDb250cm9sbGVyXSk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNldHRpbmdzLWNvbnRyb2xsZXIuanMubWFwIiwidmFyIFRpbWVsaW5lQ29udHJvbGxlciA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBUaW1lbGluZUNvbnRyb2xsZXIoJHNjb3BlLCAkZmlsdGVyLCAkaHR0cCwgZGF0YVN0b3JlLCBkYXRhVHJhbnNjaWV2ZXIpIHtcclxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlID0gJHNjb3BlO1xyXG4gICAgICAgIHRoaXMuJGZpbHRlciA9ICRmaWx0ZXI7XHJcbiAgICAgICAgdGhpcy4kaHR0cCA9ICRodHRwO1xyXG4gICAgICAgIHRoaXMuZGF0YVN0b3JlID0gZGF0YVN0b3JlO1xyXG4gICAgICAgIHRoaXMuZGF0YVRyYW5zY2lldmVyID0gZGF0YVRyYW5zY2lldmVyO1xyXG4gICAgICAgIHRoaXMuX29uUmFuZ2VDaGFuZ2VkID0gZnVuY3Rpb24gKHByb3BlcnRpZXMpIHtcclxuICAgICAgICAgICAgdmFyIGN1cnJlbnRTdGFydCA9IG1vbWVudChwcm9wZXJ0aWVzLnN0YXJ0KS5zdGFydE9mKCdkYXknKTtcclxuICAgICAgICAgICAgdmFyIGN1cnJlbnRFbmQgPSBtb21lbnQocHJvcGVydGllcy5lbmQpLmVuZE9mKCdkYXknKTtcclxuICAgICAgICAgICAgaWYgKGN1cnJlbnRTdGFydC5pc1NhbWVPckFmdGVyKF90aGlzLiRzY29wZS5zdGFydCkgJiYgY3VycmVudEVuZC5pc1NhbWVPckJlZm9yZShfdGhpcy4kc2NvcGUuZW5kKSlcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgaWYgKCFfdGhpcy4kc2NvcGUuc3RhcnQgfHwgY3VycmVudFN0YXJ0LmlzQmVmb3JlKF90aGlzLiRzY29wZS5zdGFydCkpXHJcbiAgICAgICAgICAgICAgICBfdGhpcy4kc2NvcGUuc3RhcnQgPSBjdXJyZW50U3RhcnQ7XHJcbiAgICAgICAgICAgIGlmICghX3RoaXMuJHNjb3BlLmVuZCB8fCBjdXJyZW50RW5kLmlzQWZ0ZXIoX3RoaXMuJHNjb3BlLmVuZCkpXHJcbiAgICAgICAgICAgICAgICBfdGhpcy4kc2NvcGUuZW5kID0gY3VycmVudEVuZDtcclxuICAgICAgICAgICAgX3RoaXMuX29uUmVsb2FkKCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLl9vblJlbG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgX3RoaXMuZGF0YVRyYW5zY2lldmVyLnJlbG9hZCh7IHN0YXJ0OiBfdGhpcy4kc2NvcGUuc3RhcnQsIGVuZDogX3RoaXMuJHNjb3BlLmVuZCB9LCBfdGhpcy5fb25SZWxvYWRFbmQpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5fb25SZWxvYWRFbmQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIF90aGlzLiRzY29wZS50aW1lbGluZUl0ZW1zLmNsZWFyKCk7XHJcbiAgICAgICAgICAgIHZhciBub3RlcyA9IHt9O1xyXG4gICAgICAgICAgICBmb3IgKHZhciBub3RlR3VpZCBpbiBfdGhpcy5kYXRhU3RvcmUubm90ZXMpIHtcclxuICAgICAgICAgICAgICAgIHZhciBub3RlID0gX3RoaXMuZGF0YVN0b3JlLm5vdGVzW25vdGVHdWlkXTtcclxuICAgICAgICAgICAgICAgIG5vdGVzW25vdGUuZ3VpZF0gPSBub3RlO1xyXG4gICAgICAgICAgICAgICAgX3RoaXMuJHNjb3BlLnRpbWVsaW5lSXRlbXMuYWRkKHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogbm90ZS5ndWlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwOiAndXBkYXRlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgY29udGVudDogXCI8YSBocmVmPVxcXCJldmVybm90ZTovLy92aWV3L1wiICsgX3RoaXMuZGF0YVN0b3JlLnVzZXJbJ2lkJ10gKyBcIi9cIiArIF90aGlzLmRhdGFTdG9yZS51c2VyWydzaGFyZElkJ10gKyBcIi9cIiArIG5vdGUuZ3VpZCArIFwiL1wiICsgbm90ZS5ndWlkICsgXCIvXFxcIiB0aXRsZT1cXFwiXCIgKyBub3RlLnRpdGxlICsgXCJcXFwiPlwiICsgX3RoaXMuJGZpbHRlcignYWJicmV2aWF0ZScpKG5vdGUudGl0bGUsIDQwKSArIFwiPC9hPlwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBuZXcgRGF0ZShub3RlLnVwZGF0ZWQpLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdwb2ludCdcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGZvciAodmFyIG5vdGVHdWlkIGluIF90aGlzLmRhdGFTdG9yZS50aW1lTG9ncykge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5vdGVUaW1lTG9ncyA9IF90aGlzLmRhdGFTdG9yZS50aW1lTG9nc1tub3RlR3VpZF07XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciB0aW1lTG9nSWQgaW4gbm90ZVRpbWVMb2dzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRpbWVMb2cgPSBub3RlVGltZUxvZ3NbdGltZUxvZ0lkXTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbm90ZVRpdGxlID0gbm90ZXNbdGltZUxvZy5ub3RlR3VpZF0udGl0bGU7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuJHNjb3BlLnRpbWVsaW5lSXRlbXMuYWRkKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHRpbWVMb2cuX2lkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cDogdGltZUxvZy5wZXJzb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IFwiPGEgaHJlZj1cXFwiZXZlcm5vdGU6Ly8vdmlldy9cIiArIF90aGlzLmRhdGFTdG9yZS51c2VyWydpZCddICsgXCIvXCIgKyBfdGhpcy5kYXRhU3RvcmUudXNlclsnc2hhcmRJZCddICsgXCIvXCIgKyB0aW1lTG9nLm5vdGVHdWlkICsgXCIvXCIgKyB0aW1lTG9nLm5vdGVHdWlkICsgXCIvXFxcIiB0aXRsZT1cXFwiXCIgKyBub3RlVGl0bGUgKyBcIiBcIiArIHRpbWVMb2cuY29tbWVudCArIFwiXFxcIj5cIiArIF90aGlzLiRmaWx0ZXIoJ2FiYnJldmlhdGUnKShub3RlVGl0bGUsIDIwKSArIFwiIFwiICsgX3RoaXMuJGZpbHRlcignYWJicmV2aWF0ZScpKHRpbWVMb2cuY29tbWVudCwgMjApICsgXCI8L2E+XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBtb21lbnQodGltZUxvZy5kYXRlKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5kOiB0aW1lTG9nLnNwZW50VGltZSA/IG1vbWVudCh0aW1lTG9nLmRhdGUpLmFkZCh0aW1lTG9nLnNwZW50VGltZSwgJ21pbnV0ZXMnKSA6IG51bGwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHRpbWVMb2cuc3BlbnRUaW1lID8gJ3JhbmdlJyA6ICdwb2ludCdcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5fb25SZXNpemUgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgX3RoaXMuJHNjb3BlWyd0aW1lbGluZSddLnNldE9wdGlvbnMoe1xyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiB3aW5kb3cuaW5uZXJIZWlnaHQgLSA5MFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuJHNjb3BlLmRhdGFTdG9yZSA9IHRoaXMuZGF0YVN0b3JlO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlLnRpbWVsaW5lSXRlbXMgPSBuZXcgdmlzLkRhdGFTZXQoKTtcclxuICAgICAgICB0aGlzLiRzY29wZS50aW1lbGluZUdyb3VwcyA9IG5ldyB2aXMuRGF0YVNldCgpO1xyXG4gICAgICAgIHRoaXMuJHNjb3BlLnN0YXJ0ID0gbW9tZW50KCkuc3RhcnRPZignZGF5Jyk7XHJcbiAgICAgICAgdGhpcy4kc2NvcGUuZW5kID0gbW9tZW50KCkuZW5kT2YoJ2RheScpO1xyXG4gICAgICAgIHRoaXMuZGF0YVRyYW5zY2lldmVyLnJlbG9hZCh7IHN0YXJ0OiB0aGlzLiRzY29wZS5zdGFydCwgZW5kOiB0aGlzLiRzY29wZS5lbmQgfSwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RpbWVsaW5lJyk7XHJcbiAgICAgICAgICAgIC8vIHNldCB3b3JraW5nIHRpbWVcclxuICAgICAgICAgICAgdmFyIGhpZGRlbkRhdGVzO1xyXG4gICAgICAgICAgICBpZiAoX3RoaXMuZGF0YVN0b3JlLnNldHRpbmdzICYmIF90aGlzLmRhdGFTdG9yZS5zZXR0aW5nc1snc3RhcnRXb3JraW5nVGltZSddICYmIF90aGlzLmRhdGFTdG9yZS5zZXR0aW5nc1snZW5kV29ya2luZ1RpbWUnXSlcclxuICAgICAgICAgICAgICAgIGhpZGRlbkRhdGVzID0gW3tcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IG1vbWVudCgpLnN1YnRyYWN0KDEsICdkYXlzJykuc3RhcnRPZignZGF5JykuaG91cihfdGhpcy5kYXRhU3RvcmUuc2V0dGluZ3NbJ2VuZFdvcmtpbmdUaW1lJ10pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmQ6IG1vbWVudCgpLnN0YXJ0T2YoJ2RheScpLmhvdXIoX3RoaXMuZGF0YVN0b3JlLnNldHRpbmdzWydzdGFydFdvcmtpbmdUaW1lJ10pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXBlYXQ6ICdkYWlseSdcclxuICAgICAgICAgICAgICAgICAgICB9XTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgaGlkZGVuRGF0ZXMgPSB7fTtcclxuICAgICAgICAgICAgLy8gZ2VuZXJhdGUgdGltZWxpbmUgb2JqZWN0XHJcbiAgICAgICAgICAgIF90aGlzLiRzY29wZVsndGltZWxpbmUnXSA9IG5ldyB2aXMuVGltZWxpbmUoY29udGFpbmVyLCBfdGhpcy4kc2NvcGUudGltZWxpbmVJdGVtcywgX3RoaXMuJHNjb3BlLnRpbWVsaW5lR3JvdXBzLCB7XHJcbiAgICAgICAgICAgICAgICBtYXJnaW46IHsgaXRlbTogNSB9LFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiB3aW5kb3cuaW5uZXJIZWlnaHQgLSA4MCxcclxuICAgICAgICAgICAgICAgIG9yaWVudGF0aW9uOiB7IGF4aXM6ICdib3RoJywgaXRlbTogJ3RvcCcgfSxcclxuICAgICAgICAgICAgICAgIHN0YXJ0OiBfdGhpcy4kc2NvcGUuc3RhcnQsXHJcbiAgICAgICAgICAgICAgICBlbmQ6IF90aGlzLiRzY29wZS5lbmQsXHJcbiAgICAgICAgICAgICAgICBvcmRlcjogZnVuY3Rpb24gKGEsIGIpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYS5zdGFydCAtIGIuc3RhcnQ7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgaGlkZGVuRGF0ZXM6IGhpZGRlbkRhdGVzXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAvLyBzZXQgcGVyc29uIGRhdGFcclxuICAgICAgICAgICAgaWYgKCFfdGhpcy5kYXRhU3RvcmUuc2V0dGluZ3MgfHwgIV90aGlzLmRhdGFTdG9yZS5zZXR0aW5nc1sncGVyc29ucyddKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gX3RoaXMuZGF0YVN0b3JlLnNldHRpbmdzWydwZXJzb25zJ107IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGVyc29uID0gX2FbX2ldO1xyXG4gICAgICAgICAgICAgICAgX3RoaXMuJHNjb3BlLnRpbWVsaW5lR3JvdXBzLmFkZCh7XHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IHBlcnNvbi5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHBlcnNvbi5uYW1lXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBfdGhpcy4kc2NvcGUudGltZWxpbmVHcm91cHMuYWRkKHtcclxuICAgICAgICAgICAgICAgIGlkOiAndXBkYXRlZCcsXHJcbiAgICAgICAgICAgICAgICBjb250ZW50OiAnVXBkYXRlJ1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgLy8gYWRkIGV2ZW50c1xyXG4gICAgICAgICAgICBfdGhpcy4kc2NvcGVbJ3RpbWVsaW5lJ10ub24oJ3JhbmdlY2hhbmdlZCcsIF90aGlzLl9vblJhbmdlQ2hhbmdlZCk7XHJcbiAgICAgICAgICAgIF90aGlzLiRzY29wZS4kb24oJ3Jlc2l6ZTo6cmVzaXplJywgX3RoaXMuX29uUmVzaXplKTtcclxuICAgICAgICAgICAgX3RoaXMuJHNjb3BlLiRvbignZXZlbnQ6OnJlbG9hZCcsIF90aGlzLl9vblJlbG9hZCk7XHJcbiAgICAgICAgICAgIC8vIHJlbG9hZFxyXG4gICAgICAgICAgICBfdGhpcy5fb25SZWxvYWRFbmQoKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIHJldHVybiBUaW1lbGluZUNvbnRyb2xsZXI7XHJcbn0pKCk7XHJcbmFuZ3VsYXIubW9kdWxlKCdBcHAnKS5jb250cm9sbGVyKCdUaW1lbGluZUNvbnRyb2xsZXInLCBbJyRzY29wZScsICckZmlsdGVyJywgJyRodHRwJywgJ2RhdGFTdG9yZScsICdkYXRhVHJhbnNjaWV2ZXInLCBUaW1lbGluZUNvbnRyb2xsZXJdKTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dGltZWxpbmUtY29udHJvbGxlci5qcy5tYXAiLCJhbmd1bGFyLm1vZHVsZSgnQXBwJykuZGlyZWN0aXZlKCdyZXNpemUnLCBmdW5jdGlvbiAoJHRpbWVvdXQsICRyb290U2NvcGUsICR3aW5kb3cpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgbGluazogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgdGltZXIgPSBmYWxzZTtcclxuICAgICAgICAgICAgYW5ndWxhci5lbGVtZW50KCR3aW5kb3cpLm9uKCdsb2FkIHJlc2l6ZScsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRpbWVyKVxyXG4gICAgICAgICAgICAgICAgICAgICR0aW1lb3V0LmNhbmNlbCh0aW1lcik7XHJcbiAgICAgICAgICAgICAgICB0aW1lciA9ICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3Jlc2l6ZTo6cmVzaXplJyk7XHJcbiAgICAgICAgICAgICAgICB9LCAyMDApO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59KTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cmVzaXplLmpzLm1hcCIsInZhciBhYmJyZXZpYXRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0ZXh0LCBsZW4sIHRydW5jYXRpb24pIHtcclxuICAgICAgICBpZiAobGVuID09PSB2b2lkIDApIHsgbGVuID0gMTA7IH1cclxuICAgICAgICBpZiAodHJ1bmNhdGlvbiA9PT0gdm9pZCAwKSB7IHRydW5jYXRpb24gPSAnLi4uJzsgfVxyXG4gICAgICAgIHZhciBjb3VudCA9IDA7XHJcbiAgICAgICAgdmFyIHN0ciA9ICcnO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGV4dC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgbiA9IGVuY29kZVVSSSh0ZXh0LmNoYXJBdChpKSk7XHJcbiAgICAgICAgICAgIGlmIChuLmxlbmd0aCA8IDQpXHJcbiAgICAgICAgICAgICAgICBjb3VudCsrO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBjb3VudCArPSAyO1xyXG4gICAgICAgICAgICBpZiAoY291bnQgPiBsZW4pXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RyICsgdHJ1bmNhdGlvbjtcclxuICAgICAgICAgICAgc3RyICs9IHRleHQuY2hhckF0KGkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGV4dDtcclxuICAgIH07XHJcbn07XHJcbmFuZ3VsYXIubW9kdWxlKCdBcHAnKS5maWx0ZXIoJ2FiYnJldmlhdGUnLCBhYmJyZXZpYXRlKTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YWJicmV2aWF0ZS5qcy5tYXAiLCJ2YXIgY2hlY2tJdGVtTWF0Y2hlcyA9IGZ1bmN0aW9uIChpdGVtLCBwcm9wcykge1xyXG4gICAgdmFyIGl0ZW1NYXRjaGVzID0gZmFsc2U7XHJcbiAgICBmb3IgKHZhciBwcm9wIGluIHByb3BzKSB7XHJcbiAgICAgICAgdmFyIHRleHQgPSBwcm9wc1twcm9wXTtcclxuICAgICAgICB0ZXh0ID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgIGlmIChpdGVtW3Byb3BdLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKS5pbmRleE9mKHRleHQpICE9IC0xKSB7XHJcbiAgICAgICAgICAgIGl0ZW1NYXRjaGVzID0gdHJ1ZTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGl0ZW1NYXRjaGVzO1xyXG59O1xyXG52YXIgZmlsdGVyQnlQcm9wZXJ0eSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAoaXRlbXMsIHByb3BzKSB7XHJcbiAgICAgICAgdmFyIG91dCA9IFtdO1xyXG4gICAgICAgIGlmIChhbmd1bGFyLmlzQXJyYXkoaXRlbXMpKVxyXG4gICAgICAgICAgICBmb3IgKHZhciBpdGVtIGluIGl0ZW1zKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaXRlbU1hdGNoZXMgPSBjaGVja0l0ZW1NYXRjaGVzKGl0ZW0sIHByb3BzKTtcclxuICAgICAgICAgICAgICAgIGlmIChpdGVtTWF0Y2hlcylcclxuICAgICAgICAgICAgICAgICAgICBvdXQucHVzaChpdGVtKTtcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGFuZ3VsYXIuaXNPYmplY3QoaXRlbXMpKVxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBpdGVtcy5sZW5ndGg7IF9pKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbSA9IGl0ZW1zW19pXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbU1hdGNoZXMgPSBjaGVja0l0ZW1NYXRjaGVzKGl0ZW0sIHByb3BzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW1NYXRjaGVzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0LnB1c2goaXRlbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIG91dCA9IGl0ZW1zO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG91dDtcclxuICAgICAgICAgICAgfVxyXG4gICAgfTtcclxufTtcclxuYW5ndWxhci5tb2R1bGUoJ0FwcCcpLmZpbHRlcignZmlsdGVyQnlQcm9wZXJ0eScsIGZpbHRlckJ5UHJvcGVydHkpO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1maWx0ZXItYnktcHJvcGVydHkuanMubWFwIiwidmFyIG9iamVjdExlbmd0aCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBfb2JqZWN0TGVuZ3RoID0gZnVuY3Rpb24gKGlucHV0LCBkZXB0aCkge1xyXG4gICAgICAgIGlmIChkZXB0aCA9PT0gdm9pZCAwKSB7IGRlcHRoID0gMDsgfVxyXG4gICAgICAgIGlmICghYW5ndWxhci5pc09iamVjdChpbnB1dCkpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVzYWdlIG9mIG5vbi1vYmplY3RzIHdpdGggb2JqZWN0TGVuZ3RoIGZpbHRlci5cIik7XHJcbiAgICAgICAgaWYgKGRlcHRoID09IDApXHJcbiAgICAgICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhpbnB1dCkubGVuZ3RoO1xyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gMDtcclxuICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGlucHV0Lmxlbmd0aDsgX2krKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gaW5wdXRbX2ldO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IF9vYmplY3RMZW5ndGgodmFsdWUsIGRlcHRoIC0gMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIF9vYmplY3RMZW5ndGg7XHJcbn07XHJcbmFuZ3VsYXIubW9kdWxlKCdBcHAnKS5maWx0ZXIoJ29iamVjdExlbmd0aCcsIG9iamVjdExlbmd0aCk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW9iamVjdC1sZW5ndGguanMubWFwIiwidmFyIG9yZGVyT2JqZWN0QnkgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKGl0ZW1zLCBmaWVsZCwgcmV2ZXJzZSkge1xyXG4gICAgICAgIGlmIChmaWVsZCA9PT0gdm9pZCAwKSB7IGZpZWxkID0gJyR2YWx1ZSc7IH1cclxuICAgICAgICBpZiAocmV2ZXJzZSA9PT0gdm9pZCAwKSB7IHJldmVyc2UgPSB0cnVlOyB9XHJcbiAgICAgICAgdmFyIGZpbHRlcmVkID0gW107XHJcbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKGl0ZW1zLCBmdW5jdGlvbiAoaXRlbSwga2V5KSB7XHJcbiAgICAgICAgICAgIGZpbHRlcmVkLnB1c2goe1xyXG4gICAgICAgICAgICAgICAga2V5OiBrZXksXHJcbiAgICAgICAgICAgICAgICBpdGVtOiBpdGVtXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGZpbHRlcmVkLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcclxuICAgICAgICAgICAgaWYgKGZpZWxkID09ICcka2V5JylcclxuICAgICAgICAgICAgICAgIHJldHVybiAoYS5rZXkgPiBiLmtleSkgPyAtMSA6IDE7XHJcbiAgICAgICAgICAgIGlmIChmaWVsZCA9PSAnJHZhbHVlJylcclxuICAgICAgICAgICAgICAgIHJldHVybiAoYS5pdGVtID4gYi5pdGVtKSA/IC0xIDogMTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBmaWVsZCA9PSAnc3RyaW5nJylcclxuICAgICAgICAgICAgICAgIHJldHVybiAoYVtmaWVsZF0gPiBiW2ZpZWxkXSkgPyAtMSA6IDE7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZmllbGQgPT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICAgICAgICAgIHJldHVybiAoZmllbGQoYS5pdGVtLCBhLmtleSkgPiBmaWVsZChiLml0ZW0sIGIua2V5KSkgPyAtMSA6IDE7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaWYgKHJldmVyc2UpXHJcbiAgICAgICAgICAgIGZpbHRlcmVkLnJldmVyc2UoKTtcclxuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xyXG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaChmaWx0ZXJlZCwgZnVuY3Rpb24gKGl0ZW0pIHtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGl0ZW0uaXRlbTtcclxuICAgICAgICAgICAgcmVzdWx0Wycka2V5J10gPSBpdGVtLmtleTtcclxuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XHJcbiAgICB9O1xyXG59O1xyXG5hbmd1bGFyLm1vZHVsZSgnQXBwJykuZmlsdGVyKCdvcmRlck9iamVjdEJ5Jywgb3JkZXJPYmplY3RCeSk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW9yZGVyLW9iamVjdC1ieS5qcy5tYXAiLCJ2YXIgc3BlbnRUaW1lID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChpbnB1dCkge1xyXG4gICAgICAgIGlmIChpbnB1dCA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICByZXR1cm4gJyc7XHJcbiAgICAgICAgaWYgKCFpbnB1dClcclxuICAgICAgICAgICAgcmV0dXJuICcwbSc7XHJcbiAgICAgICAgdmFyIGhvdXIgPSBNYXRoLmZsb29yKGlucHV0IC8gNjApO1xyXG4gICAgICAgIHZhciBtaW51dGUgPSBpbnB1dCAlIDYwO1xyXG4gICAgICAgIGlmIChob3VyKVxyXG4gICAgICAgICAgICByZXR1cm4gaG91ciArICdoJyArIG1pbnV0ZSArICdtJztcclxuICAgICAgICByZXR1cm4gbWludXRlICsgJ20nO1xyXG4gICAgfTtcclxufTtcclxuYW5ndWxhci5tb2R1bGUoJ0FwcCcpLmZpbHRlcignc3BlbnRUaW1lJywgc3BlbnRUaW1lKTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c3BlbnQtdGltZS5qcy5tYXAiLCIvLyBhbmd1bGFyLmpzIHNldHRpbmdcclxuYW5ndWxhci5tb2R1bGUoJ0FwcCcsIFsnbmdSb3V0ZScsICd1aS5ib290c3RyYXAnLCAnbmdTYW5pdGl6ZScsICd1aS5zZWxlY3QnXSk7XHJcbmFuZ3VsYXIubW9kdWxlKCdBcHAnKS5jb25maWcoWyckY29tcGlsZVByb3ZpZGVyJywgZnVuY3Rpb24gKCRjb21waWxlUHJvdmlkZXIpIHtcclxuICAgICAgICAkY29tcGlsZVByb3ZpZGVyLmFIcmVmU2FuaXRpemF0aW9uV2hpdGVsaXN0KC9eXFxzKihodHRwfGh0dHBzfG1haWx0b3xldmVybm90ZSk6Lyk7XHJcbiAgICB9XSk7XHJcbi8vIHJvdXRlIHNldHRpbmdzXHJcbnJlcXVpcmUoJy4vcm91dGUnKTtcclxuLy8gYW5ndWxhci5qcyBmaWx0ZXJzXHJcbnJlcXVpcmUoJy4vZmlsdGVycy9hYmJyZXZpYXRlJyk7XHJcbnJlcXVpcmUoJy4vZmlsdGVycy9maWx0ZXItYnktcHJvcGVydHknKTtcclxucmVxdWlyZSgnLi9maWx0ZXJzL29iamVjdC1sZW5ndGgnKTtcclxucmVxdWlyZSgnLi9maWx0ZXJzL29yZGVyLW9iamVjdC1ieScpO1xyXG5yZXF1aXJlKCcuL2ZpbHRlcnMvc3BlbnQtdGltZScpO1xyXG4vLyBhbmd1bGFyLmpzIHNlcnZpY2VzXHJcbnJlcXVpcmUoJy4vc2VydmljZXMvZGF0YS1zdG9yZScpO1xyXG5yZXF1aXJlKCcuL3NlcnZpY2VzL2RhdGEtdHJhbnNjaWV2ZXInKTtcclxucmVxdWlyZSgnLi9zZXJ2aWNlcy9wcm9ncmVzcycpO1xyXG4vLyBhbmd1bGFyLmpzIGRpcmVjdGl2ZXNcclxucmVxdWlyZSgnLi9kaXJlY3RpdmVzL3Jlc2l6ZScpO1xyXG4vLyBhbmd1bGFyLmpzIGNvbnRyb2xsZXJzXHJcbnJlcXVpcmUoJy4vY29udHJvbGxlcnMvYXV0aC1jb250cm9sbGVyJyk7XHJcbnJlcXVpcmUoJy4vY29udHJvbGxlcnMvY29udHJvbGxlcicpO1xyXG5yZXF1aXJlKCcuL2NvbnRyb2xsZXJzL21lbnUtY29udHJvbGxlcicpO1xyXG5yZXF1aXJlKCcuL2NvbnRyb2xsZXJzL25hdmlnYXRpb24tY29udHJvbGxlcicpO1xyXG5yZXF1aXJlKCcuL2NvbnRyb2xsZXJzL25vdGVzLWNvbnRyb2xsZXInKTtcclxucmVxdWlyZSgnLi9jb250cm9sbGVycy9wcm9ncmVzcy1tb2RhbC1jb250cm9sbGVyJyk7XHJcbnJlcXVpcmUoJy4vY29udHJvbGxlcnMvc2V0dGluZ3MtY29udHJvbGxlcicpO1xyXG5yZXF1aXJlKCcuL2NvbnRyb2xsZXJzL3RpbWVsaW5lLWNvbnRyb2xsZXInKTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiYW5ndWxhci5tb2R1bGUoJ0FwcCcpLmNvbmZpZyhbJyRyb3V0ZVByb3ZpZGVyJywgZnVuY3Rpb24gKCRyb3V0ZVByb3ZpZGVyKSB7XHJcbiAgICAgICAgJHJvdXRlUHJvdmlkZXJcclxuICAgICAgICAgICAgLndoZW4oJy8nLCB7XHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnbWVudSdcclxuICAgICAgICB9KVxyXG4gICAgICAgICAgICAud2hlbignL3RpbWVsaW5lJywge1xyXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3RpbWVsaW5lJ1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgICAgIC53aGVuKCcvbm90ZXMnLCB7XHJcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnbm90ZXMnXHJcbiAgICAgICAgfSlcclxuICAgICAgICAgICAgLndoZW4oJy9zZXR0aW5ncycsIHtcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdzZXR0aW5ncydcclxuICAgICAgICB9KVxyXG4gICAgICAgICAgICAub3RoZXJ3aXNlKHtcclxuICAgICAgICAgICAgcmVkaXJlY3RUbzogJy8nXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XSk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXJvdXRlLmpzLm1hcCIsInZhciBEYXRhU3RvcmVTZXJ2aWNlID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIERhdGFTdG9yZVNlcnZpY2UoKSB7XHJcbiAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcclxuICAgICAgICB0aGlzLnBlcnNvbnMgPSBbXTtcclxuICAgICAgICB0aGlzLm5vdGVib29rcyA9IHt9O1xyXG4gICAgICAgIHRoaXMuc3RhY2tzID0gW107XHJcbiAgICAgICAgdGhpcy5ub3RlcyA9IHt9O1xyXG4gICAgICAgIHRoaXMudGltZUxvZ3MgPSB7fTtcclxuICAgICAgICB0aGlzLnByb2ZpdExvZ3MgPSB7fTtcclxuICAgICAgICB0aGlzLnNldHRpbmdzID0ge307XHJcbiAgICB9XHJcbiAgICByZXR1cm4gRGF0YVN0b3JlU2VydmljZTtcclxufSkoKTtcclxuZXhwb3J0cy5EYXRhU3RvcmVTZXJ2aWNlID0gRGF0YVN0b3JlU2VydmljZTtcclxuYW5ndWxhci5tb2R1bGUoJ0FwcCcpLnNlcnZpY2UoJ2RhdGFTdG9yZScsIFtEYXRhU3RvcmVTZXJ2aWNlXSk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGEtc3RvcmUuanMubWFwIiwidmFyIGFzeW5jID0gcmVxdWlyZSgnYXN5bmMnKTtcclxudmFyIG1lcmdlID0gcmVxdWlyZSgnbWVyZ2UnKTtcclxudmFyIERhdGFUcmFuc2NpZXZlclNlcnZpY2UgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gRGF0YVRyYW5zY2lldmVyU2VydmljZSgkaHR0cCwgZGF0YVN0b3JlLCBwcm9ncmVzcykge1xyXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy4kaHR0cCA9ICRodHRwO1xyXG4gICAgICAgIHRoaXMuZGF0YVN0b3JlID0gZGF0YVN0b3JlO1xyXG4gICAgICAgIHRoaXMucHJvZ3Jlc3MgPSBwcm9ncmVzcztcclxuICAgICAgICB0aGlzLmZpbHRlclBhcmFtcyA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5yZWxvYWQgPSBmdW5jdGlvbiAocGFyYW1zLCBjYWxsYmFjaykge1xyXG4gICAgICAgICAgICBpZiAocGFyYW1zID09PSB2b2lkIDApIHsgcGFyYW1zID0ge307IH1cclxuICAgICAgICAgICAgaWYgKCFjYWxsYmFjaylcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgdmFyIG5vdGVRdWVyeSA9IF90aGlzLl9tYWtlTm90ZVF1ZXJ5KHBhcmFtcyB8fCB7fSk7XHJcbiAgICAgICAgICAgIHZhciBub3RlQ291bnQgPSAwO1xyXG4gICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5vcGVuKDEwKTtcclxuICAgICAgICAgICAgYXN5bmMuc2VyaWVzKFtcclxuICAgICAgICAgICAgICAgIC8vIGdldCB1c2VyXHJcbiAgICAgICAgICAgICAgICAvLyBnZXQgdXNlclxyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKF90aGlzLmRhdGFTdG9yZS51c2VyKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5uZXh0KCdHZXR0aW5nIHVzZXIgZGF0YS4nKTtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy4kaHR0cC5nZXQoJy91c2VyJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLnVzZXIgPSBkYXRhO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcignRXJyb3IgJGh0dHAgcmVxdWVzdCcpKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAvLyBnZXQgc2V0dGluZ3NcclxuICAgICAgICAgICAgICAgIC8vIGdldCBzZXR0aW5nc1xyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3MubmV4dCgnR2V0dGluZyBzZXR0aW5ncyBkYXRhLicpO1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLiRodHRwLmdldCgnL3NldHRpbmdzJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLnNldHRpbmdzID0gZGF0YTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhuZXcgRXJyb3IoJ0Vycm9yICRodHRwIHJlcXVlc3QnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgc2V0dGluZ3NcclxuICAgICAgICAgICAgICAgIC8vIGNoZWNrIHNldHRpbmdzXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIV90aGlzLmRhdGFTdG9yZS5zZXR0aW5nc1sncGVyc29ucyddIHx8IF90aGlzLmRhdGFTdG9yZS5zZXR0aW5nc1sncGVyc29ucyddLmxlbmd0aCA9PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKCdUaGlzIGFwcCBuZWVkIHBlcnNvbnMgc2V0dGluZy4gUGxlYXNlIHN3aXRjaCBcIlNldHRpbmdzIFBhZ2VcIiBhbmQgc2V0IHlvdXIgcGVyc29ucyBkYXRhLicpKTtcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIC8vIHN5bmNcclxuICAgICAgICAgICAgICAgIC8vIHN5bmNcclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnByb2dyZXNzLm5leHQoJ1N5bmNpbmcgcmVtb3RlIHNlcnZlci4nKTtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy4kaHR0cC5nZXQoJy9zeW5jJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcignRXJyb3IgJGh0dHAgcmVxdWVzdCcpKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAvLyBnZXQgbm90ZWJvb2tzXHJcbiAgICAgICAgICAgICAgICAvLyBnZXQgbm90ZWJvb2tzXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5uZXh0KCdHZXR0aW5nIG5vdGVib29rcyBkYXRhLicpO1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLiRodHRwLmdldCgnL25vdGVib29rcycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmRhdGFTdG9yZS5ub3RlYm9va3MgPSB7fTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHN0YWNrSGFzaCA9IHt9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgZGF0YS5sZW5ndGg7IF9pKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBub3RlYm9vayA9IGRhdGFbX2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLm5vdGVib29rc1tub3RlYm9vay5ndWlkXSA9IG5vdGVib29rO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5vdGVib29rLnN0YWNrKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrSGFzaFtub3RlYm9vay5zdGFja10gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmRhdGFTdG9yZS5zdGFja3MgPSBPYmplY3Qua2V5cyhzdGFja0hhc2gpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcignRXJyb3IgJGh0dHAgcmVxdWVzdCcpKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5uZXh0KCdHZXR0aW5nIG5vdGVzIGNvdW50LicpO1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLiRodHRwLmdldCgnL25vdGVzL2NvdW50JywgeyBwYXJhbXM6IHsgcXVlcnk6IG5vdGVRdWVyeSB9IH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vdGVDb3VudCA9IGRhdGE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub3RlQ291bnQgPiAxMDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAod2luZG93LmNvbmZpcm0oXCJDdXJyZW50IHF1ZXJ5IGZpbmQgXCIgKyBub3RlQ291bnQgKyBcIiBub3Rlcy4gSXQgaXMgdG9vIG1hbnkuIENvbnRpbnVlIGFueXdheT9cIikpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhuZXcgRXJyb3IoJ1VzZXIgQ2FuY2VsZWQnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobmV3IEVycm9yKCdFcnJvciAkaHR0cCByZXF1ZXN0JykpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIC8vIGdldCBub3Rlc1xyXG4gICAgICAgICAgICAgICAgLy8gZ2V0IG5vdGVzXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5uZXh0KCdHZXR0aW5nIG5vdGVzLicpO1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLiRodHRwLmdldCgnL25vdGVzJywgeyBwYXJhbXM6IHsgcXVlcnk6IG5vdGVRdWVyeSB9IH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmRhdGFTdG9yZS5ub3RlcyA9IHt9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgZGF0YS5sZW5ndGg7IF9pKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBub3RlID0gZGF0YVtfaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5kYXRhU3RvcmUubm90ZXNbbm90ZS5ndWlkXSA9IG5vdGU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhuZXcgRXJyb3IoJ0Vycm9yICRodHRwIHJlcXVlc3QnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgLy8gZ2V0IGNvbnRlbnQgZnJvbSByZW1vdGVcclxuICAgICAgICAgICAgICAgIC8vIGdldCBjb250ZW50IGZyb20gcmVtb3RlXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5uZXh0KCdSZXF1ZXN0IHJlbW90ZSBjb250ZW50cy4nKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY291bnQgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIGFzeW5jLmZvckVhY2hPZlNlcmllcyhfdGhpcy5kYXRhU3RvcmUubm90ZXMsIGZ1bmN0aW9uIChub3RlLCBub3RlR3VpZCwgY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3Muc2V0KFwiUmVxdWVzdCByZW1vdGUgY29udGVudHMuIFwiICsgKytjb3VudCArIFwiIC8gXCIgKyBPYmplY3Qua2V5cyhfdGhpcy5kYXRhU3RvcmUubm90ZXMpLmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbm90ZS5oYXNDb250ZW50KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuJGh0dHAuZ2V0KCcvbm90ZXMvZ2V0LWNvbnRlbnQnLCB7IHBhcmFtczogeyBxdWVyeTogeyBndWlkOiBub3RlR3VpZCB9IH0gfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBkYXRhLmxlbmd0aDsgX2krKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3RlID0gZGF0YVtfaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmRhdGFTdG9yZS5ub3Rlc1tub3RlLmd1aWRdID0gbm90ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhuZXcgRXJyb3IoJ0Vycm9yICRodHRwIHJlcXVlc3QnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgLy8gZ2V0IHRpbWUgbG9nc1xyXG4gICAgICAgICAgICAgICAgLy8gZ2V0IHRpbWUgbG9nc1xyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3MubmV4dCgnR2V0dGluZyB0aW1lIGxvZ3MuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGd1aWRzID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbm90ZUd1aWQgaW4gX3RoaXMuZGF0YVN0b3JlLm5vdGVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBub3RlID0gX3RoaXMuZGF0YVN0b3JlLm5vdGVzW25vdGVHdWlkXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ3VpZHMucHVzaChub3RlLmd1aWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGltZUxvZ1F1ZXJ5ID0gX3RoaXMuX21ha2VUaW1lTG9nUXVlcnkobWVyZ2UodHJ1ZSwgcGFyYW1zLCB7IG5vdGVHdWlkczogZ3VpZHMgfSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLiRodHRwLnBvc3QoJy90aW1lLWxvZ3MnLCB7IHF1ZXJ5OiB0aW1lTG9nUXVlcnkgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLnRpbWVMb2dzID0ge307XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBkYXRhLmxlbmd0aDsgX2krKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRpbWVMb2cgPSBkYXRhW19pXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghX3RoaXMuZGF0YVN0b3JlLnRpbWVMb2dzW3RpbWVMb2cubm90ZUd1aWRdKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmRhdGFTdG9yZS50aW1lTG9nc1t0aW1lTG9nLm5vdGVHdWlkXSA9IHt9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuZGF0YVN0b3JlLnRpbWVMb2dzW3RpbWVMb2cubm90ZUd1aWRdW3RpbWVMb2cuX2lkXSA9IHRpbWVMb2c7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhuZXcgRXJyb3IoJ0Vycm9yICRodHRwIHJlcXVlc3QnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgLy8gZ2V0IHByb2ZpdCBsb2dzXHJcbiAgICAgICAgICAgICAgICAvLyBnZXQgcHJvZml0IGxvZ3NcclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnByb2dyZXNzLm5leHQoJ0dldHRpbmcgcHJvZml0IGxvZ3MuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGd1aWRzID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbm90ZUd1aWQgaW4gX3RoaXMuZGF0YVN0b3JlLm5vdGVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBub3RlID0gX3RoaXMuZGF0YVN0b3JlLm5vdGVzW25vdGVHdWlkXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ3VpZHMucHVzaChub3RlLmd1aWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy4kaHR0cC5wb3N0KCcvcHJvZml0LWxvZ3MnLCB7IHF1ZXJ5OiB7IG5vdGVHdWlkOiB7ICRpbjogZ3VpZHMgfSB9IH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmRhdGFTdG9yZS5wcm9maXRMb2dzID0ge307XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBkYXRhLmxlbmd0aDsgX2krKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByb2ZpdExvZyA9IGRhdGFbX2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFfdGhpcy5kYXRhU3RvcmUucHJvZml0TG9nc1twcm9maXRMb2cubm90ZUd1aWRdKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmRhdGFTdG9yZS5wcm9maXRMb2dzW3Byb2ZpdExvZy5ub3RlR3VpZF0gPSB7fTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmRhdGFTdG9yZS5wcm9maXRMb2dzW3Byb2ZpdExvZy5ub3RlR3VpZF1bcHJvZml0TG9nLl9pZF0gPSBwcm9maXRMb2c7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhuZXcgRXJyb3IoJ0Vycm9yICRodHRwIHJlcXVlc3QnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBdLCBmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZXJyKVxyXG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KGVycik7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3MubmV4dCgnRG9uZS4nKTtcclxuICAgICAgICAgICAgICAgIF90aGlzLnByb2dyZXNzLmNsb3NlKCk7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMucmVQYXJzZSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICBpZiAoIWNhbGxiYWNrKVxyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5vcGVuKDIpO1xyXG4gICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5uZXh0KCdSZSBQYXJzZSBub3Rlcy4uLicpO1xyXG4gICAgICAgICAgICBhc3luYy53YXRlcmZhbGwoW1xyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuJGh0dHAuZ2V0KCcvbm90ZXMvcmUtcGFyc2UnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygnRXJyb3IgJGh0dHAgcmVxdWVzdCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfV0sIGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgICAgICAgICAgIF90aGlzLnByb2dyZXNzLm5leHQoJ0RvbmUuJyk7XHJcbiAgICAgICAgICAgICAgICBfdGhpcy5wcm9ncmVzcy5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLmNvdW50Tm90ZXMgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgdmFyIHF1ZXJ5ID0gX3RoaXMuX21ha2VOb3RlUXVlcnkoKTtcclxuICAgICAgICAgICAgX3RoaXMuJGh0dHAuZ2V0KCcvbm90ZXMvY291bnQnLCB7IHBhcmFtczogeyBxdWVyeTogcXVlcnkgfSB9KVxyXG4gICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIGRhdGEpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCdFcnJvciAkaHR0cCByZXF1ZXN0Jyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5jb3VudFRpbWVMb2dzID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIHZhciBxdWVyeSA9IF90aGlzLl9tYWtlVGltZUxvZ1F1ZXJ5KCk7XHJcbiAgICAgICAgICAgIF90aGlzLiRodHRwLmdldCgnL3RpbWUtbG9ncy9jb3VudCcsIHsgcGFyYW1zOiB7IHF1ZXJ5OiBxdWVyeSB9IH0pXHJcbiAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgZGF0YSk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soJ0Vycm9yICRodHRwIHJlcXVlc3QnKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLl9tYWtlTm90ZVF1ZXJ5ID0gZnVuY3Rpb24gKHBhcmFtcykge1xyXG4gICAgICAgICAgICBpZiAocGFyYW1zID09PSB2b2lkIDApIHsgcGFyYW1zID0ge307IH1cclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHt9O1xyXG4gICAgICAgICAgICAvLyBzZXQgdXBkYXRlZCBxdWVyeVxyXG4gICAgICAgICAgICBpZiAocGFyYW1zLnN0YXJ0KVxyXG4gICAgICAgICAgICAgICAgbWVyZ2UocmVzdWx0LCB7IHVwZGF0ZWQ6IHsgJGd0ZTogcGFyYW1zLnN0YXJ0LnZhbHVlT2YoKSB9IH0pO1xyXG4gICAgICAgICAgICAvLyBjaGVjayBub3RlYm9va3NcclxuICAgICAgICAgICAgdmFyIG5vdGVib29rc0hhc2ggPSB7fTtcclxuICAgICAgICAgICAgaWYgKF90aGlzLmZpbHRlclBhcmFtcy5ub3RlYm9va0d1aWRzICYmIF90aGlzLmZpbHRlclBhcmFtcy5ub3RlYm9va0d1aWRzLmxlbmd0aCA+IDApXHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gX3RoaXMuZmlsdGVyUGFyYW1zLm5vdGVib29rR3VpZHM7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5vdGVib29rR3VpZCA9IF9hW19pXTtcclxuICAgICAgICAgICAgICAgICAgICBub3RlYm9va3NIYXNoW25vdGVib29rR3VpZF0gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBjaGVjayBzdGFja3NcclxuICAgICAgICAgICAgaWYgKF90aGlzLmZpbHRlclBhcmFtcy5zdGFja3MgJiYgX3RoaXMuZmlsdGVyUGFyYW1zLnN0YWNrcy5sZW5ndGggPiAwKVxyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgX2IgPSAwLCBfYyA9IF90aGlzLmZpbHRlclBhcmFtcy5zdGFja3M7IF9iIDwgX2MubGVuZ3RoOyBfYisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0YWNrID0gX2NbX2JdO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG5vdGVib29rR3VpZF8xIGluIF90aGlzLmRhdGFTdG9yZS5ub3RlYm9va3MpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5vdGVib29rID0gX3RoaXMuZGF0YVN0b3JlLm5vdGVib29rc1tub3RlYm9va0d1aWRfMV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGFjayA9PSBub3RlYm9vay5zdGFjaylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGVib29rc0hhc2hbbm90ZWJvb2suZ3VpZF0gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gc2V0IG5vdGVib29rcyBxdWVyeSBjaGVja2VkIGJlZm9yZVxyXG4gICAgICAgICAgICB2YXIgbm90ZWJvb2tzQXJyYXkgPSBPYmplY3Qua2V5cyhub3RlYm9va3NIYXNoKTtcclxuICAgICAgICAgICAgaWYgKG5vdGVib29rc0FycmF5Lmxlbmd0aCA+IDApXHJcbiAgICAgICAgICAgICAgICBtZXJnZShyZXN1bHQsIHsgbm90ZWJvb2tHdWlkOiB7ICRpbjogbm90ZWJvb2tzQXJyYXkgfSB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuX21ha2VUaW1lTG9nUXVlcnkgPSBmdW5jdGlvbiAocGFyYW1zKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJhbXMgPT09IHZvaWQgMCkgeyBwYXJhbXMgPSB7fTsgfVxyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0ge307XHJcbiAgICAgICAgICAgIC8vIHNldCBkYXRlIHF1ZXJ5XHJcbiAgICAgICAgICAgIGlmIChwYXJhbXMuc3RhcnQpXHJcbiAgICAgICAgICAgICAgICBtZXJnZS5yZWN1cnNpdmUocmVzdWx0LCB7IGRhdGU6IHsgJGd0ZTogcGFyYW1zLnN0YXJ0LnZhbHVlT2YoKSB9IH0pO1xyXG4gICAgICAgICAgICBpZiAocGFyYW1zLmVuZClcclxuICAgICAgICAgICAgICAgIG1lcmdlLnJlY3Vyc2l2ZShyZXN1bHQsIHsgZGF0ZTogeyAkbHRlOiBwYXJhbXMuZW5kLnZhbHVlT2YoKSB9IH0pO1xyXG4gICAgICAgICAgICAvLyBzZXQgbm90ZSBndWlkcyBxdWVyeVxyXG4gICAgICAgICAgICBpZiAocGFyYW1zLm5vdGVHdWlkcylcclxuICAgICAgICAgICAgICAgIG1lcmdlKHJlc3VsdCwgeyBub3RlR3VpZDogeyAkaW46IHBhcmFtcy5ub3RlR3VpZHMgfSB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuZmlsdGVyUGFyYW1zID0ge1xyXG4gICAgICAgICAgICBub3RlYm9va0d1aWRzOiBbXSxcclxuICAgICAgICAgICAgc3RhY2tzOiBbXVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gRGF0YVRyYW5zY2lldmVyU2VydmljZTtcclxufSkoKTtcclxuZXhwb3J0cy5EYXRhVHJhbnNjaWV2ZXJTZXJ2aWNlID0gRGF0YVRyYW5zY2lldmVyU2VydmljZTtcclxuYW5ndWxhci5tb2R1bGUoJ0FwcCcpLnNlcnZpY2UoJ2RhdGFUcmFuc2NpZXZlcicsIFsnJGh0dHAnLCAnZGF0YVN0b3JlJywgJ3Byb2dyZXNzJywgRGF0YVRyYW5zY2lldmVyU2VydmljZV0pO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhLXRyYW5zY2lldmVyLmpzLm1hcCIsInZhciBQcm9ncmVzc1NlcnZpY2UgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gUHJvZ3Jlc3NTZXJ2aWNlKCRtb2RhbCkge1xyXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy4kbW9kYWwgPSAkbW9kYWw7XHJcbiAgICAgICAgdGhpcy5tb2RhbEluc3RhbmNlID0gbnVsbDtcclxuICAgICAgICB0aGlzLnZhbHVlID0gMDtcclxuICAgICAgICB0aGlzLmNvbXBsZXRlQ291bnQgPSAwO1xyXG4gICAgICAgIHRoaXMuYWxsQ291bnQgPSAwO1xyXG4gICAgICAgIHRoaXMubWVzc2FnZSA9ICcnO1xyXG4gICAgICAgIHRoaXMub3BlbiA9IGZ1bmN0aW9uIChhbGxDb3VudCkge1xyXG4gICAgICAgICAgICBfdGhpcy5tZXNzYWdlID0gJ3Byb2Nlc3NpbmcuLi4nO1xyXG4gICAgICAgICAgICBfdGhpcy52YWx1ZSA9IDA7XHJcbiAgICAgICAgICAgIF90aGlzLmNvbXBsZXRlQ291bnQgPSAwO1xyXG4gICAgICAgICAgICBfdGhpcy5hbGxDb3VudCA9IGFsbENvdW50O1xyXG4gICAgICAgICAgICBfdGhpcy5tb2RhbEluc3RhbmNlID0gX3RoaXMuJG1vZGFsLm9wZW4oe1xyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdwcm9ncmVzcy1tb2RhbCcsXHJcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnUHJvZ3Jlc3NNb2RhbENvbnRyb2xsZXInLFxyXG4gICAgICAgICAgICAgICAgYmFja2Ryb3A6ICdzdGF0aWMnLFxyXG4gICAgICAgICAgICAgICAga2V5Ym9hcmQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgc2l6ZTogJ3NtJyxcclxuICAgICAgICAgICAgICAgIGFuaW1hdGlvbjogZmFsc2VcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLmNsb3NlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBfdGhpcy5tb2RhbEluc3RhbmNlLmNsb3NlKCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLnNldCA9IGZ1bmN0aW9uIChtZXNzYWdlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHZvaWQgMCkgeyB2YWx1ZSA9IG51bGw7IH1cclxuICAgICAgICAgICAgX3RoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gbnVsbClcclxuICAgICAgICAgICAgICAgIF90aGlzLnZhbHVlID0gdmFsdWU7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLm5leHQgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xyXG4gICAgICAgICAgICBfdGhpcy5jb21wbGV0ZUNvdW50Kys7XHJcbiAgICAgICAgICAgIF90aGlzLnNldChtZXNzYWdlLCBfdGhpcy5jb21wbGV0ZUNvdW50IC8gX3RoaXMuYWxsQ291bnQgKiAxMDApO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gUHJvZ3Jlc3NTZXJ2aWNlO1xyXG59KSgpO1xyXG5leHBvcnRzLlByb2dyZXNzU2VydmljZSA9IFByb2dyZXNzU2VydmljZTtcclxuYW5ndWxhci5tb2R1bGUoJ0FwcCcpLnNlcnZpY2UoJ3Byb2dyZXNzJywgWyckbW9kYWwnLCBQcm9ncmVzc1NlcnZpY2VdKTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cHJvZ3Jlc3MuanMubWFwIl19
