'use strict';

(function() {

  let data = ""; // keep data in global scope
  let svgContainer = ""; // keep SVG reference in global scope

  // load data and make scatter plot after window loads
  window.onload = function() {
    svgContainer = d3.select('body')
      .append('svg')
      .attr('width', 1000)
      .attr('height', 1000);
    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("../data/Views.csv")
      .then((csvData) => makeScatterPlot(csvData));
  }

  // make scatter plot with trend line
  function makeScatterPlot(csvData) {
    data = csvData; 
    console.log(data)
    // get an array of gre scores and an array of chance of admit
    let year = data.map((row) => parseInt(row["Year"]));
    let views = data.map((row) => parseFloat(row["Sum of Avg. Viewers (mil)"]));
    let axesLimits = findMinMax(year, views);
    // draw axes with ticks and return mapping and scaling functions
    let mapFunctions = drawTicks(axesLimits);

    // plot the data using the mapping and scaling functions
    plotData(mapFunctions);
  }

  // plot all the data points on the SVG
  function plotData(map) {
    let xMap = map.x;
    let yMap = map.y;

    let div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
    // append data to SVG and plot as points
    svgContainer.selectAll('.dot')
      .data(data)
      .enter()
      .append('rect')
        .attr('x', datapoint => xMap(datapoint) - 3)
        .attr('y', yMap)
        .attr('width', 10)
        .attr('height', (datapoint) => 700 - yMap(datapoint))
        .attr('fill', "#ddb1b1")
        .attr('stroke', 'black')
        .on("mouseover", (d) => {
            div.transition()
              .duration(200)
              .style("opacity", .9);
            div.html(d.location + "<br/>" + numberWithCommas(d["pop_mlns"] * 1000000))
              .style("left", (d3.event.pageX) + "px")
              .style("top", (d3.event.pageY - 28) + "px");
          })
          .on("mouseout", (d) => {
            div.transition()
              .duration(500)
              .style("opacity", 0);
          });;
  }

  // draw the axes and ticks
  function drawTicks(limits) {
    // return gre score from a row of data
    let xValue = function(d) { return +d["Year"]; }

    // function to scale gre score
    let xScale = d3.scaleLinear()
      .domain([limits.yearMin, limits.yearMax]) // give domain buffer room
      .range([50, 700]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svgContainer.append("g")
      .attr('transform', 'translate(0, 700)')
      .call(xAxis);

    // return Chance of Admit from a row of data
    let yValue = function(d) { return +d["Sum of Avg. Viewers (mil)"]}

    // function to scale Chance of Admit
    let yScale = d3.scaleLinear()
      .domain([limits.viewsMax, limits.viewsMin]) // give domain buffer
      .range([50, 700]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svgContainer.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for GRE Scores and Chance of Admit
  function findMinMax(year, views) {

    // get min/max gre scores
    let yearMin = d3.min(year);
    let yearMax = d3.max(year);

    // get min/max admit chance
    let viewsMin = d3.min(views);
    let viewsMax = d3.max(views);

    // return formatted min/max data as an object
    return {
      yearMin : yearMin,
      yearMax : yearMax,
      viewsMin : viewsMin,
      viewsMax : viewsMax
    }
  }
})();