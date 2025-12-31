import { Volume } from "./Volume";

/**
 * Manages GPU 3D texture for volume data
 */
export class VolumeTexture {
    public readonly texture: GPUTexture;
    public readonly view: GPUTextureView;
    public readonly sampler: GPUSampler;
    private device: GPUDevice;

    constructor(device: GPUDevice, volume: Volume){
        this.device = device;

        this.texture = device.createTexture({
            size: {
                width: volume.width,
                height: volume.height,
                depthOrArrayLayers: volume.depth,
            },
            dimension: '3d',
            format: 'r32float',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });

        // uploading volume data to GPU
    }
}