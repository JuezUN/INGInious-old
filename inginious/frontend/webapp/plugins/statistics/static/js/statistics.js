
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
