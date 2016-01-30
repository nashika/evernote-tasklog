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
//# sourceMappingURL=order-object-by.js.map