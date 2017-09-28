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

// Bar submissions per tasks

function createObjectToPlotData(data, data_count_obj, normalize, verdict, color_category) {

  var plotData = {
    x: [],
    y: [],
    marker: {color: color_category},
    name: verdict,
    type: 'bar'
  };

  for(var i = 0; i < data.length; ++i) {
    if(data[i].summary_result === verdict){
      plotData.x.push(data[i].task_id);
      if(!normalize){
        plotData.y.push(data[i].count);
      }else{
        plotData.y.push((data[i].count/data_count_obj[data[i].task_id])*100);
      }
    }
  }

  return plotData;

}

function plotUserSubmissionsPerTasks(id_div, data, normalize) {

  var data_count_obj = {};
  var tasks_id = [];

  for(var i = 0; i < data.length; ++i){
    if(data_count_obj[data[i].task_id] != null){
        data_count_obj[data[i].task_id] += data[i].count;
    }else{
        data_count_obj[data[i].task_id] = data[i].count;
        tasks_id.push(data[i].task_id)
    }
  }

  var compilation_error_data = createObjectToPlotData(data, data_count_obj, normalize, "COMPILATION_ERROR", 'rgb(236,199,6)');
  var time_limit_data = createObjectToPlotData(data, data_count_obj, normalize, "TIME_LIMIT_EXCEEDED", 'rgb(50,120,202)');
  var memory_limit_data = createObjectToPlotData(data, data_count_obj, normalize, "MEMORY_LIMIT_EXCEEDED", 'rgb(119,92,133)');
  var runtime_error_data = createObjectToPlotData(data, data_count_obj, normalize, "RUNTIME_ERROR", 'rgb(2,164,174)');
  var wrong_answer_data = createObjectToPlotData(data, data_count_obj, normalize, "WRONG_ANSWER", 'rgb(227,79,54)');
  var internal_error_data = createObjectToPlotData(data, data_count_obj, normalize, "INTERNAL_ERROR", 'rgb(137,139,37)');
  var accepted_data = createObjectToPlotData(data, data_count_obj, normalize, "ACCEPTED", 'rgb(35,181,100)');

  var data = [compilation_error_data, time_limit_data, memory_limit_data, runtime_error_data, wrong_answer_data, internal_error_data, accepted_data];

  var layout = {
    barmode: 'stack',
    title: 'Submissions vs Task',
    xaxis: {
      title: 'Tasks',
      categoryorder: "array",
      categoryarray: tasks_id,
      titlefont: {
        size: 16,
        color: 'rgb(107, 107, 107)'
      }
    },
    yaxis: {
      title: normalize ? 'Percentage of submissions' : 'Number of submissions',
      titlefont: {
        size: 16,
        color: 'rgb(107, 107, 107)'
      }
    }
  };

  Plotly.purge(id_div);
  Plotly.newPlot(id_div, data, layout);
}

var toggle_normalize_submissions_per_tasks = true;

function plotUserSubmissionsPerTasksFull(id_div, data){
  toggle_normalize_submissions_per_tasks = !toggle_normalize_submissions_per_tasks
  plotUserSubmissionsPerTasks(id_div, data, toggle_normalize_submissions_per_tasks);
}

function plotUserSubmissionsPerTasksFullAsync(id_div, course_id){
  $.get("/api/stats/student/bar_submissions_per_tasks", {course_id: course_id}, function (data) {
      plotUserSubmissionsPerTasksFull(id_div, JSON.parse(data));
  }).fail(function (error) {
      alert(error.responseText);
  });
}
