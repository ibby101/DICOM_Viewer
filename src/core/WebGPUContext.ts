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
    let volumeTexture = new VolumeTexture(device, volume);

    // camera and input setup
    const camera = new Camera();
    new InputHandler(canvas, camera);

    // creating renderer
    let renderer = new VolumeRenderer(device, context, volumeTexture, camera);

    // render loop
    function frame() {
        renderer.render();
        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);

    setupUI(device, context, camera, (update) => {
        volumeTexture.destroy();
        volumeTexture = update.volumeTexture;
        renderer = update.renderer;
    });
};

function setupUI(
    device: GPUDevice,
    context: GPUCanvasContext,
    camera: Camera,
    onNewRenderer: (update: RendererUpdate) => void
) {
    const fileInput = document.getElementById('dicomFile') as HTMLInputElement;
    const loadBtn = document.getElementById('loadBtn') as HTMLButtonElement;
    const testBtn = document.getElementById('testBtn') as HTMLButtonElement;
    const status = document.getElementById('status') as HTMLDivElement;

    loadBtn.addEventListener('click', async () =>  {
        const files = Array.from(fileInput.files || []);
        if (files.length === 0) {
            status.style.color = '#ff9800';
            status.textContent = 'No file selected';
            return;
        }

        try {
            status.style.color = '#2196F3';
            status.textContent = 'Loading...'

            const volume = await VolumeLoader.loadFromFiles(files);
            const volumeTexture = new VolumeTexture(device, volume);
            const renderer = new VolumeRenderer(device, context, volumeTexture, camera);

            onNewRenderer({ renderer, volumeTexture});
            status.style.color = '#4CAF50'
            status.textContent = `Loaded ${volume.width}`;
        } catch (e: any) {
            status.style.color = '#f44336';
            status.textContent = `Error: ${e.message}`;
        }
    });

    testBtn.addEventListener('click', () => {
        const volume = VolumeLoader.generateTestVolume(128);
        const volumeTexture = new VolumeTexture(device, volume);
        const renderer = new VolumeRenderer(device, context, volumeTexture, camera);
        onNewRenderer({ renderer, volumeTexture});
        status.textContent = `Test volume loaded`
    });
}

interface RendererUpdate {
    renderer: VolumeRenderer;
    volumeTexture: VolumeTexture;
}

Initialise();