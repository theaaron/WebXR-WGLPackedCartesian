# WGLPackedCartesian
This package is a new series of WebGL programs that can be used to model ventricular or atrial electrical activity on three-dimensional geometries of anatomical structures. The codes use three-dimensional, uniform Cartesian grid point clouds of the 3D tissue as input.


The sparsity of the tissue domain is addressed through a compression algorithm, which accelerates the programs by:

 - Conserving GPU memory
 - Avoiding unnecessary input/output to and from the empty space
 - Balancing the load on GPU cores


This technique facilitates faster in silico experiments, allowing for larger number of numerical experiments to be carried out.

Furthermore, a series of programs are provided that incorporate the cross-diagonal terms in discretizing the spatial term of the cable equation. This technique provides higher accuracy in slender structures, and when combined with the compression algorithm, can provide better accuracy at faster speeds in 3D cardiac geometries.

The programs run in interactive mode and allow for the following interactions:

- Stimulation through a combination of keyboard and mouse clicks
- Changing the visualization viewpoint using mouse drag and scroll
- Creating cross-sectional views of the structure when a voxelized view is used
- Creating transparent views of the structure when a voxelized view is used
- Changing model parameters through the graphical interface

More detail will be provided on the program use in the following sections.

## Software requirements to run the programs in this package
The software is tested on the **Google Chrome Browser** (version 117.0.5938.62) on Microsoft Windows 10, macOS 12.6.7, and Ubuntu Linux 22.04.3 LTS.

