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
//# sourceMappingURL=object-length.js.map