var abbreviate = function () {
    return function (text, len, truncation) {
        if (len === void 0) { len = 10; }
        if (truncation === void 0) { truncation = '...'; }
        var count = 0;
        var str = '';
        for (var i = 0; i < text.length; i++) {
            var n = encodeURI(text.charAt(i));
            if (n.length < 4)
                count++;
            else
                count += 2;
            if (count > len)
                return str + truncation;
            str += text.charAt(i);
        }
        return text;
    };
};
angular.module('App').filter('abbreviate', abbreviate);
//# sourceMappingURL=abbreviate.js.map