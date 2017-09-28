var toggle_normalize_submissions_per_tasks = false;
var toggle_normalize_best_submissions_per_tasks = false;

function transformObjectToPlotData(data, verdict, color_category) {

  var plotData = {
    x: [],
    y: [],
    name: verdict,
    marker: {color: color_category},
    type: 'bar'
  };

  for(var i = 0; i < data.length; ++i) {

    if(data[i].summary_result === verdict){
      plotData.x.push(data[i].task_id);
      plotData.y.push(data[i].count);
    }

  }
  return plotData;
}

function plotVerdictStatistics(id_div, statistics){
  var data = statistics.by_verdict;

  var title = "Submissions Vs Verdicts (ALL)";

  if(toggle_normalize_submissions_per_tasks){
    plotVerdictStatisticsNormalized(id_div, data, title);
    toggle_normalize_submissions_per_tasks = !toggle_normalize_submissions_per_tasks
  }else{
    plotVerdictStatisticsRaw(id_div, data, title);
    toggle_normalize_submissions_per_tasks = !toggle_normalize_submissions_per_tasks
  }
}

function plotBestVerdictStatistics(id_div, statistics){
  var data = statistics.best_by_verdict;

  var title = "Submissions Vs Verdicts (Best)";

  if(toggle_normalize_best_submissions_per_tasks){
    plotVerdictStatisticsNormalized(id_div, data, title);
    toggle_normalize_best_submissions_per_tasks = !toggle_normalize_best_submissions_per_tasks
  }else{
    plotVerdictStatisticsRaw(id_div, data, title);
    toggle_normalize_best_submissions_per_tasks = !toggle_normalize_best_submissions_per_tasks
  }
}

function createObjectToPlotDataNormalized(data, data_count_obj, verdict, color_category) {

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
        plotData.y.push((data[i].count/data_count_obj[data[i].task_id])*100);
    }

  }

  return plotData;
}

function plotVerdictStatisticsNormalized(id_div, data, statistic_title) {

  var data_count_obj = {};

  for(var i = 0; i < data.length; ++i){
    if(data_count_obj[data[i].task_id] != null){
        data_count_obj[data[i].task_id] += data[i].count;
    }else{
        data_count_obj[data[i].task_id] = data[i].count;
    }
  }

  var compilation_error_data = createObjectToPlotDataNormalized(data, data_count_obj, "COMPILATION_ERROR", 'rgb(236,199,6)');
  var time_limit_data = createObjectToPlotDataNormalized(data, data_count_obj,"TIME_LIMIT_EXCEEDED", 'rgb(50,120,202)');
  var memory_limit_data = createObjectToPlotDataNormalized(data, data_count_obj,"MEMORY_LIMIT_EXCEEDED", 'rgb(119,92,133)');
  var runtime_error_data = createObjectToPlotDataNormalized(data, data_count_obj,"RUNTIME_ERROR", 'rgb(2,164,174)');
  var wrong_answer_data = createObjectToPlotDataNormalized(data, data_count_obj,"WRONG_ANSWER", 'rgb(227,79,54)');
  var internal_error_data = createObjectToPlotDataNormalized(data, data_count_obj,"INTERNAL_ERROR", 'rgb(137,139,37)');
  var accepted_data = createObjectToPlotDataNormalized(data, data_count_obj,"ACCEPTED", 'rgb(35,181,100)');

  var tasks_ids = [];
  var seen = new Set();
  for(var i = 0; i < data.length; i++){
    if(!seen.has(data[i].task_id)){
        seen.add(data[i].task_id);
        tasks_ids.push(data[i].task_id);
    }
  }

  var data = [compilation_error_data, time_limit_data, memory_limit_data, runtime_error_data, wrong_answer_data, internal_error_data, accepted_data];

  var layout = {
    barmode: 'stack',
    title: statistic_title,
    xaxis: {
      title: 'Tasks',
      categoryorder : "array",
      categoryarray : tasks_ids,
      titlefont:{
        size: 16,
        color: 'rgb(107,107,107)',

      }
    },
    yaxis: {
      title: 'Percentage of Sumbissions',
      titlefont: {
        size: 16,
        color: 'rgb(107,107,107)'
      }
    }
  };

  Plotly.purge(id_div);
  Plotly.newPlot(id_div, data, layout);
}

function plotVerdictStatisticsRaw(containerId, data, statistic_title){
  var compilation_error_data = transformObjectToPlotData(data, "COMPILATION_ERROR", 'rgb(236,199,6)');
  var time_limit_data = transformObjectToPlotData(data, "TIME_LIMIT_EXCEEDED", 'rgb(50,120,202)');
  var memory_limit_data = transformObjectToPlotData(data, "MEMORY_LIMIT_EXCEEDED", 'rgb(119,92,133)');
  var runtime_error_data = transformObjectToPlotData(data, "RUNTIME_ERROR", 'rgb(2,164,174)');
  var wrong_answer_data = transformObjectToPlotData(data, "WRONG_ANSWER", 'rgb(227,79,54)');
  var internal_error_data = transformObjectToPlotData(data, "INTERNAL_ERROR", 'rgb(137,139,37)');
  var accepted_data = transformObjectToPlotData(data, "ACCEPTED", 'rgb(35,181,100)');

  var tasks_ids = [];
  var seen = new Set();
  for(var i = 0; i < data.length; i++){
    if(!seen.has(data[i].task_id)){
        seen.add(data[i].task_id);
        tasks_ids.push(data[i].task_id);
    }
  }

  var data = [compilation_error_data, time_limit_data, memory_limit_data,
     runtime_error_data, wrong_answer_data, internal_error_data, accepted_data];

  var layout = {
    barmode: 'stack',
    title: statistic_title,
    xaxis: {
      title: 'Tasks',
      categoryorder : "array",
      categoryarray : tasks_ids,
      titlefont:{
        size: 16,
        color: 'rgb(107,107,107)',

      }
    },
    yaxis: {
      title: 'Number of Sumbissions',
      titlefont: {
        size: 16,
        color: 'rgb(107,107,107)'
      }
    }

  };
  Plotly.newPlot(containerId, data, layout);
}

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
