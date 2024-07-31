#version 300 es
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * repack.frag  : Map the data in a full-texture to a compact texture
 * 
 * PROGRAMMER   : ABOUZAR KABOUDIAN
 * DATE         : Wed 15 May 2024 11:11:15 (EDT)
 * PLACE        : Maryland, USA.
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */
#include precision.glsl


/*------------------------------------------------------------------------
 * interface variables
 *------------------------------------------------------------------------
 */
in vec2 cc ;
uniform usampler2D fullTexelIndex, compressedTexelIndex ;
uniform sampler2D  icolor ;

/*------------------------------------------------------------------------
 * output textures
 *------------------------------------------------------------------------
 */
layout (location = 0) out vec4 vcolor ;

/*========================================================================
 * main body of the shader
 *========================================================================
 */
void main(){
    // get the sizes of the compressed and the full domain ...............
    ivec2 compSize = textureSize(fullTexelIndex,        0 ) ;
    ivec2 fullSize = textureSize(compressedTexelIndex,  0 ) ;

    // get the position indices ..........................................
    ivec2 texelPos = ivec2( cc*vec2(compSize) ) ; 
    ivec4 fullTexelIndx = 
        ivec4( texelFetch(  fullTexelIndex, texelPos, 0) ) ;

    // get the output color from the full texture ........................
    vcolor = texelFetch( icolor, fullTexelIndx.xy, 0 ) ;

    return ;
}
