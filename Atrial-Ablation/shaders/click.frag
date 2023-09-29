#version 300 es
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * click.frag   : Excite the region that is clicked
 *
 * PROGRAMMER   : ABOUZAR KABOUDIAN
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */
#include precision.glsl

// interfacial variables .................................................
in vec2 cc ;

uniform sampler2D   icolor0 ;
uniform sampler2D   compressed3dCrdt ;

uniform sampler2D   projectedCoordinates ;
uniform vec2        clickPosition ;

uniform float       clickRadius ;

// output color ..........................................................
layout (location = 0) out vec4 ocolor0 ;

#include variableMap.glsl

/*========================================================================
 * main
 *========================================================================
 */
void main(){
    vec4 color0 = texture( icolor0 , cc ) ;
    vec3 texelCrdt = texture(compressed3dCrdt, cc ).xyz ;
    vec3 clickCrdt = texture(projectedCoordinates, clickPosition ).xyz ; 

    if (length(texelCrdt - clickCrdt )<clickRadius ){
        U = 1. ;
    }

    ocolor0 = vec4(color0) ;
    return ;
}
