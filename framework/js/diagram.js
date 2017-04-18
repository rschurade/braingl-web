define( ["d3"], function(d3) {

(function() {
	window.Diagram = function( addConnection, addConnections, removeConnection ) {
		var map = {};
		var addConCallback = addConnection;
		var addConsCallback = addConnections;
		var removeConCallback = removeConnection;
		
		var classes = [];
		var connectionMatrix = [];
		var valueMin = 10000000;
		var valueMax = -10000000;
		
		this.setInputCSV = function( positionCSV, connectionsCSV, callback )
		{
			var xhr = new XMLHttpRequest();
			xhr.open('GET', positionCSV, true);
			xhr.responseType = 'text';
			
			xhr.onload = function(e) {
				var text = this.response;
				csv2json( text );
				
				var xhr2 = new XMLHttpRequest();
				xhr2.open('GET', connectionsCSV, true);
				xhr2.responseType = 'text';
				
				xhr2.onload = function(e) {
					var text2 = this.response;
					csv2matrix( text2 );
					callback();
				};
				xhr2.send();
				
			};
			xhr.send();
			
		}
		
		function csv2matrix( text )
		{
			var lines = text.split("\n");
			for( var i = 0; i < lines.length; ++i ) 
			{
				var row = {};
				row.index = i;
				row.values = [];
				var values = lines[i].split(",");
				for( var k = 0; k < values.length; ++k ) {
					var value = parseFloat( values[k] )
					if ( value < valueMin ) valueMin = value;
					if ( value > valueMax ) valueMax = value;
					row.values.push( value );
				}
				connectionMatrix.push( row );
			}
			console.log( "value min: " + valueMin + " valueMax: " + valueMax );
		}
		
		function csv2json( text )
		{
			var lines = text.split("\n");
			var names = [];
			
			for( var i = 0; i < lines.length; ++i )
			{
				var tokens = lines[i].split(",");
				if( tokens.length == 5 )
				{
					names.push( tokens[3] );
				}
			}
			for( var i = 0; i < lines.length; ++i )
			{
				var tokens = lines[i].split(",");
				if( tokens.length == 5 )
				{
					var entry = {};
					entry.name = tokens[3];
					entry.position = [tokens[0], tokens[1], tokens[2]];
					entry.group = tokens[4];
					entry.imports = [];
					for ( var k = 0; k < names.length; ++k )
					{
						if ( entry.name != names[k] )
						{
							entry.imports.push( names[k] );
						}
					}
					classes.push( entry );
				}
			}
		}
		
		
		this.create = function( dataUrl, diagramDiv, diagramDiameter ) {
			diagramDiv.style( 'margin-left', '0');
			var diameter = diagramDiameter,
		    radius = diameter / 2,
		    innerRadius = radius - 120;
		
			var cluster = d3.layout.cluster()
			    .size([360, innerRadius])
			    .sort(null)
			    .value(function(d) { return d.size; });
			
			var bundle = d3.layout.bundle();
			
			var line = d3.svg.line.radial()
			    .interpolate("bundle")
			    .tension(.85)
			    .radius(function(d) { return d.y; })
			    .angle(function(d) { return d.x / 180 * Math.PI; });
			
			var svg = diagramDiv.append("svg")
			    .attr("width", diameter)
			    .attr("height", diameter)
			  .append("g")
			    .attr("transform", "translate(" + radius + "," + radius + ")");
			
			var link = svg.append("g").selectAll(".link"),
			    node = svg.append("g").selectAll(".node");
			// classes will contain content of the json
			d3.json( dataUrl, function(error, classes) {
			  if (error) throw error;
			
			  var nodes = cluster.nodes(packageHierarchy(classes) ),
			      links = packageImports(nodes);
			  link = link
			      .data(bundle(links))
			    .enter().append("path")
			      .each(function(d) { d.source = d[0], d.target = d[d.length - 1]; })
			      .attr("class", "link")
			      .attr("d", line);
			
			  node = node
			      .data(nodes.filter(function(n) { return !n.children; }))
			    .enter().append("text")
			      .attr("class", "node")
			      .attr("dy", ".31em")
			      .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
			      .style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
			      .text(function(d) { return d.key; })
			      .on("mouseover", mouseovered)
			      .on("mouseout", mouseouted)
			      .on("mousedown", mouseclick)
			});
			
			var block = false;

			function mouseclick(d) {
				if ( d3.event.which == 1 ) {
					var clicked = d.clicked || false;
					d.clicked = !clicked;
					if( !d.clicked ) {
						block = false;
						mouseouted(d);
					}
					else {
						mouseovered(d)
						if( d.clicked ) block = true;
					}	
				}
			}

			function mouseovered(d) {
				if(	block ) return;
			  	targets = [];
			  	d.imports.forEach( function( o, i ) { targets.push ( map[o] ); });
			  	addConsCallback( d.name, d.position, targets );
			  	node.each(function(n) { n.target = n.source = false; });
			
			  	link
			      	.classed("link--target", function(l) { if (l.target === d) return l.source.source = true; })
			      	.classed("link--source", function(l) { if (l.source === d) return l.target.target = true; })
			    	.filter(function(l) { return l.target === d || l.source === d; })
			      	.each(function() { this.parentNode.appendChild(this); });
			
			  	node
				    .classed("node--target", function(n) { return n.target; })
				    .classed("node--source", function(n) { return n.source; });
			}
			
			function mouseouted(d) {
				if( block ) return;
				removeConCallback( d.name );
			  	link
			      	.classed("link--target", false)
			      	.classed("link--source", false);
			
			  	node
			      	.classed("node--target", false)
			      .classed("node--source", false);
			}
			
			d3.select(self.frameElement).style("height", diameter + "px");
			
			// Lazily construct the package hierarchy from class names.
			function packageHierarchy(classes) {
			    function find(name, data) {
			    var node = map[name], i;
			    if (!node) {
			      node = map[name] = data || {name: name, children: []};
			      if (name.length) {
			      	if ( node.group )
			        	node.parent = find( "group"+node.group );
			        else
			        	node.parent = find("");	
			        node.parent.children.push(node);
			        node.key = name;
			      }
			    }
			    return node;
			  }
				// loop over data.json; d will contain one line of it
			  classes.forEach(function(d) {
			    find(d.name, d);
			  });
			
			  return map[""];
			}
			
			// Return a list of imports for the given array of nodes.
			function packageImports(nodes) {
			 // var map = {},
			  var imports = [];
			
			  // Compute a map from name to node.
			  nodes.forEach(function(d) {
			    map[d.name] = d;
			  });
			
			  // For each import, construct a link from the source to target
				// node.
			  nodes.forEach(function(d) {
			    if (d.imports) d.imports.forEach(function(i) {
			      imports.push({source: map[d.name], target: map[i]});
			    });
			  });
			  return imports;
			}
		
		};

		
		
		this.createCircleCSV = function( diagramDiv, diagramDiameter ) {
			diagramDiv.style( 'margin-left', '0');
			var diameter = diagramDiameter,
		    radius = diameter / 2,
		    innerRadius = radius - 120;
		
			var cluster = d3.layout.cluster()
			    .size([360, innerRadius])
			    .sort(null)
			    .value(function(d) { return d.size; });
			
			var bundle = d3.layout.bundle();
			
			var line = d3.svg.line.radial()
			    .interpolate("bundle")
			    .tension(.85)
			    .radius(function(d) { return d.y; })
			    .angle(function(d) { return d.x / 180 * Math.PI; });
			
			var svg = diagramDiv.append("svg")
			    .attr("width", diameter)
			    .attr("height", diameter)
			  .append("g")
			    .attr("transform", "translate(" + radius + "," + radius + ")");
			
			var link = svg.append("g").selectAll(".link"),
			    node = svg.append("g").selectAll(".node");
			// classes will contain content of the json
			
			
			
			
			
			
			  var nodes = cluster.nodes(packageHierarchy(classes) ),
			      links = packageImports(nodes);
			  link = link
			      .data(bundle(links))
			    .enter().append("path")
			      .each(function(d) { d.source = d[0], d.target = d[d.length - 1]; })
			      .attr("class", "link")
			      .attr("d", line);
			
			  node = node
			      .data(nodes.filter(function(n) { return !n.children; }))
			    .enter().append("text")
			      .attr("class", "node")
			      .attr("dy", ".31em")
			      .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
			      .style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
			      .text(function(d) { return d.key; })
			      .on("mouseover", mouseovered)
			      .on("mouseout", mouseouted)
			      .on("mousedown", mouseclick)
			
			
			var block = false;

			function mouseclick(d) {
				if ( d3.event.which == 1 ) {
					var clicked = d.clicked || false;
					d.clicked = !clicked;
					if( !d.clicked ) {
						block = false;
						mouseouted(d);
					}
					else {
						mouseovered(d)
						if( d.clicked ) block = true;
					}	
				}
			}

			function mouseovered(d) {
				if(	block ) return;
			  	targets = [];
			  	d.imports.forEach( function( o, i ) { targets.push ( map[o] ); });
			  	addConsCallback( d.name, d.position, targets );
			  	node.each(function(n) { n.target = n.source = false; });
			
			  	link
			      	.classed("link--target", function(l) { if (l.target === d) return l.source.source = true; })
			      	.classed("link--source", function(l) { if (l.source === d) return l.target.target = true; })
			    	.filter(function(l) { return l.target === d || l.source === d; })
			      	.each(function() { this.parentNode.appendChild(this); });
			
			  	node
				    .classed("node--target", function(n) { return n.target; })
				    .classed("node--source", function(n) { return n.source; });
			}
			
			function mouseouted(d) {
				if( block ) return;
				removeConCallback( d.name );
			  	link
			      	.classed("link--target", false)
			      	.classed("link--source", false);
			
			  	node
			      	.classed("node--target", false)
			      .classed("node--source", false);
			}
			
			d3.select(self.frameElement).style("height", diameter + "px");
			
			// Lazily construct the package hierarchy from class names.
			function packageHierarchy(classes) {
			    function find(name, data) {
			    var node = map[name], i;
			    if (!node) {
			      node = map[name] = data || {name: name, children: []};
			      if (name.length) {
			      	if ( node.group )
			        	node.parent = find( "group"+node.group );
			        else
			        	node.parent = find("");	
			        node.parent.children.push(node);
			        node.key = name;
			      }
			    }
			    return node;
			  }
				// loop over data.json; d will contain one line of it
			  classes.forEach(function(d) {
			    find(d.name, d);
			  });
			
			  return map[""];
			}
			
			// Return a list of imports for the given array of nodes.
			function packageImports(nodes) {
			 // var map = {},
			  var imports = [];
			
			  // Compute a map from name to node.
			  nodes.forEach(function(d) {
			    map[d.name] = d;
			  });
			
			  // For each import, construct a link from the source to target
				// node.
			  nodes.forEach(function(d) {
			    if (d.imports) d.imports.forEach(function(i) {
			      imports.push({source: map[d.name], target: map[i]});
			    });
			  });
			  return imports;
			}
		
		};
		
		
		

		this.createMatrix = function( dataUrl, diagramDiv, diagramSize ) {


			var margin = {top: 80, right: 0, bottom: 10, left: 80},
			    width = diagramSize,
			    height = diagramSize;

			var x = d3.scale.ordinal().rangeBands([0, width]),
			    z = d3.scale.linear().domain([0, 4]).clamp(true),
			    c = d3.scale.category10().domain(d3.range(10));

			var svg = diagramDiv.append("svg")
			    .attr("width", width + margin.left + margin.right)
			    .attr("height", height + margin.top + margin.bottom)
			    .style("margin-left", -margin.left + "px")
			  .append("g")
			    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			d3.json( dataUrl, function(nodes) {
			  	var matrix = [],
			    n = nodes.length;

				// Compute index per node.
				nodes.forEach(function(node, i) {
				    node.index = i;
				    node.count = 0;
				    
				    matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0}; });
				});

				nodes.forEach( function( node, i ) {
				  	node.imports.forEach( function(target, j) {
				  		matrix[node.index][findId(target)].z += 1;
					    matrix[findId(target)][node.index].z += 1;
					    matrix[node.index][node.index].z += 1;
					    matrix[findId(target)][findId(target)].z += 1;
					    nodes[node.index].count += 1;
					    nodes[findId(target)].count += 1;
				  	});
				});

				function findId( name ) {
					var id;
					nodes.forEach( function( node, i ) {
				  		if ( node.name == name ) {
				  			id = node.index;
				  			return
				  		}
				  	});
				  	return id;

				}


			  // Precompute the orders.
			  var orders = {
			    name: d3.range(n).sort(function(a, b) { return d3.ascending(nodes[a].name, nodes[b].name); }),
			    count: d3.range(n).sort(function(a, b) { return nodes[b].count - nodes[a].count; }),
			    group: d3.range(n).sort(function(a, b) { return nodes[b].group - nodes[a].group; })
			  };

			  // The default sort order.
			  x.domain(orders.name);

			  svg.append("rect")
			      .attr("class", "background")
			      .attr("width", width)
			      .attr("height", height);

			  var row = svg.selectAll(".row")
			      .data(matrix)
			    .enter().append("g")
			      .attr("class", "row")
			      .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
			      .each(row);

			  row.append("line")
			      .attr("x2", width);

			  row.append("text")
			      .attr("x", -6)
			      .attr("y", x.rangeBand() / 2)
			      .attr("dy", ".32em")
			      .attr("text-anchor", "end")
			      .attr('class', 'diagramLabelRow')
			      .text(function(d, i) { return nodes[i].name; });

			  var column = svg.selectAll(".column")
			      .data(matrix)
			    .enter().append("g")
			      .attr("class", "column")
			      .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

			  column.append("line")
			      .attr("x1", -width);

			  column.append("text")
			      .attr("x", 6)
			      .attr("y", x.rangeBand() / 2)
			      .attr("dy", ".32em")
			      .attr("text-anchor", "start")
			      .attr('class', 'diagramLabelColumn' )
			      .text(function(d, i) { return nodes[i].name; });

			  function row(row) {
			    var cell = d3.select(this).selectAll(".cell")
			        .data(row.filter(function(d) { return d.z; }))
			      .enter().append("rect")
			        .attr("class", "cell")
			        .attr("x", function(d) { return x(d.x); })
			        .attr("width", x.rangeBand())
			        .attr("height", x.rangeBand())
			        .style("fill-opacity", function(d) { return z(d.z); })
			        .style("fill", function(d) { return nodes[d.x].group == nodes[d.y].group ? c(nodes[d.x].group) : null; })
			        .on("mouseover", mouseover)
			        .on("mouseout", mouseout);
			  }

			  function mouseover(p) {
			  	addConCallback( nodes[p.x].name, nodes[p.x].position, nodes[p.y].position );
			  	d3.selectAll(".row text").classed("active", function(d, i) { return i == p.y; });
			    d3.selectAll(".column text").classed("active", function(d, i) { return i == p.x; });
			  }

			  function mouseout(p) {
			  	removeConCallback( nodes[p.x].name );
			    d3.selectAll("text").classed("active", false);
			  }

			  d3.select("#order").on("change", function() {
			    clearTimeout(timeout);
			    order(this.value);
			  });

			  function order(value) {
			    x.domain(orders[value]);

			    var t = svg.transition().duration(2500);

			    t.selectAll(".row")
			        .delay(function(d, i) { return x(i) * 4; })
			        .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
			      .selectAll(".cell")
			        .delay(function(d) { return x(d.x) * 4; })
			        .attr("x", function(d) { return x(d.x); });

			    t.selectAll(".column")
			        .delay(function(d, i) { return x(i) * 4; })
			        .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
			  }

			  var timeout = setTimeout(function() {
			    order("name");
			    // d3.select("#order").property("selectedIndex",
				// 0).node().focus();
			  }, 5000);
			});


		};
		
		
		
		
		this.createMatrixCSV = function( diagramDiv, diagramSize ) {


			var margin = {top: 80, right: 0, bottom: 10, left: 80},
			    width = diagramSize,
			    height = diagramSize;

			var x = d3.scale.ordinal().rangeBands([0, width]),
			    z = d3.scale.linear().domain([0, 4]).clamp(true),
			    c = d3.scale.category10().domain(d3.range(10));

			var svg = diagramDiv.append("svg")
			    .attr("width", width + margin.left + margin.right)
			    .attr("height", height + margin.top + margin.bottom)
			    .style("margin-left", -margin.left + "px")
			  .append("g")
			    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		  	var matrix = [],
			    n = classes.length;

				// Compute index per node.
				classes.forEach(function(node, i) {
				    node.index = i;
				    node.count = 0;
				    
				    matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0}; });
				});

				classes.forEach( function( node, i ) {
				  	node.imports.forEach( function(target, j) {
				  		matrix[node.index][findId(target)].z += 1;
					    matrix[findId(target)][node.index].z += 1;
					    matrix[node.index][node.index].z += 1;
					    matrix[findId(target)][findId(target)].z += 1;
					    classes[node.index].count += 1;
					    classes[findId(target)].count += 1;
				  	});
				});

				function findId( name ) {
					var id;
					classes.forEach( function( node, i ) {
				  		if ( node.name == name ) {
				  			id = node.index;
				  			return
				  		}
				  	});
				  	return id;

				}


			  // Precompute the orders.
			  var orders = {
			    name: d3.range(n).sort(function(a, b) { return d3.ascending(classes[a].name, classes[b].name); }),
			    count: d3.range(n).sort(function(a, b) { return classes[b].count - classes[a].count; }),
			    group: d3.range(n).sort(function(a, b) { return classes[b].group - classes[a].group; })
			  };

			  // The default sort order.
			  x.domain(orders.name);

			  svg.append("rect")
			      .attr("class", "background")
			      .attr("width", width)
			      .attr("height", height);

			  var row = svg.selectAll(".row")
			      .data(matrix)
			    .enter().append("g")
			      .attr("class", "row")
			      .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
			      .each(row);

			  row.append("line")
			      .attr("x2", width);

			  row.append("text")
			      .attr("x", -6)
			      .attr("y", x.rangeBand() / 2)
			      .attr("dy", ".32em")
			      .attr("text-anchor", "end")
			      .attr('class', 'diagramLabelRow')
			      .text(function(d, i) { return classes[i].name; });

			  var column = svg.selectAll(".column")
			      .data(matrix)
			    .enter().append("g")
			      .attr("class", "column")
			      .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

			  column.append("line")
			      .attr("x1", -width);

			  column.append("text")
			      .attr("x", 6)
			      .attr("y", x.rangeBand() / 2)
			      .attr("dy", ".32em")
			      .attr("text-anchor", "start")
			      .attr('class', 'diagramLabelColumn' )
			      .text(function(d, i) { return classes[i].name; });

			  function row(row) {
			    var cell = d3.select(this).selectAll(".cell")
			        .data(row.filter(function(d) { return d.z; }))
			        .enter().append("rect")
			        .attr("class", "cell")
			        .attr("x", function(d) { return x(d.x); })
			        .attr("width", x.rangeBand())
			        .attr("height", x.rangeBand())
			        .style("fill-opacity", function(d) { return z(d.z); })
			        //.style("fill", function(d) { return classes[d.x].group == classes[d.y].group ? c(classes[d.x].group) : null; })
			        .style("fill", function(d) { return connectionColor( d.y, d.x ) })
			        .on("mouseover", mouseover)
			        .on("mouseout", mouseout);
			  }

			  function connectionColor( row, column ) {
				  var value = connectionMatrix[row].values[column];
				  var cm = colorMap( value );
				  //console.log( cm );
				  return cm;
			  }
			  
			  function colorMap( value ) {
				  var blue;
				  var green;
				  var red;
				  if ( value < 0 ) {
					  var scaledValue = value / Math.abs( valueMin );
					  blue = 1.0;
					  green = 1.0 + scaledValue;
					  red = 1.0 + scaledValue;
				  }
				  else {
					  var scaledValue = value / valueMax;
					  red = 1.0;
					  green = 1.0 - scaledValue;
					  blue = 1.0 - scaledValue;
				  }
				  return rgbToHex( parseInt( red * 255 ), parseInt( green * 255 ) , parseInt( blue * 255 ) );
			  }
			  
			  function componentToHex(c) {
				    var hex = c.toString(16);
				    return hex.length == 1 ? "0" + hex : hex;
				}

				function rgbToHex(r, g, b) {
				    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
				}
			  
			  function mouseover(p) {
			  	addConCallback( classes[p.x].name, classes[p.x].position, classes[p.y].position );
			  	d3.selectAll(".row text").classed("active", function(d, i) { return i == p.y; });
			    d3.selectAll(".column text").classed("active", function(d, i) { return i == p.x; });
			  }

			  function mouseout(p) {
			  	removeConCallback( classes[p.x].name );
			    d3.selectAll("text").classed("active", false);
			  }

			  d3.select("#order").on("change", function() {
			    clearTimeout(timeout);
			    order(this.value);
			  });

			  function order(value) {
			    x.domain(orders[value]);

			    var t = svg.transition().duration(2500);

			    t.selectAll(".row")
			        .delay(function(d, i) { return x(i) * 4; })
			        .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
			      .selectAll(".cell")
			        .delay(function(d) { return x(d.x) * 4; })
			        .attr("x", function(d) { return x(d.x); });

			    t.selectAll(".column")
			        .delay(function(d, i) { return x(i) * 4; })
			        .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
			  }

			  var timeout = setTimeout(function() {
			    order("name");
			    // d3.select("#order").property("selectedIndex",
				// 0).node().focus();
			  }, 5000);

			
			
			
			
		};

		
		
		
	};
})();

});
