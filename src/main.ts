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

    const commandEncoder = device.createCommandEncoder();
    const textureView = context.getCurrentTexture().createView();

    const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [{
            view: textureView,
            clearValue: {r: 0.4, g: 0.4, b: 0.4, a: 1.0},
            loadOp: 'clear',
            storeOp: 'store',
        }],
    });
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
}

Initialise();