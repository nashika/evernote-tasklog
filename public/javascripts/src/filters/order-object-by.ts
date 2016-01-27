import core from '../core';

var orderObjectBy = () => {
    return (items, field:any = '$value', reverse = true) => {
        var filtered = [];
        angular.forEach(items, (item, key) => {
            filtered.push({
                key: key,
                item: item,
            });
        });
        filtered.sort((a, b) => {
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
        angular.forEach(filtered, (item) => {
            var result = item.item;
            result['$key'] = item.key;
            results.push(result);
        });
        return results;
    };
};

core.app.filter('orderObjectBy', orderObjectBy);

export default orderObjectBy;
