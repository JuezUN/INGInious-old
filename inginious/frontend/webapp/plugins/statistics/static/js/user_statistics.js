function plotUserStatistics(data) {
    data.type = 'scatter';
    data.mode = 'lines+markers';

    var layout = {
        title: 'Your progress over time',
        xaxis: {
            title: 'Date'
        },

        yaxis: {
            title: "Grade"
        }
    };


    Plotly.newPlot('myDiv', [data], layout);
}
