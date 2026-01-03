import { Volume } from "./Volume";

/**
 * Manages GPU 3D texture for volume data
 */
export class VolumeTexture {
    public readonly texture: GPUTexture;
    public readonly view: GPUTextureView;
    public readonly sampler: GPUSampler;

    constructor(device: GPUDevice, volume: Volume){
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
            magFilter: 'nearest',
            minFilter: 'nearest',
            mipmapFilter: 'nearest',
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
            addressModeW: 'clamp-to-edge',
        });

        console.log('VolumeTexture created: ', volume.dimensions);
    }

    createTransferFunctionTexture(device: GPUDevice) {
        const size = 256;
        const data = new Uint8Array(size * 4);
        for (let i = 0; i < size; i++) {
            const t = i / (size - 1);

            data[i * 4 + 0] = t * 255; // R
            data[i * 4 + 1] = (1 - Math.abs(t - 0.5) * 2) * 255; // G
            data[i * 4 + 2] = (1 - t) * 255; // B
            data[i * 4 + 3] = t * 255; // A
        }

        const texture = device.createTexture({
            size: [size],
            dimension: '1d',
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });

        device.queue.writeTexture({texture}, data, {bytesPerRow: size * 4}, [size]);
        return texture;
    }

    destroy(){
        this.texture.destroy();
    }
}