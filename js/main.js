var BREAKS = [0,0.1,0.2,0.3,0.4,0.5];
var COLORS =["#adcdec","#00a9e9","#1268b3","#013b82","#002e42"];
var SCATTER_MAX_PERCENT = 0.5;
var SCATTER_MAX_DOLLARS = 150000;
var SCATTER_TICKS = 5;
var DOT_RADIUS = 8;
var layout = {"desktop": {
                "topRow": { "left": 41.0, "bottom": 19.0, "right": 41.0, "top": 53.0, "internal":{"large": 26.0, "small":17.0},
                  "plot": {"left": 51.0, "bottom": 29.0, "right": 41.0, "top": 51.0},
                  "plotTitle": {"x": 8, "y": 25}
                },
                "bottomRow": { "left": 41.0, "bottom": 33.0, "right": 24.0, "top": 0.0, "internal":{"large": 26.0, "small":21.0},
                  "plot": {"left": 43.0, "bottom": 26.0, "right": 13.0, "top": 48.0},
                  "plotTitle": {"x": 8, "y": 25}
                },
              },
              "tablet": {},
              "mobile": {}
        };

function drawGraphic(containerWidth) {
  var getTooltipX = function(x, d, width, context, tooltip){
    if (d3.select("svg.bars").attr("width") > (width - x(d[context]) + 67) + tooltip.node().getBBox().width){
      return (width - x(d[context]) + 7)
    }
    else{
      return d3.select("svg.bars").attr("width")/2
    }
  }
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
      var isPuma = (parseInt(d.FIPS, 10) > 10) ? true: false;
      data.set(parseInt(d.FIPS, 10), {
        "isPuma": isPuma,
        "id": parseInt(d.FIPS, 10),
        "name": d["Sub-Boro-Name"],
        "borough": d.Borough,
        "unbanked2011": parseFloat(d["Unbanked-2011"]),
        "underbanked2011": parseFloat(d["Underbanked-2011"]),
        "unbanked2013": parseFloat(d["Unbanked-2013"]),
        "underbanked2013": parseFloat(d["Underbanked-2013"]),
        "poverty2011": parseFloat(d["poor-2011"]),
        "poverty2013": parseFloat(d["2013-poverty"]),
        "income2011": parseFloat(d["Median-Income-2011"]),
        "income2013": parseFloat(d["median-income-2013 "]),
        "unemployment2011": parseFloat(d["unemployment-2011"]),
        "unemployment2013": parseFloat(d["unemployment-2013"]),
        "foreignBorn2011": parseFloat(d["foreign-born-2011"]),
        "foreignBorn2013": parseFloat(d["foreign-born-2013"])
      });
    });
    dispatch.load(data);
  });


  dispatch.on("load", function(data) {
    $(".header.row").empty();
    $(".scatter.row").empty();
    $(".barContainer").empty();
  });

  dispatch.on("load.menu", function(data) {

    var values = data.values().filter(function(d){ return d.isPuma}).sort(
          function(a, b) {
            var textA = a.name.toUpperCase();
            var textB = b.name.toUpperCase();
            return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
          });

    var select = d3.select(".header.row")
      .append("div")
      .classed("ui-widget", true)
      .append("select")
      .attr("id", "combobox")
      .on("change", function() { dispatch.selectEntity(data.get(this.value)); });
    
    select.selectAll("option")
      .data(values)
      .enter().append("option")
      .attr("value", function(d) { return d.id; })
      .text(function(d) { return d.name; });
 
    $(function() {
      $( "#combobox" ).combobox();
    }); 

    dispatch.on("selectEntity.menu", function(puma) {
      select.property("value", puma.id);
      d3.select("input").attr("value","foo")
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
    var formatter = d3.format(".1%")
    var barAspectHeight = 15; 
    var barAspectWidth = 7;
    var margin = {top: 0, right: 20, bottom: 15, left: 18},
        width = containerWidth*.3 - margin.left - margin.right,
        height = Math.ceil((width * barAspectHeight) / barAspectWidth) - margin.top - margin.bottom;

    var values = data.values().filter(function(d){ return d.isPuma}).sort(function(a,b){ return a.unbanked2013 - b.unbanked2013}).reverse()
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
    var nycData = data.get(1)
    svg.append("line")
      .attr("class", "nycDashedLine")
      .style("stroke-dasharray", ("1, 3"))
      .attr("x1", width - x(nycData.unbanked2013))
      .attr("x2", width - x(nycData.unbanked2013))
      .attr("y1", 0)
      .attr("y2", height)

    svg.append("polygon")
      .attr("class", "nycArrow")
      .attr("points", (width - x(nycData.unbanked2013)) + "," + height*.9 + " " + (width - x(nycData.unbanked2013) + 12) + "," + (height*.9-4) + " " + (width - x(nycData.unbanked2013) + 12) + "," + (height*.9+4))

    svg.append("text")
      .attr("class","nycText")
      .attr("y", height*.907)
      .attr("x", (width - x(nycData.unbanked2013) + 15))
      .text("NYC, " + formatter(nycData.unbanked2013))


    svg.selectAll("rect.bar")
        .data(values)
      .enter().append("rect")
        .attr("class", function(d){
          return "bar fips_" + d.id + ' bucket_' + getBuckets(BREAKS,d.unbanked2013)[1];
        })
        .attr("value", "unbanked2013")
        .attr("y", function(d) { return y(d.name); })
        .attr("height", y.rangeBand())
        .attr("x", 0)
        .attr("width", function(d) { return width - x(d.unbanked2013); })
        .on("mouseover", function(d) { dispatch.selectEntity(data.get(d.id)); });

    var tooltip = svg.append("g")
      .attr("class", "bar tooltip")
      

    tooltip.append("text")
      .attr("class", "value")

    dispatch.on("selectEntity.bar", function(d) {
      d3.selectAll(".bar").classed("selected",false)
      var selected = d3.select(".bar.fips_" + d.id).classed("selected",true)
      var context = selected.attr("value")

      tooltip
        .datum(d)
        .transition()
        .duration(200)
        .attr("transform", function(d) { return "translate(" + getTooltipX(x, d, width, context, tooltip) + "," + (y(d.name)+12) +")" })

      d3.selectAll(".tooltip .name").remove()
      d3.selectAll(".tooltip .background").remove()

      var names = d.name.split("/")
      for(var i=0; i<names.length; i++){
        var lineEnd = (i+1 == names.length) ? "":" /";
        tooltip.append("text")
          .attr("class","name")
          .attr("y", (i+1)*20)
          .text(names[i].trim() + lineEnd)
      }
      tooltip.select(".value")
        .text(formatter(d[context]))

      var bbox = tooltip.node().getBBox();
      tooltip.insert("rect", ".value")
        .attr("class","background")
        .attr("x",-5)
        .attr("y",-20)
        .attr("width",bbox.width + 10)
        .attr("height",bbox.height + 10)


    });

    dispatch.on("changeContext.bar", function(type, year) {
      var context = getContext(type, year);
      values = data.values().filter(function(d){ return d.isPuma}).sort(function(a,b){ return a[context] - b[context]}).reverse()
      var unsorted = data.values().filter(function(d){ return d.isPuma})

      if(d3.selectAll('.bar.tooltip .name').node()){
        d3.selectAll('.bar.tooltip')  
          .transition()
          .duration(600)
          .attr("transform", function(d) { return "translate(" + getTooltipX(x, d, width, context, tooltip) + "," + (y(d.name)+12) +")" })
      }

      d3.select(".nycDashedLine")
        .transition()
        .duration(400)
        .attr("x1", width - x(nycData[context]))
        .attr("x2", width - x(nycData[context]))
      d3.select(".nycArrow")
        .transition()
        .duration(800)
        .attr("points", (width - x(nycData[context])) + "," + height*.9 + " " + (width - x(nycData[context]) + 12) + "," + (height*.9-4) + " " + (width - x(nycData[context]) + 12) + "," + (height*.9+4))
      d3.select(".nycText")
        .transition()
        .duration(800)
        .attr("x", (width - x(nycData[context]) + 15))
        .text("NYC, " + formatter(nycData[context]))


      d3.selectAll("rect.bar")
        .attr("value", context)
        .transition()
        .duration(600)
        .style("fill",function(d){
          return getColor(d,context)
        })
        .attr("width",function(d){ return width - x(d[context])})

    });

    dispatch.on("sortBars.bar", function(type,year){
      var context = getContext(type, year);

      y = d3.scale.ordinal()
        .rangeRoundBands([0, height], .1)
        .domain(values.map(function(d) { return d.name; }));

      d3.selectAll('.bar.tooltip')
        .transition()
        .ease("back")
        .delay(300)
        .duration(400)
        .attr("transform", function(d) { return "translate(" + getTooltipX(x, d, width, context, tooltip) + "," + (y(d.name)+12) +")" })

      svg.selectAll("rect.bar")
      .sort(function(a,b){return a[context] - b[context]})
        .transition()
        .delay(function (d, i) {
          return i * 5;
        })
        .duration(500)
        .attr("y",function(d) {return y(d.name); })
    });
  });

  dispatch.on("selectEntity.puma", function(d) {
    d3.selectAll(".puma").classed("selected",false)
    d3.select(".puma.fips_" + d.id).classed("selected",true)
  });

  dispatch.on("load.map", function(data) {
    var values = data.values().sort(function(a,b){ return a.unbanked2013 - b.unbanked2013}).filter(function(d){ return d.isPuma}).reverse()
    values.forEach(function(d){
    d3.select(".puma.fips_" + d.id)
      .datum(d)
      .style("fill", getColor(d, "unbanked2013"))
      .on("mouseover",function(d){ dispatch.selectEntity(data.get(d.id)) })
    });

    dispatch.on("changeContext.map", function(type,year){
      var context = getContext(type, year);
      var sorted = data.values().filter(function(d){ return d.isPuma}).sort(function(a,b){ return a[context] - b[context]}).reverse()
      sorted.forEach(function(d){
      d3.select(".puma.fips_" + d.id)
        .datum(d)
        .transition()
        .duration(600)
        .style("fill", getColor(d, context))
      });  
    });
  });

  dispatch.on("load.scatter", function(data){
    var topRowWidth = (containerWidth - layout.desktop.topRow.left - layout.desktop.topRow.right - layout.desktop.topRow.internal.large - layout.desktop.topRow.internal.small) * 0.377;
    var bottomRowWidth = (containerWidth - layout.desktop.bottomRow.left - layout.desktop.bottomRow.right - layout.desktop.bottomRow.internal.large - layout.desktop.bottomRow.internal.small*3.0) * 0.25;

    var drawScatter = function(variable){
      var containerID = variable + "Plot"
      var width = (variable === "unbanked" || variable == "underbanked") ? topRowWidth : bottomRowWidth;
      var height = width;

      var row = (variable === "unbanked" || variable == "underbanked") ? "topRow" : "bottomRow"
      var formatter = (variable === "income") ? d3.format("$s") : d3.format("%");
      var scatterMax = (variable === "income") ? SCATTER_MAX_DOLLARS : SCATTER_MAX_PERCENT;

      var titles = {"unbanked": "Percent Unbanked", "underbanked": "Percent Underbanked", "poverty": "Poverty Rate", "income": "Median Income", "unemployment": "Unemployment Rate", "foreignBorn": "Percent Foreign Born"};

      var svg = d3.select("#" + containerID)
        .append("svg")
        .attr("class", variable)
        .attr("width", width)
        .attr("height", height)

      svg
        .append("g")
        .append("rect")
        .attr("x",0)
        .attr("y",0)
        .attr("width",width)
        .attr("height", height)
        .attr("class","plot background")

      svg.append("text")
        .text(titles[variable])
        .attr("class","scatter title")
        .attr("x",layout.desktop[row].plotTitle.x)
        .attr("y",layout.desktop[row].plotTitle.y)

      var x = d3.scale.linear()
              .domain([2010.5, 2013.5])
              .range([ layout.desktop[row].plot.left , width - layout.desktop[row].plot.right])

      var y = d3.scale.linear()
            .domain([0, scatterMax])
            .range([ height - layout.desktop[row].plot.bottom, layout.desktop[row].plot.top]);

      var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(SCATTER_TICKS)
        .tickFormat(formatter);


      y.ticks(SCATTER_TICKS).forEach(function(d){
      svg.append("line")
        .attr("class", "gridLine")
        .attr("x1", x(2010.5))
        .attr("x2", x(2013.5))
        .attr("y1", y(d))
        .attr("y2", y(d));
      })   
    
      var xAxis = d3.svg.axis()
        .scale(x)
        .orient('bottom')
        .tickValues([2011, 2013])
        .tickSize(5,5,0)
        .tickFormat(d3.format("0"));


      svg.append("g")
        .attr("class", "scatter x axis")
        .attr("transform", "translate(0," + (height - layout.desktop[row].plot.bottom) + ")")
        .call(xAxis);

      svg.append("g")
        .attr("class", "scatter y axis")
        .attr("transform", "translate(" + layout.desktop[row].plot.left + ",0)")
        .call(yAxis)
      var nycData = data.get(1)

      svg.append("line")
        .attr("class", "scatter nyc connector")
        .attr("x1", x(2011))
        .attr("x2", x(2013))
        .attr("y1", y(nycData[variable + "2011"]))
        .attr("y2", y(nycData[variable + "2013"]))
      svg.append("circle")
        .attr("class","scatter nyc dot y2011")
        .attr("cx", x(2011))
        .attr("cy", y(nycData[variable + "2011"]))
        .attr("r", DOT_RADIUS)
      svg.append("circle")
        .attr("class","scatter nyc dot y2013")
        .attr("cx", x(2013))
        .attr("cy", y(nycData[variable + "2013"]))
        .attr("r", DOT_RADIUS)

      svg.append("line")
        .attr("class", "scatter borough connector")
        .attr("x1", x(2011))
        .attr("x2", x(2013))
        .attr("y1", y(scatterMax * -.5))
        .attr("y2", y(scatterMax * -.5))
      svg.append("circle")
        .attr("class","scatter borough dot y2011")
        .attr("cx", x(2011))
        .attr("cy", y(scatterMax * -.5))
        .attr("r", DOT_RADIUS)
      svg.append("circle")
        .attr("class","scatter borough dot y2013")
        .attr("cx", x(2013))
        .attr("cy", y(scatterMax * -.5))
        .attr("r", DOT_RADIUS)

      svg.append("line")
        .attr("class", "scatter puma connector")
        .attr("x1", x(2011))
        .attr("x2", x(2013))
        .attr("y1", y(scatterMax * -.5))
        .attr("y2", y(scatterMax * -.5))
      svg.append("circle")
        .attr("class","scatter puma dot y2011")
        .attr("cx", x(2011))
        .attr("cy", y(scatterMax * -.5))
        .attr("r", DOT_RADIUS)
      svg.append("circle")
        .attr("class","scatter puma dot y2013")
        .attr("cx", x(2013))
        .attr("cy", y(scatterMax * -.5))
        .attr("r", DOT_RADIUS)

    }

    var row = d3.select(".scatter.row")
              .style("width", "100%")
              .style("height", containerWidth*.725 + "px")

    row.append("div")
      .attr("id", "unbankedPlot")
      .style("margin", layout.desktop.topRow.top + "px " + layout.desktop.topRow.internal.small + "px " + layout.desktop.topRow.bottom + "px " + layout.desktop.topRow.internal.large + "px")
      .style("width", topRowWidth + "px")
      .style("height", topRowWidth + "px")
      .style("float", "left")

    row.append("div")
      .attr("id", "underbankedPlot")
      .style("margin", layout.desktop.topRow.top + "px " + layout.desktop.topRow.right + "px " + layout.desktop.topRow.bottom + "px " + 0 + "px")
      .style("width", topRowWidth + "px")
      .style("height", topRowWidth + "px")
      .style("float", "left")

    row.append("div")
      .attr("id", "povertyPlot")
      .style("margin", 0 + "px " + layout.desktop.bottomRow.internal.large + "px " + layout.desktop.bottomRow.bottom + "px " + layout.desktop.bottomRow.left + "px")
      .style("width", bottomRowWidth + "px")
      .style("height", bottomRowWidth + "px")
      .style("float", "left")

    row.append("div")
      .attr("id", "incomePlot")
      .style("margin", 0 + "px " + layout.desktop.bottomRow.internal.small + "px " + layout.desktop.bottomRow.bottom + "px " + 0 + "px")
      .style("width", bottomRowWidth + "px")
      .style("height", bottomRowWidth + "px")
      .style("float", "left")

    row.append("div")
      .attr("id", "unemploymentPlot")
      .style("margin", 0 + "px " + layout.desktop.bottomRow.internal.small + "px " + layout.desktop.bottomRow.bottom + "px " + 0 + "px")
      .style("width", bottomRowWidth + "px")
      .style("height", bottomRowWidth + "px")
      .style("float", "left")

    row.append("div")
      .attr("id", "foreignBornPlot")
      .style("margin", 0 + "px " + layout.desktop.bottomRow.right + "px " + layout.desktop.bottomRow.bottom + "px " + 0 + "px")
      .style("width", bottomRowWidth + "px")
      .style("height", bottomRowWidth + "px")
      .style("float","left")


    drawScatter("unbanked")
    drawScatter("underbanked")
    drawScatter("poverty")
    drawScatter("income")
    drawScatter("unemployment")
    drawScatter("foreignBorn")
    pymChild.sendHeight()

    dispatch.on("selectEntity.scatter", function(d){
      var updateScatter = function(variable){
        var BOROUGHS = {"Bronx": 2, "Manhattan": 3, "Staten": 4, "Brooklyn": 5, "Queens": 6}
        var width = (variable === "unbanked" || variable == "underbanked") ? topRowWidth : bottomRowWidth;
        var height = width;
        var row = (variable === "unbanked" || variable == "underbanked") ? "topRow" : "bottomRow"
        var scatterMax = (variable === "income") ? SCATTER_MAX_DOLLARS : SCATTER_MAX_PERCENT;
        var y = d3.scale.linear()
              .domain([0, scatterMax])
              .range([ height - layout.desktop[row].plot.bottom, layout.desktop[row].plot.top]);
        var svg = d3.select("svg." +  variable)
        var boroughData = data.get(BOROUGHS[d.borough])

        svg.select(".scatter.puma.dot.y2011")
          .transition()
          .attr("cy", y(d[variable + "2011"]));
        svg.select(".scatter.puma.dot.y2013")
          .transition()
          .attr("cy", y(d[variable + "2013"]));
        svg.select(".scatter.puma.connector")
          .transition()
          .attr("y1", y(d[variable + "2011"]))
          .attr("y2", y(d[variable + "2013"]));

        svg.select(".scatter.borough.dot.y2011")
          .transition()
          .attr("cy", y(boroughData[variable + "2011"]));
        svg.select(".scatter.borough.dot.y2013")
          .transition()
          .attr("cy", y(boroughData[variable + "2013"]));
        svg.select(".scatter.borough.connector")
          .transition()
          .attr("y1", y(boroughData[variable + "2011"]))
          .attr("y2", y(boroughData[variable + "2013"]));

      }

      updateScatter("unbanked")
      updateScatter("underbanked")
      updateScatter("poverty")
      updateScatter("income")
      updateScatter("unemployment")
      updateScatter("foreignBorn")
    })
    
  });

}

    (function( $ ) {
      $.widget( "custom.combobox", {
        _create: function() {
          this.wrapper = $( "<span>" )
            .addClass( "custom-combobox" )
            .insertAfter( this.element );
   
          this.element.hide();
          this._createAutocomplete();
          this._createShowAllButton();
        },
 
        _createAutocomplete: function() {
          var selected = this.element.children( ":selected" ),
            value = selected.val() ? selected.text() : "";
   
          this.input = $( "<input>" )
            .appendTo( this.wrapper )
            .val( value )
            .attr( "title", "" )
            .addClass( "custom-combobox-input ui-widget ui-widget-content ui-state-default ui-corner-left" )
            .autocomplete({
              delay: 0,
              minLength: 0,
              source: $.proxy( this, "_source" )
            })
            .tooltip({
              tooltipClass: "ui-state-highlight"
            });
 
          this._on( this.input, {
            autocompleteselect: function( event, ui ) {
              ui.item.option.selected = true;
              this._trigger( "select", event, {
                item: ui.item.option
              });
              console.log(ui.item.option.value)
              dispatch.selectEntity(data.get(ui.item.option.value))
            },
   
            autocompletechange: "_removeIfInvalid"
          });
        },
 
        _createShowAllButton: function() {
          var input = this.input,
            wasOpen = false;
   
          $( "<a>" )
            .attr( "tabIndex", -1 )
            .attr( "title", "Show All Items" )
            .tooltip()
            .appendTo( this.wrapper )
            .button({
              icons: {
                primary: "ui-icon-triangle-1-s"
              },
              text: false
            })
            .removeClass( "ui-corner-all" )
            .addClass( "custom-combobox-toggle ui-corner-right" )
            .mousedown(function() {
              wasOpen = input.autocomplete( "widget" ).is( ":visible" );
            })
            .click(function() {
              input.focus();
   
              // Close if already visible
              if ( wasOpen ) {
                return;
              }
   
              // Pass empty string as value to search for, displaying all results
              input.autocomplete( "search", "" );
            });
        },
 
        _source: function( request, response ) {
          var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i" );
          response( this.element.children( "option" ).map(function() {
            var text = $( this ).text();
            if ( this.value && ( !request.term || matcher.test(text) ) )
              return {
                label: text,
                value: text,
                option: this
              };
          }) );
        },
 
        _removeIfInvalid: function( event, ui ) {
   
          // Selected an item, nothing to do
          if ( ui.item ) {
            return;
          }
   
          // Search for a match (case-insensitive)
          var value = this.input.val(),
            valueLowerCase = value.toLowerCase(),
            valid = false;
          this.element.children( "option" ).each(function() {
            if ( $( this ).text().toLowerCase() === valueLowerCase ) {
              this.selected = valid = true;
              return false;
            }
          });
   
          // Found a match, nothing to do
          if ( valid ) {
            return;
          }
   
          // Remove invalid value
          this.input
            .val( "" )
            .attr( "title", value + " didn't match any item" )
            .tooltip( "open" );
          this.element.val( "" );
          this._delay(function() {
            this.input.tooltip( "close" ).attr( "title", "" );
          }, 2500 );
          this.input.autocomplete( "instance" ).term = "";
        },
 
        _destroy: function() {
          this.wrapper.remove();
          this.element.show();
        }
      });
    }) (jQuery)



pymChild = new pym.Child({ renderCallback: drawGraphic });