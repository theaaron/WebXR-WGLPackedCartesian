/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * app.js       : 4V Minimal Model  
 *
 * PROGRAMMER   : ABOUZAR KABOUDIAN
 * DATE         : Wed 03 May 2023 10:38:09 (EDT)
 * PLACE        : Maryland, USA.
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */

"use strict" ;

/*========================================================================
 * get the source code for fragment shaders
 *========================================================================
 */
function source( id ){
    return document.getElementById( id ).innerHTML ;
}
/*========================================================================
 * Global Parameters
 *========================================================================
 */
let env = {} ;

/*========================================================================
 * import surface data
 *========================================================================
 */
let loadedJSON ;

/*========================================================================
 * let the user select the file
 *========================================================================
 */
var fileInput = document.getElementById('json_structure') ;

fileInput.onchange = function(){
  let file = fileInput.files[0] ;
  if ( !file ){
      return ;
  }
  let reader = new FileReader() ;
  reader.readAsText(file) ;

  reader.onload = function(e){
      let result = e.target.result ;
      loadedJSON = JSON.parse(result) ;
      $('#chooser').hide() ;
      $('.loaded').show() ;
      loadWebGL() ;
  } ;
}

/*========================================================================
 * read from file on the server
 *========================================================================
 */
//let structureFile = new XMLHttpRequest();
//
//structureFile.onreadystatechange = () => {
//    if (structureFile.readyState == 4 && structureFile.status == 200) {
//        loadedJSON = JSON.parse(structureFile.responseText);
//        console.log(loadedJSON) ;
//        loadWebGL() ;
//    }
//};
//console.log("324") ;
//structureFile.open("GET", "jsons/01-350um-128-128-128.json", true);
//structureFile.send();
var gl = Abubu.gl ;
/*========================================================================
 * Initialization of the GPU and Container
 *========================================================================
 */
