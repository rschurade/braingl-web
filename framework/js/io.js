define( ["d3"], (function(d3) {

var niftiis = {};
var textures =  {};
var interpolate = true;

var meshes = {};
var fibres = {};
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


return {
	loadContent : loadContent,
	
	niftis : function() {return niftis;},
	textures : function() {return textures;},
	meshes : function() {return meshes;},
	fibres : function() {return fibres;},
	scenes : function() {return scenes;},
	content : function() {return content;},
	
	
	contentReady : function() { return pageContentLoaded; },
};

}));