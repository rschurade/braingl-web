define(["io", "diagrams", "viewer", "niftii", "d3", "showdown"], function( io, diagrams, viewer, niftii, d3, showdown ) {
// module structure: first a 'define' to make the module usable; and at the very end of ui.js: return

// diagram parameter 'diameter' variable that would have to refine here for different use cases
var diagramDiameter = 600;	
	
// var config will be the config object
var config = {};	

/**
 * @function startUp()
 * loads the config.json
 * is a d3 function which takes the url for the config.json file and a callback
 * callback function: loading is asynchronous --> tells server that it wants to have the json file, when server sends it back, it shall do something; (to not wait ;)
 */
function startUp() {
	console.log( "ui.js startUp()" )
	// load config files
	d3.json( settings.CONFIG_URL + "config.json", loadConfig );  
};

// not visible, like a private function
// receives 2 arguments from d3
function loadConfig( error, configObject ) {
	console.log( "ui.js loadConfig()" );

	// d3 throws nice error messages when config.json is broken
	if( error ) {
		console.log( error );
	}
	config = configObject;
	// if config has been loaded and has config var which equals true
	// then we load the content.json
	if ( config && config.hasContent ) {
		io.loadContent( settings.CONFIG_URL + "content.json", onContentLoaded );
	}
	
	if ( config && config.viewer ) {
		console.log( "create viewer");
		console.log( d3.select('#viewer').attr('width') );
		var view = new Viewer( d3.select('#viewer-div').attr('width'), d3.select('#viewer-div').attr('height') );
		//d3.select('#viewer-div').append(view.html);
		
		//document.getElementById('viewer-div').appendChild( view.html() );
		console.log( view.size() );
		view.render();
	}	
}


function onContentLoaded() {
	console.log( "ui.js onContentLoaded()" );
	//Kenner in config.json
	buildPage( config.firstPage );
};

// this function will get the object from the content.json: 
// in content.json line 3: "markdown-remove_including_-_to_make_it_work" : "page1.txt",  would take a text file as input; 
// and if you would like to use a markdown file, you insert in content.json line 4: "markdown" : "page1.md",
function buildPage( id ) {
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
	// create var div, which will contain the div, that will be appended here
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
		if ( p.diagram_data ) {
			var diagram = page.append('div'); 
			diagrams.createDiagram( p.diagram_data, diagram, diagramDiameter )
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
	var converter = new showdown.Converter(),
    html      = converter.makeHtml(text);
	d3.select( "#content" ).html(html);
}

// what is returned is the only thing what is visible to the outside of this module; all the rest is invisible outside this module 
return {
	startUp : startUp
};

	
});