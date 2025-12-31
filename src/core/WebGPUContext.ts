import { VolumeRenderer } from "../rendering/VolumeRenderer";
import { VolumeLoader } from "../volume/VolumeLoader";
import { VolumeTexture } from "../volume/VolumeTexture";
import { Camera } from "./Camera";
import { InputHandler } from "./InputHandler";

const Initialise = async () => {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();

    console.log('WebGPU Device: ', device);

    if (!device){
        throw new Error('WebGPU is not supported by this browser.');
    }

    console.log('WebGPU adapter and device initialised:', adapter?.info, device);

    const context = canvas.getContext('webgpu')!;

    console.log('canvas context obtained:', context);

    const format = navigator.gpu.getPreferredCanvasFormat();

    context.configure({
        device,
        format,
        alphaMode: 'premultiplied',
    });

    console.log('canvas context configured.');

    // generating test volume
    const volume = VolumeLoader.generateTestVolume(128);
    const volumeTexture = new VolumeTexture(device, volume);

    // camera and input setup
    const camera = new Camera();
    new InputHandler(canvas, camera);

    // creating renderer
    const renderer = new VolumeRenderer(device, context, volumeTexture, camera);

    // render loop
    function frame() {
        renderer.render();
        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame)
}

Initialise();