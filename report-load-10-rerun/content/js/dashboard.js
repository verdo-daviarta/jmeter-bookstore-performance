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

    var data = {"OkPercent": 56.60377358490566, "KoPercent": 43.39622641509434};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.15280898876404495, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.12222222222222222, 500, 1500, "Transaction Controller 03 - Select Book"], "isController": true}, {"data": [0.09782608695652174, 500, 1500, "Transaction Controller 02 - Browse Books"], "isController": true}, {"data": [0.0375, 500, 1500, "Add Book"], "isController": false}, {"data": [0.5531914893617021, 500, 1500, "Login"], "isController": false}, {"data": [0.0, 500, 1500, "Transaction Controller 01 - Login"], "isController": true}, {"data": [0.08333333333333333, 500, 1500, "Transaction Controller 04 - Add book"], "isController": true}, {"data": [0.02, 500, 1500, "Generate Token"], "isController": false}, {"data": [0.09782608695652174, 500, 1500, "Browse Books"], "isController": false}, {"data": [0.475, 500, 1500, "Cleanup"], "isController": false}, {"data": [0.05952380952380952, 500, 1500, "Select Book"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 265, 115, 43.39622641509434, 1547.067924528302, 201, 8026, 721.0, 4266.6, 5840.5999999999985, 7583.2599999999875, 3.691579020686773, 4.222257108901581, 1.0191021801211952], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Transaction Controller 03 - Select Book", 45, 38, 84.44444444444444, 431.7111111111111, 0, 1692, 265.0, 1059.1999999999998, 1424.8999999999985, 1692.0, 0.688241771687263, 0.23413363743423468, 0.09245261646580204], "isController": true}, {"data": ["Transaction Controller 02 - Browse Books", 46, 41, 89.1304347826087, 538.9565217391304, 207, 2849, 248.5, 1283.000000000001, 2383.0999999999985, 2849.0, 0.68954145493247, 3.2066371175668182, 0.08955958350197119], "isController": true}, {"data": ["Add Book", 40, 36, 90.0, 1466.6749999999997, 448, 3933, 906.0, 3275.2, 3874.549999999998, 3933.0, 0.6684491978609626, 0.2136556859959893, 0.3318745822192513], "isController": false}, {"data": ["Login", 47, 0, 0.0, 896.0, 213, 3038, 818.0, 1646.200000000001, 2141.6, 3038.0, 0.6876975301416365, 0.41436462509510713, 0.16386542710406182], "isController": false}, {"data": ["Transaction Controller 01 - Login", 47, 0, 0.0, 5340.6170212765965, 1998, 9552, 5576.0, 8191.0, 8351.0, 9552.0, 0.6700406301233159, 0.745943670254473, 0.3245509302159812], "isController": true}, {"data": ["Transaction Controller 04 - Add book", 42, 36, 85.71428571428571, 1396.833333333333, 0, 3933, 853.0, 3239.6000000000004, 3827.6500000000005, 3933.0, 0.6794687201721321, 0.20683604177114845, 0.32128152653972464], "isController": true}, {"data": ["Generate Token", 50, 0, 0.0, 4395.86, 1447, 8026, 4380.0, 7062.5, 7637.049999999997, 8026.0, 0.6965243435258063, 0.3557443668593718, 0.17141028766455388], "isController": false}, {"data": ["Browse Books", 46, 41, 89.1304347826087, 538.9565217391304, 207, 2849, 248.5, 1283.000000000001, 2383.0999999999985, 2849.0, 0.6971703975386854, 3.242114680741426, 0.09055045202406754], "isController": false}, {"data": ["Cleanup", 40, 0, 0.0, 1129.5500000000002, 418, 3979, 624.5, 2926.6, 3804.049999999998, 3979.0, 0.6720768855957122, 0.12142014046406908, 0.298627913033251], "isController": false}, {"data": ["Select Book", 42, 38, 90.47619047619048, 462.54761904761904, 201, 1692, 306.5, 1103.6000000000004, 1475.4500000000005, 1692.0, 0.6772336617379106, 0.24684511908025217, 0.09747201372204395], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Test failed: variable(isbn) expected to equal /\\n\\n****** received  : [[[NOT_FOUND     ]]]\\n\\n****** comparison: [[[97801449365035]]]\\n\\n/", 41, 35.65217391304348, 15.471698113207546], "isController": false}, {"data": ["400/Bad Request", 74, 64.34782608695652, 27.92452830188679], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 265, 115, "400/Bad Request", 74, "Test failed: variable(isbn) expected to equal /\\n\\n****** received  : [[[NOT_FOUND     ]]]\\n\\n****** comparison: [[[97801449365035]]]\\n\\n/", 41, "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["Add Book", 40, 36, "400/Bad Request", 36, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["Browse Books", 46, 41, "Test failed: variable(isbn) expected to equal /\\n\\n****** received  : [[[NOT_FOUND     ]]]\\n\\n****** comparison: [[[97801449365035]]]\\n\\n/", 41, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": ["Select Book", 42, 38, "400/Bad Request", 38, "", "", "", "", "", "", "", ""], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
