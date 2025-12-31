struct Uniforms {
    viewMatrix: mat4x4<f32>,
    cameraPos: vec3<f32>,
    volumeSize: vec3<f32>,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var volumeTexture: texture_3d<f32>
@group(0) @binding(2) var volumeSampler: sampler;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>
}