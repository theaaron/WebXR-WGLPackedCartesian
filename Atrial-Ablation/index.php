<!DOCTYPE html>
<html lang="en">
<head>
    <title>MM</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
<?php
    include "getFileContents.php" ;
    echo getFileContents( "common_headers.php" , __dir__ . "/../") ;
?>

<style>
<?php
  echo file_get_contents( __dir__ . "/abubu_app.css" ) ;
?>

div.relative {
  position: relative;
  height: 512px;
  border: 1px solid black;
  width:100% ;
} 

div.editor {
  position : absolute;
  top: 0px;
  right: 0;
  bottom: 0;
  left: 0;
  width:100%;
}
#loading { 
    position : fixed ;
    bottom : 20px ;
    left : 10px ;
}
#loadProgress {
    width : 300px ;
    background-color: #ddd ;
}
#loadBar {
    width : 0% ;
    height : 20px ;
    background-color: #4caf50 ;
    border-radius: 3px ;
}

</style>

</head>
<!--&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&-->
<!-- body of the html page                                             -->
<!--&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&-->
<body>
    <h1>Patient Specific fitted Atrial Minimal Model</h1>
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
    
    <h3>Instructions for modifiable sections.</h3>
<p>You can edit the source code for the initial conditions and the compute
shaders by accessing the <b>Source Code Editos</b> menu of the graphical
interface. Each class of editors can be toggled on and off. Remember that
you can save and reload your changes to each shader.</p>

<p>At the end of the comp2 shader source code lies the pacing period which
can be adjusted now by editing the source code. Any edit of the source
code will change the model mid-simulation.</p>

<p>Notice that GLSL does not allow for mixing of data types. So, floats
and integers cannot be mixed unless directly type casted.</p>

    <table style='width:100%' id=editors>
        <tr id='compEditors' style='display:none'>
            <td id='ecomp'> 
                <h2>comp editor</h2>
                <div class=relative id=compEditorContainer>
                    <div class=editor id='compEditor'></div>
                </div>
            </td>
            <!--
            <td id='ecomp2'>
                <h2>comp2 editor</h2>
                <div class=relative id=comp2EditorContainer>
                    <div class='editor' id=comp2Editor></div>
                </div>
            </td> -->
        </tr>

        <tr  id='initEditors' style='display:none'>
            <td id='einit'> 
                <h2>init editor</h2>
                <div class=relative id=initEditorContainer>
                    <div class=editor id='initEditor'></div>
                </div>
            </td>
            <!--
            <td id='einit2'>
                <h2>init2 editor</h2>
                <div class=relative id=init2EditorContainer>
                    <div class='editor' id=init2Editor></div>
                </div>
            </td>
            -->
        </tr>

    </table>
 
<!--&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&-->
<!-- All shaders included here (codes written in GLSL)                 -->
<!--&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&-->
<?php
    include "shader.php" ;

    $dir = __dir__ . "/shaders/" ;

    shader( 'init'                  , $dir                  ) ;
    shader( 'comp'                  , $dir                  ) ;
    shader( 'click'                 , $dir                  ) ;
    shader( 'ablate'                , $dir                  ) ;
    shader( 'directionator'         , $dir                  ) ;
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

