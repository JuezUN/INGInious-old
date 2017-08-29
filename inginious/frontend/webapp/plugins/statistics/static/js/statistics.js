// Example from: https://plot.ly/javascript/filled-area-animation/

Plotly.d3.csv("https://raw.githubusercontent.com/plotly/datasets/master/2014_apple_stock.csv", function(err, rows){

  function unpack(rows, key) {
  return rows.map(function(row) { return row[key]; });
}

  var frames = []
  var x = unpack(rows, 'AAPL_x')
  var y = unpack(rows, 'AAPL_y')

  var n = 100;
  for (var i = 0; i < n; i++) {
    frames[i] = {data: [{x: [], y: []}]}
    frames[i].data[0].x = x.slice(0, i+1);
    frames[i].data[0].y = y.slice(0, i+1);
  }

  Plotly.plot('myDiv', [{
    x: frames[1].data[0].x,
    y: frames[1].data[0].y,
    fill: 'tozeroy',
    type: 'scatter',
    mode: 'lines',
    line: {color: 'green'}
  }], {
    title: "Filled-Area Animation",
    xaxis: {
      type: 'date',
      range: [
        frames[99].data[0].x[0],
        frames[99].data[0].x[99]
      ]
    },
    yaxis: {
      range: [
        0,
        90
      ]
    },
    updatemenus: [{
      x: 0.1,
      y: 0,
      yanchor: "top",
      xanchor: "right",
      showactive: false,
      direction: "left",
      type: "buttons",
      pad: {"t": 87, "r": 10},
      buttons: [{
        method: "animate",
        args: [null, {
          fromcurrent: true,
          transition: {
            duration: 0,
          },
          frame: {
            duration: 40,
            redraw: false
          }
        }],
        label: "Play"
      }, {
        method: "animate",
        args: [
          [null],
          {
            mode: "immediate",
            transition: {
              duration: 0
            },
            frame: {
              duration: 0,
              redraw: false
            }
          }
        ],
        label: "Pause"
      }]
    }]
  }).then(function() {
    Plotly.addFrames('myDiv', frames);
  });

})
