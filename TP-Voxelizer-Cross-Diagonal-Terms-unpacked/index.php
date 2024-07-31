<!DOCTYPE html>
<html lang="en">
<head>
    <title>TP</title>
<?php
    include "getFileContents.php" ;
    echo getFileContents( "common_headers.php" , __dir__ . "/../") ;
?>

</head>
<!--&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&-->
<!-- body of the html page                                             -->
<!--&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&-->
<body>
    <h1>TP Ventricular Model</h1>
    
    <div id='chooser'>
        <h2>Select the JSON file containing the structure</h2>
        <p style='color:red'>Before you can proceed, you need to choose the structural
        file!</p>
       <input type='file' id='json_structure' accept='.json, .JSON'></input>
    </div> 
    <table>
 
        </tr>
        <tr>
            <td>
                <canvas id=canvas_1 width=512 height=512>
                    Your browser doesn't support HTML5.0
                </canvas>
            </td>
            <td>
                <canvas id=canvas_2 width=512 height=512>
                    Your browser doesn't support HTML5.0
                </canvas>
            </td>
        </tr>
    </table>
<div class='loaded'>
    <h3>Instructions for modifiable sections.</h3>
<p>You can edit the source code for a number of the modeling shaders by accessing the <b>Edit/Save/Load Source Code</b> menu of the GUI. As soon as the shader is edited, the program automatically starts using the updated version of the code.</p>

<p>Notice that GLSL does not allow for mixing of data types. So, floats
and integers cannot be mixed unless directly type casted.</p>

    <div class='relative' id='editorSection' style='display:none'>
        <h2>Source code editor</h2>
        <div class='editor' id='editor'></div>
    </div>

</div>    
    
<!--&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&-->
<!-- All shaders included here (codes written in GLSL)                 -->
<!--&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&-->
<?php
    include "shader.php" ;
    $dir = __dir__ . "/shaders/" ;
    
    // general shaders ...................................................
    shader( 'repack'            , $dir ) ;
    shader( 'directionator'     , $dir ) ;
    shader( 'init'              , $dir ) ;
    shader( 'comp'              , $dir ) ;

    // Click Handling ....................................................
    shader(  'click'            , $dir ) ;
?>

<!--&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&-->
<!-- main script - JavaScript code                                     -->
<!--&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&-->
<script>
<?php
    echo file_get_contents( __dir__ . "/app.js" ) ;    
?></script>


</body>
</html>

