attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform vec3 uLightLocation;

varying vec4 vPosition;
varying vec3 vLightPos;
varying vec3 vNormal;
varying vec3 vColor;
uniform float uAlpha;
varying vec2 vTextureCoord;

void main(void) 
{
	vPosition = uPMatrix * uMVMatrix * vec4( aVertexPosition, 1.0);
	vLightPos = uLightLocation;
	vNormal = normalize(aVertexNormal);
	//vColor = aTextureCoord;
	vTextureCoord = aTextureCoord;
	
	if ( uAlpha > 0.99 ) 
	{
		vPosition.z = vPosition.z + 0.5;
	}
	
	gl_Position = vPosition;
}