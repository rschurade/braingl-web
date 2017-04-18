/**
* A class to load niftii files and provide slices as png textures.
*
* @version 0.1
* @author Ralph Schurade <schurade@gmx.de>
* @copyright Copyright (c) 2011, Ralph Schurade
* @link 
* @license MIT License
*
*/
define(["d3", "three"], function( d3, three ) {
(function() {
	window.Niftii = function () {
		var data = [];
		var hdr = {};
		var dim1 = 0, dim2=0, dim3=0;
		var max = -1000;
		var min = 1000;
		var zero = 0;
		var type = '';
		var loaded = false;

		var texSize = 128;
				
		this.load = function(url, callback) {
			var xhr = new XMLHttpRequest();
			xhr.open('GET', url, true);
			xhr.responseType = 'arraybuffer';

			xhr.onload = function(e) {
				data = new DataView(this.response); // this.response == uInt8Array.buffer

				hdr.pixdim1 = data.getFloat32( 80, true ); // little endian
				hdr.pixdim2 = data.getFloat32( 84, true );
				hdr.pixdim3 = data.getFloat32( 88, true );
				
				hdr.datatype = data.getInt16( 70, true );
				hdr.dim0 = data.getInt16( 40, true );
				hdr.dim1 = data.getInt16( 42, true );
				hdr.dim2 = data.getInt16( 44, true );
				hdr.dim3 = data.getInt16( 46, true );
				hdr.dim4 = data.getInt16( 48, true );
				hdr.dim5 = data.getInt16( 52, true );
				hdr.dim6 = data.getInt16( 54, true );
				hdr.dim7 = data.getInt16( 56, true );
				dim1 = Math.min( 255, hdr.dim1 );
				dim2 = Math.min( 255, hdr.dim2 );
				dim3 = Math.min( 255, hdr.dim3 );
				
				if ( hdr.datatype === 2 ) {
					for ( var i = 88; i < data.byteLength; ++i ) {
						if ( data.getUint8( i ) < min ) min = data.getUint8( i );
						if ( data.getUint8( i ) > max ) max = data.getUint8( i );
					}
					console.log( "min: " + min + " max: " + max );
					//min = 0;
					//max = 255;
					if (hdr.dim4 === 1 ) {
						type = 'anatomy';
					}
					if (hdr.dim4 === 3) {
						type = 'rgb';
					}
				}

				if ( hdr.datatype === 16 ) {
					for ( var i = 88; i < data.byteLength; i+=4 ) {
						if ( data.getFloat32( i ) < min ) min = data.getFloat32( i );
						if ( data.getFloat32( i ) > max ) max = data.getFloat32( i );
					}
					//console.log( "min: " + min + " max: " + max );
					
					var div = max - min;
					zero = ( 0 - min ) / div;
					for ( var j = 88; j < data.length; j+=4 ) {
						data.setFloat32(j, ( data.getFloat32(j) - min ) / div );
					}
					if ( min < 0 ) {
						type = 'fmri';
					}
					else {
						type = 'overlay';
					}
				}
				
				loaded = true;
				if ( callback ) callback();		
			};
			xhr.send();
		};
		
		this.loaded = function() {
			return loaded;
		}
	
		this.getImage = function (orient, pos) {
			if ( !loaded ) console.log( "DEBUG nifti file not finished loading");
			if ( orient === 'sagittal' && pos > hdr.dim1 ) pos = 0;
			if ( orient === 'coronal' && pos > hdr.dim2 ) pos = 0;
			if ( orient === 'axial' && pos > hdr.dim3 ) pos = 0;
			
			if ( hdr.datatype === 2 ) {
				if (hdr.dim4 === 1 ) {
					return getImageGrayByte(orient,pos);
				}
				if (hdr.dim4 === 3) {
					return getImageRGBByte(orient,pos);
				}
			}
			else if ( hdr.datatype === 16 ) {
				if (hdr.dim4 === 1 ) {
					return getImageGrayFloat(orient,pos);
				}
			}
		};
		
		function getImageGrayByte(orient, pos) {
			var c2d = document.createElement("canvas");
			
			
			
			if ( orient === "axial" ) {
				c2d.width = hdr.dim1;
				c2d.height = hdr.dim2;
				var ctx = c2d.getContext("2d");
				var imageData = ctx.getImageData(0, 0, c2d.width, c2d.height);
				for( var x = 0; x < dim1; ++x )
		        {
		            for( var y = 0; y < dim2; ++y )
		            {
		            	var col = data.getUint8( getId(x,y,pos) );
		            	var index = 4 * (y * imageData.width + x);
		                imageData.data[index] = col;
		                imageData.data[index+1] = col;
		                imageData.data[index+2] = col;
		                imageData.data[index+3] = ( col > 0 ) ? 255 : 0;
		            }
		        }
			}
			
			if ( orient === "coronal" ) {
				c2d.width = hdr.dim1;
				c2d.height = hdr.dim3;
				var ctx = c2d.getContext("2d");
				var imageData = ctx.getImageData(0, 0, c2d.width, c2d.height);
				for( var x = 0; x < dim1; ++x )
		        {
		            for( var z = 0; z < dim3; ++z )
		            {
		            	var col = data.getUint8( getId(x,pos,z) );
		            	var index = 4 * (z * imageData.width + x);
		            	imageData.data[index] = col;
		                imageData.data[index+1] = col;
		                imageData.data[index+2] = col;
		                imageData.data[index+3] = ( col > 0 ) ? 255 : 0;
		            }
		        }
			}
			
			if ( orient === "sagittal" ) {
				c2d.width = hdr.dim2;
				c2d.height = hdr.dim3;
				var ctx = c2d.getContext("2d");
				var imageData = ctx.getImageData(0, 0, c2d.width, c2d.height);
				for( var y = 0; y < dim2; ++y )
		        {
		            for( var z = 0; z < dim3; ++z )
		            {
		            	var col = data.getUint8( getId(pos,y,z) );
		            	var index = 4 * (z * imageData.width + y);
		            	imageData.data[index] = col;
		                imageData.data[index+1] = col;
		                imageData.data[index+2] = col;
		                imageData.data[index+3] = ( col > 0 ) ? 255 : 0;
		            }
		        }
			}
			ctx.putImageData( imageData, 0, 0 );
			return c2d;
		} 
		
		function getId(x,y,z) {
			return 352 + x + (y * hdr.dim1) + (z * hdr.dim1 * hdr.dim2);
		}
		
		function getIdFloat(x,y,z) {
			return 88 + x + (y * hdr.dim1) + (z * hdr.dim1 * hdr.dim2);
		}
		
		function getImageRGBByte(orient, pos) {
			var c2d = document.createElement("canvas");
			c2d.width = texSize;
			c2d.height = texSize;
			var ctx = c2d.getContext("2d");
			var imageData = ctx.getImageData(0, 0, c2d.width, c2d.height);
			
			var gOff = hdr.dim1 * hdr.dim2 * hdr.dim3;
			var bOff = 2 * gOff;
			
			if ( orient === "axial" ) {
				for( var x = 0; x < dim1; ++x )
		        {
		            for( var y = 0; y < dim2; ++y )
		            {
		            	var r = data.getUint8( getId(x,y,pos) );
		            	var g = data.getUint8(parseInt(getId(x,y,pos))+parseInt(gOff) );
		            	var b = data.getUint8(parseInt(getId(x,y,pos))+parseInt(bOff) );
		            	var index = 4 * (y * imageData.width + x);
		            	imageData.data[index] = r;
		                imageData.data[index+1] = g;
		                imageData.data[index+2] = b;
		                imageData.data[index+3] = 255;
		            }
		        }
			}
			
			if ( orient === "coronal" ) {
				for( var x = 0; x < dim1; ++x )
		        {
		            for( var z = 0; z < dim3; ++z )
		            {
		                var r = data.getUint8( getId(x,pos,z) );
		            	var g = data.getUint8( getId(x,pos,z)+gOff );
		            	var b = data.getUint8( getId(x,pos,z)+bOff );
		            	var index = 4 * (z * imageData.width + x);
		            	imageData.data[index] = r;
		                imageData.data[index+1] = g;
		                imageData.data[index+2] = b;
		                imageData.data[index+3] = 255;
		            }
		        }
			}
			
			if ( orient === "sagittal" ) {
				for( var y = 0; y < dim2; ++y )
		        {
		            for( var z = 0; z < dim3; ++z )
		            {
		                var r = data.getUint8( getId(pos-1+1,y,z) );
		            	var g = data.getUint8( getId(pos-1+1,y,z)+gOff );
		            	var b = data.getUint8( getId(pos-1+1,y,z)+bOff );
		            	var index = 4 * (z * imageData.width + y);
		            	imageData.data[index] = r;
		                imageData.data[index+1] = g;
		                imageData.data[index+2] = b;
		                imageData.data[index+3] = 255;
		            }
		        }
			}
			
			return imageData;
		}
		
		function getImageGrayFloat(orient, pos) {
			var c2d = document.createElement("canvas");
			c2d.width = texSize;
			c2d.height = texSize;
			var ctx = c2d.getContext("2d");
			var imageData = ctx.getImageData(0, 0, c2d.width, c2d.height);
			
			for ( var i = 0; i < 256*256; ++i ) {
				imageData.data[i*4] = zero*255;
                imageData.data[i*4+1] = zero*255;
                imageData.data[i*4+2] = zero * 255;
                imageData.data[i*4+3] = 255;
			}
			
			if ( orient === "axial" ) {
				for( var x = 0; x < dim1; ++x )
		        {
		            for( var y = 0; y < dim2; ++y )
		            {
		            	var col = data.getFloat32( getIdFloat(x,y,pos) );
		            	var index = 4 * (y * imageData.width + x);
		                imageData.data[index] = col * 255;
		                imageData.data[index+1] = col * 255;
		                imageData.data[index+2] = col * 255;
		                imageData.data[index+3] = 255;
		            }
		        }
			}
			
			if ( orient === "coronal" ) {
				for( var x = 0; x < dim1; ++x )
		        {
		            for( var z = 0; z < dim3; ++z )
		            {
		            	var col = data.getFloat32( getIdFloat(x,pos,z) );
		            	var index = 4 * (z * imageData.width + x);
		            	imageData.data[index] = col * 255;
		                imageData.data[index+1] = col * 255;
		                imageData.data[index+2] = col * 255;
		                imageData.data[index+3] = 255;
		            }
		        }
			}
			
			if ( orient === "sagittal" ) {
				for( var y = 0; y < dim2; ++y )
		        {
		            for( var z = 0; z < dim3; ++z )
		            {
		            	var col = data.getFloat32( getIdFloat(pos-1+1,y,z) );
		            	var index = 4 * (z * imageData.width + y);
		            	imageData.data[index] = col * 255;
		                imageData.data[index+1] = col * 255;
		                imageData.data[index+2] = col * 255;
		                imageData.data[index+3] = 255;
		            }
		        }
			}
			
			return imageData;
		}
		
		this.getMin = function() {
			return min;
		};
		
		this.getMax = function() {
			return max;
		};
		
		this.getDims = function() {
			return { "nx" : hdr.dim1, "ny" : hdr.dim2, "nz" : hdr.dim3, "dx" : hdr.pixdim1, "dy" : hdr.pixdim2, "dz" : hdr.pixdim3 }; 
		};
		
		this.getType = function() {
			return type;
		};
	};
})();

});