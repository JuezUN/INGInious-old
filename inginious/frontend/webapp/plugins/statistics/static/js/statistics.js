var CsvConverter = (function () {
    function CsvConverter(data) {
        this.data = data;
    }

    CsvConverter.prototype.downloadCsv = function () {
        var filename = 'export.csv';

        var csv = Papa.unparse(this.data);
        csv = 'data:text/csv;charset=utf-8,' + csv;

        var data = encodeURI(csv);

        var link = document.createElement('a');
        link.setAttribute('href', data);
        link.setAttribute('download', filename);
        link.click();
    };

    return CsvConverter;
}());

var Statistic = (function() {
	function Statistic() {

	}

	var cachedPromise = null;
	Statistic.prototype._fetchAndCacheData = function() {
		if (cachedPromise == null) {
			cachedPromise = this._fetchData();
		}

		return cachedPromise;
	};

	Statistic.prototype.plotAsync = function() {
        var statistic = this;
		this._fetchAndCacheData().then(function(data) {
			statistic._plotData(data);
		});
	};

	Statistic.prototype.downloadCsvAsync = function() {
		this._fetchAndCacheData().then(function(data) {
            var csvConverter = new CsvConverter(data);
            csvConverter.downloadCsv();
		});
	};

	Statistic.prototype._plotData = function(data) {
        throw 'Not implemented';
	};

	Statistic.prototype._fetchData = function() {
		throw 'Not implemented';
	};

	return Statistic;
})();

var ExampleStatistic = (function() {
	function ExampleStatistic() {
		Statistic.call(this);
	}

	ExampleStatistic.prototype = Object.create(Statistic.prototype);

    ExampleStatistic.prototype._plotData = function(data) {
        console.log(data);
        alert('Plot data');
    };

    ExampleStatistic.prototype._fetchData = function() {
        return Promise.resolve([{'test_header': 'test'}]);
    };

    return ExampleStatistic;
})();
