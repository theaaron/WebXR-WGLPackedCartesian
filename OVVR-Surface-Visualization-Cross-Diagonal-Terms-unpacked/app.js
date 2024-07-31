/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * app.js       : OVVR  Model  
 *
 * PROGRAMMER   : ABOUZAR KABOUDIAN
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

var gl = Abubu.gl ;

/*========================================================================
 * Read structure from file on the server for debugging purposes
 * NOTE: if not debugging comment out this section
 *========================================================================
 */
//let structureFile = new XMLHttpRequest();
//
//structureFile.onreadystatechange = () => {
//    if (structureFile.readyState == 4 && structureFile.status == 200) {
//        loadedJSON = JSON.parse(structureFile.responseText);
//        console.log(loadedJSON) ;
//        $('#chooser').hide() ;
//        $('.loaded').show() ;
//
//        loadWebGL() ;
//    }
//};
//console.log("324") ;
//structureFile.open("GET", 
//        "/jsons/AtrialExamples/02-350um-192x192x192_lra_grid.json", true);
//structureFile.send();
//

/*========================================================================
 * WallTime
 *========================================================================
 */
class WallTimer{
    constructor(opts={}){
        this._duration  = opts?.duration ?? 100 ; /* duration of the
                                        measurements in miliseconds of
                                        simulated electrical activity   */
        this._start     = opts?.start ?? 0 ; /* physical time of the
                                                measurements            */
                                             
        this._startTime = new Date().getTime() ;    /* start wall-time of
                                                       the measurements */
        this._endTime   = NaN ;
        this._started   = false;    /* flag that wall-time 
                                       measurements have started        */
        this._finished  = false ;   /* flag indicating if wall-time
                                       measurements have ended          */
        this._paused    = false ;    /* flag indicating if measurements 
                                       are paused                       */
        this._lapsedTime= 0 ;       /* lapsed time of the wall-time
                                       measurements                     */
    }// end of constructor ...............................................

/*------------------------------------------------------------------------
 * getters and setters of the class
 *------------------------------------------------------------------------
 */
    get duration(){
        return this._duration ; 
    }

    set duration(v){
        this._duration = v ;
        this.reset() ;
    }

    get paused(){
        return this._paused ;
    }

    set paused(v){
        if (v & !this.paused & !this.finished){
            this.endTime = new Date().getTime() ;
            this._started = false ;
            this._lapsedTime += (this.endTime - this.startTime) ;
            this._paused = v ;
        }else if ( !v ){
            this._paused = v ;
        }
        return ;
    }
    
    get start(){
        return this._start ;
    }

    set start(v){
        this._start = v ;
    }

    get startTime(){
        return this._startTime ;
    }

    set startTime(v){
        this._startTime = v ;
    }

    get endTime(){
        return this._endTime ;
    }

    set endTime(v){
        this._endTime =v  ;
    }

    get lapsedTime(){
        return this._lapsedTime ;
    }

    get finished(){
        return this._finished ;
    }
    set finished(v){
        this._finished = v ;
    }

    get started(){
        return this._started ;
    }

    set started(v){
        this._started = v ;
    }

    get end(){
        return this.start + this.duration ;
    }

    get progress(){
        if (this.finished) return 100 ;
        return Math.round(100*( env.time - this.start)/this.duration) ;
    }

/*------------------------------------------------------------------------
 * Methods
 *------------------------------------------------------------------------
 */
    // Measure wall-time .................................................
    measure(){
        if ( !env.running & !this.paused ){
            this.paused  = true ;
            return ;
        }
        if ( !env.running ) return ;

        if ( !this.started & !this.paused & env.time >= this.start ){
            this.started = true ;
            this.startTime = new Date().getTime() ; 
            return ;
        }
        
        if ( !this.finished & !this.paused & env.time >= this.end ){
            this.finished = true ;
            this._endTime = new Date().getTime() ;
            this._lapsedTime += (this.endTime - this.startTime) ;
        }
    }

