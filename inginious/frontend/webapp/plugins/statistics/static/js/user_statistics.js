function plotTriesPerTasks(tries_per_tasks) {
    var results =
        [
            "WRONG_ANSWER",
            "COMPILATION_ERROR"
        ];


    var resultsDict = {};

    for (var index = 0; index < results.length; index++) {
        resultsDict[results[index]] =
            {
                "mode": "markers",
                "name": results[index],
                "marker":
                    {
                        "sizemode": "area",
                        "sizeref": 10,
                        "size": []
                    },
                "text": [],
                "x": [],
                "y": []
            }
    }


    for (var index = 0; index < tries_per_tasks.length; index++) {
        for(var j = 0 ; j < results.length ; j++){
            if(tries_per_tasks[index].result === results[j]){
                resultsDict[results[j]]["x"].append(
            }
        }
    }

    var data = {
        "mode": "markers",
        "name": "Asia"
    }
}
