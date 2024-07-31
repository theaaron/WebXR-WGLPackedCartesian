
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
            console.log('here') ;
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


