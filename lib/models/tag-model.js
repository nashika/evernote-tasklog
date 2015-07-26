// Generated by CoffeeScript 1.9.3
(function() {
  var Model, TagModel,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Model = require('./model');

  TagModel = (function(superClass) {
    extend(TagModel, superClass);

    function TagModel() {
      return TagModel.__super__.constructor.apply(this, arguments);
    }

    TagModel.prototype.PLURAL_NAME = 'tags';

    TagModel.prototype.TITLE_FIELD = 'name';

    return TagModel;

  })(Model);

  module.exports = TagModel;

}).call(this);

//# sourceMappingURL=tag-model.js.map