function loadWebGL()
{
    env.allFloats   = [] ; // uniform shared floats
    env.allInts     = [] ; // uniform shared integers
    env.allTxtrs    = [] ; // uniform shared textures

/*------------------------------------------------------------------------
 * display parameters
 *------------------------------------------------------------------------
 */
    env.colormap    = 'rainbowHotSpring' ;
    env.dispWidth   = 512 ;
    env.dispHeight  = 512 ;

    env.canvas_1 = document.getElementById("canvas_1") ;
    env.canvas_2 = document.getElementById("canvas_2") ;
    env.canvas_1.width  = env.dispWidth ;
    env.canvas_1.height = env.dispHeight ;

/*------------------------------------------------------------------------
 * load the structure and process it
 *------------------------------------------------------------------------
 */
    env.mx = loadedJSON.mx ; env.my = loadedJSON.my ;
    env.allInts = [...env.allInts, 'mx','my' ] ;

    env.structure = new Abubu.StructureFromJSON( loadedJSON ) ;

    env.width                   = env.structure.width ;
    env.height                  = env.structure.height ;
    env.fwidth                  = env.structure.fwidth ; 
    env.fheight                 = env.structure.fheight ;

    env.fullTexelIndex          = env.structure.fullTexelIndex ;
    env.compressedTexelIndex    = env.structure.compressedTexelIndex ;
    env.full3dCrdt              = env.structure.full3dCrdt ;
    env.compressed3dCrdt        = env.structure.compressed3dCrdt ;
    env.normals                 = env.structure.normals ;

    env.loaded = true ;

    env.allTxtrs = [...env.allTxtrs, 'compressed3dCrdt' ] ;  
    

/*------------------------------------------------------------------------
 * zero-flux directionator 
 *------------------------------------------------------------------------
 */
    env.dir0 = new Abubu.Uint32Texture( env.width, env.height ) ;
    env.dir1 = new Abubu.Uint32Texture( env.width, env.height ) ;
    env.dir2 = new Abubu.Uint32Texture( env.width, env.height ) ;
    env.dir3 = new Abubu.Uint32Texture( env.width, env.height ) ;
    env.dir4 = new Abubu.Uint32Texture( env.width, env.height ) ;

    env.idir0 = env.dir0 ;
    env.idir1 = env.dir1 ;
    env.idir2 = env.dir2 ;
    env.idir3 = env.dir3 ;
    env.idir4 = env.dir4 ;

    env.directionator = new Abubu.Solver({
        fragmentShader : source('directionator') ,
        uniforms : {
            mx : { type : 'i' , value : env.mx } ,
            my : { type : 'i' , value : env.my } ,
            fullTexelIndex : { 
                type : 't', value : env.fullTexelIndex 
            } ,
            compressedTexelIndex : { 
                type : 't', value : env.compressedTexelIndex
            } ,
        },
        targets: {
            odir0 : { location : 0, target : env.dir0 } ,
            odir1 : { location : 1, target : env.dir1 } ,
            odir2 : { location : 2, target : env.dir2 } ,
            odir3 : { location : 3, target : env.dir3 } ,
            odir4 : { location : 4, target : env.dir4 } ,
        }
    } ) ;
    env.directionator.render() ; 

    env.allTxtrs = [...env.allTxtrs, 
        'idir0', 'idir1', 'idir2','idir3','idir4' ] ;

/*------------------------------------------------------------------------
 * textures for time-stepping
 *------------------------------------------------------------------------
 */
    env.fcolors = [] ;
    env.scolors = [] ;

    for(let i=0; i<1; i++){
        env['fcolor'+i] = new Abubu.Float32Texture( 
                env.width, env.height, { pairable : true } ) ;
        env['scolor'+i] = new Abubu.Float32Texture( 
                env.width, env.height, { pairable : true } ) ;
        env.fcolors.push(env['fcolor'+i]) ;
        env.scolors.push(env['scolor'+i]) ;
    }
    env.colors = [ ...env.fcolors, ...env.scolors ] ;

/*------------------------------------------------------------------------
 * init solvers
 *------------------------------------------------------------------------
 */
    // init. .............................................................
    class InitTargets{
        constructor( colors ){
            for(let i=0; i<1 ; i++){
                this["ocolor"+i] = {location : i, target: colors[i]} ;
            }
        }
    }
    env.finit = new Abubu.Solver({
        fragmentShader : source('init') ,
        uniforms : { 
            compressed3dCrdt : { type : 't', value : env.compressed3dCrdt }
        } ,
        targets : new InitTargets( env.fcolors ) ,
    } ) ;

    env.sinit = new Abubu.Solver({
        fragmentShader : source('init') ,
        uniforms : { 
            compressed3dCrdt : { type : 't', value : env.compressed3dCrdt }
        } ,
        targets : new InitTargets( env.scolors ) ,
    } ) ;

/*-------------------------------------------------------------------------
 * model parameters 
 *-------------------------------------------------------------------------
 */
    class Model{
        constructor(no){
            this.floats = [ 
                'tau_m_v1'      ,   'tau_m_v2'      ,   'tau_p_v'       ,
                'tau_m_w1'      ,   'tau_m_w2'      ,   'tau_p_w1'      ,
                'tau_p_w2'      ,   'tau_s1'        ,   'tau_s2'        ,
                'tau_fi'        ,   'tau_o1'        ,   'tau_o2'        ,
                'tau_so1'       ,   'tau_so2'       ,   'tau_si1'       ,
                'tau_si2'       ,   'tau_winf'      ,   'theta_v'       ,
                'theta_p_v'     ,   'theta_m_v'     ,   'theta_vinf'    ,
                'theta_w'       ,   'theta_winf'    ,   'theta_so'      ,
                'theta_si'      ,   'theta_p_si'    ,   'theta_si_c'    ,
                'theta_s'       ,   'theta_o'       ,   'k_m_w'         ,
                'k_p_w'         ,   'k_s'           ,   'k_so'          ,
                'k_si'          ,   'k_si1'         ,   'k_si2'         ,
                'k_si_c'        ,   'u_m_w'         ,   'u_s'           ,
                'u_o'           ,   'u_u'           ,   'u_so'          ,
                'w_sinf'        ,   'w_p_c'         ,   's_c'           ,
                'alpha_w'       ,   'alpha_si'      ,   'beta_v'        ,
                'gamma_si'      ,   'delta_w'       ,   'u_p_w'         ,
                'diffCoef' ] ;
            this.taus = [ 
                'tau_m_v1'      ,   'tau_m_v2'      ,   'tau_p_v'       ,
                'tau_m_w1'      ,   'tau_m_w2'      ,   'tau_p_w1'      ,
                'tau_p_w2'      ,   'tau_s1'        ,   'tau_s2'        ,
                'tau_fi'        ,   'tau_o1'        ,   'tau_o2'        ,
                'tau_so1'       ,   'tau_so2'       ,   'tau_si1'       ,
                'tau_si2'       ,   'tau_winf'       ] ;
            this.thetas = [
                'theta_v'       ,
                'theta_p_v'     ,   'theta_m_v'     ,   'theta_vinf'    ,
                'theta_w'       ,   'theta_winf'    ,   'theta_so'      ,
                'theta_si'      ,   'theta_p_si'    ,   'theta_si_c'    ,
                'theta_s'       ,   'theta_o'  ] ;
            this.ks  = [
                'k_m_w'         ,
                'k_p_w'         ,   'k_s'           ,   'k_so'          ,
                'k_si'          ,   'k_si1'         ,   'k_si2'         ,
                'k_si_c'  ] ; 
            this.us = [ 
                'u_m_w'         ,   'u_s'           ,
                'u_o'           ,   'u_u'           ,   'u_so' ] ;
            this.others = [
                'w_sinf'        ,   'w_p_c'         ,   's_c'           ,
                'alpha_w'       ,   'alpha_si'      ,   'beta_v'        ,
                'gamma_si'      ,   'delta_w'       ,   'u_p_w'         ,
                'diffCoef' ] ;

            this.list = [ 
                    'Human-Epi',    'New-Brugada',  'MAP-Brugada',
                    'Epi',          'Endo',         'Mid-Myo', 
                    'PB' ,          'TNNP',         'Atrial-P1',
                    'Atrial-P1-Alt','Atrial-P2',    'Atrial-P3',
                    'Atrial-P4',    'Atrial-P5',    'Atrial-Original' ,
                    'Rabbit-CytoD', 'Rabbit-DAM',   'Pig-Ventricle',
                    'Canine-Epi-37','Canine-Endo_37', 'Canine-Epi_26',
                    'Canine-Endo_26' ] ;
            this.number = no ;

        } // end of constructor

        get number(){
            return this._no ;
        }
        set number(no){
            this._no = no ;
            switch (this.number){
                case 0: // Human-Epi
                    this._value = [
                        60.0       , 1150       , 1.4506     , 
                        60.0       , 15         , 200.0      , 
                        200.0      , 2.7342     , 16.0       , 
                        0.11       , 400.       , 6.0        , 
                        30.0181    , 0.9957     , 1.8875     , 
                        1.8875     , 0.07       , 0.3        ,
                        0.3        , 0.006      , 0.006      , 
                        0.13       , 0.13       , 0.13       , 
                        0.13       , 0.13       , 0.13       , 
                        0.13       , 0.006      , 65.0       , 
                        1.0        , 2.0994     , 2.0458     , 
                        1.0        , 1.0        , 1.0        , 
                        1.0        , 0.03       , 0.9087     , 
                        0.0        , 1.55       , 0.65       , 
                        0.94       , 1.0        , 1.0        , 
                        1.0        , 1.0        , 0.0        , 
                        1.0        , 1.0        , 1.0        ,
                        1.e-3 ] ;
                    break ;
                case 1: // New-Brugada
                    this._value = [
                        60        , 50        , 1.4506    , 
                        60        , 15        , 0.050082  , 
                        131.5     , 2.7342    , 35        , 
                        0.04      , 400       , 6         , 
                        30.0181   , 0.9957    , 7.5476    , 
                        1.8875    , 0.07      , 0.3       , 
                        0.3       , 0.006     , 2         , 
                        0.13      , 0.13      , 0.13      , 
                        0.13      , 0.13      , 0.13      , 
                        0.13      , 0.006     , 65        , 
                        5.7       , 5.8       , 2.0458    , 
                        97.8      , 1         , 1         , 
                        1         , 0.03      , 0.35      , 
                        0         , 1         , 0.65      , 
                        0.94      , 0.15      , 0.71752   , 
                        1.0       , 1.0       , 0.0       , 
                        1.0       , 1.0       , 1.0       , 
                        1.e-3 ] ;
                    break ;

                case 2: // 'MAP-Brugada'
                    this._value = [
                        15.06     , 15        , 3.33      , 
                        300       , 300       , 25.41     , 
                        226.2     , 4.242     , 25.21     , 
                        0.05      , 8.854     , 8.854     , 
                        193.9     , 0.5640    , 5.834     , 
                        0.1567    , 0.07      , 0.13      , 
                        0.13      , 0.955     , 2         , 
                        0.08801   , 0         , 0.2564    , 
                        0         , 1         , 1         , 
                        0.3602    , 0.955     , 65        , 
                        6.199     , 4.825     , 3.135     , 
                        4.732     , 1         , 1         , 
                        1         , 0.03      , 0.4363    , 
                        0         , 0.6       , 0.11      , 
                        1         , 0.464     , 0.6419    , 
                        1         , 1         , 0         , 
                        1         , 1.0       , 1.0       , 
                        1.e-3 ] ;
                    break ;
                case 3: // 'Epi'
                    this._value = [
                        60        , 1150      , 1.4506    , 
                        60        , 15        , 200       , 
                        200       , 2.7342    , 16        , 
                        0.11      , 400       , 6         , 
                        30.0181   , 0.9957    , 1.8875    , 
                        1.8875    , 0.07      , 0.3       , 
                        0.3       , 0.006     , 0.006     , 
                        0.13      , 0.006     , 0.13      , 
                        0.13      , 1         , 1         , 
                        0.13      , 0.006     , 65        , 
                        65        , 2.0994    , 2.0458    , 
                        1         , 1         , 1         , 
                        1         , 0.03      , 0.9087    , 
                        0         , 1.55      , 0.65      , 
                        0.94      , 0         , 0         , 
                        1         , 1         , 0         , 
                        1         , 1.0       , 1.0       , 
                        1.e-3 ] ;
                    break ;
                case 4: // 'Endo'
                    this._value = [
                        75        , 10        , 1.4506    , 
                        6         , 140       , 280       , 
                        280       , 2.7342    , 2         , 
                        0.1       , 470       , 6         , 
                        40        , 1.2       , 2.9013    , 
                        2.9013    , 0.0273    , 0.3       , 
                        0.3       , 0.2       , 0.2       , 
                        0.13      , 0.006     , 0.13      , 
                        0.13      , 1         , 1         , 
                        0.13      , 0.006     , 200       , 
                        200       , 2.0994    , 2         , 
                        1         , 1         , 1         , 
                        1         , 0.016     , 0.9087    , 
                        0         , 1.56      , 0.65      , 
                        0.78      , 0         , 0         , 
                        1         , 1         , 0         , 
                        1         , 1.0       , 1.0       , 
                        1.e-3 ] ;
                    break ;
                case 5: // 'Mid-Myo'
                    this._value = [
                        80        , 1.4506    , 1.4506    , 
                        70        , 8         , 280       , 
                        280       , 2.7342    , 4         , 
                        0.078     , 410       , 7         , 
                        91        , 0.8       , 3.3849    , 
                        3.3849    , 0.01      , 0.3       , 
                        0.3       , 0.1       , 0.1       , 
                        0.13      , 0.005     , 0.13      , 
                        0.13      , 1         , 1         , 
                        0.13      , 0.005     , 200       , 
                        200       , 2.0994    , 2.1       , 
                        1         , 1         , 1         , 
                        1         , 0.016     , 0.9087    , 
                        0         , 1.61      , 0.6       , 
                        0.5       , 0         , 0         , 
                        1         , 1         , 0         , 
                        1         , 1.0       , 1.0       , 
                        1.e-3 ] ; 
                    break ;
                case 6 : // 'PB'
                    this._value = [
                        10        , 1150      , 1.4506    , 
                        140       , 6.25      , 326       , 
                        326       , 2.7342    , 16        , 
                        0.105     , 400       , 6         , 
                        30.0181   , 0.9957    , 1.8875    , 
                        1.8875    , 0.175     , 0.35      , 
                        0.35      , 0.175     , 0.175     , 
                        0.13      , 0.006     , 0.13      , 
                        0.13      , 1         , 1         , 
                        0.13      , 0.006     , 65        , 
                        65        , 2.0994    , 2.0458    , 
                        1         , 1         , 1         , 
                        1         , 0.015     , 0.9087    , 
                        0         , 1.45      , 0.65      ,
                        0.9       , 0         , 0         , 
                        1         , 1         , 0         , 
                        1         , 1.0       , 1.0       ,  
                        1.e-3 ] ;
                    break ;
                case 7: // 'TNNP'
                    this._value = [
                        60        , 1150      , 1.4506    , 
                        70        , 20        , 280       , 
                        280       , 2.7342    , 3         , 
                        0.11      , 6         , 6         , 
                        43        , 0.2       , 2.8723    , 
                        2.8723    , 0.07      , 0.3       , 
                        0.3       , 0.015     , 0.015     , 
                        0.015     , 0.006     , 0.015     , 
                        0.015     , 1         , 1         , 
                        0.015     , 0.006     , 65        , 
                        65        , 2.0994    , 2         , 
                        1         , 1         , 1         , 
                        1         , 0.03      , 0.9087    , 
                        0         , 1.58      , 0.65      , 
                        0.94      , 0         , 0         , 
                        1         , 1         , 0         , 
                        1         , 1.0       , 1.0       , 
                        1.e-3 ] ; 
                    break ;

                case 8 : // 'Atrial-P1'
                    this._value = [
                        57.12      , 1012       , 2.189      , 
                        68.50      , 68.50      , 871.4      , 
                        871.4      , 1.7570     , 1.110      , 
                        0.12990    , 15.17      , 15.17      , 
                        72.66      , 7.933      , 40.11      , 
                        40.11      , 1.         , 0.23       , 
                        0.23       , 0.3085     , 2.         , 
                        0.2635     , -1.        , 0.1313     , 
                        -1.        , 0.         , 0.         , 
                        0.05766    , 0.         , 0.         , 
                        0.         , 6.043      , 2.592      , 
                        0.         , 0.         , 0.         , 
                        0.         , 0.         , 0.1995     , 
                        0.         , 1.         , 0.4804     , 
                        1.         , 1.         , 0.         , 
                        1.         , 1.         , 0.         , 
                        1.         , 1.0        , 1.0        ,
                        1.611e-3 ] ;
                    break ;
                case 9: //'Atrial-P1-Alt'
                    this._value = [
                        46.77      , 1321       , 1.759      , 
                        80.18      , 80.18      , 749.5      , 
                        749.5      , 1.983      , 1.484      , 
                        0.08673    , 17.05      , 17.05      , 
                        54.90      , 1.685      , 38.82      , 
                        38.82      , 1.         , 0.23       , 
                        0.23       , 0.1142     , 2.         , 
                        0.2508     , -1.        , 0.2171     , 
                        -1.        , 0.         , 0.         , 
                        0.1428     , 0.         , 0.         , 
                        0.         , 21.62      , 2.161      , 
                        0.         , 0.         , 0.         , 
                        0.         , 0.         , 0.2168     , 
                        0.         , 1.         , 0.6520     , 
                        1.         , 1.         , 0.         , 
                        1.         , 1.         , 0.         , 
                        1.         , 1.0        , 1.0        ,
                        1.337e-3 ] ;
                    break ;

                case 10: // 'Atrial-P2'
                    this._value = [ 
                        40.31      , 1183       , 1.349      , 
                        89.08      , 89.08      , 777.0      , 
                        777.0      , 1.086      , 1.144      , 
                        0.04456    , 23.45      , 23.45      , 
                        97.89      , 3.308      , 36.60      , 
                        36.60      , 1.         , 0.23       , 
                        0.23       , 0.1799     , 2.         , 
                        0.2566     , -1.        , 0.2579     , 
                        -1.        , 0.         , 0.         , 
                        0.1943     , 0.         , 0.         , 
                        0.         , 6.142      , 1.997      , 
                        0.         , 0.         , 0.         , 
                        0.         , 0.         , 0.2722     , 
                        0.         , 1.         , 0.4185     , 
                        1.         , 1.         , 0.         , 
                        1.         , 1.         , 0.         , 
                        1.         , 1.0        , 1.0        ,
                        1.405e-3 ] ;
                    break ;

                case 11: // 'Atrial-P3'
                    this._value = [
                        35.75   , 1187    , 1.247   , 
                        109.8   , 109.8   , 751.8   , 
                        751.8   , 2.241   , 1.487   , 
                        0.0688  , 18.31   , 18.31   , 
                        54.43   , 4.894   , 40.39   , 
                        40.39   , 1.      , 0.23    , 
                        0.23    , 0.1107  , 2.      , 
                        0.2798  , -1.     , 0.2131  , 
                        -1.     , 0.      , 0.      , 
                        0.1601  , 0.      , 0.      , 
                        0.      , 8.679   , 2.187   , 
                        0.      , 0.      , 0.      , 
                        0.      , 0.      , 0.2097  , 
                        0.      , 1.      , 0.6804  , 
                        1.      , 1.      , 0.      , 
                        1.      , 1.      , 0.      , 
                        1.      , 1.0     , 1.0     , 
                        1.704e-3 ] ; 
                    break ;

                case 12: // 'Atrial-P4':
                    this._value = [
                        971.3      , 120.5      , 2.243      , 
                        110.7      , 110.7      , 616.0      , 
                        616.0      , 7.104E-03  , 16.29      , 
                        0.08511    , 6.754      , 6.754      , 
                        152.9      , 19.82      , 18.94      , 
                        18.94      , 1.         , 0.23       , 
                        0.23       , 0.03489    , 2.         , 
                        0.1788     , -1.        , 0.2069     , 
                        -1.        , 0.         , 0.         , 
                        3.140E-04  , 0.         , 0.         , 
                        0.         , 8.958      , 8.677      , 
                        0.         , 0.         , 0.         , 
                        0.         , 0.         , 0.1682     , 
                        0.         , 1.         , 6.013E-03  , 
                        1.         , 1.         , 0.         , 
                        1.         , 1.         , 0.         , 
                        1.         , 1.0        , 1.0        ,
                        2.696e-3 ];
                    break ;

                case 13: // 'Atrial-P5'
                    this._value = [
                        45.15    , 1166     , 2.194    , 
                        166.4    , 166.4    , 836.3    , 
                        836.3    , 0.764    , 1.315    , 
                        0.06711  , 18.28    , 18.28    , 
                        105.4    , 3.264    , 39.23    , 
                        39.23    , 1.       , 0.23     , 
                        0.23     , 0.1382   , 2.       , 
                        0.2589   , -1.      , 0.2588   , 
                        -1.      , 0.       , 0.       , 
                        0.1797   , 0.       , 0.       , 
                        0.       , 7.351    , 1.968    , 
                        0.       , 0.       , 0.       , 
                        0.       , 0.       , 0.2023   , 
                        0.       , 1.       , 0.3497   , 
                        1.       , 1.       , 0.       , 
                        1.       , 1.       , 0.       , 
                        1.       , 1.0      , 1.0      ,
                        8.479e-4 ] ; 
                    break ;

                case 14:  //'Atrial-Original':
                    this._value = [
                        19.60    , 1250     , 3.330    , 
                        41.00    , 41.00    , 870.0    , 
                        870.0    , 1.000    , 1.000    , 
                        0.2500   , 12.50    , 12.50    , 
                        33.30    , 33.30    , 29.00    , 
                        29.00    , 1.       , 0.23     , 
                        0.23     , 0.04000  , 2.       , 
                        0.1300   , -1.      , 0.1300   , 
                        -1.      , 0.       , 0.       , 
                        0.1300   , 0.       , 0.       , 
                        0.       , 10.00    , 10.00    , 
                        0.       , 0.       , 0.       , 
                        0.       , 0.       , 0.8500   , 
                        0.       , 1.       , 0.8500   , 
                        1.       , 1.       , 0.       , 
                        1.       , 1.       , 0.       , 
                        1.       , 1.0      , 1.0      , 
                        1.e-3 ] ; 
                    break ;

                case 15: //'Rabbit-CytoD'
                    this._value = [
                        15.2     , 100.     , 3.33     , 
                        55.0     , 55.0     , 382.     , 
                        382.     , 1.       , 1.       , 
                        .075     , 8.3      , 8.3      , 
                        50.5     , 50.5     , 1.       , 
                        1.       , 1.       , .25      , 
                        .25      , .05      , 2.       , 
                        .25      , -1.      , .25      , 
                        0.       , 0.       , .4       , 
                        0.       , 0.       , 0.       , 
                        0.       , 0.       , 0.       , 
                        0.       , 0.       , 0.       , 
                        10.      , 0.       , 0.       , 
                        0.       , 1.0      , 0.       , 
                        1.       , 0.       , 0.       , 
                        1.       , 45.      , 0.       , 
                        0.       , 1.0      , 1.0      , 
                        1.e-3 ] ;
                    break ;

                case 16: // 'Rabbit-Dam'
                    this._value = [
                        28.0     , 100.     , 3.33     , 
                        98.      , 98.      , 615.     , 
                        615.     , 1.       , 1.       , 
                        .0942    , 8.3      , 8.3      , 
                        50.5     , 50.5     , 1.       , 
                        1.       , 1.       , .25      , 
                        .25      , .05      , 2.       , 
                        .25      , -1.      , .25      , 
                        0.       , 0.       , .7       , 
                        0.       , 0.       , 0.       , 
                        0.       , 0.       , 0.       , 
                        0.       , 0.       , 0.       , 
                        10.      , 0.       , 0.       , 
                        0.       , 1.       , 0.       , 
                        1.       , 0.       , 0.       , 
                        1.       , 48.      , 0.       , 
                        0.       , 1.0      , 1.0      , 
                        1.e-3 ] ;
                    break ;
                case 17: // 'Pig-Ventricle':
                    this._value = [ 
                        40.0     , 2000.0   , 10.0     , 
                        305.0    , 305.0    , 320.0    , 
                        320.0    , 1.0      , 1.0      , 
                        0.175    , 4.5      , 4.5      , 
                        35.0     , 5.0      , 1.0      , 
                        1.0      , 1.0      , 0.25     , 
                        0.1      , 0.0025   , 2.00     , 
                        0.25     , -1.0     , 0.25     , 
                        2.0      , 0.9      , 0.35     , 
                        0.0      , 0.0      , 0.0      , 
                        0.0      , 0.0      , 50.0     , 
                        0.0      , 4.5      , 10.0     , 
                        7.0      , 0.0      , 0.0      , 
                        0.0      , 0.97     , 0.85     , 
                        1.0      , 0.0      , 0.0      , 
                        4.0      , 62.0     , 1.0      , 
                        0.0      , 1.0      , 1.0      , 
                        1.e-3 ] ;
                    break ;

                case 18 : // 'Canine-Epi_37'
                    this._value = [
                        20       , 1150     , 1.4506   , 
                        120      , 300      , 120      , 
                        140      , 2.7342   , 16       , 
                        0.11     , 400      , 6        , 
                        30.0181  , 0.9957   , 1.8875   , 
                        1.8875   , 0.07     , 0.3      , 
                        0.3      , 0.006    , 0.006    , 
                        0.13     , 0.006    , 0.13     , 
                        0.13     , 0        , 0        , 
                        0.13     , 0.006    , 65       , 
                        5.7      , 2.0994   , 2.0458   , 
                        0        , 0        , 0        , 
                        0        , 0.03     , 0.9087   , 
                        0        , 1.55     , 0.65     , 
                        0.94     , 0        , 0        , 
                        1        , 1        , 0        , 
                        1        , 0        , 0.15     , 
                        1.e-3 ] ; 
                    break ;
                case 19 : // 'Canine-Endo_37'
                    this._value = [
                        55       , 40       , 1.4506   , 
                        40       , 115      , 175      , 
                        230      , 2.7342   , 2        , 
                        0.10     , 470      , 6        , 
                        40       , 1.2      , 2.9013   , 
                        2.9013   , 0.0273   , 0.3      , 
                        0.3      , 0.2      , 0.2      , 
                        0.13     , 0.006    , 0.13     , 
                        0.13     , 0        , 0        , 
                        0.13     , 0.006    , 20       , 
                        8        , 2.0994   , 2        , 
                        0        , 0        , 0        , 
                        0        , 0.00615  , 0.9087   , 
                        0        , 1.56     , 0.65     , 
                        0.78     , 0        , 0        , 
                        1        , 1        , 0        , 
                        1        , 0        , 0.0005   , 
                        1.e-3 ] ;
                    break ;

                case 20 : // 'Canine-Epi_26'
                    this._value = [
                        10       , 1150     , 1.4506   , 
                        75       , 90       , 90       , 
                        140      , 2.7342   , 16       , 
                        0.11     , 400      , 6        , 
                        30.0181  , 0.9957   , 1.8875   , 
                        1.8875   , 0.07     , 0.3      , 
                        0.3      , 0.006    , 0.006    , 
                        0.13     , 0.006    , 0.13     , 
                        0.13     , 0        , 0        , 
                        0.13     , 0.006    , 65       , 
                        6.5      , 2.0994   , 2.0458   , 
                        0        , 0        , 0        , 
                        0        , 0.02     , 0.9087   , 
                        0        , 1.55     , 0.65     , 
                        0.94     , 0        , 0        , 
                        1        , 1        , 0        , 
                        1        , 0        , 0.8      , 
                        1.e-3 ] ; 
                    break ;
                case 21 : // 'Canine-Endo_26'
                    this._value = [
                        15       , 40       , 1.4506   , 
                        40       , 165      , 175      , 
                        150      , 2.7342   , 2        , 
                        0.10     , 470      , 6        , 
                        40       , 1.2      , 2.9013   , 
                        2.9013   , 0.0273   , 0.3      , 
                        0.3      , 0.2      , 0.2      , 
                        0.13     , 0.006    , 0.13     , 
                        0.13     , 0        , 0        ,
                        0.13     , 0.006    , 8000     , 
                        8        , 2.0994   , 2        , 
                        0        , 0        , 0        , 
                        0        , 0.005    , 0.9087   , 
                        0        , 1.56     , 0.65     , 
                        0.78     , 0        , 0        , 
                        1        , 1        , 0        , 
                        1        , 0        , 0.0005   , 
                        1.e-3 ] ; 
                    break ;
            } // end of switch statement
            for(let i in this.floats){
                let name  = this.floats[i] ;
                env[name] = this._value[i] ;
            }
        }// end of set number

        get name(){
            return this.list[this.number] ;
        }
        set name(n){
            for(let i=0; i < this.list.length; i++){
                if(this.list[i] == n){
                    this.number = i ;
                }
            }
        }
        updateSolvers(){
            for(let name of this.floats){
                env.fcomp.uniforms[name].value = env[name] ;
                env.scomp.uniforms[name].value = env[name] ;
            }
        }
    } ;
 
    env.model = new Model(5) ;
    env.allFloats = [ ...env.allFloats,...env.model.floats] ; 

/*------------------------------------------------------------------------
 * defining the environments initial values 
 *------------------------------------------------------------------------
 */
    env.running     = false ;
    env.dt          = 0.05 ;
    env.C_m         = 1. ;
    env.lx          = 8.  ;
    env.resolution  = 128 ;
    env.skip        = 10 ;
    env.time        = 0. ;
    env.omega       = 0.75 ;
    
    env.others = ['dt','C_m','lx' , 'omega' ] ;
    env.allFloats   = [...env.allFloats, ...env.others ] ; 
    env.allInts = [...env.allInts, 'resolution' ] ;

/*------------------------------------------------------------------------
 * Common CompUniforms
 *------------------------------------------------------------------------
 */
    class CompGeneralUniforms{
        constructor( obj, floats, ints, txtrs){
            for(let name of floats ){
                this[name]  = { type :'f', value : obj[name] } ;
            }
            for(let name of ints){
                this[name]  = { type : 'i', value : obj[name] } ;
            }
            for(let name of txtrs){
                this[name] = { type : 't', value : obj[name] } ;
            }
        }
    }

    // comp .............................................................
    class CompUniforms extends CompGeneralUniforms{
        constructor( _fc, _sc ){
            super(env, env.allFloats, env.allInts, env.allTxtrs ) ;
            for(let i =0 ; i <1 ; i++){
                this['icolor'+i] = { type: 't', value : _fc[i] } ;
            }
        }
    }

    class CompTargets{
        constructor( _fc,_sc ){
            for(let i=0; i<1 ; i++){
                let j = i ;
                this['ocolor'+i] = {location : i, target : _sc[j] } ;
            }
        }
    }

    env.fcomp = new Abubu.Solver({
        fragmentShader : source('comp') ,
        uniforms : new CompUniforms(env.fcolors, env.scolors ) ,
        targets  : new CompTargets( env.fcolors, env.scolors ) ,
    } ) ;

    env.scomp = new Abubu.Solver({
        fragmentShader : source('comp') ,
        uniforms : new CompUniforms(env.scolors, env.fcolors ) ,
        targets  : new CompTargets( env.scolors, env.fcolors ) ,
    } ) ;


/*========================================================================
 * surfaceVisualizer 
 *========================================================================
 */
    env.deepv = new Abubu.DeepVoxelizer({
        input                   : env.fcolor0 ,
        canvas                  : canvas_1 ,
        structure               : env.structure ,
        fovy                    : 0.51,
        rotation                : [1.85,3.14,1.51] ,
        translation             : [0,0,0.1] ,
        lightDirection          : [-.28,-0.32,-0.40] ,
        lightSpecularTerm       : 0.5,
        lightColor              : [1,1,1,1] ,
        lightAmbientTerm        : 0.0, 
        materialSpecularTerm    : 0.8 ,
        materialAmbientTerm     : 1.9 ,
        materialColor           : [0.9,0.9,0.9,1.] ,
        noPasses                : 1. ,
        shininess               : 10. ,
        minValue                : 0.1 ,
        maxValue                : 1.0 ,
        voxelSize               : 1.5 ,
        alpha                   : 1.0 ,
    } ) ;

/*========================================================================
 * signal plot 
 *========================================================================
 */
    // signal plot .......................................................
    env.signalplot = new Abubu.SignalPlot({
        noPltPoints : 1024,
        grid : 'on',
        nx : 5,
        ny : 13, 
        xticks : { mode: 'auto', unit : 'ms', font : '11pt Times'} ,
        yticks : { mode: 'auto', precision:1, unit : 'm', font : '11pt Times'} ,
        canvas : env.canvas_2 
    } ) ;

    env.voltageSignal = env.signalplot.addSignal( env.fcolor0 ,{
        channel : 'r', 
        minValue : 0. ,
        maxValue : 1.3 ,
        color :[0.5,0.,0.] ,
        restValue : 0 ,
        visible : true ,
        linewidth : 3,
        timeWindow: 1000 ,
        probePosition : [0.5,0.5] ,
    }) ;

    env.display = function(){
        if(!env.running){
            env.clickCopy.render();
        }
        env.signalplot.render() ;
        env.deepv.render() ;
    }

    // solve or pause simulations ........................................
    env.solveOrPause = function(){
        env.running = !env.running ;
        if (env.running){
            //env.colorplot.status.text = 'Running...' ;
        }else{
            //env.colorplot.status.text = 'Paused!' ;
        }
    } 

    // initialize the solution using the solvers .........................
    env.init = function(){
        env.time = 0 ;
        env.signalplot.init(env.time) ;
        env.finit.render() ;
        env.sinit.render() ;
        return ;
    }
    env.init() ;
    
/*------------------------------------------------------------------------
 * click
 *------------------------------------------------------------------------
 */
    env.click = new Abubu.Solver({
        fragmentShader : source( 'click' ) ,
        uniforms : {
            icolor0 : { type : 't', value : env.fcolor0 } ,
            compressed3dCrdt : { type : 't', 
                value : env.structure.compressed3dCrdt            } ,
            projectedCoordinates : { type : 't', 
                value : env.deepv.projectedCoordinates  } ,
            clickPosition : { type : 'v2', value : [0.,0] } ,
            clickRadius     : { type : 'f', value : 0.02 } ,
        } ,
        targets : {
            ocolor0 : { location : 0 , target : env.scolor0 } ,
        }
    } ) ;

    env.clickCopy = new Abubu.Copy( env.scolor0, env.fcolor0 ) ;
    
    env.cmndClick = new Abubu.CommandClickListener(
        canvas_1 , (e) =>{
            env.deepv.projectCoordinates() ;
            env.click.uniforms.clickPosition.value = e.position ;
            env.click.render() ;
            env.clickCopy.render() ;
        } , { mousemove : true  } 
    ) ;

    env.cntrlClick = new Abubu.CtrlClickListener(
        canvas_1 , (e) =>{
            env.deepv.projectCoordinates() ;
            env.click.uniforms.clickPosition.value = e.position ;
            env.click.render() ;
            env.clickCopy.render() ;
        } , { mousemove : true  } 
    ) ;

    env.shiftClick = new Abubu.ShiftClickListener(
        canvas_1,
        (e)=>{
            env.deepv.projectCoordinates() ;
            var clickCompPosition = 
            env.deepv.getCompressedClickPosition(e.position);
            env.signalplot.setProbePosition( clickCompPosition ) ;
            env.signalplot.init(env.time) ;
        } ) ;        

/*------------------------------------------------------------------------
 * editors
 *------------------------------------------------------------------------
 */
    env.editor = new Abubu.Editor({
        sources : {
            direction : {
                source : source('directionator') ,
                solvers: [ env.directionator ],
                title : 'direction' ,
                filename: 'directionator.frag' ,
            } ,
            comp : { 
                source : source('comp') , 
                solvers : [ env.fcomp, env.scomp ] ,
                title : 'comp' ,
                filename: 'comp.frag' ,
            } ,
            init : { 
                source : source('init') , 
                solvers : [ env.finit, env.sinit ] ,
                title : 'init' ,
                filename: 'init.frag' ,
            } ,
        } ,
        id : 'editor', 
        active: 'comp' ,
    } ) ;

    env.toggleEditor = function(){
        $("#editorSection").fadeToggle(300)
    } ;


/*------------------------------------------------------------------------
 * createGui
 *------------------------------------------------------------------------
 */
   createGui() ;

/*------------------------------------------------------------------------
 * rendering the program ;
 *------------------------------------------------------------------------
 */
    env.render = function(){
        if (env.running){
            for(let i=0; i<env.skip; i++){
                env.fcomp.render() ;
                env.scomp.render() ;
                env.time += env.dt*2. ;
                env.signalplot.update(env.time) ;
            }
        }
        env.display() ;
        requestAnimationFrame(env.render) ;
    }

/*------------------------------------------------------------------------
 * add environment to document
 *------------------------------------------------------------------------
 */
    document.env = env ;

/*------------------------------------------------------------------------
 * render the webgl program
 *------------------------------------------------------------------------
 */
    env.render();

}/*  End of loadWebGL  */

