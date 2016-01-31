var checkItemMatches = (item:{[key:string]:any}, props:{[key:string]:string}):boolean => {
    for (var prop in props) {
        var text:string = props[prop];
        text = text.toLowerCase();
        if (item[prop].toString().toLowerCase().indexOf(text) != -1) {
            return true
        }
    }
    return false;
};

var filterByProperty = () => {
    return (items:Array<{[property:string]:any}>|{[key:string]:{[property:string]:any}}, props:{[property:string]:string}) => {
        var arrItems:Array<{[property:string]:any}> = [];
        if (angular.isArray(items))
            arrItems = <Array<{[property:string]:any}>>items;
        else if (angular.isObject(items))
            angular.forEach(items, (item:any, property:string):void => {
                arrItems.push(item);
            });
        else
            return [];
        var results:Array<{[key:string]:string}> = [];
        for (var item of arrItems)
            if (checkItemMatches(item, props))
                results.push(item);
        return results;
    };
};

angular.module('App').filter('filterByProperty', filterByProperty);
