define(["d3", "three"], function( d3, three ) {
	
	
(function() { window.Viewer = function( width, height ) {
	
	var width = width;
	var height = height;
	var scene = new three.Scene();
	var camera = new three.PerspectiveCamera( 75, width, height, 0.1, 1000 );
	var renderer = new three.WebGLRenderer();
	renderer.setSize( width, height );
	
	var geometry = new THREE.BoxGeometry( 1, 1, 1 );
	var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
	var cube = new THREE.Mesh( geometry, material );
	scene.add( cube );

	camera.position.z = 5;
	

	html = function() {
		return renderer.domElement;
	}
	size = function() {
		return { 'width' : width, 'height' : height };
	}
	
	render = function() {
		requestAnimationFrame( this.render );
		renderer.render(scene, camera);
		
		cube.rotation.x += 0.1;
		cube.rotation.y += 0.1;
	}
	
	return {
		render : render,
		html : html,
		size : size
	}
}

})();

});