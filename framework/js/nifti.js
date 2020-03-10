/**
* A class to handle nifti files and provide slices for web visualisation
*
* @adapted from Ralph Schurade, 2017-03 katjaq
* @copyright Copyright (c) 2011, Ralph Schurade
* @link 
* @license MIT License
*
*/
(function() {
	window.Nifti = function () {
		var data = [];
		var rawData;
		var hdr = {};
		var dimX = 0, dimY=0, dimZ=0;
		var max = -100000;
		var min = 100000;
		var zero = 0;
		var loaded = false;
		var isRadiological = false;
				
		this.download = function(url, callback) {
			var xhr = new XMLHttpRequest();
			xhr.open('GET', url, true);
			xhr.responseType = 'arraybuffer';

			xhr.onload = function(e) {
				rawData = this.response;
				data = new DataView( rawData ); // this.response == uInt8Array.buffer
				parseHeader();
				calcMinMax();		
				checkRadiological();
				
				loaded = true;
				if ( callback ) callback();		
			};
			xhr.send();
		};
		
		this.loadFile = function( file, callback ) {
			var reader = new FileReader();
			reader.onload = function(e) {
				rawData = e.target.result;
				data = new DataView( e.target.result );
				parseHeader();
				calcMinMax();				
				
				loaded = true;
				if ( callback ) callback();		
			};
			reader.readAsArrayBuffer(file);
		}
		
		/*dx delta in x pro voxel*/ 
		/*create header (348, and related to dataype and dimensions create data block*/
		/* 4 byte dazwischen platz --> bei 352 geht daten block los */ 
		/* groesse datablock dimension 1 * 2 * 3 , groesse data * nt, in jedem voxel stehen drei floats, for x y z   */
		/* nx*ny*nz*nt*sizeOfDatatype*/
		
		this.makeNew = function( nx, ny, nz, dx, dy, dz, nt, datatype ) {
			var size = 352 + ( nx * ny * nz * nt * sizeOf( datatype ) );
			/*create byteArray*/
			rawData = new Uint8Array( size );
			data = new DataView( rawData.buffer );
			data.setInt32( 0, 348, true );	
			data.setUint8( 39, 1 ); //toDo: realValue? 1 just like that
			data.setInt16( 40, 5, true );
			data.setInt16( 42, nx, true );
			data.setInt16( 44, ny, true );
			data.setInt16( 46, nz, true );
			data.setInt16( 48, nt, true );
			data.setInt16( 50, nt, true );
			/* missing! fill in!! fslhd ? eigenvector dataset */
			data.setInt16( 68, 1007, true );
			data.setInt16( 70, datatypeCode( datatype ), true );
			/* bitpix... ( 72, */
			data.setFloat32( 80, dx, true );
			data.setFloat32( 84, dy, true );
			data.setFloat32( 88, dz, true );
			/* plus 5 more... float, should be 0 */
			parseHeader();
		}		
		
		function sizeOf( datatype ) {
			switch( datatype ) {
			case 'UINT8': 
				return 1;
				break;
			case 'INT16':
				return 2;
				break;
			case 'INT32':
				return 4;
				break;
			case 'FLOAT32':
				return 4;
				break;
			default:
				return -1;
			}
		}
		
		function datatypeCode( datatype ) {
			switch( datatype ) {
			case 'UINT8': 
				return 2;
				break;
			case 'INT16':
				return 4;
				break;
			case 'INT32':
				return 8;
				break;
			case 'FLOAT32':
				return 16;
				break;
			default:
				return -1;
			}
		}
		
		function parseHeader() {
			hdr.sizeof_hdr = data.getInt32( 0, true ); // 0
			hdr.data_type = []; // 4
			for ( var i = 0; i < 10; ++i ) hdr.data_type.push( data.getUint8(  4 + i ) );
			hdr.db_name = []; // 14
			for ( var i = 0; i < 18; ++i ) hdr.db_name.push( data.getUint8(  14 + i ) );
			hdr.extents = data.getInt32( 32, true ); // 32
			hdr.session_error = data.getInt16( 36, true ) // 36
			hdr.regular = data.getUint8( 38 ); // 38      
			hdr.dim_info = data.getUint8( 39 ); // 39     
			hdr.dim = []; // 40
			for ( var i = 0; i < 8; ++i ) hdr.dim.push( data.getInt16(  40 + i * 2, true ) );					
			hdr.intent_p1  = data.getFloat32( 56, true );  
			hdr.intent_p2  = data.getFloat32( 60, true ); 
			hdr.intent_p3  = data.getFloat32( 64, true ); 
			hdr.intent_code  = data.getInt16( 68, true ); 
			hdr.datatype = data.getInt16( 70, true );     
			hdr.bitpix = data.getInt16( 72, true );       
			hdr.slice_start = data.getInt16( 74, true );  
			hdr.pixdim = [];
			for ( var i = 0; i < 8; ++i ) hdr.pixdim.push( data.getFloat32(  76 + i * 4, true ) );					
			hdr.vox_offset = data.getFloat32( 108, true ); // 108
			hdr.scl_slope  = data.getFloat32( 112, true );  
			hdr.scl_inter  = data.getFloat32( 116, true );  
			hdr.slice_end = data.getInt16( 120, true );    
			hdr.slice_code  = data.getUint8( 122 );  
			hdr.xyzt_units  = data.getUint8( 123 );  
			hdr.cal_max = data.getFloat32( 124, true );     
			hdr.cal_min = data.getFloat32( 128, true );     
			hdr.slice_duration = data.getFloat32( 132, true );
			hdr.toffset = data.getFloat32( 136, true );    
			hdr.glmax = data.getInt32( 140, true );        
			hdr.glmin = data.getInt32( 144, true );        
			hdr.descrip = []; // 148
			for ( var i = 0; i < 80; ++i ) hdr.descrip.push( data.getUint8(  148 + i ) );					
			hdr.aux_file = []; // 228
			for ( var i = 0; i < 24; ++i ) hdr.aux_file.push( data.getUint8(  228 + i ) );					
			hdr.qform_code  = data.getInt16( 252, true );  
			hdr.sform_code  = data.getInt16( 254, true );  
			hdr.quatern_b  = data.getFloat32( 256, true );  
			hdr.quatern_c  = data.getFloat32( 260, true );  
			hdr.quatern_d  = data.getFloat32( 264, true );   
			hdr.qoffset_x  = data.getFloat32( 268, true );   
			hdr.qoffset_y  = data.getFloat32( 272, true );   
			hdr.qoffset_z  = data.getFloat32( 276, true );
			/*
			hdr.sForm = new THREE.Matrix4();
			hdr.sForm.set( data.getFloat32( 280, true ), data.getFloat32( 284, true ), data.getFloat32( 288, true ),data.getFloat32( 292, true ),
					data.getFloat32( 296, true ), data.getFloat32( 300, true ), data.getFloat32( 304, true ),data.getFloat32( 308, true ),
					data.getFloat32( 312, true ), data.getFloat32( 316, true ), data.getFloat32( 320, true ),data.getFloat32( 324, true ),
					data.getFloat32( 328, true ), data.getFloat32( 332, true ), data.getFloat32( 336, true ),data.getFloat32( 340, true ) );
			*/
			
			hdr.srow_x = []; // 280
			for ( var i = 0; i < 4; ++i ) hdr.srow_x.push( data.getFloat32(  280 + i * 4, true ) );
			hdr.srow_y = []; // 296
			for ( var i = 0; i < 4; ++i ) hdr.srow_y.push( data.getFloat32(  296 + i * 4, true ) );
			hdr.srow_z = []; // 312
			for ( var i = 0; i < 4; ++i ) hdr.srow_z.push( data.getFloat32(  312 + i * 4, true ) );
			hdr.intent_name = []; // 328
			for ( var i = 0; i < 16; ++i ) hdr.intent_name.push( data.getUint8(  328 + i ) );					
			hdr.magic = []; // 344
			for ( var i = 0; i < 4; ++i ) hdr.magic.push( data.getUint8(  344 + i ) );					
			
			dimX = hdr.dim[1];
			dimY = hdr.dim[2];
			dimZ = hdr.dim[3];
			
			//console.log( 'hdr.srow: ' + hdr.srow_x + ' ' + hdr.srow_y + ' ' + hdr.srow_z );
		}
		
			
		function calcMinMax() {
			switch( hdr.datatype ) {
			case 2: {
				for ( var i = 348; i < data.byteLength; ++i ) {
					if ( data.getUint8( i ) < min ) min = data.getUint8( i );
					if ( data.getUint8( i ) > max ) max = data.getUint8( i );
				}
				console.log( 'min: ' + min + ' max: ' + max );
				//min = 0;
				//max = 255;
			}
			break;
			case 16: {
				for ( var i = 348; i < data.byteLength; i+=4 ) {
					if ( data.getFloat32( i, true ) < min ) min = data.getFloat32( i, true );
					if ( data.getFloat32( i, true ) > max ) max = data.getFloat32( i, true );
				}
				console.log( 'min: ' + min + ' max: ' + max );
				
				var div = max - min;
				zero = ( 0 - min ) / div;
				for ( var j = 348; j < data.length; j+=4 ) {
					data.setFloat32( j, ( data.getFloat32( j, true ) - min ) / parseFloat( div ), true );
				}
			}
			break;
			default:
				console.log( 'Nifti calcMinMax(): datatype ' + hdr.datatype + ' not defined' );
			}
		}
		
		function checkRadiological() {
			if( hdr.srow_x[0] < 0.0 )
			{
				isRadiological = true;
				console.log( "Radiological orientation detected" );
			}
		};
		
		this.loadFinished = function() {
			return loaded;
		}
		
		this.getImage = function (orient, pos) {
			if ( !loaded ) console.log( 'DEBUG nifti file not finished loading');
			if ( orient === 'sagittal' && pos > hdr.dim[1] ) pos = 0;
			if ( orient === 'coronal' && pos > hdr.dim[2] ) pos = 0;
			if ( orient === 'axial' && pos > hdr.dim[3] ) pos = 0;
			
			if ( hdr.datatype === 2 ) {
				if (hdr.dim[4] === 1 ) {
					return this.getImageGrayByte(orient,pos);
				}
				if (hdr.dim[4] === 3) {
					return this.getImageRGBByte(orient,pos);
				}
			}
			else if ( hdr.datatype === 16 ) {
				if (hdr.dim[4] === 1 ) {
					return this.getImageGrayFloat(orient,pos);
				}
			}
		};
		
		this.getImageGrayByte = function(orient, pos) {
			var c2d = document.createElement('canvas');

			( orient === 'sagittal' ) ? c2d.width = hdr.dim[2] : c2d.width = hdr.dim[1]; 
			( orient === 'axial' ) ? c2d.height = hdr.dim[2] : c2d.height = hdr.dim[3];
			var ctx = c2d.getContext('2d');
			var imageData = ctx.getImageData(0, 0, c2d.width, c2d.height);
			
			if ( orient === 'axial' ) {
				for( var x = 0; x < dimX; ++x )
		            for( var y = 0; y < dimY; ++y )
		            {
		            	var col = data.getUint8( this.getId( x, y, pos ) );
		            	if( isRadiological )
		            	{
		            		var index = 4 * ( y * imageData.width + ( ( dimX - 1 ) - x ) );
    		            	setImgData( index, col );
		            	}
		            	else
		            	{
    		            	var index = 4 * ( y * imageData.width + x );
    		            	setImgData( index, col );
		            	}
		            }
			}
			
			else if ( orient === 'coronal' ) {
				for( var x = 0; x < dimX; ++x )
		            for( var z = 0; z < dimZ; ++z )
		            {
		            	var col = data.getUint8( this.getId( x, pos,z) );
		            	if( isRadiological )
		            	{
		            		var index = 4 * (z * imageData.width + ( ( dimX - 1 ) - x ) );
			            	setImgData( index, col );
		            	}
		            	else
		            	{
		            		var index = 4 * (z * imageData.width + x);
			            	setImgData( index, col );
		            	}
		            	
		            }
			}
			
			else if ( orient === 'sagittal' ) {
				var x = parseInt(pos);
				if( isRadiological )
				{
					x = ( dimX - 1 ) - x;
				}
				
				for( var y = 0; y < dimY; ++y )
		            for( var z = 0; z < dimZ; ++z )
		            {
		            	var col = data.getUint8( this.getId( x, y, z ) );
		            	var index = 4 * (z * imageData.width + y);
		            	setImgData( index, col );
		            }
			}
			ctx.putImageData( imageData, 0, 0 );
			return imageData;
			
			function setImgData( id, col ) {
				imageData.data[id] = col;
                imageData.data[id+1] = col;
                imageData.data[id+2] = col;
                imageData.data[id+3] = ( col > 0 ) ? 255 : 0;
			}
		} 
		
		this.getId = function( x,y,z ) {
			return 352 + x + (y * hdr.dim[1]) + (z * hdr.dim[1] * hdr.dim[2]);
		}
		
		this.getIdFloat = function( x,y,z ) {
			return 352 + ( x + (y * hdr.dim[1]) + (z * hdr.dim[1] * hdr.dim[2]) ) * 4;
		}
		
		
		this.getValueId = function( id ) {
			switch( hdr.datatype ) {
				//UINT8
			case 2:
				return data.getUint8( id );
				//FLOAT32
			case 16:
				if( hdr.dim[5] == 1 ) {
					return data.getFloat32( id, true );	
				}
				if( hdr.dim[5] == 3 ) {
					var out = [];
					var blocksize = hdr.dim[1] * hdr.dim[2] * hdr.dim[3] * 4;
					out[0] = data.getFloat32( id, true );
					out[1] = data.getFloat32( id + blocksize, true );
					out[2] = data.getFloat32( id + blocksize*2, true );	
					return out;
				}
				break;
			default:
					console.log( "Nifti getValue(): datatype not defined" );
			}
		}
		
		this.getValue = function( x, y, z ) {
			switch( hdr.datatype ) {
			//UINT8
			case 2:
				return this.getValueId( this.getId( x,y,z ) );
			//FLOAT32
			case 16:
				return this.getValueId( this.getIdFloat( x, y, z ) );	
			}
		}
		
		this.setValue = function( x, y, z, value ) {
			switch( hdr.datatype ) {
			case 2:
				data.setUint8( this.getId( x, y , z ), value );
				break;
			case 16:
				if( hdr.dim[5] == 1 ) {
					data.setFloat32( this.getIdFloat( x, y, z ), value, true );	
				}
				if( hdr.dim[5] == 3 ) {
					var blocksize = hdr.dim[1] * hdr.dim[2] * hdr.dim[3] * 4;
					data.setFloat32( this.getIdFloat( x, y, z ), value[0], true );
					data.setFloat32( this.getIdFloat( x, y, z ) + blocksize, value[1], true );
					data.setFloat32( this.getIdFloat( x, y, z ) + blocksize*2, value[2], true );	
				}
				break;
			default:
				console.log( 'Nifti setValue(): datatype not defined' );
			}
			
		}
				
		this.getImageRGBByte = function(orient, pos) {
			var c2d = document.createElement('canvas');
			( orient === 'sagittal' ) ? c2d.width = hdr.dim[2] : c2d.width = hdr.dim[1]; 
			( orient === 'axial' ) ? c2d.height = hdr.dim[2] : c2d.height = hdr.dim[3];
			var ctx = c2d.getContext('2d');
			var imageData = ctx.getImageData(0, 0, c2d.width, c2d.height);
			
			var gOff = hdr.dim[1] * hdr.dim[2] * hdr.dim[3];
			var bOff = 2 * gOff;
			
			if ( orient === 'axial' ) {
				for( var x = 0; x < dimX; ++x )
		            for( var y = 0; y < dimY; ++y )
		            {
		            	var r = data.getUint8( this.getId(x,y,pos) );
		            	var g = data.getUint8(parseInt(this.getId(x,y,pos))+parseInt(gOff) );
		            	var b = data.getUint8(parseInt(this.getId(x,y,pos))+parseInt(bOff) );
		            	var index = 4 * (y * imageData.width + x);
		            	setImgData( index, r, g, b );
		            }
			}
			
			if ( orient === 'coronal' ) {
				for( var x = 0; x < dimX; ++x )
		            for( var z = 0; z < dimZ; ++z )
		            {
		                var r = data.getUint8( this.getId(x,pos,z) );
		            	var g = data.getUint8( this.getId(x,pos,z)+gOff );
		            	var b = data.getUint8( this.getId(x,pos,z)+bOff );
		            	var index = 4 * (z * imageData.width + x);
		            	setImgData( index, r, g, b );
		            }
			}
			
			if ( orient === 'sagittal' ) {
				for( var y = 0; y < dimY; ++y )
		            for( var z = 0; z < dimZ; ++z )
		            {
		                var r = data.getUint8( this.getId(pos,y,z) );
		            	var g = data.getUint8( this.getId(pos,y,z)+gOff );
		            	var b = data.getUint8( this.getId(pos,y,z)+bOff );
		            	var index = 4 * (z * imageData.width + y);
		            	setImgData( index, r, g, b );
		            }
			}
			
			return imageData;
			
			setImgData = function( id, r, g, b ) {
				imageData.data[id] = r;
                imageData.data[id+1] = g;
                imageData.data[id+2] = b;
                imageData.data[id+3] = 255;
			}
		}
		
		this.getImageGrayFloat = function(orient, pos) {
			var c2d = document.createElement('canvas');

			( orient === 'sagittal' ) ? c2d.width = hdr.dim[2] : c2d.width = hdr.dim[1]; 
			( orient === 'axial' ) ? c2d.height = hdr.dim[2] : c2d.height = hdr.dim[3];
			var ctx = c2d.getContext('2d');
			var imageData = ctx.getImageData(0, 0, c2d.width, c2d.height);
			
			if ( orient === 'axial' ) {
				for( var x = 0; x < dimX; ++x )
				{
		            for( var y = 0; y < dimY; ++y )
		            {
		            	var col = data.getFloat32( this.getIdFloat(x,y,pos), true );
		            	if( isRadiological )
		            	{
		            		var index = 4 * ( y * imageData.width + ( ( dimX - 1 ) - x ) );
    		            	setImgData( index, col );
		            	}
		            	else
		            	{
    		            	var index = 4 * ( y * imageData.width + x );
    		            	setImgData( index, col );
		            	}
		            }
				}
			}
			
			if ( orient === 'coronal' ) {
				for( var x = 0; x < dimX; ++x )
				{
		            for( var z = 0; z < dimZ; ++z )
		            {
		            	var col = data.getFloat32( this.getIdFloat(x,pos,z), true );
		            	if( isRadiological )
		            	{
		            		var index = 4 * (z * imageData.width + ( ( dimX - 1 ) - x ) );
			            	setImgData( index, col );
		            	}
		            	else
		            	{
		            		var index = 4 * (z * imageData.width + x);
			            	setImgData( index, col );
		            	}
		            }
				}
			}
			
			if ( orient === 'sagittal' ) {
				var x = parseInt(pos);
				if( isRadiological )
				{
					x = ( dimX - 1 ) - x;
				}
				
				for( var y = 0; y < dimY; ++y )
				{
		            for( var z = 0; z < dimZ; ++z )
		            {
		            	var col = data.getFloat32( this.getIdFloat( x, y, z ), true );
		            	var index = 4 * (z * imageData.width + y);
		            	setImgData( index, col );
		            }
				}
			}
			
			return imageData;
			
			function setImgData( id, col ) {
				imageData.data[id] = col / max *255;
                imageData.data[id+1] = col / max *255;
                imageData.data[id+2] = col / max *255;
                imageData.data[id+3] = 255;
			}
		}
		
		this.getRawData = function() {
			return rawData;
		}
		
		this.getMin = function() {
			return min;
		};
		
		this.getMax = function() {
			return max;
		};
		
		this.getDims = function() {
			return { 'nx' : hdr.dim[1], 'ny' : hdr.dim[2], 'nz' : hdr.dim[3], 'dx' : hdr.pixdim[1], 'dy' : hdr.pixdim[2], 'dz' : hdr.pixdim[3] }; 
		};
		
		this.getSForm = function() {
			return { 'rowX' : hdr.srow_x, 'rowY' : hdr.srow_y, 'rowZ' : hdr.srow_z };
		}
	};
})();
