/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * app.js       : TP Model  
 *
 * PROGRAMMER   : ABOUZAR KABOUDIAN
 * DATE         : Tue 09 May 2023 12:06:22 (EDT)
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

    for(let i=0; i<5; i++){
        env['fcolor'+i] = new Abubu.Float32Texture( 
                env.width, env.height, { pairable : true } ) ;
        env['scolor'+i] = new Abubu.Float32Texture( 
                env.width, env.height, { pairable : true } ) ;
        env.fcolors.push(env['fcolor'+i]) ;
        env.scolors.push(env['scolor'+i]) ;
    }
    env.colors = [ ...env.fcolors, ...env.scolors ] ;

/*------------------------------------------------------------------------
 * TP Targets
 *------------------------------------------------------------------------
 */
    class TpTargets{
        constructor( colors ){
            for(let i=0; i<5 ; i++){
                this["ocolor"+i] = {location : i, target: colors[i]} ;
            }
        }
    }

/*------------------------------------------------------------------------
 * init solvers
 *------------------------------------------------------------------------
 */
    // init sets 0 to 3 ..................................................
    env.finit = new Abubu.Solver({
        fragmentShader : source( 'init' ) ,
        targets : new TpTargets( env.fcolors ) ,
    } ) ;
    env.sinit = new Abubu.Solver({
        fragmentShader : source( 'init' ) ,
        targets : new TpTargets( env.scolors ) ,
    } ) ;

    env.initStates = function(){
        env.finit.render() ;
        env.sinit.render() ;

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
    env.diffCoef    = 1.e-3 ;   /* diffusion coeficient */
    env.capacitance = 0.185 ;
    env.omega       = 0.33 ;
    env.modelFloats = ['dt' , 'C_m', 'diffCoef', 'lx', 'capacitance' , 'omega'] ;

    env.allFloats   = [...env.allFloats, ...env.modelFloats ] ; 
   
    // current multipliers ...............................................
    env.currentMultipliers = [
        'C_Na'   ,     'C_NaCa' ,     'C_to'   ,     
        'C_CaL'  ,     'C_Kr'   ,     'C_Ks'   ,     
        'C_K1'   ,     'C_NaK'  ,     'C_bNa'  ,     
        'C_pK'   ,     'C_bCa'  ,     'C_pCa'  ,     
        'C_leak' ,     'C_up'   ,     'C_rel'  ,     
        'C_xfer' ] ;

    env.allFloats = [   ...env.allFloats, 
                        ...env.currentMultipliers ] ;
    
    env.cellType = 2 ; // default is endocardial cells
    env.allInts = [ ...env.allInts, 'cellType' ] ;

    // all float uniforms that need to be initialized with ones ..........
    env.oneFloats = [
        ...env.currentMultipliers,  ] ;

    // initialize values to 1.0 ..........................................
    for(let i in env.oneFloats){
        let name = env.oneFloats[i] ;
        env[name] = 1. ;
    }

    // Common uniforms for comp1 & comp2 solvers .........................
    class Uniforms{
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

    // uniforms for comp solvers .........................................
    class CompUniforms extends Uniforms{
        constructor( _fc, _sc ){
            super(env, env.allFloats, env.allInts, env.allTxtrs) ;
            for(let i=0; i<5 ; i++){
                this['icolor'+i] = { type : 't', value : _fc[i] } ;
            }   
        }
    }

/*------------------------------------------------------------------------
 * marching steps 
 *------------------------------------------------------------------------
 */
    // comp solvers ......................................................
    env.fcomp = new Abubu.Solver({
        fragmentShader : source('comp') ,
        uniforms : new CompUniforms( env.fcolors, env.scolors ) ,
        targets : new TpTargets( env.scolors ) ,
    } ) ;
    env.scomp = new Abubu.Solver({
        fragmentShader : source('comp') ,
        uniforms : new CompUniforms( env.scolors, env.fcolors ) ,
        targets : new TpTargets( env.fcolors ) ,
    } ) ;


    env.comps = [ env.fcomp, env.scomp] ;
    // marches the solution for two time steps ...........................
    env.march = function(){
        env.fcomp.render() ;
        env.scomp.render() ;
        env.time += 2.*env.dt ;
    } ;


/*========================================================================
 * surfaceVisualizer 
 *========================================================================
 */
    env.visurf = new Abubu.SurfaceVisualizer({
        canvas : canvas_1 ,
        target : env.fcolor0 ,
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

    env.voltageSignal = env.signalplot.addSignal( env.fcolor0 ,{
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
            icolor0 : { type : 't', value : env.fcolor0 } ,
            compressed3dCrdt : { type : 't', 
                value : env.structure.compressed3dCrdt            } ,
            projectedCoordinates : { type : 't', 
                value : env.visurf.projectedCoordinates  } ,
            clickPosition : { type : 'v2', value : [0.,0] } ,
            clickRadius     : { type : 'f', value : 0.1 } ,
        } ,
        targets : {
            ocolor4 : { location : 0 , target : env.scolor0 } ,
        }
    } ) ;

    env.clickCopy = new Abubu.Copy( env.scolor0, env.fcolor0 ) ;
    
    env.cmndClick = new Abubu.CommandClickListener(
        canvas_1 , (e) =>{
            env.click.uniforms.clickPosition.value = e.position ;
            env.click.render() ;
            env.clickCopy.render() ;
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
            env.signalplot.init() ;
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
            cvisFrag : { 
                source : env.visurf.fragmentShader.source ,
                solvers : [ env.visurf ] ,
                title : 'vis_fragmentShader' ,
                filename : 'fsurfaceView.frag',
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
    let solvs = [ env.fcomp, env.scomp] ;
    addToGui( pnl1.f0, env, env.modelFloats, solvs ) ;
    pnl1.f0_1 = pnl1.f0.addFolder( 'Current Multipliers'    ) ;
    addToGui( pnl1.f0_1, env, env.currentMultipliers, solvs ) ;

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
