var BREAKS = [0,0.1,0.2,0.3,0.4,0.5];
var COLORS =["#adcdec","#00a9e9","#1268b3","#013b82","#002e42"];
var SCATTER_MAX_PERCENT = 0.5;
var SCATTER_MAX_PREPAID = 0.2;
var SCATTER_MAX_DOLLARS = 150000;
var SCATTER_TICKS = 5;
var DOT_RADIUS = 8;

var desktop = true;

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

  var scrollDown = function(){
    window.parent.scrollFunc();
  }

// wrap function modified from http://bl.ocks.org/mbostock/7555321
  var wrap = function(text, width) {
    text.each(function() {
      var text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 1.1, // ems
          y = text.attr("y"),
          x = text.attr("x"),
          dy = parseFloat(text.attr("dy")),
          tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
        }
      }
    });
  }

  var formatBorough = function(borough){
    if (borough == "Staten"){ return "Staten Island";}
    else if (borough == "Bronx"){ return "The Bronx";}
    else { return borough;}
  }
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
  var checkClass = function(obj, context, suffix){
    if (getBuckets(BREAKS, obj[context])[1] == suffix){
      return true;
    }else{
      return false;
    }
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

  var dispatch = d3.dispatch("load", "changeContext", "selectEntity", "clickEntity", "sortBars", "bucketHighlight", "deselectEntities");

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
        "prepaid2011": parseFloat(d["Prepaid-2011-New-Definition"]),
        "prepaid2013": parseFloat(d["Prepaid-2013-New-Definition"])
      });
    });
    dispatch.load(data);
  });

  dispatch.on("deselectEntities", function(eventType){
    d3.selectAll(".bar.selected").classed("selected", false);
    var clicked = d3.select(".bar.clicked")
    if(clicked.node() != null){
      clicked.classed("selected", true)
      dispatch.selectEntity(clicked.data()[0])
    }
    d3.selectAll(".puma.selected").classed("selected", false);
    var clickedPuma = d3.select(".puma.clicked")
    if(clickedPuma.node() != null){
      clickedPuma.classed("selected", true)
      dispatch.selectEntity(clickedPuma.data()[0])
    }
  });

  dispatch.on("load", function(data) {
    $(".header.row").empty();
    $(".scatter.row").empty();
    $(".barContainer").empty();
  });

  dispatch.on("load.menu", function(data) {
    // dispatch.on("deselectEntities", function(eventType){
      
    // });

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

    var values = data.values().filter(function(d){ return d.isPuma}).sort(
          function(a, b) {
            var textA = a.name.toUpperCase();
            var textB = b.name.toUpperCase();
            return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
          });


//Bottom menu
    var topRowWidth = (containerWidth - layout.desktop.topRow.left - layout.desktop.topRow.right - layout.desktop.topRow.internal.large - layout.desktop.topRow.internal.small) * 0.377;
    var row = d3.select(".scatter.row")
    var wrapper = row.append("div")
      .attr("id", "bottomMenuContainer")
      .style("height", topRowWidth + "px")
      .style("width", (topRowWidth * 0.64) + "px")
      .style("margin", layout.desktop.topRow.top + "px " + 0 + "px " + layout.desktop.topRow.bottom + "px " + layout.desktop.topRow.left + "px ")

    var title = wrapper.append("div")
      .attr("class", "title")
      .text("New York City Average")

    wrapper.append("div")
      .attr("class", "helpText")
      .text("Select another neighborhood");

    var bottomSelect = wrapper.append("div")
      .classed("ui-widget", true)
      .append("select")
      .attr("id", "bottomCombobox")
      .on("change", function() { dispatch.selectEntity(data.get(this.value)); });

    bottomSelect.selectAll("option")
      .data(values)
      .enter().append("option")
      .attr("value", function(d) { return d.id; })
      .text(function(d) { return d.name; });

    var key = wrapper.append("svg")
      .attr("width", topRowWidth * 0.64)
      .attr("height", 160)
    
    var pumaKey = key.append("g")
              .attr("class", "puma");
        pumaKey.append("text");
    var boroughKey = key.append("g")
              .attr("class", "borough");
    var nycKey = key.append("g")
              .attr("class", "nyc");
    var defaultKeys = key.append("g")
              .attr("class", "temp");

    nycKey.append("line")
      .attr("class", "scatter nyc connector")
      .attr("x1", 10)
      .attr("x2", 65)
      .attr("y1", 10)
      .attr("y2", 10);     
    nycKey.append('circle')
      .attr("class","scatter nyc dot key")
      .attr("cx", 10)
      .attr("cy", 10)
      .attr("r", DOT_RADIUS);
    nycKey.append('circle')
      .attr("class","scatter nyc dot key")
      .attr("cx", 65)
      .attr("cy", 10)
      .attr("r", DOT_RADIUS);
    nycKey.append("text")
      .attr("class", "scatter key text")
      .attr("x", 85)
      .attr("y", 15)
      .text("NYC average");

    boroughKey.append("line")
        .attr("class", "scatter borough connector")
        .attr("x1", 10)
        .attr("x2", 65)
        .attr("y1", 300)
        .attr("y2", 300);
      boroughKey.append('circle')
        .attr("class","scatter borough dot key")
        .attr("cx", 10)
        .attr("cy", 300)
        .attr("r", DOT_RADIUS);
      boroughKey.append('circle')
        .attr("class","scatter borough dot key")
        .attr("cx", 65)
        .attr("cy", 300)
        .attr("r", DOT_RADIUS);
      boroughKey
        .append("text")
        .attr("class", "scatter borough text")
        .attr("x", 85)
        .attr("y", 300)
        .text("");

      pumaKey.append("line")
        .attr("class", "scatter puma connector")
        .attr("x1", 10)
        .attr("x2", 65)
        .attr("y1", 300)
        .attr("y2", 300);
      pumaKey.append('circle')
        .attr("class","scatter puma dot key")
        .attr("cx", 10)
        .attr("cy", 300)
        .attr("r", DOT_RADIUS);
      pumaKey.append('circle')
        .transition()
        .attr("class","scatter puma dot key")
        .attr("cx", 65)
        .attr("cy", 300)
        .attr("r", DOT_RADIUS);

    defaultKeys
      .attr("transform", "translate(0,12)")

    for(var i = 2; i<7; i++){
        var boroughData = data.get(i)
        var className = boroughData.name.replace(" ","_")
        defaultKeys.append("line")
          .attr("class", "scatter connector temp " + className)
          .attr("x1", 10)
          .attr("x2", 65)
          .attr("y1", 22*(i-1))
          .attr("y2", 22*(i-1));     
        defaultKeys.append('circle')
          .attr("class","scatter dot key temp " + className)
          .attr("cx", 10)
          .attr("cy", 22*(i-1))
          .attr("r", DOT_RADIUS);
        defaultKeys.append('circle')
          .attr("class","scatter dot key temp " + className)
          .attr("cx", 65)
          .attr("cy", 22*(i-1))
          .attr("r", DOT_RADIUS);
        defaultKeys.append("text")
          .attr("class", "scatter key text temp " + className)
          .attr("x", 85)
          .attr("y", 5+22*(i-1))
          .text(boroughData.name);
    }


//Top menu
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
      $( "#bottomCombobox" ).combobox();
    }); 

    dispatch.on("selectEntity.menu", function(puma) {
      var lines = puma.name.split("/");
      var lineCount = lines.length;
//Top Menu      
      select.property("value", puma.id);
//Bottom Menu
      title.text(puma.name);

      key.attr("height", 120);

      pumaKey.transition()
        .attr("transform", "translate(0,0)");
      nycKey.transition()
        .attr("transform", "translate(0," + (60 + (lineCount-1)*15) +")");
      boroughKey.transition()
        .attr("transform", "translate(0," + (30 + (lineCount-1)*15) +")");
      defaultKeys.transition()
        .duration(800)
        .attr("transform", "translate(0,300)");

        boroughKey.select(".connector")
        .transition()
        .attr("y1", 10)
        .attr("y2", 10);
      boroughKey.selectAll(".dot")
        .transition()
        .attr("cy", 10)
      boroughKey.select("text")
        .transition()
        .attr("y", 15)
        .text(formatBorough(puma.borough));
      pumaKey.select(".connector")
        .transition()
        .attr("y1", 10)
        .attr("y2", 10);
      pumaKey.selectAll('.dot')
        .transition()
        .attr("cy", 10)
      pumaKey.selectAll("text").remove()
      for (var i = 0; i<lineCount; i++){
        pumaKey
          .append("text")
          .transition()
          .attr("class", "scatter puma text")
          .attr("x", 85)
          .attr("y", 15*(i+1))
          .text(function(){ 
            if (i != lineCount-1){ return lines[i].trim() + "/" }
            else{ return lines[i]}
          });
      }
    });

    dispatch.on("deselectEntities.menu", function(eventType){
      if(d3.selectAll(".bar.clicked").node() == null){
        key.attr("height", 160);
        title.text("New York City Average")

        nycKey.transition()
          .attr("transform", "translate(0,0)");
        pumaKey.transition()
          .attr("transform", "translate(0,300)");
        boroughKey.transition()
          .attr("transform", "translate(0,300)");
        defaultKeys.transition()
        .attr("transform", "translate(0,12)");
      }
    })
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

  dispatch.on("load.bar", function(data) {
    var formatter = d3.format(".1%")
    var barAspectHeight = 15; 
    var barAspectWidth = 7;
    var margin = {top: 0, right: 20, bottom: 35, left: 18},
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
        .on("mouseover", function(d) { dispatch.selectEntity(data.get(d.id)); })
        .on("click", function(d){ dispatch.clickEntity(data.get(d.id)); dispatch.selectEntity(data.get(d.id))})
        .on("mouseout", function(d) { dispatch.deselectEntities("mouseout"); })

    var tooltip = svg.append("g")
      .attr("class", "bar tooltip")
      

    tooltip.append("text")
      .attr("class", "value")

    dispatch.on("clickEntity.bar", function(d){
      scrollDown();
      var clicked = d3.select(".bar.fips_" + d.id)
      var isClicked = clicked.classed("clicked")
      if(!isClicked){ d3.selectAll(".bar").classed("clicked",false) }
      clicked.classed("selected", !isClicked)
      clicked.classed("clicked", !isClicked)
    });

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

    dispatch.on("deselectEntities.bars", function(eventType){
      var tooltip = d3.select(".bar.tooltip")
      if(d3.selectAll(".bar.clicked").node() == null){
        var tooltipY = tooltip.attr("transform").match(/translate\([\d\.]*,([\d\.]*)/)[1]
        tooltip.transition()
          .attr("transform", "translate(2000," + tooltipY + ")")
      }
      else{
        var bar = d3.select(".bar.clicked")
        var d = bar.datum()
        var tooltipY = bar.attr("y")
        var context = bar.attr("value")
        var tooltipX = getTooltipX(x, d, width, context, tooltip)
        tooltip.transition()
          .attr("transform", "translate(" + tooltipX + "," + (parseFloat(tooltipY)+12.0) + ")")
      }
    })

    dispatch.on("changeContext.bar", function(type, year) {
      var context = getContext(type, year);
      values = data.values().filter(function(d){ return d.isPuma}).sort(function(a,b){ return a[context] - b[context]}).reverse()
      var unsorted = data.values().filter(function(d){ return d.isPuma})

      if(d3.selectAll('.bar.tooltip .name').node() && d3.selectAll('.bar.selected').node() != null){
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
        .classed("bucket_1", function(d){ return checkClass(d, context, 1) }) 
        .classed("bucket_2", function(d){ return checkClass(d, context, 2) })
        .classed("bucket_3", function(d){ return checkClass(d, context, 3) }) 
        .classed("bucket_4", function(d){ return checkClass(d, context, 4) }) 
        .classed("bucket_5", function(d){ return checkClass(d, context, 5) }) 

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
      if(d3.selectAll('.bar.tooltip .name').node() && d3.selectAll('.bar.selected').node() != null){
        d3.selectAll('.bar.tooltip')
          .transition()
          .ease("back")
          .delay(300)
          .duration(400)
          .attr("transform", function(d) { if(typeof(d) != "undefined") {
            return "translate(" + getTooltipX(x, d, width, context, tooltip) + "," + (y(d.name)+12) +")"
          } else { return null}
          })
      }

      svg.selectAll("rect.bar")
      .sort(function(a,b){return a[context] - b[context]})
        .transition()
        .delay(function (d, i) {
          return i * 5;
        })
        .duration(500)
        .attr("y",function(d) {return y(d.name); })
    });

    dispatch.on("bucketHighlight.bar", function(bucket){
      d3.selectAll(".bar").classed("deemphasized", true)
      d3.selectAll("path.puma").classed("deemphasized", true)
      var bars = d3.selectAll(".bar." + bucket)
      var fipsClasses = []
      bars.each(function(){
        var fipsClass = d3.select(this).attr("class").match(/\sfips_\d*\s/g)[0].trim()
        d3.select("path.puma."+fipsClass).classed("deemphasized", false)
      })

      bars.classed("deemphasized", false)
    });
  });

  dispatch.on("selectEntity.puma", function(d) {
    d3.selectAll(".puma").classed("selected",false)
    d3.select(".puma.fips_" + d.id).classed("selected",true)
  });

  dispatch.on("clickEntity.puma", function(d){
      scrollDown();
      var clicked = d3.select(".puma.fips_" + d.id)
      var isClicked = clicked.classed("clicked")
      if(!isClicked){ d3.selectAll(".puma").classed("clicked",false) }
      clicked.classed("selected", !isClicked)
      clicked.classed("clicked", !isClicked)
  });

  dispatch.on("load.map", function(data) {
    var values = data.values().sort(function(a,b){ return a.unbanked2013 - b.unbanked2013}).filter(function(d){ return d.isPuma}).reverse()
    values.forEach(function(d){
    d3.select(".puma.fips_" + d.id)
      .datum(d)
      .style("fill", getColor(d, "unbanked2013"))
      .on("mouseover",function(d){ dispatch.selectEntity(data.get(d.id)) })
      .on("mouseout", function(d) { dispatch.deselectEntities("mouseout"); })
      .on("click", function(d){ dispatch.clickEntity(data.get(d.id)); dispatch.selectEntity(data.get(d.id))})
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

  dispatch.on("load.key", function(data){
    var mapWidth = (desktop) ? containerWidth : containerWidth+1
    var mapHeight = containerWidth

    d3.select(".map.legend").remove();

    var svg = d3.select(".map.row")
      .insert("div", "svg.map")
      .attr("class", "map legend")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .append("svg")
      .attr("width", mapWidth)
      .attr("height", mapHeight)


    svg.append("rect")
      .attr("width", 235)
      .attr("height", 144)
      .attr("x", 7)
      .attr("y", 7)
      .style("fill", "#fff")


    svg.append("text")
      .attr("class", "legend title")
      .attr("x", 16)
      .attr("y", 29)
      .text("Percent Unbanked, 2013")

    svg.append("text")
        .attr("class", "legend label")
        .attr("x", 12)
        .attr("y", 75)
        .text("0%")

    for(var i = 0; i < 5; i++){
      svg.append("rect")
        .attr("class", "legend key bucket_" + (i+1))
        .attr("x", 16 + (i*43))
        .attr("y", 39)
        .attr("width", 43)
        .attr("height", 21)
        .on("mouseover", function(){ dispatch.bucketHighlight( d3.select(this).attr("class").replace("legend","").replace("key","").trim() ) })
        .on("mouseout", function(){ d3.selectAll(".deemphasized").classed("deemphasized", false)})

      svg.append("text")
        .attr("class", "legend label")
        .attr("x", -3 + ((i+1)*43))
        .attr("y", 75)
        .text((i+1)*10 + "%")
    }
    var pumaName = svg.append("text")
      .attr("class", "legend title")
      .attr("x", 16)
      .attr("y", 105)
      .attr("dy",0)
      .text("New York City Average")
      .call(wrap, 130)

    var formatter = d3.format("%")
    svg.append("text")
      .attr("class","legend nyc value")
      .attr("x", 150)
      .attr("y", 105)
      .text(formatter(data.get(1).unbanked2013))
    svg.append("text")
      .attr("class", "legend more")
      .attr("x", 155)
      .attr("y", 125)
      .text("Click for more")
      .on("click", scrollDown)

//Permanent borough labels on map
    var defs = svg.append("defs");
    var filter = defs.append("filter")
        .attr("id", "shadow")
        .attr("x", "-20%")
        .attr("y", "-19%")
        .attr("height", "180%")
        .attr("width", "180%")

    filter.append("feGaussianBlur")
        .attr("stdDeviation", "2 2")
        .attr("result", "shadow");
     
    filter.append("feOffset")
        .attr("dx", 2)
        .attr("dy", 2)
 
    svg.append("text")
      .attr("class", "map borough name shadow")
      .attr("x", mapWidth*0.26)
      .attr("y", mapHeight*0.24)
      .style("filter", "url(#shadow)")
      .text("MANHATTAN")
    svg.append("text")
      .attr("class", "map borough name")
      .attr("x", mapWidth*0.26)
      .attr("y", mapHeight*0.24)
      .text("MANHATTAN")

    svg.append("text")
      .attr("class", "map borough name shadow")
      .attr("x", mapWidth*0.37)
      .attr("y", mapHeight*0.095)
      .style("filter", "url(#shadow)")
      .text("THE BRONX")      
    svg.append("text")
      .attr("class", "map borough name")
      .attr("x", mapWidth*0.37)
      .attr("y", mapHeight*0.095)
      .text("THE BRONX")


    svg.append("text")
      .attr("class", "map borough name shadow")
      .attr("x", mapWidth*0.458)
      .attr("y", mapHeight*0.27)
      .style("filter", "url(#shadow)")
      .text("QUEENS")      
    svg.append("text")
      .attr("class", "map borough name")
      .attr("x", mapWidth*0.458)
      .attr("y", mapHeight*0.27)
      .text("QUEENS")

    svg.append("text")
      .attr("class", "map borough name shadow")
      .attr("x", mapWidth*0.11)
      .attr("y", mapHeight*0.45)
      .style("filter", "url(#shadow)")
      .text("STATEN")      
    svg.append("text")
      .attr("class", "map borough name")
      .attr("x", mapWidth*0.11)
      .attr("y", mapHeight*0.45)
      .text("STATEN")
    svg.append("text")
      .attr("class", "map borough name shadow")
      .attr("x", 3+mapWidth*0.11)
      .attr("y", 20+mapHeight*0.45)
      .style("filter", "url(#shadow)")
      .text("ISLAND")
    svg.append("text")
      .attr("class", "map borough name")
      .attr("x", 3+mapWidth*0.11)
      .attr("y", 20+mapHeight*0.45)
      .text("ISLAND")

    svg.append("text")
      .attr("class", "map borough name shadow")
      .attr("x", mapWidth*0.30)
      .attr("y", mapHeight*0.38)
      .style("filter", "url(#shadow)")
      .text("BROOKLYN")
    svg.append("text")
      .attr("class", "map borough name")
      .attr("x", mapWidth*0.30)
      .attr("y", mapHeight*0.38)
      .text("BROOKLYN")

    svg.append("text")
      .attr("class", "map state name")
      .attr("x", mapWidth*0.58)
      .attr("y", mapHeight*0.29)
      .text("NEW YORK")
    svg.append("text")
      .attr("class", "map state name")
      .attr("x", mapWidth*0.015)
      .attr("y", mapHeight*0.3)
      .text("NEW JERSEY")

    dispatch.on("selectEntity.key", function(puma){
      d3.selectAll(".key.selected").classed("selected", false)
      pumaName
        .text(puma.name)
        .call(wrap, 135)
      var type = d3.select("button.type.selected").node()
      var year = d3.select("button.year.selected").node()
      var context = getContext(type,year);
      d3.select(".legend.value")
        .classed("nyc", false)
        .classed("puma", true)
        .text(formatter(puma[context]))
      var key = d3.select(".legend.key.bucket_" + getBuckets(BREAKS, puma[context])[1])
      key.classed("selected", true)
      key.node().parentNode.appendChild(key.node())
    });

    dispatch.on("changeContext.key", function(type, year){
      var context = getContext(type, year)
      var legendTitle = d3.select(".map.legend .legend.title")
      legendTitle.text("Percent " + context.split("2")[0].replace(/^u/,"U") + ", 2" + context.split("2")[1])
    })

    dispatch.on("deselectEntities.key", function(eventType){
      if(d3.selectAll(".bar.clicked").node() == null){
        pumaName
          .text("New York City Average")
          .call(wrap, 130)
        var type = d3.select("button.type.selected").node()
        var year = d3.select("button.year.selected").node()
        var context = getContext(type,year);
        d3.select(".legend.value")
          .classed("nyc", true)
          .classed("puma", false)
          .text(formatter(data.get(1)[context]))
        d3.select(".legend.key.selected")
          .classed("selected", false)
      }
    })

  })

  dispatch.on("load.scatter", function(data){
    var topRowWidth = (containerWidth - layout.desktop.topRow.left - layout.desktop.topRow.right - layout.desktop.topRow.internal.large - layout.desktop.topRow.internal.small) * 0.377;
    var bottomRowWidth = (containerWidth - layout.desktop.bottomRow.left - layout.desktop.bottomRow.right - layout.desktop.bottomRow.internal.large - layout.desktop.bottomRow.internal.small*3.0) * 0.25;
    
    var drawScatter = function(variable){
      var containerID = variable + "Plot"
      var width = (variable === "unbanked" || variable == "underbanked") ? topRowWidth : bottomRowWidth;
      var height = width;

      var row = (variable === "unbanked" || variable == "underbanked") ? "topRow" : "bottomRow"
      var formatter = (variable === "income") ? d3.format("$s") : d3.format("%");
      var scatterMax;
      if(variable === "income"){ scatterMax = SCATTER_MAX_DOLLARS}
      else if(variable === "prepaid" || variable === "unemployment"){scatterMax = SCATTER_MAX_PREPAID}
      else{ scatterMax = SCATTER_MAX_PERCENT}

      var titles = {"unbanked": "Percent Unbanked", "underbanked": "Percent Underbanked", "poverty": "Poverty Rate", "income": "Median Income", "unemployment": "Unemployment Rate", "prepaid": "Percent Prepaid"};

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
    
      svg.append("line")
        .attr("class", "parallelCoordsLine")
        .attr("x1",x(2011))
        .attr("x2",x(2011))
        .attr("y1",y(0))
        .attr("y2",y(scatterMax))
      svg.append("line")
        .attr("class", "parallelCoordsLine")
        .attr("x1",x(2013))
        .attr("x2",x(2013))
        .attr("y1",y(0))
        .attr("y2",y(scatterMax))
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

      for(var i = 2; i<7; i++){
        var boroughData = data.get(i)
        var className = boroughData.name.replace(" ","_")
        svg.append("line")
          .attr("class", "scatter connector temp " + className)
          .attr("x1", x(2011))
          .attr("x2", x(2013))
          .attr("y1", y(boroughData[variable + "2011"]))
          .attr("y2", y(boroughData[variable + "2013"]))
        svg.append("circle")
          .attr("class","scatter dot y2011 temp " + className)
          .attr("cx", x(2011))
          .attr("cy", y(boroughData[variable + "2011"]))
          .attr("r", DOT_RADIUS)
        svg.append("circle")
          .attr("class","scatter nyc dot y2013 temp " + className)
          .attr("cx", x(2013))
          .attr("cy", y(boroughData[variable + "2013"]))
          .attr("r", DOT_RADIUS)
        }

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
        .data(nycData[variable + "2011"])
      svg.append("circle")
        .attr("class","scatter nyc dot y2013")
        .attr("cx", x(2013))
        .attr("cy", y(nycData[variable + "2013"]))
        .attr("r", DOT_RADIUS)
        .data(nycData[variable + "2013"])


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
      .style("margin", layout.desktop.topRow.top + "px " + 0 + "px " + layout.desktop.topRow.bottom + "px " + 0 + "px")
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
      .attr("id", "prepaidPlot")
      .style("margin", 0 + "px " + layout.desktop.bottomRow.right + "px " + layout.desktop.bottomRow.bottom + "px " + 0 + "px")
      .style("width", bottomRowWidth + "px")
      .style("height", bottomRowWidth + "px")
      .style("float","left")


    drawScatter("unbanked")
    drawScatter("underbanked")
    drawScatter("poverty")
    drawScatter("income")
    drawScatter("unemployment")
    drawScatter("prepaid")
    pymChild.sendHeight()

    d3.selectAll(".dot")
      .on("click", function(d){ console.log(this, d)})

    dispatch.on("deselectEntities.scatter", function(eventType){
      var returnDefaults = function(variable){
        var width = (variable === "unbanked" || variable == "underbanked") ? topRowWidth : bottomRowWidth;
        var height = width;
        var row = (variable === "unbanked" || variable == "underbanked") ? "topRow" : "bottomRow"
        var scatterMax = (variable === "income") ? SCATTER_MAX_DOLLARS : SCATTER_MAX_PERCENT;
        var y = d3.scale.linear()
              .domain([0, scatterMax])
              .range([ height - layout.desktop[row].plot.bottom, layout.desktop[row].plot.top]);
        var svg = d3.select("svg." +  variable)

        for(var i = 2; i<7; i++){
          var boroughData = data.get(i)
          var className = boroughData.name.replace(" ","_")
          svg.select(".scatter.connector.temp." + className)
            .transition()
            .attr("y1", y(boroughData[variable + "2011"]))
            .attr("y2", y(boroughData[variable + "2013"]))
          svg.select(".scatter.dot.y2011.temp." + className)
            .transition()
            .attr("cy", y(boroughData[variable + "2011"]))
          svg.select(".scatter.nyc.dot.y2013.temp." + className)
            .transition()
            .attr("cy", y(boroughData[variable + "2013"]))
        }

        svg.selectAll(".scatter.puma.dot")
          .transition()
          .attr("cy", 600);
        svg.selectAll(".scatter.puma.connector")
          .transition()
          .attr("y1", 600)
          .attr("y2", 600);

        svg.selectAll(".scatter.borough.dot")
          .transition()
          .attr("cy", 600);
        svg.selectAll(".scatter.borough.connector")
          .transition()
          .attr("y1", 600)
          .attr("y2", 600);


      }
      if(d3.select(".clicked").node() ==  null){
        returnDefaults("unbanked")
        returnDefaults("underbanked")
        returnDefaults("poverty")
        returnDefaults("income")
        returnDefaults("unemployment")
        returnDefaults("prepaid")
        pymChild.sendHeight()
      }
    })

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

        svg.selectAll("circle.temp")
          .transition()
          .duration(800)
          .attr("cy", 600)
        svg.selectAll("line.temp")
          .transition()
          .duration(800)
          .attr("y1", 600)
          .attr("y2", 600)

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
      updateScatter("prepaid")
    })
    
  });

}


pymChild = new pym.Child({ renderCallback: drawGraphic });