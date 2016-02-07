var checkItemMatches = function (item, props) {
    for (var prop in props) {
        var text = props[prop];
        text = text.toLowerCase();
        if (item[prop].toString().toLowerCase().indexOf(text) != -1) {
            return true;
        }
    }
    return false;
};
var filterByProperty = function () {
    return function (items, props) {
        var arrItems = [];
        if (angular.isArray(items))
            arrItems = items;
        else if (angular.isObject(items))
            angular.forEach(items, function (item, property) {
                arrItems.push(item);
            });
        else
            return [];
        var results = [];
        for (var _i = 0; _i < arrItems.length; _i++) {
            var item = arrItems[_i];
            if (checkItemMatches(item, props))
                results.push(item);
        }
        return results;
    };
};
angular.module('App').filter('filterByProperty', filterByProperty);
//# sourceMappingURL=filter-by-property.js.map