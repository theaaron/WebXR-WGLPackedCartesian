#version 300 es
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * comp.frag    : time-stepping shader
 * 
 * PROGRAMMER   : ABOUZAR KABOUDIAN
 * DATE         : Tue 02 May 2023 12:35:21 (EDT)
 * PLACE        : Maryland, USA.
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
uniform float   tau_m_v1    , tau_m_v2    , tau_p_v     , 
                tau_m_w1    , tau_m_w2    , tau_p_w1    , 
                tau_p_w2    , tau_s1      , tau_s2      , 
                tau_fi      , tau_o1      , tau_o2      , 
                tau_so1     , tau_so2     , tau_si1     , 
                tau_si2     , tau_winf    , theta_v     , 
                theta_p_v   , theta_m_v   , theta_vinf  , 
                theta_w     , theta_winf  , theta_so    , 
                theta_si    , theta_p_si  , theta_si_c  , 
                theta_s     , theta_o     , k_m_w       , 
                k_p_w       , k_s         , k_so        , 
                k_si        , k_si1       , k_si2       , 
                k_si_c      , u_m_w       , u_s         , 
                u_o         , u_u         , u_so        , 
                w_sinf      , w_p_c       , s_c         , 
                alpha_w     , alpha_si    , beta_v      , 
                gamma_si    , delta_w     , u_p_w       ,
                diffCoef, C_m ;
 
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
    float  H_theta_v       = ( u > theta_v     )  ? 1.0:0.0 ;
    float  H_theta_m_v     = ( u > theta_m_v   )  ? 1.0:0.0 ;
    float  H_theta_w       = ( u > theta_w     )  ? 1.0:0.0 ;
    float  H_theta_so      = ( u > theta_so    )  ? 1.0:0.0 ;
    float  H_theta_si      = ( u > theta_si    )  ? 1.0:0.0 ;
    float  H_theta_s       = ( u > theta_s     )  ? 1.0:0.0 ;
    float  H_theta_o       = ( u > theta_o     )  ? 1.0:0.0 ;
    float  H_theta_vinf    = ( u > theta_vinf  )  ? 1.0:0.0 ;
    float  H_theta_winf    = ( u > theta_winf  )  ? 1.0:0.0 ;

    // RHS Variables .....................................................
    float tau_m_v = ( 1.0 - H_theta_m_v )*tau_m_v1 
                    + H_theta_m_v*tau_m_v2 ;
    float tau_m_w = tau_m_w1 
        + (tau_m_w2-tau_m_w1)*(1.+Tanh(k_m_w*(u-u_m_w)))*0.5 ;
    float  tau_p_w = tau_p_w1 
        + (tau_p_w2-tau_p_w1)*(1.+Tanh(k_p_w*(
                        delta_w*(w-w_p_c) + (1.-delta_w)*(u-u_p_w))))*0.5 ;
    float tau_s   = (1. - H_theta_s)*tau_s1 + H_theta_s*tau_s2 ;
    float tau_o   = (1. - H_theta_o)*tau_o1 + H_theta_o*tau_o2 ;
    float tau_so  = tau_so1 
        + (tau_so2 - tau_so1)*(1.+Tanh(k_so*(u-u_so)))*0.5 ;
    float  tau_si  = tau_si1 
        + (tau_si2 - tau_si1)*(1.+Tanh(k_si*(s-s_c)))*0.5 ;
    float  tau_p_si = alpha_si*(1.+exp(k_si1*(u-theta_p_si)))/
        (1.-Tanh(k_si2*(u-theta_p_si))) ;

    float v_inf = 1. - H_theta_vinf ;
    float w_inf = (1.-H_theta_winf)*(1.-u/tau_winf) 
            + H_theta_winf*w_sinf ;
    // v .................................................................
    float  dv2dt   =   (1.-H_theta_v)*(v_inf - v)/tau_m_v 
                    -   H_theta_v * v /tau_p_v ;
    v += dv2dt*dt ;

    // w .................................................................
    float  wx  =   (2.-alpha_w)*(3.-alpha_w)*(4.-alpha_w)*w/6.0
                +   (alpha_w-1.)*(3.-alpha_w)*(4.-alpha_w)*0.5*w*w 
                +   (alpha_w-1.)*(alpha_w-2.)*(4.-alpha_w)*0.5*w*w*w
                +   (alpha_w-1.)*(alpha_w-2.)*(alpha_w-3.)*w*w*w*w/6. ;
    
    float dw2dt    = (1.-H_theta_w)*(w_inf-wx)/tau_m_w
                    - H_theta_w*w/tau_p_w ;
    w += dw2dt*dt ;

    // s .................................................................
    float   ds2dt   = ((1.+tanh(k_s*(u-u_s)))*0.5-s)/tau_s ;
    s += ds2dt*dt ;

    // I_sum .............................................................
    float  J_fi    = -v*H_theta_v*(u-theta_p_v)*(u_u - u )/tau_fi ;
    float  J_so    = (u - u_o)*(1.-H_theta_so)*(1.-beta_v*v)/tau_o
                    + H_theta_so/tau_so ;
    float  J_si ;  
    if (gamma_si > 0.5) 
        J_si = -H_theta_si*w*s/tau_si ;
    else
        J_si = -(1.+tanh(k_si_c*(u-theta_si_c)))*w/tau_p_si ;

    float  I_sum   = J_fi + J_so + J_si ;
   
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

    
    // u .................................................................
    float du2dt = laplacian*diffCoef - I_sum/C_m ;
    u += du2dt*dt ;

    // ouput updated color ...............................................
    ocolor0 = vec4(color0) ;
    return ;
}
