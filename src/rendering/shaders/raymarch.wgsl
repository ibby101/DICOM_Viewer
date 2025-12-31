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

// vertex shader implementation

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    var output: VertexOutput

    // fullscreen triangle generation
    let x = f32((vertexIndex << 1u) & 2u);
    let y = f32(vertexIndex & 2u)

    output.position = vec4<f32>(x * 2.0 - 1.0, 1.0 - y * 2.0, 0.0, 1.0);
    output.uv = vec2<f32>(x, y);

    return output;
}

// raymarching fragment shader implementation

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
    // converting uv to normalised device coordinates
    let ndc = input.uv * 2.0 - 1.0;

    // setting up ray origin (camera position)
    let rayOrigin = uniform.cameraPos;

    // orthographic ray direction
    let rayDir = normalize(vec3<f32>(ndc.x, ndc.y, -1.0));

    // raymarching through the volume
    let stepSize = 0.01;
    let maxSteps = 500;
    var t = 0.0;
    var accumColour = vec4<f32>(0.0);

    for (var i = 0; i < maxSteps; i++) {
        let pos = rayOrigin + rayDir * t;

        // converting to texture coordinates
        let texCoord = pos * 0.5 + 0.5;

        // checking if we are inside the volume
        if (all(texCoord >= vec3<f32>(0.0)) && all(texCoord <= vec3<f32>(1.0))){
            // if so, sample volume
            let density = textureSample(volumeTexture, volumeSampler, texCoord).r;

            // applying transfer function, opacity based on density
            let colour = vec4<f32>(1.0, 1.0, 1.0, density * 0.1);
            
            // front-to-back compositing
            accumColour = accumColour + colour * (1.0 - accumColour.a);
            
            // early ray termination
            if (accumColour.a > 0.95) {
                break;
            }
        }

        t += stepSize;

        // checking against max distance
        if (t > 3.0) {
            break;
        }
    }

    return vec4<f32>(accumColour.rgb, 1.0);
}