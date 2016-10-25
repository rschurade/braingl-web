define(["d3", "three", "arcball", "niftii"], function( d3, THREE, arcball, niftii ) {
	
	
(function() { window.Viewer = function( width, height ) {
	
	var width = width;
	var height = height;
	var scene = new THREE.Scene();
	var camera = new THREE.OrthographicCamera( width / - 6, width / 6, height / 6, height / - 6, -1000, 1000 );
	var renderer = new THREE.WebGLRenderer();
	renderer.setSize( width, height );
	arcball.setViewportDims( width, height );
	
	
	var t1data;
	var vshader = "varying vec2 vUv;void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0 );}";
	var fshader = 
		"precision highp float;" +
		"varying vec2 vUv;" +
		"uniform float color;" +
		"uniform sampler2D tex;" +
		"void main(void){" +
		"	vec4 col = texture2D(tex, vUv);" +
		"   if( ( col.r + col.g + col.b ) < 0.01 ) discard;" +
		"	gl_FragColor = col;" +
		"}";
	
	
	// instantiate a loader
	var loader = new THREE.TextureLoader();

	var axialMat;
	var coronalMat;
	var sagittalMat;
	
	var axial;
	var coronal;
	var sagittal;
	var slices;
	var sliceDim = 128;

	// load a resource
	loader.load(
		// resource URL
		settings.DATA_URL + "tex_loading.png",
		// Function when resource is loaded
		function ( texture ) {
			axialMat = new THREE.ShaderMaterial({
            uniforms: {
                tex: {type: 't', value: texture }
            },
            vertexShader: vshader,
			fragmentShader: fshader,
			side: THREE.DoubleSide
			});
			coronalMat = new THREE.ShaderMaterial({
            uniforms: {
                tex: {type: 't', value: texture }
            },
            vertexShader: vshader,
			fragmentShader: fshader,
			side: THREE.DoubleSide
			});
			sagittalMat = new THREE.ShaderMaterial({
            uniforms: {
                tex: {type: 't', value: texture }
            },
            vertexShader: vshader,
			fragmentShader: fshader,
			side: THREE.DoubleSide
			});
		// setup slices
		slices = new THREE.Group();
		
//		var mat1 = new THREE.MeshBasicMaterial( {color: 0x00ff00, side: THREE.DoubleSide} );
//		var mat2 = new THREE.MeshBasicMaterial( {color: 0x0000ff, side: THREE.DoubleSide} );
//		var mat3 = new THREE.MeshBasicMaterial( {color: 0xff0000, side: THREE.DoubleSide} );
		
		var geometry3 = new THREE.PlaneGeometry( sliceDim, sliceDim );
		
		coronal = new THREE.Mesh( geometry3, coronalMat );
		//coronal = new THREE.Mesh( geometry3, mat1 );
		coronal.rotation.x = Math.PI / -2;
		coronal.translateX( sliceDim / 2 );
		coronal.translateY( sliceDim / -2 );
		
		
		var geometry = new THREE.PlaneGeometry( sliceDim, sliceDim );
		//axial = new THREE.Mesh( geometry, mat2 );
		axial = new THREE.Mesh( geometry, axialMat );
		axial.rotation.x = Math.PI;
		axial.rotation.y = Math.PI * 2;
		axial.translateX( sliceDim / 2 );
		axial.translateY( sliceDim / -2 );
		
		
		var geometry2 = new THREE.PlaneGeometry( sliceDim, sliceDim );
		sagittal = new THREE.Mesh( geometry2, sagittalMat );
		//sagittal = new THREE.Mesh( geometry2, mat3 );
		sagittal.rotation.x = Math.PI / -2;
		sagittal.rotation.y = Math.PI / -2;
		sagittal.translateX( sliceDim / 2 );
		sagittal.translateY( sliceDim / -2 );
		
		slices.add( axial );
		slices.add( sagittal );
		slices.add( coronal );
		
		var geometry = new THREE.SphereGeometry( 5, 32, 32 );
		var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
		var sphere = new THREE.Mesh( geometry, material );
		
		var g1 = new THREE.SphereGeometry( 5, 32, 32 );
		var m1 = new THREE.MeshBasicMaterial( {color: 0xff0000} );
		var s1 = new THREE.Mesh( g1, m1 );
		s1.translateX( 50 );
		scene.add( s1 );
		var g2 = new THREE.SphereGeometry( 5, 32, 32 );
		var m2 = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
		var s2 = new THREE.Mesh( g2, m2 );
		s2.translateY( 50 );
		scene.add( s2 );
		var g3 = new THREE.SphereGeometry( 5, 32, 32 );
		var m3 = new THREE.MeshBasicMaterial( {color: 0x0000ff} );
		var s3 = new THREE.Mesh( g3, m3 );
		s3.translateZ( 50 );
		scene.add( s3 );		
		
		
		scene.add( sphere );
		scene.add( slices );
		
		loadTexture( "t1.nii", texLoaded );
		},
		// Function called when download progresses
		function ( xhr ) {
			console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
		},
		// Function called when download errors
		function ( xhr ) {
			console.log( 'An error happened' );
		}
	);
	
	
	
	
	

	render = function() {
		requestAnimationFrame( this.render );
		

		scene.quaternion.setFromRotationMatrix( arcball.get() )
		
		renderer.render( scene, camera );
	}
	
	
	html = function() {
		return renderer.domElement;
	}
	size = function() {
		return { 'width' : width, 'height' : height };
	}
	
	setSize = function( w, h ) {
		width = w;
		height = h;
		renderer.setSize( width, height );
	}
	
	function loadTexture(url, callback ) {
		t1data = new Niftii();
		t1data.load( settings.DATA_URL + url, callback );
	}
	
	function texLoaded() {
		console.log( "tex loaded" );
		console.log( t1data.getDims() );
		var image = t1data.getImage( "coronal", Math.floor( t1data.getDims()[1]/2 ) );
		var tex = new THREE.Texture( image );
		tex.needsUpdate = true;
		coronal.material.uniforms.tex.value = tex;
		coronal.material.needsUpdate = true;
		//coronal.position.y =  Math.floor( t1data.getDims()[1]/2 );
		coronal.translateX( t1data.getDims()[0]/-2 );
		coronal.translateY( t1data.getDims()[2]/2 );
		coronal.needsUpdate = true;
		
		var image2 = t1data.getImage( "axial", Math.floor( t1data.getDims()[2]/2 ) );
		var tex2 = new THREE.Texture( image2 );
		tex2.needsUpdate = true;
		axial.material.uniforms.tex.value = tex2;
		axial.material.needsUpdate = true;
		//axial.position.z =  Math.floor( t1data.getDims()[2]/2 );
		axial.translateX( t1data.getDims()[0]/-2 );
		axial.translateY( t1data.getDims()[1]/2 );
		axial.needsUpdate = true;

		var image3 = t1data.getImage( "sagittal", Math.floor( t1data.getDims()[0]/2 ) );
		var tex3 = new THREE.Texture( image3 );
		tex3.needsUpdate = true;
		sagittal.material.uniforms.tex.value = tex3;
		sagittal.material.needsUpdate = true;
		//sagittal.position.x =  Math.floor( t1data.getDims()[0]/2 );
		sagittal.translateX( t1data.getDims()[1]/-2 );
		sagittal.translateY( t1data.getDims()[2]/2 );
		sagittal.needsUpdate = true;
	}
	
	return {
		render : render,
		html : html,
		size : size,
		setSize : setSize,
	}
}

})();

});