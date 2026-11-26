/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 52.19155844155844, "KoPercent": 47.80844155844156};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.01932367149758454, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.05970149253731343, 500, 1500, "Transaction Controller 03 - Select Book"], "isController": true}, {"data": [0.04954954954954955, 500, 1500, "Transaction Controller 02 - Browse Books"], "isController": true}, {"data": [0.0, 500, 1500, "Add Book"], "isController": false}, {"data": [0.02127659574468085, 500, 1500, "Login"], "isController": false}, {"data": [0.0, 500, 1500, "Transaction Controller 01 - Login"], "isController": true}, {"data": [0.016666666666666666, 500, 1500, "Transaction Controller 04 - Add book"], "isController": true}, {"data": [0.0, 500, 1500, "Generate Token"], "isController": false}, {"data": [0.023148148148148147, 500, 1500, "Browse Books"], "isController": false}, {"data": [0.0, 500, 1500, "Cleanup"], "isController": false}, {"data": [0.02072538860103627, 500, 1500, "Select Book"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 1232, 589, 47.80844155844156, 13063.069805194804, 190, 61134, 8522.0, 30720.400000000005, 41590.2, 60214.67, 5.375640320793082, 4.707699216670594, 1.42381808589898], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Transaction Controller 03 - Select Book", 201, 86, 42.78606965174129, 8825.457711442785, 0, 32229, 7051.0, 25888.4, 28441.8, 31979.28, 0.9389232745533108, 0.5043455491650123, 0.13152060463622564], "isController": true}, {"data": ["Transaction Controller 02 - Browse Books", 222, 86, 38.73873873873874, 9525.94594594595, 0, 31695, 7365.5, 26161.600000000002, 28308.449999999997, 31615.23, 1.0193867149115154, 2.904800129030481, 0.1288224131914151], "isController": true}, {"data": ["Add Book", 177, 130, 73.44632768361582, 21366.86440677966, 195, 61134, 15725.0, 60211.0, 60220.1, 60832.14, 0.8194292698283365, 0.252454815651562, 0.369581372046351], "isController": false}, {"data": ["Login", 235, 97, 41.276595744680854, 10431.680851063833, 195, 31934, 7541.0, 26077.600000000002, 27585.199999999997, 31668.68, 1.0696891073785788, 0.5505893958532477, 0.2764593361668715], "isController": false}, {"data": ["Transaction Controller 01 - Login", 235, 100, 42.5531914893617, 24421.14042553191, 393, 59966, 27109.0, 54220.6, 55564.799999999996, 59425.23999999998, 1.0590690107394103, 1.0445499421455386, 0.5557031570396542], "isController": true}, {"data": ["Transaction Controller 04 - Add book", 180, 130, 72.22222222222223, 21010.749999999993, 0, 61134, 15389.0, 60211.0, 60219.95, 60820.53, 0.8268980756244229, 0.2505099204799684, 0.3667341416453434], "isController": true}, {"data": ["Generate Token", 249, 74, 29.718875502008032, 14962.10040160643, 194, 39103, 13956.0, 31161.0, 32990.0, 37649.5, 1.0864727596408095, 0.5151260447482787, 0.28903321786833175], "isController": false}, {"data": ["Browse Books", 216, 86, 39.81481481481482, 9790.555555555564, 190, 31695, 7697.5, 26210.5, 28397.399999999998, 31621.17, 0.9994632512169391, 2.9271389554683593, 0.1298130980584501], "isController": false}, {"data": ["Cleanup", 162, 116, 71.60493827160494, 13864.703703703703, 195, 51924, 9027.0, 42568.200000000004, 46814.649999999994, 50600.37000000001, 0.7872408665480946, 0.21771940390801917, 0.30758714774615853], "isController": false}, {"data": ["Select Book", 193, 86, 44.55958549222798, 9191.279792746114, 194, 32229, 7253.0, 26050.8, 28678.899999999987, 31997.760000000002, 0.9023456311042747, 0.5047888531677942, 0.13163620714442673], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["400/Bad Request", 14, 2.3769100169779285, 1.1363636363636365], "isController": false}, {"data": ["504/Gateway Time-out", 23, 3.904923599320883, 1.8668831168831168], "isController": false}, {"data": ["502/Bad Gateway", 468, 79.45670628183362, 37.98701298701299], "isController": false}, {"data": ["401/Unauthorized", 84, 14.261460101867572, 6.818181818181818], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 1232, 589, "502/Bad Gateway", 468, "401/Unauthorized", 84, "504/Gateway Time-out", 23, "400/Bad Request", 14, "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["Add Book", 177, 130, "502/Bad Gateway", 62, "401/Unauthorized", 41, "504/Gateway Time-out", 23, "400/Bad Request", 4, "", ""], "isController": false}, {"data": ["Login", 235, 97, "502/Bad Gateway", 97, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["Generate Token", 249, 74, "502/Bad Gateway", 74, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["Browse Books", 216, 86, "502/Bad Gateway", 86, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["Cleanup", 162, 116, "502/Bad Gateway", 73, "401/Unauthorized", 43, "", "", "", "", "", ""], "isController": false}, {"data": ["Select Book", 193, 86, "502/Bad Gateway", 76, "400/Bad Request", 10, "", "", "", "", "", ""], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
