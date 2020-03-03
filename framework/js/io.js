define( ["d3", "nifti"], (function(d3, nifti) {

var _niftis = {};
var textures =  {};
var interpolate = true;

var meshes = {};
var _fibres = {};
var scenes = {};
var content = {};	
	
	
var pageContentLoaded = false;
	
function loadContent( url, callback ) {
	// load content.json 
	d3.json( settings.CONFIG_URL + "content.json", function(error, obj) {
		// if there is no error: loop over all entries so that they will be assigned to the content object with their id to access them via their id later
		if ( !error ) {
			// the entire content of the content.json will be stored inside the content object
			// in content.json: there are 3 objects: 1) lines 1-42, 2) lines {42-73}, 3) 73 to end; 
			// loop over all elements in the array --> first: o will contain the first element from lines 2-42 of the content.json

			obj.forEach(function(o) {
				// initialised as an empty object {} above, now, o.id will contain the content of page1 --> content page1= obj(o) --> 
				// this way, the entire content object will be constructed --> and you can access it via page ids
				content[o.id] = o;
		    });
			
			pageContentLoaded = true;
			// callback onContentLoaded in ui.js:  function onContentLoaded() {
			callback();
		} else {
			console.log( error );
		}
			
	});
};

function loadElements( url, texCallback, overlayCallback, fibreCallback ) {
	// load content.json 
	d3.json( settings.CONFIG_URL + "elements.json", function(error, obj) {
		// if there is no error: loop over all entries so that they will be assigned to the content object with their id to access them via their id later
		if ( !error ) {
			// the entire content of the content.json will be stored inside the content object
			// in content.json: there are 3 objects: 1) lines 1-42, 2) lines {42-73}, 3) 73 to end; 
			// loop over all elements in the array --> first: o will contain the first element from lines 2-42 of the content.json

			obj.forEach(function(o) {
				// initialised as an empty object {} above, now, o.id will contain the content of page1 --> content page1= obj(o) --> 
				// this way, the entire content object will be constructed --> and you can access it via page ids
				
				if( o.type == "texture" )
				{
					console.log( o.id + " " + o.url );
					loadTexture( o.id, o.url, texCallback );
				}
				if( o.type == "overlay" )
				{
					console.log( o.id + " " + o.url );
					loadTexture( o.id, o.url, overlayCallback );
				}
				
				else if( o.type == "fibre" )
				{
					console.log( o.id + " " + o.url );
					loadFibre( o, fibreCallback );
				}
				
		    });
			
			// callback onContentLoaded in ui.js:  function onContentLoaded() {
			//callback();
		} else {
			console.log( error );
		}
			
	});
};

function loadTexture( id, url, callback ) {
	_niftis[id] = new Nifti();
	_niftis[id].download( settings.DATA_URL + url, callback );
}

function loadFibre( def, callback ) {
	d3.json( settings.DATA_URL + def.url, function(error, obj) {
		if ( !error ) {
			obj.color = def.color;
			_fibres[def.id] = obj;
			callback( def.id );
		} else {
			console.log( error );
		}
	});
}



return {
	loadContent : loadContent,
	loadElements : loadElements,
	
	niftis : function() {return _niftis;},
	textures : function() {return textures;},
	meshes : function() {return meshes;},
	fibres : function() {return _fibres;},
	scenes : function() {return scenes;},
	content : function() {return content;},
	
	
	contentReady : function() { return pageContentLoaded; },
};

}));