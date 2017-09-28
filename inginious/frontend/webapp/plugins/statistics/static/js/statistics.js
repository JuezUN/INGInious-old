//Global namespace
var UserStatistics = {};

var CsvConverter = (function () {
    function CsvConverter(data) {
        this.data = data;
    }

    CsvConverter.prototype.downloadCsv = function () {
        var filename = 'export.csv';

        var csv = Papa.unparse(this.data);
        csv = 'data:text/csv;charset=utf-8,' + csv;

        var data = encodeURI(csv);

        var link = document.createElement('a');
        link.setAttribute('href', data);
        link.setAttribute('download', filename);
        link.click();
    };

    return CsvConverter;
}());

var Statistic = (function () {
    function Statistic() {

    }

    var cachedPromise = null;
    Statistic.prototype._fetchAndCacheData = function () {
        if (cachedPromise == null) {
            cachedPromise = this._fetchData();
        }

        return cachedPromise;
    };

    Statistic.prototype.plotAsync = function () {
        var statistic = this;
        this._fetchAndCacheData().then(function (data) {
            statistic._plotData(data);
        });
    };

    Statistic.prototype.downloadCsvAsync = function () {
        this._fetchAndCacheData().then(function (data) {
            var csvConverter = new CsvConverter(data);
            csvConverter.downloadCsv();
        });
    };

    Statistic.prototype._plotData = function (data) {
        throw 'Not implemented';
    };

    Statistic.prototype._fetchData = function () {
        throw 'Not implemented';
    };

    return Statistic;
})();

var ExampleStatistic = (function () {
    function ExampleStatistic() {
        Statistic.call(this);
    }

    ExampleStatistic.prototype = Object.create(Statistic.prototype);

    ExampleStatistic.prototype._plotData = function (data) {
        console.log(data);
        alert('Plot data');
    };

    ExampleStatistic.prototype._fetchData = function () {
        return Promise.resolve([{'test_header': 'test'}]);
    };

    return ExampleStatistic;
})();

var UserTrialsAndBestGradeStatistic = (function () {
    function UserTrialsAndBestGradeStatistic(course_id) {
        this.course_id = course_id;
        this.div_id = "tries_per_task";
        this.RESOURCE_URL = "/api/stats/student/trials_and_best_grade";
    }

    UserTrialsAndBestGradeStatistic.prototype = Object.create(Statistic.prototype);

    UserTrialsAndBestGradeStatistic.prototype._fetchData = function () {
        return $.getJSON(this.RESOURCE_URL, {course_id: this.course_id});
    };

    UserTrialsAndBestGradeStatistic.prototype._plotData = function (tries_per_tasks) {
        var SUBMISSIONS_COUNT_TO_PIXELS = this._getRatio(tries_per_tasks);

        var results =
            [
                "COMPILATION_ERROR",
                "TIME_LIMIT_EXCEEDED",
                "MEMORY_LIMIT_EXCEEDED",
                "RUNTIME_ERROR",
                "WRONG_ANSWER",
                "INTERNAL_ERROR",
                "ACCEPTED"
            ];


        var plotData = {};

        for (var index = 0; index < results.length; index++) {
            plotData[results[index]] =
                {
                    "mode": "markers",
                    "name": results[index],
                    "marker":
                        {
                            "sizemode": "area",
                            "sizeref": SUBMISSIONS_COUNT_TO_PIXELS,
                            "size": []
                        },
                    "text": [],
                    "x": [],
                    "y": []
                }
        }


        for (var index = 0; index < tries_per_tasks.length; index++) {
            for (var j = 0; j < results.length; j++) {
                if (tries_per_tasks[index].result === results[j]) {
                    plotData[results[j]]["x"].push(tries_per_tasks[index].taskid);
                    plotData[results[j]]["y"].push(tries_per_tasks[index].grade);
                    plotData[results[j]]["text"].push(tries_per_tasks[index].tried + " submissions");
                    plotData[results[j]]["marker"]["size"].push(tries_per_tasks[index].tried);
                }
            }
        }

        var data = [];
        for (var index = 0; index < results.length; index++) {
            data.push(plotData[results[index]]);
        }

        var layout = {
            xaxis: {title: 'Task'},
            yaxis: {title: 'Grade', range: [-10, 110]},
            margin: {t: 20},
            hovermode: 'closest'
        };
        Plotly.purge(this.div_id);
        Plotly.plot(this.div_id, data, layout, {showLink: false});
    };

    UserTrialsAndBestGradeStatistic.prototype._getRatio = function (tries_per_tasks) {
        var sum = 0.0;

        for (var i = 0; i < tries_per_tasks.length; i++) {
            sum += tries_per_tasks[i].tried;
        }

        var avg = sum / tries_per_tasks.length;
        return avg / 1000;
    };

    return UserTrialsAndBestGradeStatistic;
})();
