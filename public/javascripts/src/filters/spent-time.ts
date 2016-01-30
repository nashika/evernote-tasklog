var spentTime = () => {
    return (input) => {
        if (input === undefined) return '';
        if (!input) return '0m';
        var hour = Math.floor(input / 60);
        var minute = input % 60;
        if (hour) return hour + 'h' + minute + 'm';
        return minute + 'm';
    };
};

angular.module('App').filter('spentTime', spentTime);
