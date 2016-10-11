define(["io", "diagrams", "viewer", "niftii", "d3", "showdown"], function( io, diagrams, viewer, niftii, d3, showdown ) {

	
var diagramDiameter = 600;	
	
var config = {};	
	
function startUp() {
	console.log( "ui.js startUp()" )
	// load config files
	d3.json( settings.CONFIG_URL + "config.json", loadConfig );  

};

function loadConfig( error, configObject ) {
	console.log( "ui.js loadConfig()" );
	if(error) {
		console.log( error );
	}
	config = configObject;
	
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
	
	buildPage( config.firstPage );
};

function buildPage( id ) {
	var co = io.content()[id];
	if ( !co ) return;
	
	var content = d3.select('#content');
	content.html('');
	
	if ( co.markdown ) {
		d3.text(settings.CONFIG_URL + co.markdown, buildMarkdownPage );
		return;
	}
	
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
	
	var page = content.append('div');
		page.attr('class', 'section')
			.attr('id', 'page-body')
			.append('header')
			.append('h1').text(co.title);
	
	co.paragraphs.forEach( function(p, i) {
		var div = page.append('div');
		div.append('a')
			.attr('id', 'para'+i)
			.attr('name', 'para'+i);
		
		if ( p.text )
		{
			var ts ="";
			p.text.forEach( function(l) {ts+=l;});
			div.attr('class', 'document')
				.append('p')
				.html(ts);
		}
		if( p.image_url ) {
			var fig = div.append('figure');
			fig.append('img')
				.attr( 'src', p.image_url)
				.attr( 'class', 'contentImage');
		}
		if ( p.diagram_data ) {
			var diagram = page.append('div'); 
			diagrams.createDiagram( p.diagram_data, diagram, diagramDiameter )
		}
		div.append('br');
		div.append('br');
		div.append('br');
	});
	
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

return {
	startUp : startUp
};

	
});