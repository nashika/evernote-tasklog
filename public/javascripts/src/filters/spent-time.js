var core_1 = require('../core');
var spentTime = function () {
    return function (input) {
        if (input === undefined)
            return '';
        if (!input)
            return '0m';
        var hour = Math.floor(input / 60);
        var minute = input % 60;
        if (hour)
            return hour + 'h' + minute + 'm';
        return minute + 'm';
    };
};
core_1["default"].app.filter('spentTime', spentTime);
exports.__esModule = true;
exports["default"] = spentTime;
//# sourceMappingURL=spent-time.js.map