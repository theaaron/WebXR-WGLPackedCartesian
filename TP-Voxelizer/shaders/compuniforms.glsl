
/* uniform samplers of state variables  */
uniform sampler2D   icolor0, icolor1, icolor2, icolor3, icolor4 ;

uniform float   dt ;        /* time step                */
uniform float   lx ;        /* domain size in x,y-dir   */
uniform float   diffCoef ;  /* diffusion coeficient     */
uniform float   C_m ;       /* membrane capacitance     */
uniform int     mx, my ;    /* number of z-layers in 
                               S and T directions 
                               of the textures          */
uniform float   capacitance ;

// directional information ...............................................
uniform usampler2D  idir0 ;
uniform usampler2D  idir1 ;

#include directionMap.glsl

// coordinate of the system ..............................................
uniform sampler2D   compressed3dCrdt ;
       
uniform int         cellType ;
uniform float   C_CaL, C_pCa, C_bCa, C_leak, C_up, C_xfer, C_rel , 
                C_Na,  C_bNa, C_NaK, C_NaCa, C_K1, C_to,
                C_Kr,  C_Ks,  C_pK ;
