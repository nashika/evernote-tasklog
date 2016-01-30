var checkItemMatches = (item:{[key:string]:string}, props:{[key:string]:string}) => {
    var itemMatches = false;
    for (var prop in props) {
        var text:string = props[prop];
        text = text.toLowerCase();
        if (item[prop].toString().toLowerCase().indexOf(text) != -1) {
            itemMatches = true;
            break;
        }
    }
    return itemMatches;
};

var filterByProperty = () => {
    return (items:Array<{[key:string]:string}>, props:{[key:string]:string}) => {
        var out:Array<{[key:string]:string}> = [];
        if (angular.isArray(items))
            for (var item in items) {
                var itemMatches = checkItemMatches(item, props);
                if (itemMatches)
                    out.push(item);
                else if (angular.isObject(items))
                    for (item of items) {
                        itemMatches = checkItemMatches(item, props);
                        if (itemMatches) out.push(item);
                    }
                else
                    out = items;
                return out;
            }
    }
};

angular.module('App').filter('filterByProperty', filterByProperty);