/*========================================================================
 * add multiple parameters to the GUI
 *========================================================================
 */ 
function addToGui( 
        guiElemenent ,  // gui element to add options into
        obj,            // object that holds parameters
        paramList,      // array of strings that contains list 
                        // of parmeters to be added
        solverList      // array of solvers that need to be update upon 
                        // change of a parameter through gui interactions
    ){
    let elements = {} ;
    for(let param of paramList){
        elements[param] = 
            guiElemenent.add(obj, param ).onChange( ()=> {
                Abubu.setUniformInSolvers( 
                    param, obj[param], solverList ) ;
            } ) ;
    }
    return elements ;
}
/*========================================================================
 * addVectorToGui
 *========================================================================
 */
function addVectorToGui(
    guiElem, 
    obj, 
    param , opts){
    let elems = [] ;
    let labels = opts?.labels ?? 'XYZW' ;

    for (var i=0 ; i< obj[param].length ; i++){
        elems.push(guiElem.add( obj[param] , i.toString() )
            .name( param + ' ' + labels[i] ) );
       elems[i].onChange( ()=>{ obj[param] = obj[param] } ) ;
        if ( opts?.callback ){
            elems[i].onChange( ()=>{ 
                    obj[param] = obj[param];
                    opts.callback();
                }   ) ;
        }

        if ( opts?.min ){
            elems[i].min( opts.min ) ;
        }
        if ( opts?.max ){
            elems[i].max( opts.max ) ;
        }
        if ( opts?.step ){
            elems[i].step( opts.step ) ;
        }
         
    }
    return elems ;
}
/*========================================================================
 * createGui
 *========================================================================
 */
