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
        this._cachedPromise = null;
    }

    Statistic.prototype._fetchAndCacheData = function() {
        if (this._cachedPromise == null) {
            this._cachedPromise = this._fetchData();
        }

        return this._cachedPromise;
    };

    Statistic.prototype.plotAsync = function() {
        var statistic = this;
        this._fetchAndCacheData().then(function(data) {
            statistic._plotData(data);
        });
    };

    Statistic.prototype._fetchCsvData = function() {
        return this._fetchAndCacheData();
    };

    Statistic.prototype.downloadCsvAsync = function() {
        this._fetchCsvData().then(function(data) {
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
