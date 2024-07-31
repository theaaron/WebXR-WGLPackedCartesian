#version 300 es
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * init.frag    : initialize the solution
 * 
 * PROGRAMMER   : ABOUZAR KABOUDIAN
 * DATE         : Tue 02 May 2023 12:34:31 (EDT)
 * PLACE        : Maryland, USA.
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */

#include precision.glsl

// interfacial variables .................................................
in vec2 cc ;
uniform sampler2D   compressed3dCrdt ;

// output colors .........................................................
layout (location  = 0) out vec4 ocolor0 ;

// color macros ..........................................................
#include variableMap.glsl

/*========================================================================
 * main body of the shader
 *========================================================================
 */
void main(){
    vec4 color0 ;

    // 3d coordinate of the texel
    vec3 crd = texture(compressed3dCrdt , cc).xyz ;

    u = 0.01 ;
    v = 1. ;
    w = 1. ;
    s = 0.03 ;

    ocolor0 = vec4(color0) ;
}

