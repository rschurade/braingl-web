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
	d3.json( settings.CONFIG_URL + "content.json", function(error, obj) {
		if ( !error ) {
			obj.forEach(function(o) {
				content[o.id] = o;
		    });
			
			pageContentLoaded = true;
			callback();
		} else {
			console.log( error );
		}
			
	});
};


return {
	loadContent : loadContent,
	
	niftiis : function() {return niftiis;},
	textures : function() {return textures;},
	meshes : function() {return meshes;},
	fibres : function() {return fibres;},
	scenes : function() {return scenes;},
	content : function() {return content;},
	
	
	contentReady : function() { return pageContentLoaded; },
};

}));