requirejs.config({
    //By default load any module IDs from framework/js
    baseUrl: '../framework/js',
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
    paths: {
    	d3: "http://d3js.org/d3.v3.min",
        three: "../libs/three.min",
        showdown: "https://cdn.rawgit.com/showdownjs/showdown/1.4.3/dist/showdown.min"
    	//three: "https://ajax.googleapis.com/ajax/libs/threejs/r76/three.min"
    },
    shim: {
        three: {
            exports: 'THREE'
        },
        showdown: {
            exports: 'SHOWDOWN'
        }
    }
});

require(['d3', 'three', 'ui'], 
function( d3, three, ui ) {
	console.log( "loaded d3.js, version: " + d3.version );
	console.log( "loaded three.js, revision: " + three.REVISION );
	
	ui.startUp();
});
