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
//# sourceMappingURL=object-length.js.map