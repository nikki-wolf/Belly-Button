function buildMetadata(sample) {
    // Use `d3.json` to fetch the metadata for a sample
    // Use d3 to select the panel with id of `#sample-metadata`
    var defaultURL = "/metadata/"+sample;
    
    var selector = d3.select("#sample-metadata");
    // Use `.html("") to clear any existing metadata

    selector.html("");
    // Use `Object.entries` to add each key and value pair to the panel
    d3.json(defaultURL).then(function(d){
      Object.entries(d).forEach(([key, value]) => {
          selector.append("h4").text(`${key}: ${value}`);
         // console.log(`Key: ${key} and Value ${value}`);
      });
    });


    // BONUS: Build the Gauge Chart
    //buildGauge(data.WFREQ);
    //build a GUAGE chart for washing frequency
    d3.json(defaultURL).then(function(d) {
      buildGauge(d.WFREQ)
    });

}

//function to sort an object of samples
function objectSort(myObj){
  var sortObj = [];
  for (var entry in myObj) {
    sortObj.push([entry, myObj[entry]]);
  }
  
  sortObj.sort( (a, b) => b.sample_values - a.sample_values);
  return sortObj
}

function buildCharts(sample) {
  var defaultURL = "/samples/"+sample;
  //`d3.json` to fetch the sample data for the plots

    // Build a Bubble Chart using the sample data
    var layout = {
      title: '<b>Sample values vs. OTU ID </b> <br>(for selected sample)',
      titlefont: {
        size: 28,
        color: 'black'
      },
      showlegend: false,
      xaxis: {
        title: "<b>OTU ID</b>",
        titlefont: {
          family: 'Courier New, monospace',
          size: 18,
          color: '#7f7f7f'
        }
      }
    };
    d3.json(defaultURL).then(function(d) {
    var trace = [{
      x: d.otu_ids,
      y: d.sample_values,
      mode: 'markers',
      marker: {
        size: d.sample_values,
        color: d.otu_ids,
        colorscale: "Jet", //"Portland",

      },
      text: d.otu_labels,
    }];
    
    Plotly.newPlot('bubble', trace, layout);
    
    //build a PIE chart for top 10 samples_values
    layout={
      title: {
        text: "<b>Belly Button Biodiversity:<br> </b> Top 10 Sample Values (for selected sample)",
        titlefont: {
          size: 18,
          color: 'black'
        },
        xref: 'paper',
        y: 1.09,
      },
      legend:{
        x:1,
        y:0.8
      },
      margin: { t: 30, b: 100 } 
    }


    trace = [{values:d.sample_values.slice(0,10),
                  labels: d.otu_ids.slice(0,10),
                  hovertext: d.otu_labels.slice(0,10),
                  type:'pie'}];
    Plotly.newPlot('pie', trace, layout);
    });
}

function init() {
  // Grab a reference to the dropdown select element
  var selector = d3.select("#selDataset");

  // Use the list of sample names to populate the select options
  d3.json("/names").then((sampleNames) => {
    sampleNames.forEach((sample) => {
      selector
        .append("option")
        .text(sample)
        .property("value", sample);
    });
    // Use the first sample from the list to build the initial plots
    const firstSample = sampleNames[0];
    buildCharts(firstSample);
    buildMetadata(firstSample);
  });
}

function optionChanged(newSample) {
  // Fetch new data each time a new sample is selected
  buildCharts(newSample);
  buildMetadata(newSample);
}

// Initialize the dashboard
init();

