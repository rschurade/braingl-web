define(["d3", "three", "arcball", "niftii"], function( d3, THREE, arcball, niftii ) {
	
	
(function() { window.Viewer = function( width, height ) {
	
	var width = width;
	var height = height;
	var scene = new THREE.Scene();
	var zoom = 6.0;
	var camera = new THREE.OrthographicCamera( width / - zoom, width / zoom, height / zoom, height / - zoom, -1000, 1000 );
	var renderer = new THREE.WebGLRenderer();
	renderer.setSize( width, height );
	arcball.setViewportDims( width, height );
	renderer.setClearColor( 0xffffff, 1 );
	
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
	var connections;
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
		connections = new THREE.Group();
//		var mat1 = new THREE.MeshBasicMaterial( {color: 0x00ff00, side: THREE.DoubleSide} );
//		var mat2 = new THREE.MeshBasicMaterial( {color: 0x0000ff, side: THREE.DoubleSide} );
//		var mat3 = new THREE.MeshBasicMaterial( {color: 0xff0000, side: THREE.DoubleSide} );
		
		var geometry3 = new THREE.PlaneGeometry( sliceDim, sliceDim );
		
		coronal = new THREE.Mesh( geometry3, coronalMat );
		//coronal = new THREE.Mesh( geometry3, mat1 );
		coronal.rotation.x = Math.PI;
		coronal.rotation.y = Math.PI;
		coronal.rotation.z = Math.PI;
		
		
		var geometry = new THREE.PlaneGeometry( sliceDim, sliceDim );
		//axial = new THREE.Mesh( geometry, mat2 );
		axial = new THREE.Mesh( geometry, axialMat );
		axial.rotation.x = Math.PI;
		axial.rotation.y = Math.PI * 2;
		
		
		var geometry2 = new THREE.PlaneGeometry( sliceDim, sliceDim );
		sagittal = new THREE.Mesh( geometry2, sagittalMat );
		//sagittal = new THREE.Mesh( geometry2, mat3 );
		sagittal.rotation.x = Math.PI / -2;
		sagittal.rotation.y = Math.PI / -2;
		
		axial.name = "axialTmp"
		coronal.name = "coronalTmp";
		sagittal.name = "sagittalTmp"
		
		slices.add( axial );
		slices.add( sagittal );
		slices.add( coronal );
		
		var geometry = new THREE.SphereGeometry( 5, 32, 32 );
		var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
		var sphere = new THREE.Mesh( geometry, material );
		/*
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
		*/
		
		scene.add( sphere );
		scene.add( slices );
		scene.add( connections );
		
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
	
	zoom = function( delta ) {
		if ( delta < 0 ) {
			camera.zoom *= 0.9;
		}
		else if ( delta > 0 ) {
			camera.zoom *= 1.1;
		}
		camera.updateProjectionMatrix();
	}
	
	function texLoaded() {
		console.log( "tex loaded" );

		var object = scene.getObjectByName( "coronalTmp" );
	    slices.remove( object );
	    object = scene.getObjectByName( "axialTmp" );
	    slices.remove( object );
	    object = scene.getObjectByName( "sagittalTmp" );
	    slices.remove( object );
				
		var dims = t1data.getDims();
		console.log( dims );
		
		var image = t1data.getImage( "coronal", Math.floor( dims.ny / 2 ) );
		var tex = new THREE.Texture( image );
		tex.needsUpdate = true;
		
		var geometry = new THREE.PlaneGeometry( dims.nx * dims.dx, dims.nz * dims.dz );
		coronal = new THREE.Mesh( geometry, coronalMat );
		coronal.material.uniforms.tex.value = tex;
		coronal.material.needsUpdate = true;
		coronal.rotation.x = Math.PI / -2;
		coronal.needsUpdate = true;
		coronal.name = "coronal";
		slices.add( coronal );
		
		
		var image2 = t1data.getImage( "axial", Math.floor( dims.nz/2 ) );
		var tex2 = new THREE.Texture( image2 );
		tex2.needsUpdate = true;
		
		var geometry = new THREE.PlaneGeometry( dims.nx * dims.dx, dims.ny * dims.dy );
		axial = new THREE.Mesh( geometry, axialMat );
		axial.material.uniforms.tex.value = tex2;
		axial.material.needsUpdate = true;
		axial.rotation.x = Math.PI;
		axial.rotation.y = Math.PI * 2;
		axial.needsUpdate = true;
		axial.name = "axial";
		slices.add( axial );

		var image3 = t1data.getImage( "sagittal", Math.floor( dims.nx/2 ) );
		var tex3 = new THREE.Texture( image3 );
		tex3.needsUpdate = true;
		
		var geometry = new THREE.PlaneGeometry( dims.ny * dims.dy, dims.nz * dims.dz );
		sagittal = new THREE.Mesh( geometry, sagittalMat );
		sagittal.material.uniforms.tex.value = tex3;
		sagittal.material.needsUpdate = true;
		sagittal.rotation.x = Math.PI / -2;
		sagittal.rotation.y = Math.PI / -2;
		sagittal.needsUpdate = true;
		sagittal.name = "sagittal";
		slices.add( sagittal );
	}
	
	function addConnections( id, position, destinations ) {
		var con = new THREE.Group();
		con.name = id;
		addSphere( con, 5, 0x00ff00, position );
		destinations.forEach( function(d,i) {
			addSphere( con, 5, 0xff0000, d.position );
			addLine( con, position, d.position, 0x0000ff );
		})
		connections.add( con );
	}
	
	function removeConnections( id ) {
		var con = connections.getObjectByName( id );
	    connections.remove( con );
	}
	
	function addSphere( parent, radius, col, position ) {
		var geometry = new THREE.SphereGeometry( radius, 32, 32 );
		var material = new THREE.MeshBasicMaterial( {color: col} );
		var s = new THREE.Mesh( geometry, material );
		s.translateX( position[0] );
		s.translateY( position[1] );
		s.translateZ( position[2] );
		parent.add( s );
	}
	
	function addLine( parent, pos1, pos2, col ) {
		var material = new THREE.LineBasicMaterial({
			color: col
		});

		var geometry = new THREE.Geometry();
		geometry.vertices.push(
			new THREE.Vector3( pos1[0], pos1[1], pos1[2] ),
			new THREE.Vector3( pos2[0], pos2[1], pos2[2] )
		);

		var line = new THREE.Line( geometry, material );
		parent.add( line );
	}
	
	return {
		render : render,
		html : html,
		size : size,
		setSize : setSize,
		zoom : zoom,
		addConnections : addConnections,
		removeConnections : removeConnections,
	}
}

})();

});