define ( ["three"], (function( THREE ) {
	
var Epsilon = 0.00001;
var width = 500; 										// width of window
var height = 500; 										// height of window
var adjust_width  = 1.0 / ((width - 1.0) * 0.5);
var adjust_height = 1.0 / ((height - 1.0) * 0.5);
var m_zoom = 1.0;

var v_mouse_current = new THREE.Vector3();  		// mouse position at the beginning of dragging
var v_mouse_down = new THREE.Vector3();  			// mouse position at the beginning of dragging
var q_current_rotation = new THREE.Quaternion();	// current rotation
var m_rot = new THREE.Matrix4();				 			// current rotation matrix
var v_from = new THREE.Vector3();
var lastRot = new THREE.Matrix4();

var m_rotTarget = new THREE.Quaternion();
var m_oldRot = new THREE.Quaternion();
var m_interpolating = false;
var m_interpolateStep = 0;


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
	if ( m_interpolating ) {
		++m_interpolateStep;
		if ( m_interpolateStep == 50 ) {
			m_interpolating = false;
		}
		else {
			// slerp quats
			d = Math.log( m_interpolateStep ) / Math.log( 50 );
			qrot = new THREE.Quaternion();
			THREE.Quaternion.slerp( m_oldRot, m_rotTarget, qrot, d );
			// set rot
			m_rot.makeRotationFromQuaternion( qrot );
		}
	}
	
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

function slerp(qa, qb, t) 
{
	// quaternion to return
	qm = new THREE.Quaternion();
	// Calculate angle between them.
	cosHalfTheta = qa.w * qb.w + qa.x * qb.x + qa.y * qb.y + qa.z * qb.z;
	// if qa=qb or qa=-qb then theta = 0 and we can return qa
	if (Math.abs(cosHalfTheta) >= 1.0)
	{
		qm.w = qa.w;qm.x = qa.x;qm.y = qa.y;qm.z = qa.z;
		return qm;
	}
	// Calculate temporary values.
	halfTheta = Math.acos(cosHalfTheta);
	sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta*cosHalfTheta);
	// if theta = 180 degrees then result is not fully defined
	// we could rotate around any axis normal to qa or qb
	if (Math.abs(sinHalfTheta) < 0.001)
	{ // fabs is floating point absolute
		qm.w = (qa.w * 0.5 + qb.w * 0.5);
		qm.x = (qa.x * 0.5 + qb.x * 0.5);
		qm.y = (qa.y * 0.5 + qb.y * 0.5);
		qm.z = (qa.z * 0.5 + qb.z * 0.5);
		return qm;
	}
	ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
	ratioB = Math.sin(t * halfTheta) / sinHalfTheta; 
	//calculate Quaternion.
	w = (qa.w * ratioA + qb.w * ratioB);
	x = (qa.x * ratioA + qb.x * ratioB);
	y = (qa.y * ratioA + qb.y * ratioB);
	z = (qa.z * ratioA + qb.z * ratioB);
	qm.set( x, y, z, w );
	return qm;
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

function translation() {
	return { "x": moveX, "y": moveY };
}

function setRotation( rot ) {
	m_rot = rot;
}

function interpolateTo( rot ) {
	nextRot = new THREE.Matrix4();	
	var m1 = new THREE.Matrix4();
	var m2 = new THREE.Matrix4();
	var m3 = new THREE.Matrix4();
	m1.makeRotationX( rot[0] );
	m2.makeRotationY( rot[1] );
	m3.makeRotationZ( rot[2] );
	nextRot.multiplyMatrices( m1, m2 );
	nextRot.multiply( m3 );
	m_rotTarget.setFromRotationMatrix( nextRot );
	m_interpolating = true;
	m_interpolateStep = 0;
	m_oldRot = new THREE.Quaternion();
	m_oldRot.setFromRotationMatrix( m_rot );
	
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
	translation : translation,
	setRotation : setRotation,
	interpolateTo : interpolateTo
};
}));