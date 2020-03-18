define(["d3", "three", "arcball", "nifti"], function( d3, THREE, arcball, nifti ) {
//syntax: require.js --> quasi classes	
//anonyme fct called when file is being loaded	--> creates window class 
//index html loads main.js (belongs to require.js --> html is being loaded main.js is being loaded

	//anonyme function without name --> called immediately when is being loaded, in global cobnetext (window) inits a viewer object which is the prototype for viewer classes, i e 
	// when in ui.js viewer = new viewer (l 64) --> creates object which looks like this one 
	//creates viewer object and the functuon which this object shall make availabe are defined down there in line 182 return :) 
	// eg add connections; but add sphere and stuff are bot visible to outside --> in ui.js they are not callable --... just used by the addconnection functions
	// slices is three.js group 
	// cor is three.js mesh (object to render with three.js

(function() { window.Viewer = function( width, height ) {
	
	var dispatch = d3.dispatch("dimsChanged");
	
	var width = width;
	var height = height;
	var scene = new THREE.Scene();
	
	const lightColor = 0xFFFFFF;
	const lightIntensity = 0.6;
	const light = new THREE.AmbientLight( lightColor, lightIntensity);
	scene.add( light );
	
	const lightColor2 = 0xFFFFFF;
	const lightIntensity2 = 0.5;
	const light2 = new THREE.PointLight( lightColor2, lightIntensity2 );
	light2.position.set( 500, 0, 0 );
	scene.add( light2 );
	
	const lightColor3 = 0xFFFFFF;
	const lightIntensity3 = 0.5;
	const light3 = new THREE.PointLight( lightColor3, lightIntensity3 );
	light3.position.set( -500, 0, 0 );
	scene.add( light3 );
	
	var zoom = 6.0;
	var camera = new THREE.OrthographicCamera( width / - zoom, width / zoom, height / zoom, height / - zoom, -1000, 1000 );
	var renderer = new THREE.WebGLRenderer();
	renderer.setSize( width, height );
	arcball.setViewportDims( width, height );
	renderer.setClearColor( 0x000000, 1 );
	
	
	
	var scene2 = new THREE.Scene();
	var camera2 = new THREE.OrthographicCamera( width / - zoom, width / zoom, height / zoom, height / - zoom, -1000, 1000 );
	//scene2.add( light );
	scene2.add( light2 );
	scene2.add( light3 );
	
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var t1data;
	var ovdata;
	var hasOverlay = false;
	var showOverlay = true;
	
	
	var orientationCubeSize = 20;
	
	
	var axesHelperType = "Cube";
	
	if( axesHelperType == "Cube" )
	{
		var geo = new THREE.BoxGeometry( orientationCubeSize, orientationCubeSize, orientationCubeSize );
    	var mat = new THREE.MeshBasicMaterial( { color:0xffffff, vertexColors: THREE.FaceColors } );
    	var orientCube = new THREE.Mesh( geo, mat );
    
    	
    	orientCube.geometry.faces[ 0 ].color.setHex( 0xff0000 );
    	orientCube.geometry.faces[ 1 ].color.setHex( 0xff0000 );
    	
    	orientCube.geometry.faces[ 2 ].color.setHex( 0xff0000 );
    	orientCube.geometry.faces[ 3 ].color.setHex( 0xff0000 );
    	
    	orientCube.geometry.faces[ 4 ].color.setHex( 0x00ff00 );
    	orientCube.geometry.faces[ 5 ].color.setHex( 0x00ff00 );
    	
    	orientCube.geometry.faces[ 6 ].color.setHex( 0x00ff00 );
    	orientCube.geometry.faces[ 7 ].color.setHex( 0x00ff00 );
    	
    	orientCube.geometry.faces[ 8 ].color.setHex( 0x0000ff );
    	orientCube.geometry.faces[ 9 ].color.setHex( 0x0000ff );
    	
    	orientCube.geometry.faces[ 10 ].color.setHex( 0x0000ff );
    	orientCube.geometry.faces[ 11 ].color.setHex( 0x0000ff );
    	
    	orientCube.geometry.colorsNeedUpdate = true;
    	
    	scene2.add( orientCube );
	}
	else
	{
		var orientCube = new THREE.AxesHelper( orientationCubeSize );
	}
	
	scene2.translateX( 100 );
	scene2.translateY( -80 );
	scene2.translateZ( 100 );
	
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var vshader = "varying vec2 vUv;void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0 );}";
	var fshader = 
		"precision highp float;" +
		"varying vec2 vUv;" +
		"uniform float color;" +
		"uniform bool hasOverlay;" +
		"uniform bool showOverlay;" +
		"uniform sampler2D tex;" +
		"uniform sampler2D overlay;" +
		"vec4 colormap( float val ) {"+
		"    vec4 col = vec4( 0.0 );" +
		"    col.a = 1.0;" +
		"    float cv = val * 5.;" +
		
		"    if( cv > 4. ) {" +
		"        col.r = 1.;" +
		"        col.b = cv - 4.;" +
		"    }" +
		"    else if( cv > 3. ) {" +
		"        col.r = 1.;" +
		"        col.g = 1. - ( cv - 3. );" +
		"    }" +
		"    else if( cv > 2. ) {" +
		"        col.r = cv - 2.;" +
		"        col.g = 1.0;" +
		"    }" +
		"    else if( cv > 1. ) {" +
		"        col.g = 1.;" +
		"        col.b = 1.0 - ( cv - 1. );" +
		"    }" +
		"    else {" +
		"        col.g = cv;" +
		"        col.b = 1.0;" +
		"    }" +
		"    return col;" +
		"}"+
		"void main(void){" +
		"    vec4 col = texture2D(tex, vUv);" +
		"    if( length( col.rgb ) < 0.02 ) discard;" +
		
		"    if( hasOverlay && showOverlay ) {" +
		"        vec4 ovcol = texture2D(overlay, vUv);" +
		"        if( length( ovcol.rgb ) > 0.001 )" +
		"            col = mix( col, colormap( ovcol.r ), 0.5 );" +
		"    }" +
		"	gl_FragColor = col;" +
		"}";
	
	var vLineShader = 
		"attribute vec3 aNormal;" +
		"attribute vec3 aGlobalColor;" +
		"varying vec3 vNormal;" +
		"varying vec3 vGlobalColor;" +
		"void main() { "+
		"   vNormal = aNormal;"+
		"   vGlobalColor = aGlobalColor;"+
		"   gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0 );" +
		"}";
	var fLineShader = 
		"varying vec3 vNormal;" +
		"varying vec3 vGlobalColor;" +
		"uniform vec3 color;" +
		"uniform int renderMode;" +
		"void main(void){" +
    		"vec3 uAmbientColor = vec3(0.4);" +
    		"vec3 uPointLightingDiffuseColor= vec3(0.6);" +
    		"vec3 lightDirection = vec3( 0.0, 0.0, 1.0 );" +
    		"vec3 lightWeighting;" +
    
    		"float diffuseLightWeighting = max(dot(vNormal, lightDirection), 0.0);" +
    			
    		"lightWeighting = uAmbientColor + uPointLightingDiffuseColor * diffuseLightWeighting;" +
    		
    		"vec3 myColor = color;" +
    		"if( renderMode == 1 ) {" +
    		"    myColor = vec3( abs( vNormal.x ), abs( vNormal.y ), abs( vNormal.z ) );" +
    		"}"+
    		"else if( renderMode == 2 ) {" +
    		"    myColor = vec3( abs( vGlobalColor.x ), abs( vGlobalColor.y ), abs( vGlobalColor.z ) );" +
    		"}"+
    		"myColor = myColor * lightWeighting * 1.5 ;" +
    		"myColor.x = clamp( myColor.x, 0.0, 1.0 );" +
    		"myColor.y = clamp( myColor.y, 0.0, 1.0 );" +
    		"myColor.z = clamp( myColor.z, 0.0, 1.0 );" +
		"	gl_FragColor = vec4( myColor, 1.0);" +
		"}";
	
	
	// instantiate a loader
	var loader = new THREE.TextureLoader();

	var axialMat;
	var coronalMat;
	var sagittalMat;
	var lineMat;
	
	var fiberRenderMode = 2; // 0 fiber color set in elements.json, 1 local color ie. vertex tangent 2 global color
	
	var axial;
	var coronal;
	var sagittal;
	
	var pivot = new THREE.Group();
	var slices = new THREE.Group();
	var connections = new THREE.Group();
	var meshes = new THREE.Group();
	var fibres = new THREE.Group();
	
	
	var translationX = 0;
	var translationY = 0;
	
	pivot.add( slices );
	pivot.add( connections );
	pivot.add( fibres );
	pivot.add( meshes );
	
	scene.add( pivot );
	
	var sliceDim = 128;
	var zero;
	var brainZero;
	
//then init viewer --> creates slices, rotate them!! Three.js wants it like that: create plane geometry of target size --> rotate it, texturise it
	init = function() {
		// load a resource
		loader.load(
			// resource URL
			settings.DATA_URL + "tex_loading.png",
			// Function when resource is loaded
			function ( texture ) {
				axialMat = new THREE.ShaderMaterial({
				uniforms: {
					tex: {type: 't', value: texture },
					overlay: {type: 't', value: 0 },
					hasOverlay: { value: 1},
					showOverlay: { value: 1}
				},
				vertexShader: vshader,
				fragmentShader: fshader,
				side: THREE.DoubleSide
				});
				coronalMat = new THREE.ShaderMaterial({
				uniforms: {
					tex: {type: 't', value: texture },
					overlay: {type: 't', value: 0 },
					hasOverlay: { value: 1},
					showOverlay: { value: 1}
				},
				vertexShader: vshader,
				fragmentShader: fshader,
				side: THREE.DoubleSide
				});
				sagittalMat = new THREE.ShaderMaterial({
				uniforms: {
					tex: {type: 't', value: texture },
					overlay: {type: 't', value: 0 },
					hasOverlay: { value: 1},
					showOverlay: { value: 1}
				},
				vertexShader: vshader,
				fragmentShader: fshader,
				side: THREE.DoubleSide
				}
			);
				
    		lineMat = new THREE.ShaderMaterial({
    			uniforms: {
    				renderMode: { value: 1 },
    				color: new THREE.Uniform(new THREE.Vector3() )
    			},
    			vertexShader: vLineShader,
    			fragmentShader: fLineShader,
    			side: THREE.DoubleSide
    			});
				

			// setup slices
			var geometry3 = new THREE.PlaneGeometry( sliceDim, sliceDim );
			
			coronal = new THREE.Mesh( geometry3, coronalMat );
			coronal.rotation.x = Math.PI;
			coronal.rotation.y = Math.PI;
			coronal.rotation.z = Math.PI;
			
			
			var geometry = new THREE.PlaneGeometry( sliceDim, sliceDim );
			axial = new THREE.Mesh( geometry, axialMat );
			axial.rotation.x = Math.PI;
			axial.rotation.y = Math.PI * 2;
			
			
			var geometry2 = new THREE.PlaneGeometry( sliceDim, sliceDim );
			sagittal = new THREE.Mesh( geometry2, sagittalMat );
			sagittal.rotation.x = Math.PI / -2;
			sagittal.rotation.y = Math.PI / -2;
			
			axial.name = "axial"
			coronal.name = "coronal";
			sagittal.name = "sagittal"
			
			slices.add( axial );
			slices.add( sagittal );
			slices.add( coronal );
			
			
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
	}
	

	render = function() {
		requestAnimationFrame( this.render );

		scene.quaternion.setFromRotationMatrix( arcball.get() );
		
		camera.translateX( -translationX );
		camera.translateY( translationY );
		
		camera.translateX( arcball.translation().x );
		camera.translateY( -arcball.translation().y );
		
		translationX = arcball.translation().x;
		translationY = arcball.translation().y;
		
		if( axialMat )
		{
    		axial.material.uniforms.hasOverlay.value = hasOverlay;
    		coronal.material.uniforms.hasOverlay.value = hasOverlay;
    		sagittal.material.uniforms.hasOverlay.value = hasOverlay;
    		
    		axial.material.uniforms.showOverlay.value = showOverlay;
    		coronal.material.uniforms.showOverlay.value = showOverlay;
    		sagittal.material.uniforms.showOverlay.value = showOverlay;
		}
		
		if( lineMat )
		{
			fibres.traverse( function ( fib ) {
				if( fib.material )
				{
					fib.material.uniforms.renderMode.value = fiberRenderMode;
				}
			}); 
			
		}
		
		renderer.autoClear = true;
		renderer.render( scene, camera );
		renderer.autoClear = false;
		
		
		
		scene2.quaternion.setFromRotationMatrix( arcball.get() );
		

		
		renderer.render( scene2, camera2 );
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
		arcball.setViewportDims( width, height );
	}
	
	function resize(w, h) {
		// resize the canvas but preserve the aspect ratio
		camera.left = (w / - originalZoom);
		camera.right = w / originalZoom;
		camera.top =  h / originalZoom;
		camera.bottom =  h / -originalZoom;
		camera.updateProjectionMatrix();

		renderer.setSize( w, h );
		renderer.render( scene, camera );
	}
	
	function loadTexture( url, callback ) {
		t1data = new Nifti();
		t1data.download( settings.DATA_URL + url, callback );
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
	
	function setOverlay( nifti ) {
		ovdata = nifti;
		hasOverlay = true;
		
		var dims = t1data.getDims();
		
		setSlice( "sliceX", dims.nx / 2 );
		setSlice( "sliceY", dims.ny / 2 );
		setSlice( "sliceZ", dims.nz / 2 );
	}
	
	function setAnatomy( nifti ) {
		t1data = nifti;
		
		var dims = t1data.getDims();
		
		var sform = t1data.getSForm();
		brainZero = new THREE.Vector3( Math.sign( sform.rowX[0] ) * sform.rowX[3], Math.sign( sform.rowY[1] ) * sform.rowY[3], Math.sign( sform.rowZ[2] ) * sform.rowZ[3] );
		
		setSlice( "sliceX", dims.nx / 2 );
		setSlice( "sliceY", dims.ny / 2 );
		setSlice( "sliceZ", dims.nz / 2 );
		
		dispatch.dimsChanged( dims );
		
		arcball.setRotation( [-1.2, -0.111, 2.5] );
		
		fibres.traverse( function ( fib ) {
			fib.visible = true;
		}); 
		
	}
	
	function setSlice( id, value ) {
		var dims = t1data.getDims();
		switch ( id ) {
			case 'sliceX' :
			{
				object = slices.getObjectByName( "sagittal" );
				slices.remove( object );
				var image = t1data.getImage( "sagittal", Math.floor( value ) );
				var tex = new THREE.Texture( image );
				tex.magFilter = THREE.NearestFilter;
				tex.minFilter = THREE.NearestFilter;
				tex.needsUpdate = true;
				
				if( hasOverlay )
				{
					var ovVal = ( value * dims.dx ) / ovdata.getDims().dx;
					var ovImg = ovdata.getImage( "sagittal", Math.floor( ovVal ) );
					var ovtex = new THREE.Texture( ovImg );
					ovtex.magFilter = THREE.NearestFilter;
					ovtex.minFilter = THREE.NearestFilter;
					ovtex.needsUpdate = true;
				}
				
				var geometry = new THREE.PlaneGeometry( dims.ny * dims.dy, dims.nz * dims.dz );
				geometry.vertices = [];
				var x = value * dims.dx;
				geometry.vertices.push(
					new THREE.Vector3( x, 0, 0 ),
					new THREE.Vector3( x, dims.ny * dims.dy, 0 ),
					new THREE.Vector3( x, 0, dims.nz * dims.dz ),
					new THREE.Vector3( x, dims.ny * dims.dy, dims.nz * dims.dz )
				);
				
				sagittal = new THREE.Mesh( geometry, sagittalMat );
				sagittal.translateX( brainZero.x );
				sagittal.translateY( brainZero.y );
				sagittal.translateZ( brainZero.z );
				sagittal.material.uniforms.tex.value = tex;
				if( hasOverlay )
				{
					sagittal.material.uniforms.overlay.value = ovtex;
				}
				sagittal.material.needsUpdate = true;
				sagittal.needsUpdate = true;
				sagittal.name = "sagittal";
				slices.add( sagittal );
			}
				break;
			case 'sliceY' :
			{
				object = slices.getObjectByName( "coronal" );
				slices.remove( object );
				
				var image = t1data.getImage( "coronal", Math.floor( value ) );
				var tex = new THREE.Texture( image );
				tex.magFilter = THREE.NearestFilter;
				tex.minFilter = THREE.NearestFilter;
				tex.needsUpdate = true;
				
				if( hasOverlay )
				{
					var ovVal = ( value * dims.dy ) / ovdata.getDims().dy;
					var ovImg = ovdata.getImage( "coronal", Math.floor( ovVal ) );
					var ovtex = new THREE.Texture( ovImg );
					ovtex.magFilter = THREE.NearestFilter;
					ovtex.minFilter = THREE.NearestFilter;
					ovtex.needsUpdate = true;
				}
				
				
				var geometry = new THREE.PlaneGeometry( dims.nx * dims.dx, dims.nz * dims.dz );
				geometry.vertices = [];
				var y = value * dims.dy;
				geometry.vertices.push(
					new THREE.Vector3( 0 , y, 0 ),
					new THREE.Vector3( dims.nx * dims.dx, y, 0 ),
					new THREE.Vector3( 0 , y, dims.nz * dims.dz ),
					new THREE.Vector3( dims.nx * dims.dx, y, dims.nz * dims.dz )
				);
				
				coronal = new THREE.Mesh( geometry, coronalMat );
				coronal.translateX( brainZero.x );
				coronal.translateY( brainZero.y );
				coronal.translateZ( brainZero.z );
				coronal.material.uniforms.tex.value = tex;
				if( hasOverlay )
				{
					coronal.material.uniforms.overlay.value = ovtex;
				}
				coronal.material.needsUpdate = true;
				coronal.needsUpdate = true;
				coronal.name = "coronal";
				slices.add( coronal );
			}
				break;
			case 'sliceZ' :
			{
				object = slices.getObjectByName( "axial" );
				slices.remove( object );
				var image = t1data.getImage( "axial", Math.floor( value ) );
				var tex = new THREE.Texture( image );
				tex.magFilter = THREE.NearestFilter;
				tex.minFilter = THREE.NearestFilter;
				tex.needsUpdate = true;
				
				if( hasOverlay )
				{
					var ovVal = ( value * dims.dz ) / ovdata.getDims().dz;
					var ovImg = ovdata.getImage( "axial", Math.floor( ovVal ) );
					var ovtex = new THREE.Texture( ovImg );
					ovtex.magFilter = THREE.NearestFilter;
					ovtex.minFilter = THREE.NearestFilter;
					ovtex.needsUpdate = true;
				}
				
				var geometry = new THREE.PlaneGeometry( dims.nx * dims.dx, dims.ny * dims.dy );
				geometry.vertices = [];
				var z = value * dims.dz;
				geometry.vertices.push(
					new THREE.Vector3( 0, 0, z ),
					new THREE.Vector3( dims.nx * dims.dx, 0, z ),
					new THREE.Vector3( 0, dims.ny * dims.dy, z ),
					new THREE.Vector3( dims.nx * dims.dx, dims.ny * dims.dy, z )
				);
				
				axial = new THREE.Mesh( geometry, axialMat );
				axial.translateX( brainZero.x );
				axial.translateY( brainZero.y );
				axial.translateZ( brainZero.z );
				axial.material.uniforms.tex.value = tex;
				if( hasOverlay )
				{
					axial.material.uniforms.overlay.value = ovtex;
				}
				axial.material.needsUpdate = true;
				axial.needsUpdate = true;
				axial.name = "axial";
				slices.add( axial );
			}
				break;				
		}
	}
	
	function addConnections( id, position, destinations ) {
		var con = new THREE.Group(); 	// one line from data.json
		con.name = id;
		addSphere( con, 5, 0x00ff00, position );
		destinations.forEach( function(d,i) {
			addSphere( con, 5, 0xff0000, d.position );
			addLine( con, position, d.position, 0x0000ff );
		})
		connections.add( con );
	}

	function addConnection( id, pos1, pos2 ) {
		var con = new THREE.Group(); 	// one line from data.json
		con.name = id;
		addSphere( con, 5, 0x00ff00, pos1 );
		addSphere( con, 5, 0xff0000, pos2 );
		addLine( con, pos1, pos2, 0x0000ff );
		connections.add( con );
	}
	
	function removeConnections( id ) {
		var con = connections.getObjectByName( id )
	    connections.remove( con );
	}
	
	function addSphere( parent, radius, col, position ) {
		var geometry = new THREE.SphereGeometry( radius, 32, 32 );
		var material = new THREE.MeshBasicMaterial( {color: col} );
		var s = new THREE.Mesh( geometry, material );
		s.translateX( position[0] - brainZero.x );
		s.translateY( position[1] - brainZero.y );
		s.translateZ( position[2] - brainZero.z );
		parent.add( s );
	}
	
	function addLine( parent, pos1, pos2, col ) {
		var material = new THREE.LineBasicMaterial({
			color: col
		});

		var geometry = new THREE.Geometry();
		geometry.vertices.push(
			new THREE.Vector3( pos1[0] - brainZero.x, pos1[1] - brainZero.y, pos1[2] - brainZero.z ),
			new THREE.Vector3( pos2[0] - brainZero.x, pos2[1] - brainZero.y, pos2[2] - brainZero.z )
		);

		var line = new THREE.Line( geometry, material );
		parent.add( line );
	}
	
	function addFibs( id, json ) {
		var vertices = json.vertices;
		var normals = json.normals;
		var indices = json.indices; 
		
		
		var fib = new THREE.Group();
		fib.name = id;
		var index = 0;
		
		var fibMaterial = lineMat.clone();
		fibMaterial.uniforms.color.value = new THREE.Vector3( json.color.r, json.color.g, json.color.b );
		
		var r, g, b;
		
		for( var k = 0; k < indices.length; ++k )
		{
			var geometry = new THREE.BufferGeometry();
			var numVerts = indices[k] * 3;
			var verts = new Float32Array( numVerts );
			var norms = new Float32Array( numVerts );
			var colors = new Float32Array( numVerts );
			
			r = vertices[index] -   vertices[index +     (numVerts - 3 )];
			g = vertices[index+1] - vertices[index + 1 + (numVerts - 3 )];
			b = vertices[index+2] - vertices[index + 2 + (numVerts - 3 )];
			
			var rgb = new THREE.Vector3( r, g, b );
			rgb.normalize();
			
			
			for ( var i = 0; i < numVerts; i += 3 ) {
				colors[i] = rgb.x;
				colors[i+1] = rgb.y;
				colors[i+2] = rgb.z;
			}
			
			for ( var i = 0; i < numVerts; ++i ) {
				verts[i] = vertices[index];
				norms[i] = normals[index];
				++index;
				//geometry.vertices.push(	new THREE.Vector3( vertices[index], vertices[index+1], vertices[index+2] ) );
				//index += 3;
			}
			
			geometry.setAttribute( 'position', new THREE.BufferAttribute( verts, 3 ) );
			geometry.setAttribute( 'aNormal', new THREE.BufferAttribute( norms, 3 ) );
			geometry.setAttribute( 'aGlobalColor', new THREE.BufferAttribute( colors, 3 ) );
			var line = new THREE.Line( geometry, fibMaterial );
			
			fib.add( line );
		}
		
		if (typeof json.visible === 'boolean' && json.visible === false) {
            // initialize hidden
            fib.visible = false;
		}
		
		fib.name = id;
		fibres.add( fib );
	}
	
	function removeFibs( id ) {
		
	}
	
	function addMesh( id, json ) {
		var vertices = json.vertices;
		var normals = json.normals;
		var indices = json.indices; 
		var colors = json.colors;
		
		var geometry = new THREE.BufferGeometry();
		
		geometry.setIndex( indices );
		geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
		geometry.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
		geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 4 ) );

		var material = new THREE.MeshLambertMaterial( {
			side: THREE.DoubleSide,
			vertexColors: true,
			transparent: true, 
			opacity: 0.5
		} );

		var mesh = new THREE.Mesh( geometry, material );
		
		if (typeof json.visible === 'boolean' && json.visible === false) {
            // initialize hidden
            mesh.visible = false;
		}
		
		mesh.name = id;
		meshes.add( mesh );
	
	}
	
	function setFiberMode( mode ) {
		fiberRenderMode = mode;
	}
	
	function setFibVisible( fibID, visible ) {
			var fib = fibres.getObjectByName( fibID );
			fib.visible = visible;
	}
	
	function setMeshVisible( meshID, visible ) {
		var mesh = meshes.getObjectByName( meshID );
		mesh.visible = visible;
}
	
	function setShowOverlay( show ) {
		showOverlay = show;
	}
	
	function toggleShowOverlay() {
		showOverlay = !showOverlay;
	}
	
	function setStandardView( view )
	{
		if( view == "default" )
		{
			var dims = t1data.getDims();
			
			setSlice( "sliceX", dims.nx / 2 );
			setSlice( "sliceY", dims.ny / 2 );
			setSlice( "sliceZ", dims.nz / 2 );
			
			dispatch.dimsChanged( dims );
			
			arcball.setTranslation( 0, 0 );
			arcball.setRotation( [-1.2, -0.111, 2.5] );
			
			return;
		}
		
		arcball.setView( view );
		camera.zoom = 1.0;
		camera.updateProjectionMatrix();
	}
	
	function resetView()
	{
		var dims = t1data.getDims();
		
		setSlice( "sliceX", dims.nx / 2 );
		setSlice( "sliceY", dims.ny / 2 );
		setSlice( "sliceZ", dims.nz / 2 );
		
		/*
		var sform = t1data.getSForm();
		brainZero = new THREE.Vector3( Math.sign( sform.rowX[0] ) * sform.rowX[3], Math.sign( sform.rowY[1] ) * sform.rowY[3], Math.sign( sform.rowZ[2] ) * sform.rowZ[3] );
		arcball.setRotation( [-1.2, -0.111, 2.5] );
		*/
		dispatch.dimsChanged( dims );
	}
	
	
	return {
		dispatch : dispatch,
		init : init,
		render : render,
		html : html,
		resize : resize,
		size : size,
		setSize : setSize,
		zoom : zoom,
		addConnection : addConnection,
		addConnections : addConnections,
		removeConnections : removeConnections,
		setSlice : setSlice,
		setOverlay : setOverlay,
		setAnatomy : setAnatomy,
		addFibs : addFibs,
		addMesh : addMesh,
		removeFibs : removeFibs,
		setFiberMode : setFiberMode,
		setFibVisible : setFibVisible,
		setMeshVisible : setMeshVisible,
		setShowOverlay : setShowOverlay,
		toggleShowOverlay : toggleShowOverlay,
		setStandardView : setStandardView,
		resetView : resetView
	}
}

})();

});