The programs require WebGL 2.0-enabled hardware. To check if your computer and browser support WebGL 2.0, visit [WebGL Report at https://webglreport.com/?v=2.](https://webglreport.com/?v=2.)

The programs depend on the following open source libraries:
 - [abubu.js](https://abubujs.org/)
 - [jQuery](https://jquery.com/)
 - [ace](https://ace.c9.io/)
 - [JSzip](https://stuk.github.io/jszip/)

An internet connection is required to load the above-mentioned libraries at each program launch. Once the programs are launched and the libraries are loaded, you may be able to run the programs offline.

## Instructions to run the programs in this package

### Running each program of the package 
You can directly run the programs in this package by visiting [WGLPackedCartesian](https://dbp-osel.github.io/WGLPackedCartesian/), and clicking on the link for the program that you want to run.

Alternatively, you can clone this repository to your local disk by issuing the following command on the command line:
```bash
git clone https://github.com/dbp-osel/WGLPackedCartesian
```

This will create a copy of the repository on your local disk, which you can then run the programs from. Navigate to the root directory of the repository on your local drive, and open the file ``index.html`` in a web browser that supports WebGL 2.0 such as the Google Chrome browser. You can click on each program link in your browser to open the program that you want to run. 

Once the programs open in the web browser, you can load the mesh and interact with the simulations. 

### User interactions
There are a number of interactions possible with the programs in this package. They can be achieved through mouse (+keyboard) interactions with the visualization canvas, the Graphical User Interface (GUI), or the built-in source code editor of each program.

#### Graphical User Interface (GUI)
Each program has a Graphical User Interface (GUI) with menus and submenus in the interface. The GUI allows for modifications of the parameters during the simulation.

The main menus in the GUI are as follows.

 * **Model/Patient  Info**: change model parameters such as diffusion coefficient, ionic channel conductances, extra-cellular ionic concentrations, time-stepping, domain size, etc. Depending on the model, the parameters that you encounter in this menu might be different.  

 * **Display**:
    - ***Model View*** provides parameters to change the placement of the tissue on canvas by applying translation, rotation, or scaling on the grid.
    - ***Projection***: Allows you to adjust the field of view (FOV), near plane, and far plane of the frustum. 
    - ***Coloring and Lighting***: you can adjust the following:
        - _lighting_:
            - Light direction
            - Light color
            - Light specular term
            - Light ambient term
        - _Material Properties_:
            - Material's Ambient Term
            - Material's Specular Term
            - Shininess
        - _Colormap and Range_:
            - Colormap
            - minValue: Minimum value of the visualized parameter range
            - maxValue: Maximum value of the visualized parameter range
            - Color channel: Channel of the texture that is going to be visualized.
    - ***Cut Planes*** (_Voxel Visualization Only_): Three cut planes can be adjusted to create cross-sectional views of the structure:
        - _cutX_: Slider to choose the x-location of a cut plane which x-axis is normal to it. 
        - _cutY_: Slider to choose the y-location of a cut plane which y-axis is normal to it. 
        - _cutZ_: Slider to choose the z-location of a cut plane which z-axis is normal to it. 
        - _cutXDir_: which side of the x cut plane to visualize
        - _cutYDir_: which side of the y cut plane to visualize
        - _cutZDir_: which side of the z cut plane to visualize
    - ***DDP Params*** (_Voxel Visualization Only_): Dual-Depth-Peeling parameters for transparent view of the structure. This technique allows for visualization of activation waves in the depth of the tissue. The adjustable parameters are:
        - _Voxel Size_: Number to scale the voxels from their original size.
        - _alpha_: Alpha value which determines the transparency of the structure's surface which varies between 0 and 1, where 0 is fully transparent and 1.0 is fully opaque.
        - _noPasses_: Integer value determining how many times the dual-depth-peeling technique will be applied. Each pass peels both the front and back of the structure. In our experiments, 4-8 passes produced acceptable image quality, and 6 passes produced the best results with a minor performance overhead.

    - ***Skip***: he visualization speed is mainly dictated by the refresh rate of the computer screen, which is usually around <nobr>60 Hz</nobr>. If every other time step of the simulation is visualized, the speed of simulation will be limited to solving 120 time steps per second for a screen with a refresh rate of <nobr>60 Hz</nobr>. The skip parameter determines the number of two time steps to be skipped before each visualization update. This can allow for several thousand time steps to be solved per second of wall time. Increasing the skip parameter without bound will not keep increasing the speed of the simulation, as the GPU will eventually be maxed out with computational tasks, depending on the capabilities of your computer's GPU.

 * **Edit/Save/Load Source Code**: While the main parameters of a model, such as conductances, can be included in a menu to be changed easily during a simulation, complex models have hundreds of parameters and dozens of equations that it may be useful to modify. With ``WebGL``, the ACE editor can be used to open the shader's source code in the same web page that is running the code, allowing the code to be modified while running. Whenever the source code changes, the source code for the appropriate solvers is updated and the [abubujs](https://abubujs.org) library automatically re-compiles the new code and immediately uses it. Therefore, _any_ parameter or equation in the model can be modified at any time during a simulation. The menu has the following options:
    - ***Show/Hide Editor***: A button to display or hide the source code editor.
    - ***Edit Source***: A dropdown menu that can toggle between the shader codes that are available to be edited through the built-in editor.
    - ***File Name***: A text field with a default file name for the shader that is being edited.
    - ***Save to file***: Save the current state of the source shader source code to disk for future reference.
    - ***Load from file*** Load previously saved shader file from the disk. 

 * **Simulation**:  This menu controls initiation, starting, and pausing of the simulation through the following buttons:
    - ***Initialize***: Apply the initial conditions to the simulation;
    - ***Solve/Pause***: Start or Pause the simulation a simulation;
    - ***Solution Time [ms]:*** Displays the simulation time lapsed.

#### Mouse (+Keyboard) interactions with the programs
3D interactions with the mouse fall into three categories: manipulating the viewpoint, creating excitation regions in 3D space, and picking the location of the probe to create the running window view of the cell's membrane potential vs time. 

The viewpoint is set by manipulating the camera matrix and updating the visualizer solvers with the new matrix values.

Detecting the excitation coordinates, and the coordinate of the probe, in the tissue structure by the mouse in 3D, referred to as picking, is more involved. To pick the appropriate coordinate given a click location, the coordinates of the visible points of the structure are projected using the same view and projection matrices used for the visualization of a texture off-screen. The aspect ratio of this texture must match that of the canvas used for visualization. The click point on the canvas is used to read the projected coordinate texture to find the coordinates of the target point for stimulation. These coordinates can then be used to create the excitation region or determining the location of the signal probe. 


To change the view point of the structure, while pressing down the left button of the mouse, drag the mouse pointer across the canvas that displays 3D structure. You can use the **mouse wheel** to zoom in or out of the view. 

To create excitations anywhere in the tissue in 3D applications, use **Ctrl+click/drag** with **PCs** and **Command+click/drag** with **macOS**.

## License
Shield: [![CC BY 4.0][cc-by-shield]][cc-by]

This work is licensed under a
[Creative Commons Attribution 4.0 International License][cc-by].

[![CC BY 4.0][cc-by-image]][cc-by]

[cc-by]: http://creativecommons.org/licenses/by/4.0/
[cc-by-image]: https://i.creativecommons.org/l/by/4.0/88x31.png
[cc-by-shield]: https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg

## Authors

**Developer:**   Abouzar Kaboudian

**Contact:**    [abouzar.kaboudian@fda.hhs.gov](mailto:abouzar.kaboudian@fda.hhs.gov)

## Disclaimers
*This software and documentation (the "Software") were developed at the Food and Drug Administration (FDA) by employees of the Federal Government in the course of their official duties. Pursuant to Title 17, Section 105 of the United States Code, this work is not subject to copyright protection and is in the public domain. Permission is hereby granted, free of charge, to any person obtaining a copy of the Software, to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, or sell copies of the Software or derivatives, and to permit persons to whom the Software is furnished to do so. FDA assumes no responsibility whatsoever for use by other parties of the Software, its source code, documentation or compiled executables, and makes no guarantees, expressed or implied, about its quality, reliability, or any other characteristic. Further, use of this code in no way implies endorsement by the FDA or confers any advantage in regulatory decisions. Although this software can be redistributed and/or modified freely, we ask that any derivative works bear some notice that they are derived from it, and any modified versions bear some notice that they have been modified.*

*The mention of commercial products, their sources, or their use in connection with material reported herein is not to be construed as either actual or implied endorsement or recommendation of such products by the US Government or the Department of Health and Human Services. HHS is not responsible for any "off-site" webpage referenced in this product.*



