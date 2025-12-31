import { Camera } from "./Camera";

/**
 * handling mouse and keyboard input for camera control
 */
export class InputHandler {
    private canvas: HTMLCanvasElement;
    private camera: Camera;
    private isDragging = false;
    private lastX = 0;
    private lastY = 0;

    constructor(canvas: HTMLCanvasElement, camera: Camera) {
        this.canvas = canvas;
        this.camera = camera;
        this.setupListeners();
    }

    private setupListeners() {
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;

            const deltaX = e.clientX - this.lastX;
            const deltaY = e.clientY - this.lastY;

            this.camera.rotate(deltaX * 0.01, deltaY * 0.01);

            this.lastX = e.clientX;
            this.lastY = e.clientY;
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        // adding zoom on mouse wheel scroll
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.camera.zoom(e.deltaY * 0.001);
        })
    }
}