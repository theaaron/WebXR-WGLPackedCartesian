<?php
/*@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * getFileContents : Script used for importing  and handling 
 *          "#include" directives in the files that are imported using the 
 *          getFileContents
 *
 * PROGRAMMER   : ABOUZAR KABOUDIAN
 * DATE         : Thu 21 Sep 2023 10:01:42 (EDT)
 * PLACE        : Maryland, USA.
 *@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */
function getFileContents( $file, $dir = __dir__ . "/" ){
    $output = "" ;
    
    $content = file_get_contents( $dir . $file ) ;
    
    // array of lines ....................................................
    $arr = explode("\n", $content); 
    
    // number of lines in the file .......................................
    $noLines = count($arr) ;

    // process each line of the file .....................................
    for($i=0 ; $i<$noLines ; $i++){
        $lineArray = preg_split('/\s+/', $arr[$i]);

        /* if the first word of the line is getFileContent load the included
           file, otherwise, append the line as is */
        $noWords=count($lineArray) ;
        $noInclude=true ;
        for($j=0 ; $j<$noWords; $j++){
            if ( $lineArray[$j] == "#include" ){
                $noInclude=false ;
                $output = $output . getFileContents( $lineArray[$j+1], $dir );
                break ;
            }
        }
        if ($noInclude){
            $output = $output . $arr[$i] . "\n" ;
        }
    }

    return $output ;
}

?>
