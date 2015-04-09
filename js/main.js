var BREAKS = [0,0.1,0.2,0.3,0.4,0.5]
var COLORS =["#adcdec","#00a9e9","#1268b3","#013b82","#002e42"]

function drawGraphic(container_width) {
  var getContext = function(type, year){
    var typeName = d3.select(type)
                    .attr('class')
                    .replace('button','')
                    .replace('selected','')
                    .replace('type','')
                    .replace(' ','');
    var yearName = d3.select(year)
                    .attr('class')
                    .replace('button','')
                    .replace('selected','')
                    .replace('year','')
                    .replace('y','')
                    .replace(' ','');
    return (typeName.trim() + yearName.trim());
  }

  var getColor = function(obj, context){
    return COLORS[getBuckets(BREAKS, obj[context])[1]-1]
  }
  var getBuckets = function(array, value) {
  var indexes = [],
      len = array.length,
      i,
      index = array.indexOf(value);

  if (~index) {
    return index;
  }

  if (value < array[0]) {
    return -1;  
  }

  for (i = 1; i < len; i++) {
    if (array[i] >= value) {
      return [i - 1, i];
    }    
  }

  return -1;
}

  var dispatch = d3.dispatch("load", "changeContext", "selectEntity", "sortBars");

  d3.csv("../data/data.csv", function(error, pumas) {
    if (error) throw error;
    var data = d3.map();
    pumas.forEach(function(d) {
      if(parseInt(d.FIPS, 10) > 10){
        data.set(parseInt(d.FIPS, 10), {"id": parseInt(d.FIPS, 10), "name": d["Sub-Boro-Name"], "borough": d.Borough, "unbanked2011": parseFloat(d["Unbanked-2011"]), "underbanked2011": parseFloat(d["Underbanked-2011"]), "unbanked2013": parseFloat(d["Unbanked-2013"]), "underbanked2013": parseFloat(d["Underbanked-2013"])})
      }
    });
    dispatch.load(data);
  });


  dispatch.on("load", function(data) {
    $(".header.row").empty();
    $(".barContainer").empty();
  });

  dispatch.on("load.menu", function(data) {
    var select = d3.select(".header.row")
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

  dispatch.on("load.buttons", function(data){
    var row = d3.select(".header.row")
    row.append("button")
      .attr("class", "unbanked button type selected")
      .text("Unbanked")
      .on("click", function(){ dispatch.changeContext(this, d3.select(".button.year.selected").node())});
    row.append("button")
      .attr("class", "underbanked button type")
      .text("Underbanked")
      .on("click", function(){ dispatch.changeContext(this, d3.select(".button.year.selected").node())});
    row.append("button")
      .attr("class", "y2011 button year")
      .text("2011")
      .on("click", function(){ dispatch.changeContext(d3.select(".button.type.selected").node(), this)});
    row.append("button")
      .attr("class", "y2013 button year selected")
      .text("2013")
      .on("click", function(){ dispatch.changeContext(d3.select(".button.type.selected").node(), this)});

    row.append("button")
      .attr("class", "sort button")
      .text("Sort bars")
      .on("click", function(){ dispatch.sortBars(d3.select(".button.type.selected").node(), d3.select(".button.year.selected").node())});
  })

  dispatch.on("changeContext", function(type, year){
    d3.selectAll(".button.selected").classed("selected",false)
    d3.select(type).classed("selected", true)
    d3.select(year).classed("selected", true)
  })

  // A bar chart to show total population; uses the "bar" namespace.
  dispatch.on("load.bar", function(data) {
    var barAspectHeight = 15; 
    var barAspectWidth = 7;
    var margin = {top: 0, right: 20, bottom: 15, left: 18},
        width = container_width*.3 - margin.left - margin.right,
        height = Math.ceil((width * barAspectHeight) / barAspectWidth) - margin.top - margin.bottom;

    var values = data.values().sort(function(a,b){ return a.unbanked2013 - b.unbanked2013}).reverse()
    var x = d3.scale.linear()
        .domain([0, d3.max(values, function(d) {
           return d3.max([parseFloat(d.unbanked2013), parseFloat(d.unbanked2011), parseFloat(d.underbanked2011), parseFloat(d.underbanked2013)]); 
         })])
        .rangeRound([width, 0])
        .nice();

    var y = d3.scale.ordinal()
      .rangeRoundBands([0, height], .1)
      .domain(values.map(function(d) { return d.name; }));

    var yAxis = d3.svg.axis()
        .scale(y)

    var xAxis = d3.svg.axis()
        .scale(x)

    var svg = d3.select(".barContainer").append("svg")
        .attr("class", "bars")
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

    svg.selectAll("rect.bar")
        .data(values)
      .enter().append("rect")
        .attr("class", function(d){
          return "bar fips_" + d.id + ' bucket_' + getBuckets(BREAKS,d.unbanked2013)[1];
        })
        .attr("y", function(d) { return y(d.name); })
        .attr("height", y.rangeBand())
        .attr("x", 0)
        .attr("width", function(d) { return width - x(d.unbanked2013); })
        .on("mouseover", function(d) { dispatch.selectEntity(data.get(d.id)); });;

    dispatch.on("selectEntity.bar", function(d) {
      d3.selectAll(".bar").classed("selected",false)
      d3.select(".bar.fips_" + d.id).classed("selected",true)
    });

    dispatch.on("changeContext.bar", function(type, year) {
      var context = getContext(type, year);
      values = data.values().sort(function(a,b){ return a[context] - b[context]}).reverse()

      y = d3.scale.ordinal()
      .rangeRoundBands([0, height], .1)
      .domain(values.map(function(d) { return d.name; }));

      d3.selectAll("rect.bar")
      .transition()
      .duration(600)
      .style("fill",function(d){
        return getColor(d,context)
      })
      .attr("width",function(d){ return width - x(d[context])})
    });

    dispatch.on("sortBars.bar", function(type,year){

      svg.selectAll("rect.bar")
      .sort(function(a,b){return a[getContext(type,year)] - b[getContext(type,year)]})
        .transition()
        .delay(function (d, i) {
          return i * 5;
        })
        .duration(500)
        .attr("y",function(d) {console.log(d.name);   return y(d.name); })
    });
  });

  dispatch.on("selectEntity.puma", function(d) {
    d3.selectAll(".puma").classed("selected",false)
    d3.select(".puma.fips_" + d.id).classed("selected",true)
  });


  dispatch.on("load.map", function(data) {
    var values = data.values().sort(function(a,b){ return a.unbanked2013 - b.unbanked2013}).reverse()
    values.forEach(function(d){
    d3.select(".puma.fips_" + d.id)
      .datum(d)
      .style("fill", getColor(d, "unbanked2013"))
      .on("mouseover",function(d){ dispatch.selectEntity(data.get(d.id)) })
    })

    dispatch.on("changeContext.map", function(type,year){
      var context = getContext(type, year);
      var sorted = data.values().sort(function(a,b){ return a[context] - b[context]}).reverse()
      sorted.forEach(function(d){
      d3.select(".puma.fips_" + d.id)
        .datum(d)
        .transition()
        .duration(600)
        .style("fill", getColor(d, context))
      })  
    })
  });

}

pymChild = new pym.Child({ renderCallback: drawGraphic });