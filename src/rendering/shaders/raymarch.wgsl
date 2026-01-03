struct Uniforms {
    viewMatrix: mat4x4<f32>,
    invViewMatrix: mat4x4<f32>,
    cameraPos: vec3<f32>,
    _padding1: f32,
    volumeSize: vec3<f32>,
    _padding2: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var volumeTexture: texture_3d<f32>;
@group(0) @binding(2) var volumeSampler: sampler;
@group(0) @binding(3) var transferFuncTexture: texture_1d<f32>;
@group(0) @binding(4) var transferSampler: sampler;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>
}

// vertex shader implementation

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    var output: VertexOutput;

    // fullscreen triangle generation
    let x = f32((vertexIndex << 1u) & 2u);
    let y = f32(vertexIndex & 2u);

    output.position = vec4<f32>(x * 2.0 - 1.0, 1.0 - y * 2.0, 0.0, 1.0);
    output.uv = vec2<f32>(x, y);

    return output;
}

// raybox intersection implementation
fn rayBoxIntersection(rayOrigin: vec3<f32>, rayDir: vec3<f32>, boxMin: vec3<f32>, boxMax: vec3<f32>) -> vec2<f32> {
    let invDir = 1.0 / rayDir;
    let t0 = (boxMin - rayOrigin) * invDir;
    let t1 = (boxMax - rayOrigin) * invDir;

    let tMin = min(t0, t1);
    let tMax = max(t0, t1);

    let tEnter = max(max(tMin.x, tMin.y), tMin.z);
    let tExit = min(min(tMax.x, tMax.y), tMax.z);

    return vec2<f32>(tEnter, tExit);
}

// raymarching fragment shader implementation

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
    // converting uv to normalised device coordinates
    let ndc = input.uv * 2.0 - 1.0;

    // generating ray in view space
    let aspect = 1.0;
    let fov = 1.0;
    let rayDirView = normalize(vec3<f32>(ndc.x * aspect, -ndc.y, -fov));

    // transforming ray to world space using inverse view
    let rayDirWorld = normalize((uniforms.invViewMatrix * vec4<f32>(rayDirView, 0.0)).xyz);

    // setting up ray origin (camera position)
    let rayOrigin = uniforms.cameraPos;

    // setting up volume bounding box
    let boxMin = vec3<f32>(-0.5, -0.5, -0.5);
    let boxMax = vec3<f32>(0.5, 0.5, 0.5);
    
    let intersection = rayBoxIntersection(rayOrigin, rayDirWorld, boxMin, boxMax);
    let tEnter = intersection.x;
    let tExit = intersection.y;

    if (tEnter > tExit || tExit < 0.0) {
        return vec4<f32>(0.0, 0.0, 0.0, 1.0);
    }

    let tStart = max(tEnter, 0.0);
    
    // raymarching through the volume
    let stepSize = 0.003;
    let maxSteps = 500;
    var t = tStart;
    var accumColour = vec4<f32>(0.0);

    for (var i = 0; i < maxSteps; i++) {
        if (t > tExit){
            break;
        }

        let pos = rayOrigin + rayDirWorld * t;

        // converting to texture coordinates
        let texCoord = vec3<f32>(
            pos.x + 0.5,           
            1.0 - (pos.y + 0.5),   
            1.0 - (pos.z + 0.5)    
        );

        // sample volume
        let density = textureSampleLevel(volumeTexture, volumeSampler, texCoord, 0.0).r;

        if (density > 0.01) {
            // sampling 1D texture coordinates using density
            let tfSample = textureSampleLevel(transferFuncTexture, transferSampler, density, 0.0);
            
            let colour = vec4<f32>(tfSample.rgb, density * 0.5);

            // front-to-back compositing
            let alpha = colour.a * (1.0 - accumColour.a);
            accumColour = accumColour + vec4<f32>(colour.rgb * alpha, alpha);
            
            // early ray termination
            if (accumColour.a > 0.95) {
                break;
            }
        }


        t += stepSize;

        // checking against max distance
        if (t > 10.0) {
            break;
        }
    }

    return vec4<f32>(accumColour.rgb, 1.0);
}