
function transformObjectToPlotData(data, xFunction, yFunction) {
  var plotData = {
    x: [],
    y: []
  };

  for(var i = 0; i < data.length; ++i) {
    plotData.x.push(xFunction(data[i]));
    plotData.y.push(yFunction(data[i]));
  }

  return plotData;
}

function plotOutcomeStatistics(containerId, data) {
  var plotData = transformObjectToPlotData(data, function(element) {
    return element.result || "other";
  }, function(element) {
    return element.count;
  });

  plotData["type"] = "bar";

  Plotly.newPlot(containerId, [plotData]);
}

function plotGradeStatistics(containerId, data) {
  var plotData = transformObjectToPlotData(data, function(element) {
    return element.grade || "unavailable";
  }, function(element) {
    return element.count;
  });

  plotData["type"] = "bar";

  Plotly.newPlot(containerId, [plotData]);
}
