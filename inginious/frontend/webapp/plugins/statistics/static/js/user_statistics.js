function plotTriesPerTasksAsync(course_id) {
    $.get("/api/stats/student/trials_and_best_grade", {course_id: course_id}, function (data) {
        plotTriesPerTasks(JSON.parse(data));
    }).fail(function (error) {
        alert(error.responseText);
    });
}


function plotTriesPerTasks(tries_per_tasks) {
    var SUBMISSIONS_COUNT_TO_PIXELS = getRatio(tries_per_tasks);

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
    Plotly.purge('tries_per_task');
    Plotly.plot('tries_per_task', data, layout, {showLink: false});
}

function getRatio(tries_per_tasks) {
    var sum = 0.0;

    for (var i = 0; i < tries_per_tasks.length; i++) {
        sum += tries_per_tasks[i].tried;
    }

    var avg = sum / tries_per_tasks.length;
    return avg / 1000;
}

//Global namespace
var UserStatistics = {};

var AsyncCSVConverter = (function () {
    function AsyncCSVConverter(resource, course_id) {
        this.resource = resource;
        this.course_id = course_id;
    }

    AsyncCSVConverter.prototype.downloadCSV = function () {
        $.get(this.resource, {course_id: this.course_id}, function (data) {
            var csvConverter = new CSVConverter(data);
            csvConverter.downloadCSV();
        }).fail(function (error) {
            alert(error.responseText);
        });
    };

    return AsyncCSVConverter;
}());

var CSVConverter = (function () {
    function CSVConverter(data) {
        this.data = data;
    }

    CSVConverter.prototype.downloadCSV = function () {
        var filename = 'export.csv';

        var csv = Papa.unparse(this.data);
        csv = 'data:text/csv;charset=utf-8,' + csv;

        var data = encodeURI(csv);

        var link = document.createElement('a');
        link.setAttribute('href', data);
        link.setAttribute('download', filename);
        link.click();
    };

    return CSVConverter;
}());
