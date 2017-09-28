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

var Statistic = (function() {
    function Statistic() {

    }

    var cachedPromise = null;
    Statistic.prototype._fetchAndCacheData = function() {
        if (cachedPromise == null) {
            cachedPromise = this._fetchData();
        }

        return cachedPromise;
    };

    Statistic.prototype.plotAsync = function() {
        var statistic = this;
        this._fetchAndCacheData().then(function(data) {
            statistic._plotData(data);
        });
    };

    Statistic.prototype.downloadCsvAsync = function() {
        this._fetchAndCacheData().then(function(data) {
            var csvConverter = new CsvConverter(data);
            csvConverter.downloadCsv();
        });
    };

    Statistic.prototype._plotData = function(data) {
        throw 'Not implemented';
    };

    Statistic.prototype._fetchData = function() {
        throw 'Not implemented';
    };

    return Statistic;
})();

function plotGradeStatistics(containerId, data) {
    var allGrades = _.flatMap(data, function(item) {
        return item.grades;
    });

    var studentCountToPixels = 1e-03 * _.meanBy(allGrades, function(item) {
        return item.count;
    });

    var plotData = {
        mode: 'markers',
        x: [],
        y: [],
        text: [],
        marker: {
            sizemode: "area",
            size: [],
            sizeref: studentCountToPixels
        }
    };

    for(var i = 0; i < data.length; ++i) {
        var grades = data[i].grades;
        for(var j = 0; j < grades.length; ++j) {
            plotData.x.push(data[i].task_name);
            plotData.y.push(grades[j].grade);
            plotData.text.push("Students: " + grades[j].count);
            plotData.marker.size.push(grades[j].count);
        }
    }

    var layout = {
        xaxis: {title: 'Task name', type: 'category'},
        yaxis: {title: 'Grade', type: 'linear', range: [-10, 110]},
        hovermode: 'closest'
    };

    Plotly.newPlot(containerId, [plotData], layout);
}

function plotGradeDistributionStatistics(containerId, data) {
    var plotData = _.map(data, function(item) {
        return {
            y: item.grades,
            name: item.task_name,
            boxmean: true,
            type: 'box',
            marker: {
                outliercolor: 'rgba(219, 64, 82, 0.6)',
                line: {
                    outliercolor: 'rgba(219, 64, 82, 1.0)',
                    outlierwidth: 2
                }
            },
            boxpoints: 'all'
        };
    });

    var layout = {
        xaxis: {title: 'Task name', type: 'category'},
        yaxis: {title: 'Grade', type: 'linear', range: [-10, 110], zeroline: false}
    };

    Plotly.newPlot(containerId, plotData, layout);
}
