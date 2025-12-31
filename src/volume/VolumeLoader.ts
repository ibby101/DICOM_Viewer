import { Volume } from "./Volume.ts";

/**
 * Handles loading of volume data from different file formats
 */
export class VolumeLoader {

    /**
     * Main entry point for loading volume data from files
     * @param files - Array of file(s) to load
     * @returns Promise resolving to a Volume Instance
     */
    static async loadFromFiles(files: File[]) : Promise<Volume> {
        if (files.length === 0){
            throw new Error('No files provided');
        }

        const firstFile = files[0];
        const extension = firstFile.name.split('.').pop()?.toLowerCase();

        switch (extension) {
            case 'raw':
                return await this.loadRaw(firstFile);
            case 'nii':
            case 'gz':
                throw new Error('NIfTI format not yet supported');
            case 'dcm':
            case 'dicom':
                throw new Error('DICOM format not yet supported');
            default:
                throw new Error('Unsupported file format: ${extension}');
        }
    }

    /**
     * Loads raw binary volume file
     * Assumes uint8 data and attempts to infer dimensions from file size
     * @param file - Raw binary file
     * @returns Promise resolving to Volume
     */
    private static async loadRaw(file: File): Promise<Volume> {
        const buffer = await file.arrayBuffer();
        const uint8Data = new Uint8Array(buffer);

        // inferring dimensions from file size
        const dimensions = this.inferDimensions(buffer.byteLength);

        // converting uint8 to float32
        const data = new Float32Array(uint8Data.length);
        for (let i = 0; i < uint8Data.length; i++){
            data[i] = uint8Data[i] / 255.0
        }

        return new Volume(data, dimensions);
    }

    /**
     * attempting to infer volume dimensions from file size
     * assumes uint8 data, 1 byte per voxel
     * @param byteLength - size of the file in bytes
     * @returns inferred dimensions [width, height, depth]
     */
    private static inferDimensions(byteLength: number): [number, number, number] {
        const knownSizes: { [key: number]: [number, number, number] } = {
            2097152: [128, 128, 128],
            16777216: [256, 256, 256],
            134217728: [512, 512, 512],
        };

        if (knownSizes[byteLength]){
            return knownSizes[byteLength]
        }

        const cubeRoot = Math.round(Math.cbrt(byteLength));
        if (cubeRoot *cubeRoot * cubeRoot === byteLength) {
            console.log('Inferred cubic volume: ${cubeRoot}³');
            return [cubeRoot, cubeRoot, cubeRoot];
        }

        console.warn('Could not infer dimensions from size ${byteLength}. Assuming 256³');
        return [256, 256, 256];
    }

    /**
     * generation of synthetic test volume with sphere
     * used for testing rendering without real data
     * @param size - cube dimensions, 128 by default
     * @returns volume containing a centered sphere
     */
    static generateTestVolume(size: number = 128): Volume {
        const dimensions: [number, number, number] = [size, size, size];
        const data = new Float32Array(size * size * size);

        const centre = size / 2;
        const radius = size / 3;
    
        for (let z = 0; z < size; z++) {
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const dx = x - centre;
                    const dy = y - centre;
                    const dz = z - centre;
                    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

                    const idx = x + y * size + z * size * size;

                    if (dist < radius) {
                        data[idx] = 1.0 - (dist / radius);
                    } else {
                        data[idx] = 0.0;
                    }
                }
            }
        }

        return new Volume(data, dimensions);
    }

    
}