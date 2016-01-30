var objectLength = () => {
    var _objectLength = (input:{[key:string]:any}, depth:number = 0) => {
        if (!angular.isObject(input))
            throw new Error("Usage of non-objects with objectLength filter.");
        if (depth == 0)
            return Object.keys(input).length;
        else {
            var result = 0;
            for (var key in input)
                var value:any = input[key]
                result += _objectLength(value, depth - 1);
            return result;
        }
    };
    return _objectLength;
};

angular.module('App').filter('objectLength', objectLength);
