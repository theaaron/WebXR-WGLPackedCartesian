/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * WEBGL 2.0    :   Minimal Atrial Model 
 *
 * PROGRAMMER   :   ABOUZAR KABOUDIAN
 * DATE         :   Fri 03 Sep 2021 17:37:27 (EDT)
 * PLACE        :   Atlanta, GA
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
    env.loadedJSON = loadedJSON ;
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

    env.idir0 = env.dir0 ;
    env.idir1 = env.dir1 ;

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
        }
    } ) ;
    env.directionator.render() ; 

    env.allTxtrs = [...env.allTxtrs, 'idir0', 'idir1' ] ;


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
    class Patient{
        constructor(no){
            this.floats = [ 
                'u_c' , 'u_v' , 'u_w' , 'u_d' , 't_vm', 't_vp', 't_wm', 
                't_wp', 't_sp', 't_sm', 'u_csi','x_k' , 't_d' , 't_o' , 
                't_soa','t_sob','u_so' ,'x_tso','t_si' ,'t_vmm', 
                'diffCoef' ] ;
            this.list = [ 'Patient 1', 'Patient 1-Alt','Patient 2',
                     'Patient 3', 'Patient 4', 'Patient 5', 'Original' ] ;
            this.number = no ;

        } // end of constructor

        get number(){
            return this._no ;
        }
        set number(no){
            this._no = no ;
            switch (this.number){
                case 0: // patient 1
                    this._value = [
                        0.1313 , 0.3085 , 0.2635 , 0.05766, 57.12  ,
                        2.189  , 68.50  , 871.4  , 1.110  , 1.7570 ,
                        0.1995 , 6.043  , 0.12990, 15.17  , 72.66  ,
                        7.933  , 0.4804 , 2.592  , 40.11  , 1012 ,
                        1.611E-03 ] ;
                    break ;
                case 1: // patient 1-alt
                    this._value = [
                        0.2171 , 0.1142 , 0.2508 , 0.1428 , 46.77  ,
                        1.759  , 80.18  , 749.5  , 1.484  , 1.983  ,
                        0.2168 , 21.62  , 0.08673, 17.05  , 54.90  ,
                        1.685  , 0.6520 , 2.161  , 38.82  , 1321   ,
                        1.337E-03 ] ;
                    break ;
                case 2: // patient 2
                    this._value = [
                        0.2579  , 0.1799, 0.2566 , 0.1943 , 40.31  ,
                        1.349   , 89.08 , 777.0 ,  1.144 ,  1.086  , 
                        0.2722  , 6.142 , 0.04456, 23.45 ,  97.89  , 
                        3.308   , 0.4185, 1.997  , 36.60 ,  1183   , 
                        1.405E-03 ] ; 
                    break ;
                case 3 :
                    this._value = [
                        0.2131  , 0.1107, 0.2798,   0.1601 ,    35.75 ,
                        1.247   , 109.8 , 751.8 ,   1.487,      2.241 ,
                        0.2097  , 8.679 , 0.06880 , 18.31,      54.43 ,
                        4.894   , 0.6804, 2.187   , 40.39,      1187  ,
                        1.704E-03 ] ;
                    break ;
                case 4 :
                    this._value = [
                        0.2069   ,0.03489  ,0.1788   ,3.140E-04,971.3    ,
                        2.243    ,110.7    ,616.0    ,16.29    ,7.104E-03,
                        0.1682   ,8.958    ,0.08511  ,6.754    ,152.9    ,
                        19.82    ,6.013E-03,8.677    ,18.94    ,120.5    ,
                        2.696E-03 ] ;
                    break ;
                case 5 :
                    this._value = [
                        0.2588 ,0.1382 ,0.2589 ,0.1797 ,45.15  ,
                        2.194  ,166.4  ,836.3  ,1.315  ,0.764  ,
                        0.2023 ,7.351  ,0.06711,18.28  ,105.4  ,
                        3.264  ,0.3497 ,1.968  ,39.23  ,1166   ,
                        8.479E-04 ] ;
                    break ;
                default : // original model
                    this._value = [
                        0.1300 ,0.04000, 0.1300 , 0.1300 , 19.60  , 
                        3.330  ,41.00  , 870.0  , 1.000  , 1.000  , 
                        0.8500 ,10.00  , 0.2500 , 12.50  , 33.30  , 
                        33.30  ,0.8500 , 10.00  , 29.00  , 1250   , 
                        1.000E-3 ] ;
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
 
    env.patient = new Patient(1) ;
    env.allFloats = [ ...env.allFloats,...env.patient.floats] ; 

/*------------------------------------------------------------------------
 * defining the environments initial values 
 *------------------------------------------------------------------------
 */
    env.running     = false ;
    env.dt          = 0.05 ;
    env.C_m         = 1. ;
    if (loadedJSON?.length){
        env.lx = loadedJSON.length/10 ;
    }else{
        env.lx = 8.  ;
    }
    env.resolution  = 128 ;
    env.skip        = 10 ;
    env.time        = 0. ;
    
    env.allFloats   = [...env.allFloats, 'dt','C_m' ,'lx' ] ; 
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
        fovy : 0.51,
        rotation : [3.31,-3.14,2.29] ,
        lightDirection : [ 0.6,0.25,-2.06] ,
        lightSpecularTerm : 0.5, 
        lightAmbientTerm : 0.1, 
        materialSpecularTerm : 5.2 ,
        materialAmbientTerm : 0.1 ,
        shininess : 10 ,
        minValue : 0.1 ,
        maxValue : 0.7 ,
        noPasses                : 1. ,
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
        ny : 10, 
        xticks : { mode: 'auto', unit : 'ms', font : '11pt Times'} ,
        yticks : { mode: 'auto', precision:1, unit : 'm', font : '11pt Times'} ,
        canvas : env.canvas_2 
    } ) ;

    env.voltageSignal = env.signalplot.addSignal( env.fcolor0 ,{
        channel : 'r', 
        minValue : 0. ,
        maxValue : 1. ,
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
            clickRadius     : { type : 'f', value : 0.1 } ,
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
                env.wallTimer.measure() ;
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
    pnl1.f0 = pnl1.addFolder('Patient Info') ;
    pnl1.f0.add( env.patient , 'name', env.patient.list)
        .name('Patient Name').onChange(function(){
            pnl1.f0.updateDisplay() ;
            env.patient.updateSolvers() ;
        }) ;
    addToGui( pnl1.f0, env, env.allFloats, [env.fcomp,env.scomp] ) ;

    // wall-time measurements --------------------------------------------
    pnl1.f4 = pnl1.addFolder('Wall time measurements') ;
    pnl1.f4.add(env.wallTimer, 'duration').name('Sim. Activity [ms]') ; 
    pnl1.f4.add(env.wallTimer, 'progress').name("Progress [%]").listen() ;
    pnl1.f4.add(env.wallTimer, 'lapsedTime').name("Measured Walltime [ms]").listen() ; 
    pnl1.f4.add(env.wallTimer, 'reset').name('Reset') ; 
 
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
