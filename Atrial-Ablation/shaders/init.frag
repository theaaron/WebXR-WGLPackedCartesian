#version 300 es
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * init.frag    : initialize the solution
 *
 * PROGRAMMER   : ABOUZAR KABOUDIAN
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

    U = 0.01 ;
    V = 1. ;
    W = 1. ;
    D = 0.03 ;

    if ( crd.y <0.8 ){
        if ( crd.x >0.45 && crd.x<0.5)
            U = 1. ;
        if ( crd.x >0.5 && crd.x<0.6)
            V = 0. ;
    }

    ocolor0 = vec4(color0) ;
}

