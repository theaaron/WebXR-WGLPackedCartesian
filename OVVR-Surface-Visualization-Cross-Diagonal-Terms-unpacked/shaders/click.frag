#version 300 es
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * click.frag   : Create activations on the tissue
 * 
 * PROGRAMMER   : ABOUZAR KABOUDIAN
 * DATE         : Thu 04 May 2023 17:10:13 (EDT)
 * PLACE        : Maryland, USA.
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */

#include precision.glsl

// interfacial variables .................................................
in vec2 cc ;

uniform sampler2D   icolor4 ;
uniform sampler2D   full3dCrdt ;

uniform sampler2D   projectedCoordinates ;
uniform vec2        clickPosition ;

uniform float       clickRadius ;

// output color ..........................................................
layout (location = 0) out vec4 ocolor4 ;

#include variables.glsl

/*========================================================================
 * main
 *========================================================================
 */
void main(){
    vec4 color4 = texture( icolor4 , cc ) ;
    vec3 texelCrdt = texture(full3dCrdt, cc ).xyz ;
    vec3 clickCrdt = texture(projectedCoordinates, clickPosition ).xyz ; 

    if (length(texelCrdt - clickCrdt )<clickRadius ){
        vlt = 1. ;
    }

    ocolor4 = vec4(color4) ;
    return ;
}
