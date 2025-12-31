/*
* This class represents 3D Medical Volume data
* Stores voxel data, dimensions, spacing, as well as providing sampling utilities
*/
export class Volume {
    // Flattened 3D voxel data array
    data: Float32Array;
    // Dimensions of the volume [width, height, depth]
    dimensions: [number, number, number];
    // Metadata about the volume, including voxel spacing in millimeters (mm).
    metadata: { spacing: [number, number, number] };

    /**
     * Creates a new volume instance
     * @param data - Flattened array of voxel data.
     * @param dimensions - Volume dimensions [width, height, depth]
     * @param spacing - Voxel spacing in mm, default set to [1, 1, 1]
     */
    constructor(data: Float32Array, dimensions: [number, number, number], spacing: [number, number, number] = [1,1,1]){
        this.data = data;
        this.dimensions = dimensions;
        this.metadata = { spacing };
    }

    /**
     * Returns width of volume in voxels
     * @returns number of voxels along the x-axis
     */
    get width() { return this.dimensions[0]; }

    /**
     * Returns height of volume in voxels
     * @returns number of voxels along the y-axis
     */
    get height() { return this.dimensions[1]; }

    /**
     * Returns depth of volume in voxels
     * @returns number of voxels along the z-axis
     */
    get depth() { return this.dimensions[2]; }

    /**
     * Retrieves voxel values at integer coordinates
     * returns 0 if out of bounds
     * @param x - 0-based X coordinate
     * @param y - 0-based Y coordinate
     * @param z - 0-based Z coordinate
     * @returns voxel intensity at (x, y, z)
     */
    getVoxel(x:number, y:number, z:number): number {
        const idx = x + y * this.width + z * this.width * this.height;
        
        return this.data[idx];
    }

    /**
     * Samples volume at normalised coordinates [0, 1]^3 using nearest neighbor
     * @param u - normalised x coordinate
     * @param v - normalised y coordinate
     * @param w - normalised z coordinate
     * @returns voxel intensity at normalised coordinates
     */
    sampleNormalised(u:number, v:number, w:number): number {
        const x = u * (this.width-1);
        const y = v * (this.height-1);
        const z = w * (this.depth-1);

        return this.getVoxel(Math.floor(x), Math.floor(y), Math.floor(z));
    }

    /**
     * Returns axis-aligned bounding box of volume in physical space
     * @returns object with min max coordinates in mm
     */
    get boundingBox() {
        const [sx, sy, sz] = this.metadata.spacing;

        return { min: [0, 0, 0], max: [this.width*sx, this.height*sy, this.depth*sz] };
    }
}   