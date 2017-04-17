define ( ["three"], (function( THREE ) {
	
var Epsilon = 0.00001;
var width = 500; 										// width of window
var height = 500; 										// height of window
var adjust_width  = 1.0 / ((width - 1.0) * 0.5);
var adjust_height = 1.0 / ((height - 1.0) * 0.5);
var m_zoom = 1.0;

var v_mouse_current = new THREE.Vector3();  			// mouse position at the beginning of dragging
var v_mouse_down = new THREE.Vector3();  				// mouse position at the beginning of dragging
var q_current_rotation = new THREE.Quaternion();		// current rotation
var m_rot = new THREE.Matrix4();				 		// current rotation matrix
var v_from = new THREE.Vector3();
var lastRot = new THREE.Matrix4();


/// maps the specified mouse position to the sphere defined
/// with center and radius. the resulting vector lies on the
/// surface of the sphere.
function map_sphere(mouse)
{
	tmpx = ( mouse.x * adjust_width ) - 1.0;
	tmpy = 1.0 - ( mouse.y * adjust_height );
	
	length = ( tmpx * tmpx ) + ( tmpy  *tmpy );

	bm = new THREE.Vector3(); 
	if ( length > 1.0 )
	{
		norm = 1.0 / Math.sqrt( length );
		bm.setX( tmpx * norm );
		bm.setY( tmpy * norm );
		bm.setZ( 0.0 );
	}
	else
	{
		bm.setX( tmpx );
		bm.setY( tmpy );
		bm.setZ( Math.sqrt( 1.0 - length ) );
	}
	return bm;			
}



// after here public functions

/// sets the window size.
function setViewportDims(width_, height_)
{ 
	width = width_; 
	height = height_; 
	adjust_width  = 1.0 / ((width - 1.0) * 0.5);
	adjust_height = 1.0 / ((height - 1.0) * 0.5);
}

/// sets the current position and calculates the current
/// rotation matrix.
function drag(x, y)
{
	v_mouse_current.setX( x );
	v_mouse_current.setY( y );
	v_mouse_current.setZ( 0.0 );
	
	v_to   = map_sphere( v_mouse_current );
	perp = new THREE.Vector3();
	perp.crossVectors( v_from, v_to );

	if ( perp.length() > Epsilon )
	{
		q_current_rotation.set( perp.x, perp.y, perp.z, (v_from.x * v_to.x) + (v_from.y * v_to.y) + (v_from.z * v_to.z) );
	}
	else
	{
		q_current_rotation.set( 0, 0, 0, 0 );
	}
		
	m_rot.makeRotationFromQuaternion( q_current_rotation);
	m_rot.multiply( lastRot );
}

/// indicates the beginning of the dragging.
function click(x,y)
{
	lastRot.copy( m_rot );
	v_mouse_down.setX( x );
	v_mouse_down.setY( y );
	v_mouse_down.setZ( 0.0 );
	v_from = map_sphere(v_mouse_down);
}

/// returns the rotation matrix to be used directly
function get()
{ 
	return m_rot;
	
	
	
	/*
	var mv = mat4.create();
	mat4.identity( mv );
	
	var halfMove = vec3.create();
	halfMove[0] = -moveX;
	halfMove[1] = moveY;
	halfMove[2] = 0;
	mat4.translate( mv, halfMove );
	
	
	var scale = vec3.create();
	scale[0] = m_zoom;
	scale[1] = m_zoom;
	scale[2] = m_zoom;
	mat4.scale( mv, scale );
	
	mat4.inverse( m_rot );
	mat4.multiply( mv, m_rot );
	mat4.inverse( m_rot );
	
	var halfMove = vec3.create();
	halfMove[0] = -80;
	halfMove[1] = -100;
	halfMove[2] = -80;
	
	mat4.translate( mv, halfMove );
	
	return mv;
	*/
}

function zoomIn() {
	if ( m_zoom < 1.0 ) {
		m_zoom += 0.05;
	}
	else {
		m_zoom += ( m_zoom - 0.9 ) / 2;
	}
}

function zoomOut() {
	if ( m_zoom < 1.0 ) {
		m_zoom -= 0.05;
	}
	else {
		m_zoom -= ( m_zoom - 0.9 ) / 2;
	}
	if ( m_zoom < 0.1 ) {
		m_zoom = 0.1;
	}
}

function setZoom( zoom ) {
	m_zoom = zoom;
}

var midClickX = 0;
var midClickY = 0;
var moveX = 0;
var moveY = 0;
var oldMoveX = 0;
var oldMoveY = 0;

function midClick( x, y ) {
	oldMoveX = moveX;
	oldMoveY = moveY;
	midClickX = x;
	midClickY = y;
}

function midDrag( x, y ) {
	moveX = ( midClickX - x ) / 3 + oldMoveX;
	moveY = ( midClickY - y ) / 3 + oldMoveY;
}

function reset() {
	v_mouse_current = new THREE.Vector3();
	v_mouse_down = new THREE.Vector3();
	q_current_rotation = new THREE.Quaternion();
	m_rot = new THREE.Matrix4();
	v_from = new THREE.Vector3();
	lastRot = new THREE.Matrix4();
}

function setTranslation( x, y ) {
	moveX = x;
	moveY = y;
}

function setRotation( rot ) {
	m_rot = rot;
}

return {
	setViewportDims: setViewportDims,
	click: click,
	drag: drag,
    get: get,
    zoomIn : zoomIn,
	zoomOut : zoomOut,
	setZoom : setZoom,
	midClick : midClick,
	midDrag: midDrag,
	reset: reset,
	setTranslation : setTranslation,
	setRotation : setRotation
};
}));