    // Reset measurements ................................................
    reset(){
        this._started       = false ;
        this.start          = env.time ;
        this._finished      = false ;
        this._lapsedTime   = 0 ;
    }
}

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
    env.dir0 = new Abubu.Uint32Texture( env.fwidth, env.fheight ) ;
    env.dir1 = new Abubu.Uint32Texture( env.fwidth, env.fheight ) ;
    env.dir2 = new Abubu.Uint32Texture( env.fwidth, env.fheight ) ;
    env.dir3 = new Abubu.Uint32Texture( env.fwidth, env.fheight ) ;
    env.dir4 = new Abubu.Uint32Texture( env.fwidth, env.fheight ) ;

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

    for(let i=0; i<11; i++){
        env['fcolor'+i] = new Abubu.Float32Texture( 
                env.fwidth, env.fheight, { pairable : true } ) ;
        env['scolor'+i] = new Abubu.Float32Texture( 
                env.fwidth, env.fheight, { pairable : true } ) ;
        env.fcolors.push(env['fcolor'+i]) ;
        env.scolors.push(env['scolor'+i]) ;
    }
    env.colors = [ ...env.fcolors, ...env.scolors ] ;

/*------------------------------------------------------------------------
 * visualization texture
 *------------------------------------------------------------------------
 */
    env.vcolor = new Abubu.Float32Texture( env.width, env.height ) ;
    
    env.repack = new Abubu.Solver({
        fragmentShader: source('repack') ,
        uniforms : {
            fullTexelIndex : { 
                type : 't', value : env.fullTexelIndex 
            } ,
            compressedTexelIndex : { 
                type : 't', value : env.compressedTexelIndex
            } ,
            icolor : { type : 't', value : env.fcolor4 } ,
        } ,
        targets : {
            vcolor : { location : 0, target : env.vcolor } ,
        }
    } ) ;

/*------------------------------------------------------------------------
 * OVVR Targets
 *------------------------------------------------------------------------
 */
    class OvvrTargets1{
        constructor( colors ){
            for(let i=0; i<4 ; i++){
                this["ocolor"+i] = {location : i, target: colors[i]} ;
            }
        }
    }
    class OvvrTargets2{
        constructor( colors ){
            for ( let i =4 ; i< 11 ; i++){
                this["ocolor"+i] = { location : i-4, target : colors[i] } ;
            }
        }
    }

/*------------------------------------------------------------------------
 * init solvers
 *------------------------------------------------------------------------
 */
    // init sets 0 to 3 ..................................................
    env.finit1 = new Abubu.Solver({
        fragmentShader : source( 'init1' ) ,
        targets : new OvvrTargets1( env.fcolors ) ,
    } ) ;
    env.sinit1 = new Abubu.Solver({
        fragmentShader : source( 'init1' ) ,
        targets : new OvvrTargets1( env.scolors ) ,
    } ) ;

    // init sets 4 to 11 .................................................
    env.finit2 = new Abubu.Solver({
        fragmentShader : source( 'init2' ) ,
        targets : new OvvrTargets2( env.fcolors ) ,
    } ) ;
    env.sinit2 = new Abubu.Solver({
        fragmentShader : source( 'init2' ) ,
        targets : new OvvrTargets2( env.scolors ) ,
    } ) ;

    env.initStates = function(){
        env.finit1.render() ;
        env.finit2.render() ;

        env.sinit1.render() ;
        env.sinit2.render() ;
        return ;
    }

