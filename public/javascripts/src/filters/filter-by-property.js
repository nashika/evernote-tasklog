// Generated by CoffeeScript 1.9.3
(function() {
  var checkItemMatches, filterByProperty;

  checkItemMatches = (function(_this) {
    return function(item, props) {
      var itemMatches, prop, text;
      itemMatches = false;
      for (prop in props) {
        text = props[prop];
        text = text.toLowerCase();
        if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
          itemMatches = true;
          break;
        }
      }
      return itemMatches;
    };
  })(this);

  filterByProperty = function() {
    return function(items, props) {
      var i, item, itemMatches, key, len, out;
      out = [];
      if (angular.isArray(items)) {
        for (i = 0, len = items.length; i < len; i++) {
          item = items[i];
          itemMatches = checkItemMatches(item, props);
          if (itemMatches) {
            out.push(item);
          }
        }
      } else if (angular.isObject(items)) {
        for (key in items) {
          item = items[key];
          itemMatches = checkItemMatches(item, props);
          if (itemMatches) {
            out.push(item);
          }
        }
      } else {
        out = items;
      }
      return out;
    };
  };

  app.filter('filterByProperty', filterByProperty);

  module.exports = filterByProperty;

}).call(this);

//# sourceMappingURL=filter-by-property.js.map
