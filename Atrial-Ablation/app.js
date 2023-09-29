/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * app.js   :  Patient Specific Minimal Model with Ablation Lesion
 * Introduction
 *
 * PROGRAMMER   : ABOUZAR KABOUDIAN
 * DATE         : Wed 27 Sep 2023 21:00:38 (EDT)
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

function wn(a=0){
    console.log(a,env.wnormals.value[0]) ;
}

/*========================================================================
 * structure
 *========================================================================
 */
var fileInput = document.getElementById('json_structure') ;
let loadedJSON ;

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
    env.canvas_3 = document.getElementById("canvas_3") ;
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

    env.fablationMap = new Abubu.Float32Texture(env.width, env.height) ;
    env.sablationMap = new Abubu.Float32Texture(env.width, env.height) ;

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
            ablationMap : { type : 't', value : env.fablationMap } ,
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
    env.loaded = true ;


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
    env.dt          = 0.1 ;
    env.C_m         = 1. ;
    env.lx          = 8.  ;
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
            this.ablationMap = { type : 't' , value : env.fablationMap } ;
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

/*------------------------------------------------------------------------
 * lighting information 
 *------------------------------------------------------------------------
 */

/*========================================================================
 * depth peeling 
 *========================================================================
 */
    env.deepv = new Abubu.DeepVoxelizer({
        input                   : env.fcolor0 ,
        canvas                  : canvas_1 ,
        structure               : env.structure ,
        fovy                    : 0.44,
        rotation                : [2.2,2.2,1.4] ,
        lightDirection          : [-.19,-0.21,-0.66] ,
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

    env.deepa = new Abubu.DeepVoxelizer({
        input                   : env.fablationMap ,
        canvas                  : env.canvas_2 ,
        structure               : env.structure ,
        fovy                    : 0.44,
        rotation                : [2.2,2.2,1.4] ,
        lightDirection          : [-.19,-0.21,-0.66] ,
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

/*------------------------------------------------------------------------   
 * ablation click 
 *------------------------------------------------------------------------
 */
    env.ablate = new Abubu.Solver({
        fragmentShader : source('ablate') ,
        uniforms : {
            icolor0 : { type : 't', value : env.fablationMap } ,
            compressed3dCrdt : { type : 't', 
                value : env.structure.compressed3dCrdt            } ,
            projectedCoordinates : { type : 't', 
                value : env.deepa.projectedCoordinates  } ,
            clickPosition : { type : 'v2', value : [0.,0] } ,
            clickRadius     : { type : 'f', value : 0.05 } ,
        } ,
        targets : {
            ocolor0 : { location : 0 , target : env.sablationMap } ,
        }
    } ) ;
    env.ablateCopy = new Abubu.Copy( env.sablationMap, env.fablationMap ) ;
    
    env.ablator = function(){
        env.ablate.render() ;
        env.ablateCopy.render() ;
        env.directionator.render() ;
    }

    env.cmndAblate = new Abubu.CommandClickListener(
        env.canvas_2 , (e) =>{
            env.deepa.projectCoordinates() ;
            env.ablate.uniforms.clickPosition.value = e.position ;
            env.ablator() ;
        } , { mousemove : true  } 
    ) ;

    
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
            clickRadius     : { type : 'f', value : 0.05 } ,
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
            env.click.uniforms.clickPosition.value = e.position ;
            env.click.render() ;
            env.clickCopy.render() ;
        } , { mousemove : true  } 
    ) ;

/*========================================================================
 * cvis
 *========================================================================
 */

    env.display = function(){
        env.deepv.render() ;
        env.deepa.render() ;
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
//        env.signalplot.init(env.time) ;
        env.finit.render() ;
        env.sinit.render() ;
        return ;
    }
    env.init() ;

/*------------------------------------------------------------------------
 * editors
 *------------------------------------------------------------------------
 */
    // compEditor ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    env.compEditor = ace.edit("compEditor") ;
    env.compEditor.setValue(source('comp'));
    env.compEditor.clearSelection() ; 
    env.compEditor.setTheme("ace/theme/tomorrow");
    env.compEditor.getSession().setMode('ace/mode/glsl') ;
    env.compEditor.on( 'change', function(){
        let source = env.compEditor.getValue() ;
        if (source.length>12){
            env.fcomp.fragmentShader = env.compEditor.getValue() ;
            env.scomp.fragmentShader = env.compEditor.getValue() ;
        }
    } ) ;

    // Save comp
    env.saveComp = new Abubu.TextWriter({filename: 'comp.frag'}) ;
    env.saveComp.onclick = function(){
        env.saveComp.text = env.compEditor.getValue() ;
    }

    // Load comp
    env.loadComp = new Abubu.TextReader() ;
    env.loadComp.onload = function(){
        let result = env.loadComp.result ;
        //console.log(result) ;
        env.compEditor.setValue(result) ;
        env.compEditor.clearSelection() ;
    } ;
    // initEditor ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    env.initEditor = ace.edit("initEditor") ;
    env.initEditor.setValue(source('init'));
    env.initEditor.clearSelection() ; 
    env.initEditor.setTheme("ace/theme/tomorrow");
    env.initEditor.getSession().setMode('ace/mode/glsl') ;
    env.initEditor.on( 'change', function(){
        let source = env.initEditor.getValue() ;
        if (source.length>12){
            env.finit.fragmentShader = env.initEditor.getValue() ;
            env.sinit.fragmentShader = env.initEditor.getValue() ;
        }
    } ) ;

    // Save init
    env.saveInit = new Abubu.TextWriter({filename: 'init.frag'}) ;
    env.saveInit.onclick = function(){
        env.saveInit.text = env.initEditor.getValue() ;
    }

    // Load init
    env.loadInit = new Abubu.TextReader() ;
    env.loadInit.onload = function(){
        let result = env.loadInit.result ;
        //console.log(result) ;
        env.initEditor.setValue(result) ;
        env.initEditor.clearSelection() ;
    } ;

    $(".editor").css('fontSize','10pt') ;

    env.toggleInitEditors = function(){
        $('#initEditors').fadeToggle() ;
    }

    env.toggleCompEditors = function(){
        $('#compEditors').fadeToggle() ;
    }

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
                //env.signalplot.update(env.time) ;
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

    pnl1.f1 = pnl1.addFolder('Display') ;
    pnl1.f1.fv = pnl1.f1.addFolder('Voltage Map') ;
    pnl1.f1.fa  = pnl1.f1.addFolder('Ablation Map') ;
    pnl1.visurf = env.deepv.controlByGui( pnl1.f1.fv) ;
    pnl1.visura = env.deepa.controlByGui( pnl1.f1.fa) ;

    pnl1.f1.add(env, 'skip' ) ;
    pnl1.f1.open() ;

    // source code editors ...............................................
    pnl1.f2 = pnl1.addFolder('Source Code Editors' ) ;

    pnl1.f2.add(env, 'toggleCompEditors').name('Show/Hide Comp Editor') ;
    pnl1.f2.add(env.saveComp, 'fileName').name('comp File Name') ;
    pnl1.f2.add(env.saveComp, 'save').name('Save comp to file...') ;
    pnl1.f2.add(env.loadComp, 'click')
        .name('Load comp from file!') ;

    pnl1.f2.add(env, 'toggleInitEditors').name('Show/Hide Init Editor') ;
    pnl1.f2.add(env.saveInit, 'fileName').name('init File Name') ;
    pnl1.f2.add(env.saveInit, 'save').name('Save init to file...') ;
    pnl1.f2.add(env.loadInit, 'click')
        .name('Load init from file!') ;
    

    // simulation ........................................................
    pnl1.f3 = pnl1.addFolder('Simulation') ;
    pnl1.f3.add(env, 'init' ).name('Initialize Solution') ;
    pnl1.f3.add(env, 'solveOrPause').name('Solve/Pause') ;
    pnl1.f3.add(env, 'time').name('Solution Time [ms]').listen() ;
    pnl1.f3.open() ;
    return ;
} /* End of createGui */