//build guage chart, it's structure is taken from plotly website and just the data and range are modfied in this function
function buildGauge(sample){
  // Enter weekly scrubs between 0-9
  // if sample is zero or one it goes to category 0-1
  // then, each category level shown by an arrow is calculated based on (sample-1)*20 +10
  // it covers all sample scrub range, e.g. sample #1279 with scrub freq of 9 /week is also shown correctly
  sample=(sample)? sample:1;
  var level = (sample-1)*20+10;

  // Trig to calc meter point
  var degrees = 180 - level,  radius = .5;
  var radians = degrees * Math.PI / 180;
  var x = radius * Math.cos(radians);
  var y = radius * Math.sin(radians);
  var scrubrange=['8-9','7-8','6-7','5-6','4-5','3-4','2-3','1-2','0-1'];
  // Path: may have to change to create a better triangle
  var mainPath = 'M -.0 -0.025 L .0 .025 L ',
      pathX = String(x),   space = ' ',   pathY = String(y),   pathEnd = ' Z';
  var path = mainPath.concat(pathX,space,pathY,pathEnd);
  const arcSize=50/9; //size of each arc
  var data = [{ type: 'scatter',
    x: [0], y:[0],
      marker: {size: 28, color:'850000'},
      showlegend: false,
      name: 'scrub/week',
      text: sample,
      hoverinfo: 'text+name'},
    { values: [arcSize, arcSize, arcSize, arcSize, arcSize, arcSize, arcSize, arcSize, arcSize, 50],
    rotation: 90,
    text:scrubrange,
    textinfo: 'text',
    textposition:'inside',
    marker: {colors:['rgba(127,179,130,1)','rgba(130,188,137,1)','rgba(132,191,123,1)','rgba(182,205,135,1)',
                    'rgba(211,229,143,1)','rgba(228,232,171,1)','rgba(232,231,200,1)','rgba(243,239,227,1)','rgba(247,243,234,1)','rgba(255, 255, 255, 0)']},
    labels: scrubrange,
    hoverinfo: 'label',
    hole: .5,
    type: 'pie',
    showlegend: false
  }];

  var layout = {
    shapes:[{
        type: 'path',
        path: path,
        fillcolor: '850000',
        line: {
          color: '850000'
        }
      }],
    title: '<b>Belly Button Washing Frequency</b> <br> Scrubs per Week',
    height: 500,
    width: 500,
    xaxis: {zeroline:false, showticklabels:false,
              showgrid: false, range: [-1, 1]},
    yaxis: {zeroline:false, showticklabels:false,
              showgrid: false, range: [-1, 1]}
  };

  Plotly.newPlot('gauge', data, layout);
}

//parallel coordinate plot 
function parCoordPlot(){
  //`d3.json` to fetch the sample data for the plots
  var defaultURL = "/metadata";
  // Build a Bubble Chart using the sample data
  var layout = {
    showlegend: false,
  };

  d3.json(defaultURL).then(function(d) {
    function unpack(rows, key) {
      return rows.map(function(row) { 
        return row[key]; 
      });
    }
    //fill NULL values in GENDER,AGE,WFREQ columns
    var gen= unpack(d, 'GENDER');
    var genFilledUpper=gen.map(function(d){
      switch (d){
        case null:
          return 0;
          break;
        case ('F'):
          return 1;
          break;
        case ('f'):
            return 1;
            break;
        case ('m'):
          return 2;
          break;
        case ('M'):
            return 2;
            break;
      }
    })
    var scrub= unpack(d, 'WFREQ');
    var scrubFilled=scrub.map(function(d){
      if (d==null){
        return 0
      }
      return d;
    });
    var age= unpack(d, 'AGE');
    var ageFilled=age.map(function(d){
      if (d==null){
        return 0
      }
      return d;
    });
    var valsum= unpack(d, 'VALSUM');
    var valFilled=valsum.map(function(d){
      if (d==null){
        return 0
      }
      return d;
      //return Math.floor(Math.log10(d)*100)
    });
    var sampleFilled=unpack(d,'sample')

    var data = [{
      type: 'parcoords',
      //pad: [80,80,80,80],
      pad:[200,200,200],
      line: {
        showscale: true,
        color: valsum,
        cmin: 1,
        cmax: 2536,
        colorscale: 'Jet',
      },

  
      dimensions: [ {
        //constraintrange: [1000,1100],
        range: [Math.min(...sampleFilled),Math.max(...sampleFilled)],
        label: 'Sample #',
        values: sampleFilled
      },{
        constraintrange: [40,60],
        range: [0,Math.max(...ageFilled)],
        label: 'Age',
        values: ageFilled
      }, {
        constraintrange: [5,6],
        range: [Math.min(...scrubFilled),Math.max(...scrubFilled)],
        label: 'scrub/week',
        values: scrubFilled
      }, {
         constraintrange: [1],
         //label: 'Gender',
         range: [0,2],//0:'Not availanle, 1: female, 2: male
         tickvals: [0,1,2],
         ticktext: ['NA','Female','Male'],
         values: genFilledUpper
       }
      ]
    }];
  
    var layout = {
      width: 1000,
      annotations: [{showarrow: false,
        text: 'Total Bacteria/Archaea',
        x: 1.14, y: 1.2, xref: 'paper', yref: 'paper'}],
    };
  
    Plotly.plot('parCoord', data, layout);     
  });
}

parCoordPlot()

//help button to fully describe the parallel coordinate plot
//document.getElementById("helpDesc").style.visibility = "hidden";
document.getElementById("helpDesc").style.display = "none";
$("#helpText").mouseover(function() {
  $(this).children("#helpDesc").show();
}).mouseout(function() {
  $(this).children("#helpDesc").hide();
});
