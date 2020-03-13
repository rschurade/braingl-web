define(["io", "diagram", "viewer", "nifti", "d3", "arcball"], function( io, diagram, viewer, nifti, d3, arcball ) {
// module structure: first a 'define' to make the module usable; and at the very end of ui.js: return
	
	//initilaizes slider, then loads config --> json function of d3 gets url of config file and a callback,
	//load config has signature and errore --> from d3 eror message (empty if success); and in config object: our config obj from d3
	
// var config will be the config object
var config = {};
var view;
var currentPage;



function startUp() {
	console.log( "ui.js startUp()" )
	
	// ui elements
	d3.select('#sliceX').on('input', function() { view.setSlice( this.id, this.value ); d3.select('#lsliceX').text(this.value); } );
	d3.select('#sliceY').on('input', function() { view.setSlice( this.id, this.value ); d3.select('#lsliceY').text(this.value); } );
	d3.select('#sliceZ').on('input', function() { view.setSlice( this.id, this.value ); d3.select('#lsliceZ').text(this.value); } );
	
	d3.select('#rotX').on('input', function() { updateRotation(); d3.select('#lrotX').text( (this.value / 100.0 - 3.1415).toFixed(2) ); } );
	d3.select('#rotY').on('input', function() { updateRotation(); d3.select('#lrotY').text( (this.value / 100.0 - 3.1415).toFixed(2) ); } );
	d3.select('#rotZ').on('input', function() { updateRotation(); d3.select('#lrotZ').text( (this.value / 100.0 - 3.1415).toFixed(2) ); } );
	
	// load config files
	d3.json( settings.CONFIG_URL + "config.json", loadConfig );  
};

function updateRotation() {
	var x = d3.select('#rotX').property('value' ) / 100.0 - 3.1415;
	var y = d3.select('#rotY').property('value' ) / 100.0 - 3.1415;
	var z = d3.select('#rotZ').property('value' ) / 100.0 - 3.1415;
	arcball.setRotation( [x, y, z] );
} 


function loadConfig( error, configObject ) {
	console.log( "ui.js loadConfig()" );

	if( error ) {
		console.log( error );
	}
	config = configObject;
	// if config has been loaded
	// then we load the content.json
	if ( config && config.hasContent ) {
		io.loadContent( settings.CONFIG_URL + "content.json", onContentLoaded );
	}
	
	if ( config && config.showDebugElements ) {
		d3.select( '#controls-rot' ).style('display', 'block' );
	}
	else {
		d3.select( '#controls-rot' ).style('display', 'none' );
	}
	
	if ( config && config.viewer ) {
		console.log( "create viewer" );
		view = new Viewer( d3.select('#viewer-div').property('clientWidth'), d3.select('#viewer-div').property('clientHeight') );
		//d3.select('#viewer-div').append(view.html);
		view.dispatch.on('dimsChanged', onDimsChanged );
		document.getElementById('viewer-div').appendChild( view.html() );
		
		view.init();
		
		console.log( view.size() );
		view.render();
	}
	
	if ( config && config.hasElements ) {
		io.loadElements( settings.CONFIG_URL + "elements.json", onTexLoaded, onOverlayLoaded, onFibreLoaded, onMeshLoaded );
	}
}

function onDimsChanged( dims ) {
	console.log( 'dims changed');
	d3.select('#sliceX').attr('max', dims.nx - 1 );
	d3.select('#sliceY').attr('max', dims.ny - 1 );
	d3.select('#sliceZ').attr('max', dims.nz - 1 );
	
	d3.select('#sliceX').attr('value', parseInt( dims.nx / 2 ) );
	d3.select('#sliceY').attr('value', parseInt( dims.ny / 2 ) );
	d3.select('#sliceZ').attr('value', parseInt( dims.nz / 2 ) );

	d3.select('#lsliceX').text( parseInt( dims.nx / 2 ) );
	d3.select('#lsliceY').text( parseInt( dims.ny / 2 ) );
	d3.select('#lsliceZ').text( parseInt( dims.nz / 2 ) );
}


//in content json is our content
function onContentLoaded() {
	console.log( "ui.js onContentLoaded()" );
	buildPage( config.firstPage );
};

function onTexLoaded() {
	console.log( "ui.js onTexLoaded()" );
	view.setAnatomy( io.niftis()["tex1"] );
	
};

function onOverlayLoaded( id ) {
	console.log( "ui.js onOverlayLoaded()" );
	view.setOverlay( io.niftis()[id] );
};


function onFibreLoaded( id ) {
	console.log( "ui.js onFibreLoaded()" + " " + id );
	view.addFibs( id, io.fibres()[id] );
	
};

function onMeshLoaded( id ) {
	console.log( "ui.js onMeshLoaded()" + " " + id );
	view.addMesh( id, io.meshes()[id] );
	
};


d3.select('#viewer-div').on("resize", function(d) {
    arcball.setViewportDims( d3.select('#viewer-div').property('clientWidth'), d3.select('#viewer-div').property('clientHeight') );
})


//if in config json viewer truwe: initialised here; then event gets attached: if dims change, call function onDIMS --> THEN VIEWER CALLS INIT FUNCTION AND THE FIRST TIME THE RENDER FUNCTION --> VIEWER FILE


// this function will get the object from the content.json: 
// in content.json line 3: "markdown-remove_including_-_to_make_it_work" : "page1.txt",  would take a text file as input; 
// and if you would like to use a markdown file, you insert in content.json line 4: "markdown" : "page1.md",
function buildPage( id ) {
	currentPage = id;
	// get object of the page to be built; if there is none, quit function
	var co = io.content()[id];
	if ( !co ) return;
	
	// set var content as d3 object of the html object
	var content = d3.select('#content');
	// to delete everything that is inside the content object
	content.html('');
	
	if ( co.markdown ) {
		//example-pub/config/page1.txt --> give url to d3; callback, which will be called when txt file has been loaded (see at the very end of the file) 
		d3.text( settings.CONFIG_URL + co.markdown, buildMarkdownPage );
		return;
	}
	
	// actually build the page
	// create the html elements and assign them the content from content.json
	var nav = content.append('nav')
		.attr('class','prev-next top');
	
	if( co.previous !="" ) {
		nav.append('a')
			.attr('class', 'prev')
			.attr('href', '#'+co.previous)
			.text(String.fromCharCode(171) + ' previous')
			.on('click',function(e) {
				d3.event.preventDefault();
	            buildPage( co.previous );
	            return false;
	        });
	}
	
	if( co.next !="" ) {
		nav.append('a')
			.attr('class', 'next')
			.attr('href', '#'+co.next)
			.text('next '+String.fromCharCode(187))
			.on('click',function(e) {
				d3.event.preventDefault();
	            buildPage( co.next );
	            return false;
	        });
	}
	// create div that will contain the actual page
	var page = content.append('div');
		page.attr('class', 'section')
			.attr('id', 'page-body')
			//o.title
			.append('header')
			.append('h1').text(co.title);
	
	// loop over the single paragraphs
	// gets invisible link which is used for 'scroll to paragraph' functionality
	// p will contain the paragraph obj form the content.json
	// paragraph 1 = para0
	co.paragraphs.forEach( function(p, i) {
		var div = page.append('div');
		div.append('a')
			.attr('id', 'para'+i)
			.attr('name', 'para'+i);
		
		// assemble the text from the array from the json file 
		if ( p.text )
		{
			var ts ="";
			p.text.forEach( function(l) {ts+=l;});
			div.attr('class', 'document')
				.append('p')
				// p gets text as content
				.html(ts);
		}
		// not every paragraph needs an image
		if( p.image_url ) {
			var fig = div.append('figure');
			fig.append('img')
				.attr( 'src', p.image_url)
				.attr( 'class', 'contentImage');
		}
		// produce diagram if there is one
		if ( p.diagram_data || p.diagram_dataPos ) {
			var diagram = page.append('div'); 
			diagram.attr( 'class', 'diagramContainer' );
			var d = new Diagram( view.addConnection, view.addConnections, view.removeConnections );
			if ( p.diagram_type == "circle") {
				d.create( settings.DATA_URL + p.diagram_data, diagram, page.property( 'clientWidth' ) );	
			}
			else if ( p.diagram_type == "circleCSV") {
				d.setInputCSV( settings.DATA_URL + p.diagram_dataPos, settings.DATA_URL + p.diagram_dataCon, function(){
					d.createCircleCSV( diagram, page.property( 'clientWidth' ) );
				});
			}
			else if( p.diagram_type == "matrix" ) {
				d.createMatrix( settings.DATA_URL + p.diagram_data, diagram, page.property( 'clientWidth' ) * 0.9);

				var data = ["name", "count", "group"];

				var select = page
				  .append('select')
				  	.attr('class','select')
				  	.attr('id', 'order');

				var options = select
				  .selectAll('option')
					.data(data).enter()
					.append('option')
						.text(function (d) { return d; });
			}
			else if( p.diagram_type == "matrixCSV" ) {
				
				d.setInputCSV( settings.DATA_URL + p.diagram_dataPos, settings.DATA_URL + p.diagram_dataCon, function() { 
					d.createMatrixCSV( diagram, page.property( 'clientWidth' ) * 0.9 );
				});
				

				var data = ["name", "count", "group"];

				var select = page
				  .append('select')
				  	.attr('class','select')
				  	.attr('id', 'order');

				var options = select
				  .selectAll('option')
					.data(data).enter()
					.append('option')
						.text(function (d) { return d; });
			}
			page.append('br');
		}
		// insert 3 line breaks before the next paragraph
		div.append('br');
		div.append('br');
		div.append('br');
	});
	
	/**
	 * @function
	 */
  	function ScrollTo(name) {
  		ScrollToResolver(document.getElementById(name));
  	}

  	function ScrollToResolver(elem) {
  		var jump = parseInt(elem.getBoundingClientRect().top * .2);
  		document.body.scrollTop += jump;
  		document.documentElement.scrollTop += jump;
  		if (!elem.lastjump || elem.lastjump > Math.abs(jump)) {
  			elem.lastjump = Math.abs(jump);
  			setTimeout(function() { ScrollToResolver(elem);}, "100");
  		} else {
  			elem.lastjump = null;
  		}
  	}
	
	/**
	 * @function
	 * gives an on.click function to all links 
	 * all a2page links call buildPage function with href attribute
	 * and if there is attr para also scroll to this paragraph
	 */
  	d3.selectAll('.a2page').on('click', function() {
  		d3.event.preventDefault();
  		buildPage(d3.select(this).attr('href') );
  		if(d3.select(this).attr('para')) {
  			ScrollTo(d3.select(this).attr('para'));
  		}
  	});
};

function buildMarkdownPage( error, text ) {
	/*
	var converter = new showdown.Converter(),
    html      = converter.makeHtml(text);
	d3.select( "#content" ).html(html);
	*/
}

//***************************************************************************************************
//
// everything mouse related
//
//***************************************************************************************************/
var leftDown = false;
var middleDown = false;
var rightDown = false;
    
d3.select('#viewer-div').on("contextmenu", function(d) {
    d3.event.preventDefault();
})

.on( 'mousedown', function () {
	var coords = d3.mouse( this );
	var button = d3.event.which;
	switch ( button ) {
	case 1:
		arcball.click(coords[0], coords[1]);
		leftDown = true;
		break;
	case 2:
		middleDown = true;
		arcball.midClick(coords[0], coords[1]);
		break;
	case 3:
		rightDown = true;
	}
	return false;
})
.on( 'mouseup', function () {
	var button = d3.event.which;
	switch ( button ) {
	case 1:
		leftDown = false;
		break;
	case 2:
		middleDown = false;
		break;
	case 3:
		rightDown = false;
		break;
	}
})
.on( 'mousemove', function () {
	var coords = d3.mouse( this );
	if (leftDown) {
		arcball.drag(coords[0], coords[1]);
	} 
	else if (middleDown) {
		arcball.midDrag(coords[0], coords[1]);
	}
})

.on("wheel.zoom", function() {
		//console.log( d3.event );
		view.zoom( event.deltaY );
		d3.event.preventDefault();
});

window.addEventListener("resize", function() {
	if ( view ) {
		view.setSize( d3.select('#viewer-div').property('clientWidth'), d3.select('#viewer-div').property('clientHeight') );
	}
	if( currentPage ) {
		buildPage( currentPage );
	}
});

d3.select('#controlsLink').on( 'click', function() {
	d3.event.preventDefault();
	if ( d3.select('#controls').style('display') == 'block' ) {
		d3.select('#controls').style('opacity', 100 );
	    d3.select('#controls').transition().style('opacity', 0 ).duration( 2500 )
	    	.each( 'end', function() {d3.select('#controls').style('display', 'none');});
	}
	else {
	    d3.select('#controls').style('display', 'block');
	    d3.select('#controls').style('opacity', 0 );
	    d3.select('#controls').transition().style('opacity', 100 ).duration( 3000 );
	}
});

d3.select('#resetLink').on( 'click', function() {
	d3.event.preventDefault();
	view.setOverlay( io.niftis()["tex3"] );
});




// what is returned is the only thing what is visible to the outside of this module; all the rest is invisible outside this module 
return {
	startUp : startUp
};

	
});