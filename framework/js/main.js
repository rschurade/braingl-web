/**
 * @function
 */
 //calls config function and gives paths, shim : to make d3 work with require.js
requirejs.config({
    //By default load any module IDs from framework/js
    baseUrl: '../framework/js',
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
    paths: {
    	d3: "http://d3js.org/d3.v3.min",
        three: "../libs/three.min",
    	//three: "https://ajax.googleapis.com/ajax/libs/threejs/r84/three.min",
   	
    },
    // shim: because three.js are not really require modules, so you need shim fix
    shim: {
        three: {
            exports: 'THREE'
        },
        
    }
});

/**
 * @function 
 * @desc require.js syntax: function gets array and gets function of the code
 * here is where it starts after loading
 * require: takes the names of the modules without .js , loads ui.js and makes it available in the var
 * and calls startup function in --> ui.js with function startUp() {
 */
require(['d3', 'three', 'ui'], 
function( d3, THREE, ui ) {
	console.log( "loaded d3.js, version: " + d3.version );
	console.log( "loaded three.js, revision: " + THREE.REVISION );
	
	ui.startUp();
});
