/**
 * Orbit camera for volume inspection
 */
export class Camera {
    public radius: number = 2.0;
    public theta: number = Math.PI / 4;
    public phi: number = Math.PI / 4;
    

    public target: [number, number, number] = [0, 0, 0];

    constructor() {}

    /**
     * getting camera position in world space
     */
    getPosition(): [number, number, number] {
        const x = this.target[0] + this.radius * Math.sin(this.phi) * Math.cos(this.theta);
        const y = this.target[1] + this.radius * Math.cos(this.phi);
        const z = this.target[2] + this.radius * Math.sin(this.phi) * Math.sin(this.theta);

        return [x, y, z];
    }

    /**
     * getting view matrix as Float32Array (column-major)
     */
    getViewMatrix(): Float32Array {
        const pos = this.getPosition();
        const eye = pos;
        const centre = this.target;
        const up: [number, number, number] = [0, 1, 0];

        // calculating lookAt matrix
        const zAxis = normalise(subtract(eye, centre));
        const xAxis = normalise(cross(up, zAxis));
        const yAxis = cross(zAxis, xAxis);

        return new Float32Array([
            xAxis[0], yAxis[0], zAxis[0], 0,
            xAxis[1], yAxis[1], zAxis[1], 0,
            xAxis[2], yAxis[2], zAxis[2], 0,
            -dot(xAxis, eye), -dot(yAxis, eye), -dot(zAxis, eye), 1,
        ]);
    }

    /**
     * getting inverse view matrix for ray generation
     */
    getInverseViewMatrix(): Float32Array {
        const pos = this.getPosition();
        const eye = pos;
        const centre = this.target;
        const up: [number, number, number] = [0, 1, 0];

        const zAxis = normalise(subtract(eye, centre));
        const xAxis = normalise(cross(up, zAxis));
        const yAxis = cross(zAxis, xAxis);

        return new Float32Array([
            xAxis[0], xAxis[1], xAxis[2], 0,
            yAxis[0], yAxis[1], yAxis[2], 0,
            zAxis[0], zAxis[1], zAxis[2], 0,
            eye[0], eye[1], eye[2], 1,
        ]);
    }

    /**
     * camera rotation
     */
    rotate(deltaTheta: number, deltaPhi: number) {
        this.theta += deltaTheta;
        this.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.phi + deltaPhi));
    }

    /**
     * camera zoom
     */
    zoom(delta: number) {
        this.radius = Math.max(0.5, Math.min(10, this.radius + delta));
    }
}
    // vector math helper functions

    function subtract(a: [number, number, number], b: [number, number, number]): [number, number, number] {
        return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    }
    

    function cross(a: [number, number, number], b: [number, number, number]): [number, number, number] {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0],
        ];
    }

    function dot(a: [number, number, number], b: [number, number, number]): number {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }

    function length(v: [number, number, number]): number {
        return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    }

    function normalise(v: [number, number, number]): [number, number, number] {
        const len = length(v);
        return [v[0] / len, v[1] / len, v[2] / len];
    }
