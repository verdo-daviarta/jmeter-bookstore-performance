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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.011110445615716339, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.02035928143712575, 500, 1500, "Transaction Controller 03 - Select Book"], "isController": true}, {"data": [0.03138075313807531, 500, 1500, "Transaction Controller 02 - Browse Books"], "isController": true}, {"data": [3.006614552014432E-4, 500, 1500, "Add Book"], "isController": false}, {"data": [0.008059701492537314, 500, 1500, "Login"], "isController": false}, {"data": [0.0, 500, 1500, "Transaction Controller 01 - Login"], "isController": true}, {"data": [0.0015015015015015015, 500, 1500, "Transaction Controller 04 - Add book"], "isController": true}, {"data": [0.0, 500, 1500, "Generate Token"], "isController": false}, {"data": [0.030221424296828246, 500, 1500, "Browse Books"], "isController": false}, {"data": [0.0, 500, 1500, "Cleanup"], "isController": false}, {"data": [0.019184652278177457, 500, 1500, "Select Book"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 10013, 0, 0.0, 5779.607210626179, 200, 17342, 5155.0, 10198.6, 11491.3, 13689.020000000004, 3.662461036286638, 4.290146606915295, 1.0783356695787492], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Transaction Controller 03 - Select Book", 1670, 0, 0.0, 3212.832335329337, 0, 8914, 3024.0, 4861.1, 5452.149999999999, 6942.339999999998, 0.6128699009315989, 0.45730857678397435, 0.09026613737827467], "isController": true}, {"data": ["Transaction Controller 02 - Browse Books", 1673, 0, 0.0, 3131.790794979084, 0, 9113, 2932.0, 4796.8, 5486.3, 6679.62, 0.6132886789769186, 2.848622440857783, 0.07956043356448658], "isController": true}, {"data": ["Add Book", 1663, 0, 0.0, 9315.499098015649, 615, 17342, 9075.0, 12701.2, 13606.0, 15305.439999999995, 0.6106853409812828, 0.1699661349410797, 0.3163929526526071], "isController": false}, {"data": ["Login", 1675, 0, 0.0, 3766.226865671638, 240, 9407, 3567.0, 5618.200000000001, 6305.199999999999, 7657.400000000001, 0.6133848259213864, 0.388918951929489, 0.1543915212227488], "isController": false}, {"data": ["Transaction Controller 01 - Login", 1675, 0, 0.0, 12248.693731343286, 1889, 20104, 12144.0, 15175.4, 15920.599999999999, 17693.48, 0.6130014122820597, 0.7128518084868307, 0.3133791023518394], "isController": true}, {"data": ["Transaction Controller 04 - Add book", 1665, 0, 0.0, 9304.309309309325, 0, 17342, 9074.0, 12700.8, 13605.5, 15304.359999999995, 0.6111897276076051, 0.16990218383320577, 0.3162739072918789], "isController": true}, {"data": ["Generate Token", 1679, 0, 0.0, 8478.049434187007, 1649, 16065, 8279.0, 11265.0, 12183.0, 13621.800000000007, 0.6141288404998767, 0.32476786025843885, 0.15937346662105506], "isController": false}, {"data": ["Browse Books", 1671, 0, 0.0, 3135.539198084983, 207, 9113, 2936.0, 4797.4, 5486.4, 6680.359999999999, 0.612849147054088, 2.8499879279995777, 0.07959857085761105], "isController": false}, {"data": ["Cleanup", 1657, 0, 0.0, 6778.238382619187, 1593, 15193, 6478.0, 9602.0, 10499.699999999999, 12716.020000000002, 0.609123993677168, 0.11004681526394147, 0.28166197776899604], "isController": false}, {"data": ["Select Book", 1668, 0, 0.0, 3216.684652278174, 200, 8914, 3025.5, 4862.200000000001, 5452.849999999999, 6943.2599999999975, 0.6120885282573532, 0.4572731680828859, 0.09025914820982453], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 10013, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