/*------------------------------------------------------------------------
 * Initiate all coeficients 
 *------------------------------------------------------------------------
 */
    env.running     = false ;
    env.skip        = 20 ;
    env.time        = 0. ;
    
    // model params
    env.dt          = 0.05 ;    /* time step size       */
    env.C_m         = 1. ;      /* cell conductance     */
    if (loadedJSON?.length){
        env.lx = loadedJSON.length/10 ;
    }else{
        env.lx = 8.  ;
    }
    /* domain size          */
    env.diffCoef    = 1.e-3 ;   /* diffusion coeficient */
    env.omega       = 0.33 ;
    env.modelFloats = ['dt' , 'C_m', 'diffCoef', 'lx', 'omega' ] ;

    env.allFloats   = [...env.allFloats, ...env.modelFloats ] ; 
   
    // current multipliers ...............................................
    env.currentMultipliers = [
        'C_Na',     'C_Nafast',     'C_Nalate',     'C_NaCa',   
        'C_to',     'C_CaL',        'C_CaNa',       'C_CaK',        
        'C_Kr',     'C_Ks',         'C_K1',         'C_NaCai',      
        'C_NaCass', 'C_NaKNa',      'C_NaKK',       'C_NaK',    
        'C_Nab',    'C_Kb',         'C_Cab',        'C_pCa',    
        'C_relNP',  'C_relCaMK',    'C_upNP',       'C_upCaMK', 
        'C_leak',   'C_up',         'C_tr',         'C_rel',        
        'C_diffCa', 'C_diffNa',     'C_diffK'                       ] ;

    env.allFloats = [   ...env.allFloats, 
                        ...env.currentMultipliers ] ;
    
    // time multipliers ..................................................
    env.timeMultipliers = [
        'Ct_m',     'Ct_h',         'Ct_j',         'Ct_hCaMKslow', 
        'Ct_hslow', 'Ct_mL',        'Ct_jCaMK',     'Ct_hL', 
        'Ct_hLCaMK','Ct_a',         'Ct_ifast',     'Ct_islow', 
        'Ct_aCaMK', 'Ct_iCaMKfast', 'Ct_iCaMKslow', 'Ct_d',     
        'Ct_ffast', 'Ct_fslow',     'Ct_fCafast',   'Ct_fCaslow', 
        'Ct_jCa',   'Ct_fCaMKfast', 'Ct_fCaCaMKfast','Ct_n', 
        'Ct_xrfast','Ct_xrslow',    'Ct_xs1',       'Ct_xs2', 
        'Ct_xk1',   'Ct_relNP',     'Ct_relCaMK',   'Ct_tr', 
        'Ct_diffCa','Ct_diffNa',    'Ct_diffK',                     ] ;
    
    env.allFloats = [   ...env.allFloats, 
                        ...env.timeMultipliers ] ;

    // scaling factors ...................................................
    env.scalingFactors = [
        'SGNalate' , 'SGto' ,       'SPCa',         'SGKr'     ,
        'SGKs'     , 'SGK1' ,       'SGNaCa',       'SGNaK'    , 
        'SGKb'     , 'SJrel' ,      'SJup',         'SCMDN' ] ;

    env.allFloats = [   ...env.allFloats, 
                        ...env.scalingFactors ];

    env.cellType = 2 ; // default is endocardial cells
    env.allInts = [ ...env.allInts, 'cellType' ] ;

    // extra-cellular concentrations .....................................
    env.Na_o        = 140 ;         /* Sodium               */
    env.Ca_o        = 1.8 ;         /* Calcium              */ 
    env.K_o         = 5.4 ;         /* Potasium             */

    env.extraCellularConcentrations = [ 'Na_o', 'Ca_o', 'K_o' ] ;
    env.allFloats = [   ...env.allFloats , 
                        ...env.extraCellularConcentrations ];

    // all float uniforms that need to be initialized with ones ..........
    env.oneFloats = [
        ...env.currentMultipliers,  ...env.timeMultipliers,
        ...env.scalingFactors ] ;

    // initialize values to 1.0 ..........................................
    for(let i in env.oneFloats){
        let name = env.oneFloats[i] ;
        env[name] = 1. ;
    }

    // Common uniforms for comp1 & comp2 solvers .........................
    class CompUniforms{
        constructor( obj, floats, ints, txtrs){
            for(let i in floats ){
                let name    = floats[i] ;
                this[name]  = { type :'f', value : obj[name] } ;
            }
            for(let i in ints){
                let name    = ints[i] ;
                this[name]  = { type : 'i', value : obj[name] } ;
            }
            for(let name of txtrs){
                this[name] = { type : 't', value : obj[name] } ;
            }
        }
    }

    // uniforms for comp1 solvers ........................................
    class Comp1Uniforms extends CompUniforms{
        constructor( _fc, _sc ){
            super(env, env.allFloats, env.allInts, env.allTxtrs) ;
            for(let i=0; i<11 ; i++){
                this['icolor'+i] = { type : 't', value : _fc[i] } ;
            }   
        }
    }

    // uniforms for comp2 solvers ........................................
    class Comp2Uniforms extends CompUniforms{
        constructor( _fc, _sc ){
            super(env, env.allFloats, env.allInts, env.allTxtrs) ; 
            // colors already updated by comp1
            for(let i=0; i<4 ; i++){
                this['icolor'+i] = { type : 't', value : _sc[i] } ;
            }
            // other colors
            for(let i=4; i<11 ; i++){
                this['icolor'+i] = { type : 't', value : _fc[i] } ;
            }
        }
    } ;
