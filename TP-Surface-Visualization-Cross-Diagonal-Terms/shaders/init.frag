#version 300 es
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * init2.frag   : initialize color-sets for TP model   
 * 
 * PROGRAMMER   : ABOUZAR KABOUDIAN
 * DATE         : Tue 09 May 2023 12:02:53 (EDT)
 * PLACE        : Maryland, USA.
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */

#include precision.glsl

// interface variables ...................................................
in vec2 cc ;

// variable macros .......................................................
#include    variables.glsl

uniform int cellType ;

// color outputs .........................................................
layout (location = 0) out vec4 ocolor0 ; 
layout (location = 1) out vec4 ocolor1 ; 
layout (location = 2) out vec4 ocolor2 ; 
layout (location = 3) out vec4 ocolor3 ; 
layout (location = 4) out vec4 ocolor4 ; 

/*========================================================================
 * main body of the shader
 *========================================================================
 */
void main(){
    // color declarations ................................................
    vec4 color0, color1, color2, color3,  color4;

    if (cellType == EPI){
        // Epi cells
        V       = -85.46 ;
        Cai     = 0.0001029;
        CaSR    = 3.432;
        CaSS    = 0.0002120;
        Nai     = 9.293;
        Ki      = 136.2;
        sm      = 0.001633;
        sh      = 0.7512;
        sj      = 0.7508;
        sxr1    = 0.0002052;
        sxr2    = 0.4736;
        sxs     = 0.003214;
        sr      = 2.326e-8;
        ss      = 1.000;
        sd      = 3.270e-5;
        sf      = 0.9767;
        sf2     = 0.9995;
        sfcass  = 1.000;
        sRR     = 0.9891;
    }else if (cellType == MYO){
        // M-cells
        V       = -84.53;
        Cai     = 0.0001156;
        CaSR    = 4.130;
        CaSS    = 0.0002331;
        Nai     = 9.322;
        Ki      = 136.0;
        sm      = 0.001694;
        sh      = 0.7466;
        sj      = 0.7457;
        sxr1    = 0.0002140;
        sxr2    = 0.4718;
        sxs     = 0.003343;
        sr      = 2.392e-8;
        ss      = 1.000;
        sd      = 3.345e-5;
        sf      = 0.9595;
        sf2     = 0.9995;
        sfcass  = 1.000;
        sRR     = 0.9874;
    }else{
        // endo
        V       = -84.70;
        Cai     = 0.0001021;
        CaSR    = 3.385;
        CaSS    = 0.0002111;
        Nai     = 9.413;
        Ki      = 136.1;
        sm      = 0.001634;
        sh      = 0.7512;
        sj      = 0.7508;
        sxr1    = 0.0002051;
        sxr2    = 0.4736;
        sxs     = 0.003213;
        sr      = 2.326e-8;
        ss      = 0.6401;
        sd      = 3.270e-5;
        sf      = 0.9771;
        sf2     = 0.9995;
        sfcass  = 1.000;
        sRR     = 0.9891;
    }

    // output colors .....................................................
    ocolor0 = vec4(color0 ) ;
    ocolor1 = vec4(color1 ) ;
    ocolor2 = vec4(color2 ) ;
    ocolor3 = vec4(color3 ) ;
    ocolor4 = vec4(color4 ) ;

    return ;
}
