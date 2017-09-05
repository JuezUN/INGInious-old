
function transformObjectToPlotData(data, xFunction, yFunction, verdict) {

  var plotData = {
    x: [],
    y: [],
    name: verdict,
    type: 'bar'
  };

  for(var i = 0; i < data.length; ++i) {
    if(data[i].summary_result === verdict){
      plotData.x.push(xFunction(data[i]));
      plotData.y.push(yFunction(data[i]));
    }
    else{
      plotData.x.push(xFunction(data[i]));
      plotData.y.push(0);
    }
  }

  return plotData;
}

function getSummaryResult(element){
  return element.task_id;
}

function getCount(element){
  return element.count;
}

function plotVerdictStatistics(containerId, data){

  var compilation_error_data = transformObjectToPlotData(data, getSummaryResult, getCount, "COMPILATION_ERROR");
  var time_limit_data = transformObjectToPlotData(data, getSummaryResult, getCount, "TIME_LIMIT_EXCEEDED");
  var memory_limit_data = transformObjectToPlotData(data, getSummaryResult, getCount, "MEMORY_LIMIT_EXCEEDED");
  var runtime_error_data = transformObjectToPlotData(data, getSummaryResult, getCount, "RUNTIME_ERROR");
  var wrong_answer_data = transformObjectToPlotData(data, getSummaryResult, getCount, "WRONG_ANSWER");
  var internal_error_data = transformObjectToPlotData(data, getSummaryResult, getCount, "INTERNAL_ERROR");
  var accepted_data = transformObjectToPlotData(data, getSummaryResult, getCount, "ACCEPTED");

  var data = [compilation_error_data, time_limit_data, memory_limit_data, runtime_error_data, wrong_answer_data, internal_error_data, accepted_data];

  var layout = {barmode: 'stack'};
  Plotly.newPlot(containerId, data, layout);
}
