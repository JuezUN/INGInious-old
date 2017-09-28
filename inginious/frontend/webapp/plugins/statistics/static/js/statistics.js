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
