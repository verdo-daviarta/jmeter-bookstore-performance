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

    var data = {"OkPercent": 57.46268656716418, "KoPercent": 42.53731343283582};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.1487695749440716, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.06976744186046512, 500, 1500, "Transaction Controller 03 - Select Book"], "isController": true}, {"data": [0.14130434782608695, 500, 1500, "Transaction Controller 02 - Browse Books"], "isController": true}, {"data": [0.047619047619047616, 500, 1500, "Add Book"], "isController": false}, {"data": [0.5425531914893617, 500, 1500, "Login"], "isController": false}, {"data": [0.0, 500, 1500, "Transaction Controller 01 - Login"], "isController": true}, {"data": [0.06976744186046512, 500, 1500, "Transaction Controller 04 - Add book"], "isController": true}, {"data": [0.0, 500, 1500, "Generate Token"], "isController": false}, {"data": [0.08139534883720931, 500, 1500, "Browse Books"], "isController": false}, {"data": [0.47619047619047616, 500, 1500, "Cleanup"], "isController": false}, {"data": [0.06976744186046512, 500, 1500, "Select Book"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 268, 114, 42.53731343283582, 1516.2835820895516, 199, 7699, 759.0, 4280.5, 5334.649999999997, 6801.77, 3.6593025478576697, 3.978960823786832, 1.024618580859663], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Transaction Controller 03 - Select Book", 43, 38, 88.37209302325581, 517.6046511627907, 207, 1819, 312.0, 1184.0000000000002, 1624.3999999999987, 1819.0, 0.7090444389479759, 0.2647483562123835, 0.10210871155907329], "isController": true}, {"data": ["Transaction Controller 02 - Browse Books", 46, 38, 82.6086956521739, 389.9130434782608, 0, 1593, 252.5, 889.4000000000004, 1092.55, 1593.0, 0.6846562579070357, 2.9762721490020394, 0.08312561860925477], "isController": true}, {"data": ["Add Book", 42, 38, 90.47619047619048, 1126.0476190476193, 424, 4340, 690.0, 2643.9000000000005, 3193.8000000000006, 4340.0, 0.6807793302428112, 0.217745546568548, 0.33798363698252665], "isController": false}, {"data": ["Login", 47, 0, 0.0, 970.8510638297874, 206, 3125, 805.0, 2042.4, 2490.199999999997, 3125.0, 0.689513526201514, 0.4154588336585294, 0.1642981449152045], "isController": false}, {"data": ["Transaction Controller 01 - Login", 47, 0, 0.0, 5270.553191489361, 2571, 8166, 5451.0, 7645.8, 7928.2, 8166.0, 0.6663830993903304, 0.7418718098681412, 0.32277931376719127], "isController": true}, {"data": ["Transaction Controller 04 - Add book", 43, 38, 88.37209302325581, 1099.8604651162793, 0, 4340, 677.0, 2619.2000000000003, 3171.3999999999987, 4340.0, 0.6931794367514065, 0.21655560346912128, 0.33613661277062207], "isController": true}, {"data": ["Generate Token", 51, 0, 0.0, 4352.0, 2154, 7699, 4280.0, 6492.400000000001, 6834.799999999999, 7699.0, 0.6963598132117207, 0.3556603342868456, 0.1713697977825719], "isController": false}, {"data": ["Browse Books", 43, 38, 88.37209302325581, 417.11627906976736, 199, 1593, 259.0, 918.8000000000002, 1102.6, 1593.0, 0.7155813682581418, 3.327732886372335, 0.09294172068196568], "isController": false}, {"data": ["Cleanup", 42, 0, 0.0, 1221.3333333333333, 410, 3285, 769.0, 2912.5000000000005, 3210.1000000000004, 3285.0, 0.6791720569210867, 0.12270198293984476, 0.3017805526358344], "isController": false}, {"data": ["Select Book", 43, 38, 88.37209302325581, 517.5813953488372, 207, 1819, 312.0, 1183.4, 1624.3999999999987, 1819.0, 0.6948371980286014, 0.2594435495273491, 0.10006274238506908], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Test failed: variable(isbn) expected to equal /\\n\\n****** received  : [[[NOT_FOUND     ]]]\\n\\n****** comparison: [[[97801449365035]]]\\n\\n/", 38, 33.333333333333336, 14.17910447761194], "isController": false}, {"data": ["400/Bad Request", 76, 66.66666666666667, 28.35820895522388], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 268, 114, "400/Bad Request", 76, "Test failed: variable(isbn) expected to equal /\\n\\n****** received  : [[[NOT_FOUND     ]]]\\n\\n****** comparison: [[[97801449365035]]]\\n\\n/", 38, "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["Add Book", 42, 38, "400/Bad Request", 38, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["Browse Books", 43, 38, "Test failed: variable(isbn) expected to equal /\\n\\n****** received  : [[[NOT_FOUND     ]]]\\n\\n****** comparison: [[[97801449365035]]]\\n\\n/", 38, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": ["Select Book", 43, 38, "400/Bad Request", 38, "", "", "", "", "", "", "", ""], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
