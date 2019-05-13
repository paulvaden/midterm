


'use strict';

(function () {

  let data = "no data";
  let svgContainer = ""; // keep SVG reference in global scope
  var selected = "";
  var countries = new Map();

  // load data and make scatter plot after window loads
  window.onload = function () {
    svgContainer = d3.select('body')
      .append('svg')
      .attr('width', 1500)
      .attr('height', 1000);
    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("./data/Views.csv")
      .then((data) => makeScatterPlot(data));
  }

  // make scatter plot with trend line
  function makeScatterPlot(csvData) {
    data = csvData // assign data as global variable

    // get arrays of fertility rate data and life Expectancy data
    let year = data.map((row) => parseFloat(row["Year"]));
    let views = data.map((row) => parseFloat(row["Sum of Avg. Viewers (mil)"]));

    // find data limits
    let axesLimits = findMinMax(year, views);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits, "Year", "Sum of Avg. Viewers (mil)");


    // plot data as points and add tooltip functionality
    plotData(mapFunctions);

    // draw title and axes labels
    makeLabels();
  }

  // make title and axes labels
  function makeLabels() {
    svgContainer.append('text')
      .attr('x', 375)
      .attr('y', 40)
      .style('font-size', '18pt')
      .style('font-weight', 'bold')
      .text("Average Viewership by Season");

    svgContainer.append('text')
      .attr('x', 500)
      .attr('y', 760)
      .style('font-size', '12pt')
      .style('font-weight', 'bold')
      .text('Year');

    svgContainer.append('text')
      .attr('transform', 'translate(15, 500)rotate(-90)')
      .style('font-size', '12pt')
      .style('font-weight', 'bold')
      .text('Avg Viewers (in millions)');

      var legend = svgContainer
            .append('g')
            .attr("class", "legend")
            .attr("transform","translate(800,100)");

        legend.append('text')
            .attr("x", 0)
            .attr("y", 15)
            .text('Viewership Data')
            .attr("class", "textselected")
            .style("text-anchor", "start")
            .style("font-size", 17)
            .style('font-weight', 'bold');
        
        legend.append('rect')
            .attr("x", 0)
            .attr("y", 25)
            .attr("width", 15)
            .attr("height", 15)
            .style("fill", "steelblue")
        
        legend.append('text')
            .attr("x", 25)
            .attr("y", 40)
            .text('Actual')
            .attr("class", "textselected")
            .style("text-anchor", "start")
            .style("font-size", 17);

        legend.append('rect')
            .attr("x", 0)
            .attr("y", 60)
            .attr("width", 15)
            .attr("height", 15)
            .style("fill", "grey")
        
        legend.append('text')
            .attr("x", 20)
            .attr("y", 75)
            .text('Estimated')
            .attr("class", "textselected")
            .style("text-anchor", "start")
            .style("font-size", 17);
  }
  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map) {
    // get population data as array
    let pop_data = data.map((row) => +row["Sum of Avg. Viewers (mil)"]);
    let pop_limits = d3.extent(pop_data);
    // make size scaling function for population
    let pop_map_func = d3.scaleLinear()
      .domain([pop_limits[0], pop_limits[1]])
      .range([3, 20]);

    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    // make tooltip
    let div = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);



    // append data to SVG and plot as points
    var dots = svgContainer.selectAll('.dot')
      .data(data)
      .enter()

      dots.append('text')
      .attr('x', datapoint => xMap(datapoint) - 8)
      .attr('y', yMap)
      .style('font-size', '12px')
      .attr("dy", "-.5em")
      .text(d => d['Sum of Avg. Viewers (mil)'])

      dots.append('rect')
      .attr('x', datapoint => xMap(datapoint) - 12.5)
      .attr('y', yMap)
      .attr('width', 30)
      .attr('height', (datapoint) => 700 - yMap(datapoint))
      .attr('fill', (d) => (d.Data == 'Actual') ? 'steelblue' : 'Grey')
      .attr('stroke', 'black')
      // add tooltip functionality to points
      .on("mouseover", (d) => {
        div.transition()
          .duration(200)
          .style("opacity", .9);
        div.html('<h2 style="color: red"> Season #' + d["Year"] + " </h2>" + "Year: " + d["Year"] + "<br/>" + "Episodes: " + d["Episodes"] + "<br/>"
          + "Avg Viewers (mil): " + d["Sum of Avg. Viewers (mil)"] + "<br/>" +
          "Most Watched Episode: " + d['Most watched episode'] + "<br/>" + "Viewers (mil): " + d['Viewers (mil)'])
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", (d) => {
        div.transition()
          .duration(500)
          .style("opacity", 0);
      });

    var sum = d3.sum(data, function (d) { return d["Sum of Avg. Viewers (mil)"]; });
    var average = sum / data.length;

    var line = d3.line()
      .x(function (d, i) { return map.x2(d["Year"]); })
      .y(function (d, i) { return map.yScale(average); });

    svgContainer.append("path")
      .data([data])
      .attr("class", "mean")
      .style("stroke-dasharray", "5,5")
      .attr("d", line);

      svgContainer.append("text")
      .attr("transform", "translate(" + (950) + "," + map.yScale(average) + ")")
      .attr("dy", "1.2em")
      .attr("text-anchor", "end")
      .style("fill", "black")
      .style('font-weight', 'bold')
      .style('font-size', '13px')
      .html(average);
  }

  // draw the axes and ticks
  function drawAxes(limits, x, y) {
    // return x value from a row of data
    let xValue = function (d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 0.5, limits.xMax + 0.5]) // give domain buffer room
      .range([50, 1000]);

    let x2 = d3.scaleLinear()
      .domain([limits.xMin, limits.xMax]) // give domain buffer room
      .range([50, 1000]);

    // xMap returns a scaled x value from a row of data
    let xMap = function (d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale).ticks(25).tickSize(0);
    svgContainer.append("g")
      .attr('transform', 'translate(0, 700)')
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "end")
      .style('font-size', '12px')
      .attr("dx", "-1em")
      .attr("dy", ".1em")
      .attr("transform", "rotate(-90)")
      .text(d => d);

    // return y value from a row of data
    let yValue = function (d) { return +d[y] }

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 3, limits.yMin - 5]) // give domain buffer
      .range([50, 700]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale).ticks(7).tickSize(0);
    svgContainer.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale,
      x2: x2
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin: xMin,
      xMax: xMax,
      yMin: yMin,
      yMax: yMax
    }
  }
})();
