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


    Plotly.newPlot('grades_per_task', [data], layout);
}

function plotUserTriesPerTask(data) {
    data.type = 'scatter';
    data.mode = 'lines+markers';

    var layout = {
        title: 'Attempts per task',
        xaxis: {
            title: 'Date'
        },

        yaxis: {
            title: "Tries"
        }
    };


    Plotly.newPlot('tries_per_task', [data], layout);
}
