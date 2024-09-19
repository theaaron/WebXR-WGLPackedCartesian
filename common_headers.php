    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />

<!-- Online libraries and dependencies -->
<script src='https://kaboudian.github.io/abubujs/libs/Abubu.latest.js'
	    type='text/javascript'></script>
<script 
src='https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.5/ace.js'  
type="text/javascript" charset="utf-8">
</script>
<script 
    src='https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.5/mode-glsl.js'>
</script>
<script 
    src='https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.5/theme-tomorrow.js'>
</script>
<script
    src='https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.5/keybinding-vim.js'>
</script>
<script 
    src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js">
</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.6.0/jszip.min.js"></script>

<style>

#include abubu_app.css 

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
