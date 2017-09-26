
var toggle_normalize_submissions_per_tasks = true;

function createObjectToPlotData(data, verdict, color_category) {

  var plotData = {
    x: [],
    y: [],
    marker: {color: color_category},
    name: verdict,
    //hoverinfo: 'skip',
    type: 'bar'
  };

  for(var i = 0; i < data.length; ++i) {
    if(data[i].summary_result === verdict){
      plotData.x.push(data[i].task_id);
      plotData.y.push(data[i].count);
    }
  }
/*
  for(var i = 0; i < data.length; ++i) {
    if(plotData.x.indexOf(data[i].task_id) < 0){
       plotData.x.push(data[i].task_id);
       plotData.y.push(0);
    }
  }*/

  return plotData;
}

function plotUserSubmissionsPerTasks(id_div, data) {

  var compilation_error_data = createObjectToPlotData(data, "COMPILATION_ERROR", 'rgb(236,199,6)');
  var time_limit_data = createObjectToPlotData(data,"TIME_LIMIT_EXCEEDED", 'rgb(50,120,202)');
  var memory_limit_data = createObjectToPlotData(data,"MEMORY_LIMIT_EXCEEDED", 'rgb(119,92,133)');
  var runtime_error_data = createObjectToPlotData(data,"RUNTIME_ERROR", 'rgb(2,164,174)');
  var wrong_answer_data = createObjectToPlotData(data,"WRONG_ANSWER", 'rgb(227,79,54)');
  var internal_error_data = createObjectToPlotData(data,"INTERNAL_ERROR", 'rgb(137,139,37)');
  var accepted_data = createObjectToPlotData(data,"ACCEPTED", 'rgb(35,181,100)');

  var data = [compilation_error_data, time_limit_data, memory_limit_data, runtime_error_data, wrong_answer_data, internal_error_data, accepted_data];

  var layout = {
    barmode: 'stack',
    title: 'Submissions vs Task',
    xaxis: {title: 'Tasks'},
    yaxis: {title: 'Number of submissions'}
  };

  Plotly.purge(id_div);
  Plotly.newPlot(id_div, data, layout);
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

  /*for(var i = 0; i < data.length; ++i) {
    if(plotData.x.indexOf(data[i].task_id) < 0){
       plotData.x.push(data[i].task_id);
       plotData.y.push(0);
    }
  }*/

  return plotData;

/*
  var plotData = {
    x: Object.keys(data_count_obj),
    y: [],
    marker: {color: color_category},
    name: verdict,
    type: 'bar'
  };

  console.log(Object.keys(data_count_obj));

  for(var i = 0; i < plotData.x.length; ++i){
    if(data[i].task_id === plotData.x[i]){
      plotData.y.push((data[i].count/data_count_obj[data[i].task_id])*100);
    }
  }*/

  return plotData;

}

function plotUserSubmissionsPerTasksNormalized(id_div, data) {

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

  var data = [compilation_error_data, time_limit_data, memory_limit_data, runtime_error_data, wrong_answer_data, internal_error_data, accepted_data];

  var layout = {
    barmode: 'stack',
    title: 'Submissions vs Task',
    xaxis: {title: 'Tasks'},
    yaxis: {title: 'Percentage of submissions'}
  };

  Plotly.purge(id_div);
  Plotly.newPlot(id_div, data, layout);
}

function plotUserSubmissionsPerTasksFull(id_div, data){

  if(toggle_normalize_submissions_per_tasks){
    plotUserSubmissionsPerTasks(id_div, data);
    toggle_normalize_submissions_per_tasks = !toggle_normalize_submissions_per_tasks
  }else{
    plotUserSubmissionsPerTasksNormalized(id_div, data);
    toggle_normalize_submissions_per_tasks = !toggle_normalize_submissions_per_tasks
  }
}
