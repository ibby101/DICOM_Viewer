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
        device.queue.writeTexture(
            { texture: this.texture },
            volume.data.buffer,
            {
                offset: 0,
                bytesPerRow: volume.width * 4, // 4 bytes per float32
                rowsPerImage: volume.height,
            },
            {
                width: volume.width,
                height: volume.height,
                depthOrArrayLayers: volume.depth,
            }
        );

        this.view = this.texture.createView({
            dimension: '3d',
        }); 

        this.sampler = device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
            addressModeW: 'clamp-to-edge',
        });

        console.log('VolumeTexture created: ', volume.dimensions);
    }

    destroy(){
        this.texture.destroy();
    }
}