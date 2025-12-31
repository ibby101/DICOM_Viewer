import { VolumeTexture } from "../volume/VolumeTexture";
import { Camera } from "../core/Camera";
import rayShader from './shaders/raymarch.wgsl?raw';

export class VolumeRenderer {
    private device: GPUDevice;
    private context: GPUCanvasContext;
    private pipeline: GPURenderPipeline;
    private bindGroup: GPUBindGroup;
    private uniformBuffer: GPUBuffer
    private camera:  Camera;

    constructor (
        device: GPUDevice,
        context: GPUCanvasContext,
        volumeTexture: VolumeTexture,
        camera: Camera
    ) {
        this.device = device;
        this.context = context;
        this.camera = camera;

        // creating uniform buffer
        this.uniformBuffer = device.createBuffer({
            size: 128,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        // creating bind group layout (descriptor set layout equivalent)
        const bindGroupLayout = device.createBindGroupLayout({
            entries: [
                {binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: {type: 'uniform'}},
                {binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: {sampleType: 'float', viewDimension: '3d'}},
                {binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: {type: 'filtering'}},
            ],
        });

        this.bindGroup = device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                {binding: 0, resource: {buffer: this.uniformBuffer}},
                {binding: 1, resource: volumeTexture.view},
                {binding: 2, resource: volumeTexture.sampler},
            ],
        });

        // creating the pipeline
        const shaderModule = device.createShaderModule({ code: rayShader});

        this.pipeline = device.createRenderPipeline({
            layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout]}),
            vertex: {
                module: shaderModule,
                entryPoint: 'vs_main',
            },
            fragment: {
                module: shaderModule,
                entryPoint: 'fs_main',
                targets: [{ format: context.getCurrentTexture().format}],
            },
            primitive: { topology: 'triangle-list'},
        });

        console.log('VolumeRenderer Initialised')
    }

    render() {
        const viewMatrix = this.camera.getViewMatrix();
        const cameraPos = this.camera.getPosition();

        const uniforms = new Float32Array(32);
        uniforms.set(viewMatrix, 0);
        uniforms.set(cameraPos, 16);
        uniforms.set([1, 1, 1], 20);

        this.device.queue.writeBuffer(this.uniformBuffer, 0, uniforms);

        // begin render
        const commandEncoder = this.device.createCommandEncoder();
        const textureView = this.context.getCurrentTexture().createView();

        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0},
                loadOp: 'clear',
                storeOp: 'store',
            }],
        });

        renderPass.setPipeline(this.pipeline);
        renderPass.setBindGroup(0, this.bindGroup);
        renderPass.draw(3, 1, 0, 0);
        renderPass.end();

        this.device.queue.submit([commandEncoder.finish()]);
    }
}

