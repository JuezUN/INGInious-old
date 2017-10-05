var toggle_normalize_submissions_per_tasks = false;
var toggle_normalize_best_submissions_per_tasks = false;
var color_yellow = 'rgb(236,199,6)';
var color_blue = 'rgb(50,120,202)';
var color_purple = 'rgb(119,92,133)';
var color_cyan = 'rgb(2,164,174)';
var color_red = 'rgb(227,79,54)';
var color_brown = 'rgb(137,139,37)';
var color_aquamarine = 'rgb(35,181,100)';
var color_gray = 'rgb(107, 107, 107)';

function plotVerdictStatistics(id_div, statistics){
  var data = statistics.by_verdict;

  var title = "Submissions Vs Verdicts (ALL)";

  plotVerdictStatisticsChart(id_div, data, title, toggle_normalize_submissions_per_tasks);
  toggle_normalize_submissions_per_tasks = !toggle_normalize_submissions_per_tasks
}

function plotBestVerdictStatistics(id_div, statistics){
  var data = statistics.best_by_verdict;

  var title = "Submissions Vs Verdicts (Best)";
  plotVerdictStatisticsChart(id_div, data, title, toggle_normalize_best_submissions_per_tasks);
  toggle_normalize_best_submissions_per_tasks = !toggle_normalize_best_submissions_per_tasks
}

function getDataNormalized(data_entry, data_count_obj){
    return data_entry.count/data_count_obj[data_entry.task_id]*100;
}

function getData(data_entry, data_count_obj){
    return data_entry.count;
}

function createObjectToPlotData(data, data_count_obj, verdict, color_category, get_function) {

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
        plotData.y.push(get_function(data[i], data_count_obj));
    }
  }
  return plotData;
}

function plotVerdictStatisticsChart(id_div, data, statistic_title, normalized) {

  var data_count_obj = {};

  for(var i = 0; i < data.length; ++i){
    if(data_count_obj[data[i].task_id] != null){
        data_count_obj[data[i].task_id] += data[i].count;
    }else{
        data_count_obj[data[i].task_id] = data[i].count;
    }
  }

  var get_function = null;

  if(normalized){
    get_function = getDataNormalized;
  }
  else{
    get_function = getData;
  }



  var compilation_error_data = createObjectToPlotData(data, data_count_obj,
  "COMPILATION_ERROR", color_yellow, get_function);
  var time_limit_data = createObjectToPlotData(data, data_count_obj,
  "TIME_LIMIT_EXCEEDED", color_blue, get_function);
  var memory_limit_data = createObjectToPlotData(data, data_count_obj,
  "MEMORY_LIMIT_EXCEEDED", color_purple, get_function);
  var runtime_error_data = createObjectToPlotData(data, data_count_obj,
  "RUNTIME_ERROR", color_cyan, get_function);
  var wrong_answer_data = createObjectToPlotData(data, data_count_obj,
  "WRONG_ANSWER", color_red, get_function);
  var internal_error_data = createObjectToPlotData(data, data_count_obj,
  "INTERNAL_ERROR", color_brown, get_function);
  var accepted_data = createObjectToPlotData(data, data_count_obj,
  "ACCEPTED", color_aquamarine, get_function);

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
        color: color_gray,

      }
    },
    yaxis: {
      title: 'Percentage of Sumbissions',
      titlefont: {
        size: 16,
        color: color_gray
      }
    }
  };

  Plotly.purge(id_div);
  Plotly.newPlot(id_div, data, layout);
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
        this._cachedPromise = null;
    }

    Statistic.prototype._fetchAndCacheData = function() {
        if (this._cachedPromise == null) {
            this._cachedPromise = this._fetchData();
        }

        return this._cachedPromise;
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
