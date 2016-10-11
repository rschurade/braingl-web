define(["d3", "three"], function( d3, three ) {
	
	
(function() { window.Viewer = function( width, height ) {
	
	var width = width;
	var height = height;
	var scene = new three.Scene();
	var camera = new three.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, -1000, 1000 );
	var renderer = new three.WebGLRenderer();
	renderer.setSize( width, height );
	
	var geometry = new THREE.BoxGeometry( 100, 100, 100 );
	var material = new THREE.MeshBasicMaterial( { color: 0x00ff00, wireframe : true } );
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
		
		cube.rotation.x += 0.01;
		cube.rotation.y += 0.01;
	}
	
	return {
		render : render,
		html : html,
		size : size
	}
}

})();

});