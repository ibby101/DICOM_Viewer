# WebGPU_Dicom_Viewer
Real-time 3D volume rendering of DICOM/medical data directly in the browser using WebGPU

Upload any .dcm file and the viewer renders a volumetric prism of the scan slice in real-time using WebGPU. A transfer function in the shader maps tissue density to colour so that bone appears white, soft tissue blue, and other regions are highlighted in red. This mimics the kind of visualisation used in clinical imaging software