function createGui(){
    env.gui = new Abubu.Gui() ;
    env.gui.pnl1 = env.gui.addPanel({width:300}) ;
    let pnl1 = env.gui.pnl1 ;
    
    // model .............................................................
    pnl1.f0 = pnl1.addFolder('Model Info') ;
    pnl1.f0.add( env.model , 'name', env.model.list)
        .name('Model Name').onChange(function(){
            pnl1.f0.updateDisplay() ;
            env.model.updateSolvers() ;
        }) ;
    pnl1.f0_1 = pnl1.f0.addFolder("All tau's") ;
    pnl1.f0_2 = pnl1.f0.addFolder("All theta's") ;
    pnl1.f0_3 = pnl1.f0.addFolder("All k's") ;
    pnl1.f0_4 = pnl1.f0.addFolder("All u's") ;
    pnl1.f0_5 = pnl1.f0.addFolder("All other parameters") ;

    addToGui( pnl1.f0_1, env, env.model.taus, [env.fcomp,env.scomp] ) ;
    addToGui( pnl1.f0_2, env, env.model.thetas, [env.fcomp,env.scomp] ) ;
    addToGui( pnl1.f0_3, env, env.model.ks, [env.fcomp,env.scomp] ) ;
    addToGui( pnl1.f0_4, env, env.model.us, [env.fcomp,env.scomp] ) ;
    addToGui( pnl1.f0_5, env, env.model.others, [env.fcomp,env.scomp] ) ;
    addToGui( pnl1.f0_5, env, env.others, [env.fcomp,env.scomp] ) ;

    // display -----------------------------------------------------------
    pnl1.f1 = pnl1.addFolder('Display') ;
    pnl1.deepv = env.deepv.controlByGui( pnl1.f1) ;

    pnl1.f1.add(env, 'skip' ) ;
    pnl1.f1.open() ;
    
    // source code editors ...............................................
    pnl1.f2  = pnl1.addFolder('Edit/Save/Load Source Code') ;
    pnl1.f2.add( env , 'toggleEditor').name('Show/Hide Editor' ) ;
    pnl1.f2.add( env.editor , 'title', env.editor.titles )
        .name('Edit source').onChange( ()=>{ pnl1.updateDisplay() ;} ) ;
    pnl1.f2.add( env.editor , 'filename').name('Filename') ;
    pnl1.f2.add( env.editor , 'save' ).name('Save to file') ;
    pnl1.f2.add( env.editor , 'load' ).name('Load from file') ;

    // simulation ........................................................
    pnl1.f3 = pnl1.addFolder('Simulation') ;
    pnl1.f3.add(env, 'init' ).name('Initialize Solution') ;
    pnl1.f3.add(env, 'solveOrPause').name('Solve/Pause') ;
    pnl1.f3.add(env, 'time').name('Solution Time [ms]').listen() ;
    pnl1.f3.open() ;
    return ;
} /* End of createGui */
