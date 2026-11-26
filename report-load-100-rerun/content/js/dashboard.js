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

    var data = {"OkPercent": 47.97879390324719, "KoPercent": 52.02120609675281};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.017785771382893684, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.01694915254237288, 500, 1500, "Transaction Controller 03 - Select Book"], "isController": true}, {"data": [0.06496062992125984, 500, 1500, "Transaction Controller 02 - Browse Books"], "isController": true}, {"data": [0.0, 500, 1500, "Add Book"], "isController": false}, {"data": [0.02280701754385965, 500, 1500, "Login"], "isController": false}, {"data": [0.0, 500, 1500, "Transaction Controller 01 - Login"], "isController": true}, {"data": [0.0, 500, 1500, "Transaction Controller 04 - Add book"], "isController": true}, {"data": [0.0016129032258064516, 500, 1500, "Generate Token"], "isController": false}, {"data": [0.05, 500, 1500, "Browse Books"], "isController": false}, {"data": [0.002380952380952381, 500, 1500, "Cleanup"], "isController": false}, {"data": [0.01694915254237288, 500, 1500, "Select Book"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 1509, 785, 52.02120609675281, 10893.220013253798, 232, 60261, 4805.0, 29782.0, 33182.5, 51209.00000000007, 6.449434552557122, 5.55315524508065, 1.678642879390445], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Transaction Controller 03 - Select Book", 236, 116, 49.152542372881356, 8291.694915254238, 236, 35597, 2232.0, 26480.0, 31754.299999999996, 35008.32, 1.0444557544643844, 0.5639518239251178, 0.15235680223938394], "isController": true}, {"data": ["Transaction Controller 02 - Browse Books", 254, 96, 37.79527559055118, 9138.118110236217, 0, 36516, 2004.5, 26546.5, 27443.75, 34834.499999999985, 1.1168762641808108, 3.286749873581919, 0.14277857323454402], "isController": true}, {"data": ["Add Book", 218, 179, 82.11009174311927, 11474.454128440362, 236, 60261, 4838.5, 38162.99999999998, 56853.09999999997, 60258.48, 0.968570336866986, 0.29669929389889543, 0.41232532828092094], "isController": false}, {"data": ["Login", 285, 106, 37.19298245614035, 12260.343859649123, 235, 34364, 12049.0, 31646.00000000001, 32688.0, 34248.08, 1.2431083816037407, 0.6566656984415347, 0.3204079480969537], "isController": false}, {"data": ["Transaction Controller 01 - Login", 285, 109, 38.24561403508772, 24898.996491228067, 474, 64146, 25311.0, 54520.2, 59760.5, 63541.17999999999, 1.2338997727026735, 1.2202771539127613, 0.6457087482411517], "isController": true}, {"data": ["Transaction Controller 04 - Add book", 218, 179, 82.11009174311927, 11474.454128440364, 236, 60261, 4838.5, 38162.99999999998, 56853.09999999997, 60258.48, 0.9689233394965154, 0.296807428153001, 0.41247560329922844], "isController": true}, {"data": ["Generate Token", 310, 103, 33.225806451612904, 14469.803225806441, 233, 39807, 13078.5, 32716.1, 36132.85, 38544.82999999999, 1.324933539624061, 0.6187377857689316, 0.3519772095403763], "isController": false}, {"data": ["Browse Books", 250, 96, 38.4, 9284.327999999998, 232, 36516, 2095.0, 26634.9, 27448.35, 34894.900000000016, 1.0953958322379376, 3.275113729472282, 0.14227309149184147], "isController": false}, {"data": ["Cleanup", 210, 185, 88.0952380952381, 7993.709523809525, 235, 50507, 1967.0, 25098.9, 29990.549999999996, 41833.83999999987, 1.090252107820742, 0.32342016466700585, 0.40104181538657224], "isController": false}, {"data": ["Select Book", 236, 116, 49.152542372881356, 8291.694915254238, 236, 35597, 2232.0, 26480.0, 31754.299999999996, 35008.32, 1.050967468994233, 0.5674678113379795, 0.1533066787646679], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["400/Bad Request", 39, 4.968152866242038, 2.584493041749503], "isController": false}, {"data": ["504/Gateway Time-out", 9, 1.1464968152866242, 0.5964214711729622], "isController": false}, {"data": ["502/Bad Gateway", 573, 72.99363057324841, 37.97216699801193], "isController": false}, {"data": ["401/Unauthorized", 164, 20.89171974522293, 10.868124585818423], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 1509, 785, "502/Bad Gateway", 573, "401/Unauthorized", 164, "400/Bad Request", 39, "504/Gateway Time-out", 9, "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["Add Book", 218, 179, "401/Unauthorized", 82, "502/Bad Gateway", 78, "400/Bad Request", 10, "504/Gateway Time-out", 9, "", ""], "isController": false}, {"data": ["Login", 285, 106, "502/Bad Gateway", 106, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["Generate Token", 310, 103, "502/Bad Gateway", 103, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["Browse Books", 250, 96, "502/Bad Gateway", 96, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["Cleanup", 210, 185, "502/Bad Gateway", 103, "401/Unauthorized", 82, "", "", "", "", "", ""], "isController": false}, {"data": ["Select Book", 236, 116, "502/Bad Gateway", 87, "400/Bad Request", 29, "", "", "", "", "", ""], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