/*------------------------------------------------------------------------
 * marching steps 
 *------------------------------------------------------------------------
 */
    // comp1 solvers .....................................................
    env.fcomp1 = new Abubu.Solver({
        fragmentShader : source('comp1') ,
        uniforms : new Comp1Uniforms( env.fcolors, env.scolors ) ,
        targets : new OvvrTargets1( env.scolors ) ,
    } ) ;
    env.scomp1 = new Abubu.Solver({
        fragmentShader : source('comp1') ,
        uniforms : new Comp1Uniforms( env.scolors, env.fcolors ) ,
        targets : new OvvrTargets1( env.fcolors ) ,
    } ) ;

    // comp2 solvers .....................................................
    env.fcomp2 = new Abubu.Solver({
        fragmentShader : source( 'comp2' ) ,
        uniforms : new Comp2Uniforms( env.fcolors, env.scolors ) ,
        targets : new OvvrTargets2( env.scolors ) ,
    } ) ;

    env.scomp2 = new Abubu.Solver({
        fragmentShader : source( 'comp2' ) ,
        uniforms : new Comp2Uniforms( env.scolors, env.fcolors ) ,
        targets : new OvvrTargets2( env.fcolors ) ,
    } ) ;

    env.comps = [ env.fcomp1, env.fcomp2, env.scomp1, env.scomp2 ] ;
    // marches the solution for two time steps ...........................
    env.march = function(){
        env.fcomp1.render() ;
        env.fcomp2.render() ;
        env.scomp1.render() ;
        env.scomp2.render() ;
        env.time += 2.*env.dt ;
    } ;


