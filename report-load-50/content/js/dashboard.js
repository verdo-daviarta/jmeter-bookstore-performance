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

    var data = {"OkPercent": 100.0, "KoPercent": 0.0};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.02494908350305499, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.03535353535353535, 500, 1500, "Transaction Controller 03 - Select Book"], "isController": true}, {"data": [0.06372549019607843, 500, 1500, "Transaction Controller 02 - Browse Books"], "isController": true}, {"data": [0.0, 500, 1500, "Add Book"], "isController": false}, {"data": [0.052884615384615384, 500, 1500, "Login"], "isController": false}, {"data": [0.0, 500, 1500, "Transaction Controller 01 - Login"], "isController": true}, {"data": [0.030927835051546393, 500, 1500, "Transaction Controller 04 - Add book"], "isController": true}, {"data": [0.0, 500, 1500, "Generate Token"], "isController": false}, {"data": [0.045, 500, 1500, "Browse Books"], "isController": false}, {"data": [0.0, 500, 1500, "Cleanup"], "isController": false}, {"data": [0.015463917525773196, 500, 1500, "Select Book"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 580, 0, 0.0, 11113.867241379312, 212, 36058, 10694.0, 19029.699999999997, 21824.549999999996, 33837.65999999999, 3.589064491776092, 4.359505964112449, 1.0268282570760263], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Transaction Controller 03 - Select Book", 99, 0, 0.0, 5972.232323232322, 0, 17432, 4552.0, 12305.0, 13871.0, 17432.0, 0.6824668072961906, 0.499550677038094, 0.09860412056568915], "isController": true}, {"data": ["Transaction Controller 02 - Browse Books", 102, 0, 0.0, 6837.901960784312, 0, 18111, 5980.0, 13442.7, 15532.849999999993, 18083.34, 0.6780968082913955, 3.0915833726673805, 0.08634619667466643], "isController": true}, {"data": ["Add Book", 94, 0, 0.0, 18270.925531914887, 6597, 36058, 17040.0, 28957.5, 34234.75, 36058.0, 0.6257613985101553, 0.17416210798378345, 0.3277940204837002], "isController": false}, {"data": ["Login", 104, 0, 0.0, 9107.105769230768, 249, 18199, 8813.0, 14403.0, 16519.5, 18195.3, 0.6790018672551349, 0.43666879398822195, 0.17352496637634984], "isController": false}, {"data": ["Transaction Controller 01 - Login", 104, 0, 0.0, 21919.125000000007, 1913, 31608, 25395.5, 30204.0, 30802.5, 31582.2, 0.6713835665960852, 0.7903080294892321, 0.34840126788204306], "isController": true}, {"data": ["Transaction Controller 04 - Add book", 97, 0, 0.0, 17705.84536082474, 0, 36058, 16942.0, 28800.0, 34100.49999999999, 36058.0, 0.6453802087838242, 0.17406708876971902, 0.32761518290208186], "isController": true}, {"data": ["Generate Token", 115, 0, 0.0, 12595.295652173914, 1664, 27049, 12575.0, 18114.0, 19849.599999999995, 26539.880000000012, 0.7116248561280182, 0.37938016701525973, 0.1869405139633173], "isController": false}, {"data": ["Browse Books", 100, 0, 0.0, 6974.659999999999, 212, 18111, 6089.0, 13502.900000000001, 15664.949999999984, 18101.779999999995, 0.666880068288519, 3.1012528175682887, 0.08661625886950491], "isController": false}, {"data": ["Cleanup", 70, 0, 0.0, 14918.014285714287, 5080, 29613, 14118.5, 24027.399999999998, 26033.4, 29613.0, 0.5030651038110775, 0.0908857853564935, 0.23440812593875543], "isController": false}, {"data": ["Select Book", 97, 0, 0.0, 6095.371134020618, 1015, 17432, 4745.0, 12305.8, 13896.699999999999, 17432.0, 0.6901605868499505, 0.515598485293176, 0.10177172716244388], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": []}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 580, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
