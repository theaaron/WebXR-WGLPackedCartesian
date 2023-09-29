#version 300 es
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * comp.frag    : time-stepping shader
 *
 * PROGRAMMER   : ABOUZAR KABOUDIAN
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */

#include precision.glsl

in vec2 cc  ;
uniform float   dt ;        // time increment
uniform float   lx ;        // domain length
uniform int     resolution ;// resolution in all directions
uniform int     mx, my ;    /* number of z-layers in S and T directions 
                               of the textures */

// directional information ...............................................
uniform usampler2D  idir0 ;
uniform usampler2D  idir1 ;

#include directionMap.glsl

// coordinate of the system ..............................................
uniform sampler2D   compressed3dCrdt ;

uniform sampler2D   icolor0 ;

// patient data ..........................................................
uniform float   u_c  , u_v  , u_w  , u_d  , t_vm , t_vp , t_wm , t_wp ,
                t_sp , t_sm , u_csi, x_k  , t_d  , t_o  , t_soa, t_sob,
                u_so , x_tso, t_si , t_vmm, diffCoef , C_m ;

#define  u_0  0. 
#define  u_m  1.0 
#define  u_na 0.23 

#include variableMap.glsl

// output color ..........................................................
layout ( location = 0 ) out vec4 ocolor0 ;

/*========================================================================
 * Approximate hyperbolic tangent 
 *========================================================================
 */
float Tanh(float x){
    if ( x<-3.0){
        return -1.0 ;
    } else if (x>3.0){
        return 1.0 ;
    } else {
        return x*(27.0 + x*x)/(27.0+9.0*x*x) ;
    }
}

/*========================================================================
 * main body of the shader
 *========================================================================
 */
void main(){
    // extract pixel values from textures ................................
    ivec2 isize = textureSize(icolor0,        0 ) ;
    ivec2 texelPos = ivec2( cc*vec2(isize) ) ; 
    
    // localizing color values ...........................................
    vec4    color0 = texelFetch(icolor0, texelPos, 0) ;
    
    // directional channels ..............................................
    uvec4 dir0  = texelFetch(idir0 , texelPos, 0 ) ;
    uvec4 dir1  = texelFetch(idir1 , texelPos, 0 ) ;


    // step functions ....................................................
    float   H_u_na  = ( U > u_na    )   ?   1.0 : 0.0 ;
    float   H_u_v   = ( U > u_v     )   ?   1.0 : 0.0 ;
    float   H_u_w   = ( U > u_w     )   ?   1.0 : 0.0 ;
    float   H_u_d   = ( U > u_d     )   ?   1.0 : 0.0 ;
    float   H_u_c   = ( U > u_c     )   ?   1.0 : 0.0 ;

    // I_fi ..............................................................
    float   I_fi = -V*(U-u_na)*(u_m-U)*H_u_na/t_d ;

    // I_so ..............................................................
    float   t_so = t_soa + 0.5  *(t_sob - t_soa)
                                *(1.0 + Tanh((U-u_so)*x_tso)    ) ;

    float   I_so = (U-u_0)*(1.-H_u_c)/t_o + H_u_c/t_so ;

    // I_si ..............................................................
    float   I_si = -W*D/t_si ;
   
    // I_sum .............................................................
    float I_sum = I_fi+I_so+I_si ;

    // V .................................................................
    float   dV2dt = (1. - H_u_na)*(1.-V)/((1.-H_u_v)*t_vm + H_u_v*t_vmm )
                - H_u_na*V/t_vp ;
    V += dV2dt*dt ;

    // W .................................................................
    float   dW2dt = (1.-H_u_w)*(1.-W)/t_wm - H_u_w*W/t_wp ;
    W += dW2dt*dt ;

    // D .................................................................
    float   dD2dt = (  (1.-H_u_d)/t_sm + H_u_d/t_sp         )*
                    (  (1. + Tanh(x_k*(U-u_csi)))*0.5 - D   ) ;
    D += dD2dt*dt ;

   
    // laplacian .........................................................
    float  dx = lx/float(mx*my) ;

    float laplacian = (
            texelFetch( vlt_txtr, unpack( NORTH ), 0 )
        +   texelFetch( vlt_txtr, unpack( SOUTH ), 0 )
        +   texelFetch( vlt_txtr, unpack( EAST  ), 0 )
        +   texelFetch( vlt_txtr, unpack( WEST  ), 0 )
        +   texelFetch( vlt_txtr, unpack( UP    ), 0 )
        +   texelFetch( vlt_txtr, unpack( DOWN  ), 0 )
        -6.*texelFetch( vlt_txtr, texelPos, 0 )         ).vchannel ;

    laplacian = laplacian/(dx*dx) ;

    
    // U .................................................................
    float dU2dt = laplacian*diffCoef - I_sum/C_m ;
    U += dU2dt*dt ;

    // ouput updated color ...............................................
    ocolor0 = vec4(color0) ;
    return ;
}
