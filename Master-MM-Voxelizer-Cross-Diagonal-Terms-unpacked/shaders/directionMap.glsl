/*========================================================================
 * all direction macros go here for safe access
 *========================================================================
 */
#define NORTH   dir0.r
#define SOUTH   dir0.g
#define EAST    dir0.b
#define WEST    dir0.a

#define UP      dir1.r
#define DOWN    dir1.g

#define MS12    dir2.r
#define PS12    dir2.g
#define MS13    dir2.b
#define PS13    dir2.a

#define MS21    dir3.r
#define PS21    dir3.g
#define MS23    dir3.b
#define PS23    dir3.a

#define MS31    dir4.r
#define PS31    dir4.g
#define MS32    dir4.b
#define PS32    dir4.a

#include uintpacking.glsl
