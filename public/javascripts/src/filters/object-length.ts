import core from '../core';

var objectLength = () => {
    var _objectLength = (input, depth = 0) => {
        if (!angular.isObject(input))
            throw new Error("Usage of non-objects with objectLength filter.");
        if (depth == 0)
            return Object.keys(input).length;
        else {
            var result = 0;
            for (var value of input)
                result += _objectLength(value, depth - 1);
            return result;
        }
    };
    return _objectLength;
};

core.app.filter('objectLength', objectLength);

export default objectLength;
