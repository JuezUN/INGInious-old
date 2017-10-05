
var GradeDistributionStatistic = (function() {
    function GradeDistributionStatistic(containerId) {
        Statistic.call(this);
        this.containerId = containerId;
    }

    GradeDistributionStatistic.prototype = Object.create(Statistic.prototype);

    GradeDistributionStatistic.prototype._plotData = function(data) {
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

        Plotly.newPlot(this.containerId, plotData, layout);
    };

    GradeDistributionStatistic.prototype._fetchData = function() {
        return $.get('/api/stats/admin/grade_distribution', {course_id: adminStatistics.courseId}, null, "json");
    };

    GradeDistributionStatistic.prototype._fetchCsvData = function() {
        return this._fetchAndCacheData().then(function(data) {
            // Unwrap each grade so the CSV is properly generated.
            return _.flatMap(data, function(taskElement) {
                return _.map(taskElement.grades, function(grade) {
                    return {
                        task_id: taskElement.task_id,
                        task_name: taskElement.task_name,
                        grade: grade
                    };
                });
            });
        });
    };

    return GradeDistributionStatistic;
})();

var GradeCountStatistic = (function() {
    function GradeCountStatistic(containerId) {
        Statistic.call(this);
        this.containerId = containerId;
    }

    GradeCountStatistic.prototype = Object.create(Statistic.prototype);

    GradeCountStatistic.prototype._plotData = function(data) {
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

        Plotly.newPlot(this.containerId, [plotData], layout);
    };

    GradeCountStatistic.prototype._fetchData = function() {
        return $.get('/api/stats/admin/grade_count', {course_id: adminStatistics.courseId}, null, "json");
    };

    GradeCountStatistic.prototype._fetchCsvData = function() {
        return this._fetchAndCacheData().then(function(data) {
            // Unwrap each grade so the CSV is properly generated.
            return _.flatMap(data, function(taskElement) {
                return _.map(taskElement.grades, function(gradeElement) {
                    return {
                        task_id: taskElement.task_id,
                        task_name: taskElement.task_name,
                        grade: gradeElement.grade,
                        count: gradeElement.count
                    };
                });
            });
        });
    };

    return GradeCountStatistic;
})();

var gradeCountStatistic = new GradeCountStatistic("statisticsGradeDiv");
var gradeDistributionStatistic = new GradeDistributionStatistic("statisticsGradeDistributionDiv");

var tabToStatistic = {
    "gradeCount": gradeCountStatistic,
    "gradeDistribution": gradeDistributionStatistic
};

$(function() {
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        var statistic = tabToStatistic[e.target.getAttribute("aria-controls")];

        if (statistic) {
            statistic.plotAsync();
        }
    });
    $('.active > a[data-toggle="tab"]').trigger('shown.bs.tab');
});
