import { Volume } from "./Volume.ts";
import * as dicomParser from 'dicom-parser';

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
                return await this.loadDICOMSeries(files);
            default:
                throw new Error(`Unsupported file format: ${extension}`);
        }
    }

    /**
     * Loads multiple slices from DICOM series.
     * @param files - array of DICOM files
     * @returns promise resolving to volume
     */
    private static async loadDICOMSeries(files: File[]): Promise<Volume> {
        console.log(`Loading ${files.length} DICOM files...`);

        // parsing DICOM files
        const slices: DicomSlice[] = [];

        for (const file of files) {
            const arrayBuffer = await file.arrayBuffer();
            const byteArray = new Uint8Array(arrayBuffer);

            try {
                const dataSet = dicomParser.parseDicom(byteArray);

                // extracting metadata
                const width = dataSet.uint16('x00280011')!;
                const height = dataSet.uint16('x00280010')!;
                const sliceLocation = dataSet.floatString('x00201041') || 0;
                const instanceNumber = dataSet.intString('x00200013') || 0;

                // extracting pixel data
                const pixelDataElement = dataSet.elements.x7fe00010;
                if (!pixelDataElement) {
                    throw new Error('No pixel data found in DICOM file');
                }

                const pixelData = new Uint16Array(
                    dataSet.byteArray.buffer,
                    pixelDataElement.dataOffset,
                    pixelDataElement.length / 2
                );

                // getting pixel spacing
                const pixelSpacing = dataSet.string('x00280030')?.split('\\').map(Number) || [1, 1];
                const sliceThickness = dataSet.floatString('x00180050') || 1;

                slices.push({
                    width,
                    height,
                    sliceLocation,
                    instanceNumber,
                    pixelData,
                    pixelSpacing,
                    sliceThickness,
                    file:file.name
                });
            } catch (error) {
                console.error(`Error parsing ${file.name}: `, error);
                throw error;    
            }
        }

        slices.sort((a, b) => {
            if (a.instanceNumber !== b.instanceNumber) {
                return a.instanceNumber - b.instanceNumber;
            }
            return a.sliceLocation - b.sliceLocation;
        });

        console.log(`Sorted ${slices.length} slices`)

        // building 3D volume
        const width = slices[0].width!;
        const height = slices[0].height!;
        const depth = slices.length;

        const volumeData = new Float32Array(width * height  * depth);

        // finding min/max for normalisation
        let minValue = Infinity;
        let maxValue = -Infinity;
        
        for (const slice of slices) {
            for (let i = 0; i < slice.pixelData.length; i++) {
                const value = slice.pixelData[i];
                if (value < minValue) minValue = value;
                if (value > maxValue) maxValue = value;
            }
        }

        console.log(`DICOM value range: ${minValue} to ${maxValue}`);

        const range = maxValue - minValue;

        for (let z = 0; z < depth; z++) {
            const slice = slices[z];
            const sliceOffset = z * width * height;
            
            for (let i = 0; i < slice.pixelData.length; i++) {
                volumeData[sliceOffset + i] = (slice.pixelData[i] - minValue) / range;
            }
        }

        // getting spacing
        const spacing: [number, number, number] = [
            slices[0].pixelSpacing[0],
            slices[0].pixelSpacing[1],
            slices[0].sliceThickness
        ];

        console.log(`Volume created: ${width}x${height}x${depth}\nspacing: ${spacing}`)

        return new Volume(volumeData, [width, height, depth], spacing);
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
            console.log(`Inferred cubic volume: ${cubeRoot}³`);
            return [cubeRoot, cubeRoot, cubeRoot];
        }

        console.warn(`Could not infer dimensions from size ${byteLength}. Assuming 256³`);
        return [256, 256, 256];
    }

    /**
     * generation of spherical synthetic test volume
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

// helper interface

interface DicomSlice {
    width: number,
    height: number,
    sliceLocation: number,
    instanceNumber: number,
    pixelData: Uint16Array;
    pixelSpacing: number[];
    sliceThickness: number;
    file: string;
}