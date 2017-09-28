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