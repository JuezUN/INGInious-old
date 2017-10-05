    var color_yellow = 'rgb(236,199,6)';
    var color_blue = 'rgb(50,120,202)';
    var color_purple = 'rgb(119,92,133)';
    var color_cyan = 'rgb(2,164,174)';
    var color_red = 'rgb(227,79,54)';
    var color_brown = 'rgb(137,139,37)';
    var color_aquamarine = 'rgb(35,181,100)';
    var color_gray = 'rgb(107, 107, 107)';
    var toggle_normalize_best_submissions_per_tasks = false;
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

      var yLabel = normalized ? "Percentage of tasks" : "Number of tasks";

      var tasks_ids = [];
      for(var i = 0; i < data.length; i++){
        if(data_count_obj[data[i].task_id] == null){
            data_count_obj[data[i].task_id] = 0;
            tasks_ids.push(data[i].task_id);
        }
        data_count_obj[data[i].task_id] += data[i].count;
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
          title: yLabel,
          titlefont: {
            size: 16,
            color: color_gray
          }
        }
      };

      Plotly.purge(id_div);
      Plotly.newPlot(id_div, data, layout);
    }

    var GradeDistributionStatistic = (function() {
        function GradeDistributionStatistic(containerId) {
            Statistic.call(this);
            this.containerId = containerId;
        }

        GradeDistributionStatistic.prototype = Object.create(Statistic.prototype);

        GradeDistributionStatistic.prototype._plotData = function(data) {
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

            Plotly.newPlot(this.containerId, plotData, layout);
        };

        GradeDistributionStatistic.prototype._fetchData = function() {
            return $.get('/api/stats/admin/grade_distribution', {course_id: courseId}, null, "json");
        };

        return GradeDistributionStatistic;
    })();

    var GradeCountStatistic = (function() {
        function GradeCountStatistic(containerId) {
            Statistic.call(this);
            this.containerId = containerId;
        }

        GradeCountStatistic.prototype = Object.create(Statistic.prototype);

        GradeCountStatistic.prototype._plotData = function(data) {
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

            Plotly.newPlot(this.containerId, [plotData], layout);
        };

        GradeCountStatistic.prototype._fetchData = function() {
            return $.get('/api/stats/admin/grade_count', {course_id: courseId}, null, "json");
        };

        return GradeCountStatistic;
    })();

    var SubmissionsVerdictStatistic = (function() {
        function SubmissionsVerdictStatistic (containerId) {
            Statistic.call(this);
            this.toggle_normalize_submissions_per_tasks = false;
            this.containerId = containerId;
        }

        SubmissionsVerdictStatistic.prototype = Object.create(Statistic.prototype);

        SubmissionsVerdictStatistic.prototype._plotData = function(data) {

              var title = "Submissions Vs Verdicts (ALL)";


              plotVerdictStatisticsChart(this.containerId, data, title, this.toggle_normalize_submissions_per_tasks);

        };

        SubmissionsVerdictStatistic.prototype._fetchData = function() {
            return $.get('/api/stats/admin/submissions_verdict', {course_id: courseId}, null, "json");
        };
        SubmissionsVerdictStatistic.prototype.toggle = function(){
            this.toggle_normalize_submissions_per_tasks = !this.toggle_normalize_submissions_per_tasks;
            this.plotAsync();
        }

        return SubmissionsVerdictStatistic ;
    })();

    var BestSubmissionsVerdictStatistic = (function() {
        function BestSubmissionsVerdictStatistic (containerId) {
            Statistic.call(this);
            this.toggle_normalize_best_submissions_per_tasks = false;
            this.containerId = containerId;
        }

        BestSubmissionsVerdictStatistic.prototype = Object.create(Statistic.prototype);

        BestSubmissionsVerdictStatistic.prototype._plotData = function(data) {

              var title = "Submissions Vs Verdicts (BEST)";

              plotVerdictStatisticsChart(this.containerId, data, title, this.toggle_normalize_best_submissions_per_tasks);

        };

        BestSubmissionsVerdictStatistic.prototype._fetchData = function() {
            return $.get('/api/stats/admin/best_submissions_verdict', {course_id: courseId}, null, "json");
        };
        BestSubmissionsVerdictStatistic.prototype.toggle = function(){
            this.toggle_normalize_best_submissions_per_tasks = !this.toggle_normalize_best_submissions_per_tasks;
            this.plotAsync();
        }

        return BestSubmissionsVerdictStatistic ;
    })();

    var GradeCountStatistic = (function() {
        function GradeCountStatistic(containerId) {
            Statistic.call(this);
            this.containerId = containerId;
        }

        GradeCountStatistic.prototype = Object.create(Statistic.prototype);

        GradeCountStatistic.prototype._plotData = function(data) {
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

            Plotly.newPlot(this.containerId, [plotData], layout);
        };

        GradeCountStatistic.prototype._fetchData = function() {
            return $.get('/api/stats/admin/grade_count', {course_id: courseId}, null, "json");
        };

        return GradeCountStatistic;
    })();

    var gradeCountStatistic = new GradeCountStatistic("statisticsGradeDiv");
    var gradeDistributionStatistic = new GradeDistributionStatistic("statisticsGradeDistributionDiv");
    var submissionsVerdictStatistic = new SubmissionsVerdictStatistic("submissionsVerdictDiv");
    var bestSubmissionsVerdictStatistic = new BestSubmissionsVerdictStatistic("bestSubmissionsVerdictDiv");

    var tabToStatistic = {
        "gradeCount": gradeCountStatistic,
        "gradeDistribution": gradeDistributionStatistic,
        "submissionsVerdict": submissionsVerdictStatistic,
        "bestSubmissionsVerdict": bestSubmissionsVerdictStatistic
    };

    $(function() {
        $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            var statistic = tabToStatistic[e.target.getAttribute("aria-controls")];

            if (statistic) {
                statistic.plotAsync();
            }
        });
        $('.active > a[data-toggle="tab"]').trigger('shown.bs.tab');
    });