/*========================================================================
 * surfaceVisualizer 
 *========================================================================
 */
    env.visurf = new Abubu.SurfaceVisualizer({
        canvas : canvas_1 ,
        target : env.vcolor ,
        structure : env.structure ,
        fovy : 0.51,
        rotation : [3.31,-3.14,2.29] ,
        lightDirection : [ 0.6,0.25,-2.06] ,
        lightSpecularTerm : 0.5, 
        lightAmbientTerm : 0.1, 
        materialSpecularTerm : 5.2 ,
        materialAmbientTerm : 0.1 ,
        shininess : 10 ,
        minValue : -40 ,
        maxValue : 30 ,
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
        ny : 12, 
        xticks : { mode: 'auto', unit : 'ms', font : '11pt Times'} ,
        yticks : { mode: 'auto', precision:1, unit : 'mv', font : '11pt Times'} ,
        canvas : env.canvas_2 
    } ) ;

    env.voltageSignal = env.signalplot.addSignal( env.vcolor ,{
        channel : 'r', 
        minValue : -90 ,
        maxValue : 30. ,
        color :[0.5,0.,0.] ,
        restValue : -86 ,
        visible : true ,
        linewidth : 3,
        timeWindow: 1000 ,
        probePosition : [0.5,0.5] ,
    }) ;

    env.display = function(){
        env.repack.render() ;
        env.visurf.render() ;

        //env.colorplot.time.text = env.time.toFixed(2) + ' [ms]' ;
        //env.colorplot.initForeground() ;
        //env.colorplot.render() ;
        env.signalplot.render() ;
    }

    // wall Timer ........................................................
    env.wallTimer = new WallTimer() ;

    // solve or pause simulations ........................................
    env.solveOrPause = function(){
        env.running = !env.running ;
        env.wallTimer.paused = !env.running ;

        if (env.running){
            //env.colorplot.status.text = 'Running...' ;
        }else{
            //env.colorplot.status.text = 'Paused!' ;
        }
    } 

    // initialize the solution using the solvers .........................
    env.init = function(){
        env.time = 0 ;
        env.wallTimer.reset() ;

        env.signalplot.init(env.time) ;
        env.initStates() ; 
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
            icolor4 : { type : 't', value : env.fcolor4 } ,
            full3dCrdt : { type : 's', 
                value : env.structure.full3dCrdt            } ,
            projectedCoordinates : { type : 't', 
                value : env.visurf.projectedCoordinates  } ,
            clickPosition : { type : 'v2', value : [0.,0] } ,
            clickRadius     : { type : 'f', value : 0.1 } ,
        } ,
        targets : {
            ocolor4 : { location : 0 , target : env.scolor4 } ,
        }
    } ) ;

    env.clickCopy = new Abubu.Copy( env.scolor4, env.fcolor4 ) ;
     
    env.cmndClick = new Abubu.CommandClickListener(
        canvas_1 , (e) =>{
            let runStatus = env.running ;
            env.running = false ;
            env.click.uniforms.clickPosition.value = e.position ;
            env.click.render() ;
            env.clickCopy.render() ;
            env.running = runStatus ;
        } , { mousemove : true  } 
    ) ;

    env.cntrlClick = new Abubu.CtrlClickListener(
        canvas_1 , (e) =>{
            env.click.uniforms.clickPosition.value = e.position ;
            env.click.render() ;
            env.clickCopy.render() ;
        } , { mousemove : true  } 
    ) ;

    env.shiftClick = new Abubu.ShiftClickListener(
        canvas_1,
        (e)=>{
            var clickCompPosition = 
            env.visurf.getCompressedClickPosition(e.position);
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
            comp1 : { 
                source : source('comp1') , 
                solvers : [ env.fcomp1, env.scomp1 ] ,
                title : 'comp1' ,
                filename: 'comp1.frag' ,
            } ,
            comp2 : { 
                source : source('comp2') , 
                solvers : [ env.fcomp2, env.scomp2 ] ,
                title : 'comp2' ,
                filename: 'comp2.frag' ,
            } ,

            init1 : { 
                source : source('init1') , 
                solvers : [ env.finit1, env.sinit1 ] ,
                title : 'init1' ,
                filename: 'init1.frag' ,
            } ,
            init2 : { 
                source : source('init2') , 
                solvers : [ env.finit2, env.sinit2 ] ,
                title : 'init2' ,
                filename: 'init2.frag' ,
            } ,


        } ,
        id : 'editor', 
        active: 'comp1' ,
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
                env.wallTimer.measure() ;
                env.march() ;
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
    let solvs = [ env.fcomp1, env.scomp1, env.fcomp2,env.scomp2 ] ;
    addToGui( pnl1.f0, env, env.modelFloats, solvs ) ;
    pnl1.f0_1 = pnl1.f0.addFolder( 'Current Multipliers'    ) ;
    pnl1.f0_2 = pnl1.f0.addFolder( 'Time Multipliers'       ) ;
    pnl1.f0_3 = pnl1.f0.addFolder( 'Scaling Factors'        ) ;
    pnl1.f0_4 = pnl1.f0.addFolder( 'Extra Cell. Concentrations'        ) ;

    addToGui( pnl1.f0_1, env, env.currentMultipliers, solvs ) ;
    addToGui( pnl1.f0_2, env, env.timeMultipliers, solvs ) ;
    addToGui( pnl1.f0_3, env, env.scalingFactors, solvs ) ;
    addToGui( pnl1.f0_4, env, env.extraCellularConcentrations, solvs ) ;

    // wall-time measurements --------------------------------------------
    pnl1.f4 = pnl1.addFolder('Wall time measurements') ;
    pnl1.f4.add(env.wallTimer, 'duration').name('Sim. Activity [ms]') ; 
    pnl1.f4.add(env.wallTimer, 'progress').name("Progress [%]").listen() ;
    pnl1.f4.add(env.wallTimer, 'lapsedTime').name("Measured Walltime [ms]").listen() ; 
    pnl1.f4.add(env.wallTimer, 'reset').name('Reset') ; 

    // display -----------------------------------------------------------
    pnl1.f1 = pnl1.addFolder('Display') ;
    pnl1.visurf = env.visurf.controlByGui( pnl1.f1) ;

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
