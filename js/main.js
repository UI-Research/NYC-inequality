
var dispatch = d3.dispatch("load", "changeData", "selectEntity");

d3.csv("../data/nyc-sample-data.csv", function(error, pumas) {
  if (error) throw error;
  var data = d3.map();
  pumas.forEach(function(d) {
    data.set(parseInt(d.PUMACE10, 10), {"id": parseInt(d.PUMACE10, 10), "name": d.Subboro, "borough": d.Borough, "unbanked": parseFloat(d.Unbanked20)})
  });
  dispatch.load(data);
  dispatch.selectEntity(data.get(3810));
  dispatch.changeData(null)
});

// A drop-down menu for selecting a state; uses the "menu" namespace.
dispatch.on("load.menu", function(data) {
  var select = d3.select("body")
    .append("div")
    .append("select")
      .on("change", function() { dispatch.selectEntity(data.get(this.value)); });
  select.selectAll("option")
      .data(data.values())
    .enter().append("option")
      .attr("value", function(d) { return d.id; })
      .text(function(d) { return d.name; });

  dispatch.on("selectEntity.menu", function(puma) {
    select.property("value", puma.id);
  });
});

// A bar chart to show total population; uses the "bar" namespace.
dispatch.on("load.bar", function(data) {
  var margin = {top: 20, right: 20, bottom: 30, left: 40},
      width = 500 - margin.left - margin.right,
      height = 460 - margin.top - margin.bottom;

  var x = d3.scale.linear()
      .domain([0, d3.max(data.values(), function(d) { return parseFloat(d.unbanked); })])
      .rangeRound([height, 0])
      .nice();

  var y = d3.scale.ordinal()
    .rangeRoundBands([0, width], .1)
    .domain(data.values().map(function(d) { return d.name; }));

  var yAxis = d3.svg.axis()
      .scale(y)

  var xAxis = d3.svg.axis()
      .scale(x)

  var svg = d3.select("body").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg.append("g")
      .attr("class", "bar x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "bar y axis")
      .call(yAxis)


  svg.selectAll(".bar")
      .data(data.values())
    .enter().append("rect")
      .attr("class", function(d){ return "bar fips_" + d.id; })
      .attr("y", function(d) { return y(d.name); })
      .attr("height", y.rangeBand())
      .attr("x", 0)
      .attr("width", function(d) { return height - x(d.unbanked); })
      .on("mouseover", function(d) { dispatch.selectEntity(data.get(d.id)); });;

  dispatch.on("selectEntity.bar", function(d) {
    d3.selectAll(".bar").classed("selected",false)
    d3.select(".bar.fips_" + d.id).classed("selected",true)
    // rect.transition()
    //     .attr("y", y(d.unbanked))
    //     .attr("height", y(0) - y(d.unbanked));
  });
});

dispatch.on("selectEntity.puma", function(d) {
  d3.selectAll(".puma").classed("selected",false)
  d3.select(".puma.fips_" + d.id).classed("selected",true)
  // rect.transition()
  //     .attr("y", y(d.unbanked))
  //     .attr("height", y(0) - y(d.unbanked));
});


dispatch.on("load.map", function(data) {
  data.values().forEach(function(d){
    // console.log(d)
    var test = d3.select(".puma.fips_" + d.id)
    .datum(d)
    .on("mouseover",function(d){ dispatch.selectEntity(data.get(d.id)) })
    // console.log(d.stateById, d3.select(".puma.fips_" + d.id))
  })
  // d3.selectAll(".puma")
  //   .data(data.values(), function(d,i){
  //     var svg_fips, data_fips;
  //     if (typeof(this.length) == "undefined"){
  //       svg_fips = d3.select(this).attr("class").replace("puma","").replace(" ","").replace("fips_","")
  //     }
  //     console.log(d, svg_fips)
  //   })

    // .on("mouseover", function(d) {})
});

// // A pie chart to show population by age group; uses the "pie" namespace.
// dispatch.on("load.pie", function(stateById) {
//   var width = 880,
//       height = 460,
//       radius = Math.min(width, height) / 2;

//   var color = d3.scale.ordinal()
//       .domain(groups)
//       .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

//   var arc = d3.svg.arc()
//       .outerRadius(radius - 10)
//       .innerRadius(radius - 70);

//   var pie = d3.layout.pie()
//       .sort(null);

//   var svg = d3.select("body").append("svg")
//       .attr("width", width)
//       .attr("height", height)
//     .append("g")
//       .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

//   var path = svg.selectAll("path")
//       .data(groups)
//     .enter().append("path")
//       .style("fill", color)
//       .each(function() { this._current = {startAngle: 0, endAngle: 0}; });

//   dispatch.on("statechange.pie", function(d) {
//     path.data(pie.value(function(g) { return d[g]; })(groups)).transition()
//         .attrTween("d", function(d) {
//           var interpolate = d3.interpolate(this._current, d);
//           this._current = interpolate(0);
//           return function(t) {
//             return arc(interpolate(t));
//           };
//         });
//   });
// });

// // Coerce population counts to numbers and compute total per state.
// function type(d) {
//   d.total = d3.sum(groups, function(k) { return d[k] = +d[k]; });
//   return d;
// }
