/**
 * Swaply's procedural 3D Home world. No remote assets, tracking or extra runtime
 * dependency. WebGL2 renders actual geometry, perspective, lighting and shadows.
 * React owns navigation/data; this module owns only the decorative scene.
 */
export type Domain = "objects" | "properties" | "services" | "events";
type V3 = [number, number, number];
type M4 = Float32Array;
type Colour = [number, number, number];
export const DOMAIN_IDS: readonly Domain[] = ["objects", "properties", "services", "events"];
const CENTRES: V3[] = [[-5.1, 0.5, -4], [5.1, 0.5, -4], [-5.1, 0, 4], [5.1, 0, 4], [0, 0.8, 0]];
const STRIDE = 10;
const TAU = Math.PI * 2;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (v: V3): V3 => { const l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const hex = (n: number): Colour => [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
const tint = (n: number, s: number): Colour => hex(n).map(v => clamp(v * s, 0, 1)) as Colour;
export function multiply(a: M4, b: M4): M4 {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) out[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return out;
}
function view(eye: V3, target: V3): M4 {
  const z = norm(sub(eye, target)), x = norm(cross([0, 1, 0], z)), y = cross(z, x);
  return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1]);
}
function perspective(fov: number, aspect: number): M4 {
  const f = 1 / Math.tan(fov / 2), near = 0.2, far = 150;
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, 2 * far * near / (near - far), 0]);
}
function ortho(s: number): M4 { return new Float32Array([1/s,0,0,0, 0,1/s,0,0, 0,0,-2/100,0, 0,0,-1,1]); }
function model(p: V3, angle = 0): M4 {
  const c = Math.cos(angle), s = Math.sin(angle);
  return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, ...p,1]);
}
function point(m: M4, p: V3): V3 {
  return [m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12], m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13], m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];
}
function random(seed: number) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let n = Math.imul(seed ^ seed >>> 15, 1 | seed); n ^= n + Math.imul(n ^ n >>> 7, 61 | n); return ((n ^ n >>> 14) >>> 0) / 4294967296; }; }

class Sculpt {
  values: number[] = [];
  matrix: M4 = model([0,0,0]);
  group(at: V3, scale: number, angle: number, fn: () => void) {
    const saved = this.matrix, m = model(at, angle);
    for (let i = 0; i < 12; i++) m[i] *= scale;
    this.matrix = multiply(saved, m); fn(); this.matrix = saved;
  }
  triangle(a: V3, b: V3, c: V3, colour: number | Colour, glow = 0) {
    a = point(this.matrix, a); b = point(this.matrix, b); c = point(this.matrix, c);
    const n = norm(cross(sub(b, a), sub(c, a))), rgb = typeof colour === "number" ? hex(colour) : colour;
    for (const p of [a,b,c]) this.values.push(...p, ...n, ...rgb, glow);
  }
  quad(a: V3, b: V3, c: V3, d: V3, colour: number | Colour, glow = 0) { this.triangle(a,b,c,colour,glow); this.triangle(a,c,d,colour,glow); }
  box(p: V3, size: V3, colour: number, glow = 0) {
    const [x,y,z] = p, [a,b,c] = size.map(n => n/2);
    const v: V3[] = [[x-a,y-b,z-c],[x+a,y-b,z-c],[x+a,y+b,z-c],[x-a,y+b,z-c],[x-a,y-b,z+c],[x+a,y-b,z+c],[x+a,y+b,z+c],[x-a,y+b,z+c]];
    for (const ids of [[4,5,6,7],[1,0,3,2],[0,4,7,3],[5,1,2,6],[3,7,6,2],[0,1,5,4]]) this.quad(v[ids[0]],v[ids[1]],v[ids[2]],v[ids[3]],colour,glow);
  }
  cylinder(p: V3, r: number, top: number, height: number, colour: number, sides = 12, glow = 0) {
    const y0 = p[1] - height/2, y1 = p[1] + height/2;
    for (let i=0;i<sides;i++) {
      const a = i*TAU/sides, b = (i+1)*TAU/sides;
      const v0: V3 = [p[0]+r*Math.cos(a),y0,p[2]+r*Math.sin(a)], v1: V3 = [p[0]+r*Math.cos(b),y0,p[2]+r*Math.sin(b)];
      const v2: V3 = [p[0]+top*Math.cos(b),y1,p[2]+top*Math.sin(b)], v3: V3 = [p[0]+top*Math.cos(a),y1,p[2]+top*Math.sin(a)];
      this.quad(v1,v0,v3,v2,colour,glow); this.triangle(v3,[p[0],y1,p[2]],v2,colour,glow); this.triangle(v0,[p[0],y0,p[2]],v1,colour,glow);
    }
  }
  sphere(p: V3, size: V3, colour: number, segments = 10, glow = 0) {
    const at = (i: number,j: number): V3 => { const u=i*TAU/segments, v=j*Math.PI/(segments/2); return [p[0]+size[0]*Math.cos(u)*Math.sin(v),p[1]+size[1]*Math.cos(v),p[2]+size[2]*Math.sin(u)*Math.sin(v)]; };
    for(let i=0;i<segments;i++) for(let j=0;j<segments/2;j++) this.quad(at(i,j),at(i+1,j),at(i+1,j+1),at(i,j+1),colour,glow);
  }
  beam(a: V3, b: V3, width: number, colour: number) {
    const z=norm(sub(b,a)), x=norm(cross(Math.abs(z[1]) > .95 ? [1,0,0] : [0,1,0],z)), y=cross(z,x), h=width/2;
    const ring = (p: V3): V3[] => [[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v]) => add(p,[h*(x[0]*u+y[0]*v),h*(x[1]*u+y[1]*v),h*(x[2]*u+y[2]*v)]));
    const aa=ring(a),bb=ring(b);
    for(let i=0;i<4;i++) this.quad(aa[i],aa[(i+1)%4],bb[(i+1)%4],bb[i],colour);
    this.quad(...aa as [V3,V3,V3,V3],colour); this.quad(...bb as [V3,V3,V3,V3],colour);
  }
  torus(p: V3, radius: number, tube: number, colour: number, vertical = false, glow = 0) {
    const at=(i:number,j:number):V3=>{const u=i*TAU/32,v=j*TAU/6,r=radius+tube*Math.cos(v);return vertical ? [p[0]+r*Math.cos(u),p[1]+r*Math.sin(u),p[2]+tube*Math.sin(v)] : [p[0]+r*Math.cos(u),p[1]+tube*Math.sin(v),p[2]+r*Math.sin(u)];};
    for(let i=0;i<32;i++) for(let j=0;j<6;j++) this.quad(at(i,j),at(i+1,j),at(i+1,j+1),at(i,j+1),colour,glow);
  }
}

function island(b: Sculpt, radius: number, seed: number) {
  const rng = random(seed), sides=28;
  const outline=Array.from({length:sides},()=>radius*(.88+rng()*.16));
  const rings = [[0.16,1],[-.3,1.02],[-1.2,.85],[-2.4,.54],[-3.0,.17]];
  const at=(i:number,r:number):V3=>{const a=i*TAU/sides;return [Math.cos(a)*outline[i%sides]*rings[r][1],rings[r][0]+(r>0?Math.sin(i*6.1+seed)*.14:0),Math.sin(a)*outline[i%sides]*rings[r][1]*.78];};
  for(let i=0;i<sides;i++) {
    b.triangle([0,.16,0],at(i+1,0),at(i,0),tint(0x72a64b,.88+rng()*.22));
    for(let r=0;r<rings.length-1;r++) {
      const a=at(i,r),c=at(i+1,r+1);
      b.triangle(a,at(i,r+1),c,tint(r===0?0x537d3c:0x6b7985,.75+rng()*.5));
      b.triangle(a,c,at(i+1,r),tint(r===0?0x5b8741:0x80919a,.7+rng()*.45));
    }
    if(i%3===0) b.sphere([at(i,1)[0],-.27,at(i,1)[2]],[.28,.3,.23],0x507b34,8);
  }
  b.cylinder([0,.185,0],radius*.45,radius*.45,.045,0xcab697,40);
}
function tree(b:Sculpt,x:number,z:number,scale=1,pine=false) {
  b.group([x,.18,z],scale,0,()=>{
    b.cylinder([0,.75,0],.13,.065,1.5,0x725334,7);
    if(pine) { for(let i=0;i<3;i++) b.cylinder([0,1+i*.5,0],.75-i*.12,0,1.15, [0x224e3e,0x2d6650,0x42865b][i],9); }
    else { b.sphere([0,1.65,0],[.8,.82,.7],0x548b41,12);b.sphere([.47,1.63,.05],[.5,.65,.48],0x79a54a,10);b.sphere([-.35,1.44,.18],[.5,.59,.46],0x3a783c,10); }
  });
}
function flowers(b:Sculpt,x:number,z:number,n:number,seed:number) {
  const r=random(seed);
  for(let i=0;i<n;i++){const px=x+(r()-.5)*1.1,pz=z+(r()-.5)*.7; b.cylinder([px,.28,pz],.012,.012,.2,0x436c38,5);b.sphere([px,.39,pz],[.055,.045,.055],[0xf7d586,0xefad86,0xf2eee0,0xc992c7][i%4],6);}
}
function bench(b:Sculpt,x:number,z:number) {
  for(const dx of [-.5,.5]) b.box([x+dx,.4,z],[.08,.5,.45],0x413c35);
  for(let j=0;j<3;j++) b.box([x,.64,z+(j-1)*.14],[1.3,.065,.12],0xa87749);
  b.box([x,.9,z-.24],[1.3,.24,.06],0xb47e4b);
}
function person(b:Sculpt,x:number,z:number,colour:number,scale=1) {
  b.group([x,.18,z],scale,0,()=>{
    b.beam([-.055,.02,0],[-.075,.31,0],.065,0x263641);b.beam([.055,.02,0],[.065,.31,.035],.065,0x263641);
    b.cylinder([0,.44,0],.11,.13,.3,colour,8); b.sphere([0,.72,0],[.092,.115,.09],0xc49370,8); b.sphere([0,.79,-.01],[.098,.065,.095],0x48332c,8);
    b.beam([-.13,.54,0],[-.19,.29,.025],.055,colour);b.beam([.13,.54,0],[.18,.3,.055],.055,colour);
  });
}
function house(b:Sculpt,x:number,z:number,scale=1) {
  b.group([x,.18,z],scale,0,()=>{
    b.box([0,.12,0],[2.2,.24,1.85],0xc8bcaa); b.box([0,1.07,0],[1.85,1.9,1.52],0xf6e8ce);
    for(const dx of [-.82,0,.82]) b.box([dx,1.15,.781],[.075,1.8,.065],0x76543a);
    b.box([0,1.76,.8],[1.85,.07,.06],0x76543a);
    const a:V3=[-1.1,1.98,-.95],c:V3=[1.1,1.98,-.95],d:V3=[0,3.02,-.95],aa:V3=[-1.1,1.98,.95],cc:V3=[1.1,1.98,.95],dd:V3=[0,3.02,.95];
    b.triangle(aa,cc,dd,0xeedabd); b.triangle(c,a,d,0xeedabd);b.quad(a,aa,dd,d,0xad6843);b.quad(dd,cc,c,d,0x925134);
    for(let j=0;j<12;j++){const zz=-.93+j*.168;b.beam([-1.11,1.99,zz],[0,3.04,zz],.035,0xc27e52);b.beam([0,3.04,zz],[1.11,1.99,zz],.035,0xa76443);}
    b.box([.58,2.73,-.4],[.28,1,.3],0x9b795e);b.box([.58,3.25,-.4],[.36,.1,.38],0xc5b39b);
    for(const xx of [-.52,.52]) for(const yy of [.85,1.52]){
      b.box([xx,yy,.782],[.34,.39,.035],0x244750);b.box([xx,yy,.805],[.025,.39,.02],0xe2bc72);b.box([xx,yy,.805],[.34,.025,.02],0xe2bc72);
      b.box([xx-.23,yy,.80],[.09,.43,.035],0x648073); b.box([xx+.23,yy,.80],[.09,.43,.035],0x648073);
    }
    b.box([0,.55,.8],[.29,.93,.09],0x684c39);b.sphere([.08,.58,.859],[.025,.025,.025],0xeac777,8);
    b.box([0,.06,1.03],[.75,.1,.4],0xe1d8c4);b.box([0,.02,1.25],[.9,.08,.25],0xc0b8a5);
    flowers(b,-.64,1,10,3);flowers(b,.66,1,10,9);
  });
}
function bicycle(b:Sculpt,x:number,z:number) {
  b.group([x,.2,z],.85,-.15,()=>{
    for(const xx of [-.6,.6]) { b.torus([xx,.43,0],.4,.042,0x303739,true);b.torus([xx,.43,0],.32,.018,0xcfb583,true);for(let i=0;i<10;i++){const a=i*TAU/10;b.beam([xx,.43,0],[xx+Math.cos(a)*.34,.43+Math.sin(a)*.34,0],.014,0xb7c1be);}}
    for(const [a,c] of [[[-.6,.43,0],[-.25,.97,0]],[[-.6,.43,0],[.08,.43,0]],[[.08,.43,0],[-.25,.97,0]],[[-.25,.97,0],[.4,.93,0]],[[.4,.93,0],[.08,.43,0]],[[.4,.93,0],[.6,.43,0]]] as [V3,V3][]) b.beam(a,c,.055,0xd89836);
    b.box([-.28,1.03,0],[.3,.07,.13],0x563c2e);b.beam([.4,.9,0],[.38,1.22,0],.04,0x778788);b.beam([.38,1.22,0],[.5,1.22,.17],.045,0x2f4147);
  });
}
function market(b:Sculpt) {
  island(b,3.3,12);
  b.box([-.45,.32,-.35],[3.1,.23,2.3],0xb38b5e);
  for(let i=0;i<9;i++) b.box([-1.83+i*.35,.45,-.35],[.32,.05,2.3],0xbf986b);
  for(const x of [-1.9,1]) for(const z of [-1.5,.55]) b.beam([x,.3,z],[x,2.75,z],.11,0x956735);
  for(let i=0;i<12;i++) {
    const x=-2+i*.26;
    b.quad([x,2.75,-1.57],[x+.265,2.75,-1.57],[x+.265,2.43,.74],[x,2.43,.74],i%2?0xf9e8bf:0xda913d);
    b.box([x+.13,2.35,.74],[.26,.17,.04],i%2?0xf9e8bf:0xda913d);
  }
  b.box([-.5,1,-1.24],[2.7,1.2,.18],0x775337);
  for(const yy of [.6,1.13,1.68]) b.box([-.5,yy,-.96],[2.6,.085,.55],0xb17d49);
  for(let i=0;i<8;i++){const x=-1.52+i*.3;b.cylinder([x,1.42,-.94],.07,.1,.35,[0x6c98a0,0xc58053,0xe2bc86][i%3],8);}
  // Sofa, records, a lamp and a bicycle are actual meshes, not image planes.
  b.box([-.85,.74,.12],[1.33,.4,.64],0xc96a4d);b.box([-.85,1.06,-.12],[1.33,.42,.14],0xad563f);
  for(const x of [-1.56,-.15]) b.box([x,.89,.11],[.18,.55,.7],0xb95c41);
  for(const x of [-1.2,-.5]) b.box([x,.98,.01],[.48,.16,.43],0xe6ad7e);
  b.cylinder([.6,1.22,-.45],.035,.035,1.5,0x55463b,8);b.cylinder([.6,2,-.45],.3,.17,.36,0xe5c284,12);
  b.box([-1.85,.62,1.15],[.66,.7,.65],0xb7864e);b.box([-1.85,1,1.15],[.71,.07,.7],0xe4be7e);
  bicycle(b,1.23,.81); tree(b,-2.1,-.65,.63);tree(b,1.77,-1.34,.77,true);flowers(b,-2.2,.8,14,15);
  person(b,.05,1.9,0xf0d2a0,1);person(b,-1.4,1.85,0x356e78,1.05);
}
function properties(b:Sculpt) {
  island(b,3.35,24);house(b,-.38,-.35,1.03);tree(b,1.8,-.82,1.15);tree(b,-2.1,-1.05,.85,true);tree(b,2.05,1.25,.55);
  for(let i=0;i<9;i++) {const x=-1.65+i*.39;b.box([x,.59,1.7],[.055,.73,.055],0xefe5ca);}
  b.box([-.08,.48,1.7],[3.26,.06,.07],0xdedac1);b.box([-.08,.8,1.7],[3.26,.06,.07],0xdedac1);
  bench(b,1.22,.8);person(b,-.55,1.2,0x426d82);flowers(b,-1.8,1.1,20,7);
  b.cylinder([2,.21,-.03],.51,.51,.04,0x66b9c9,24);b.torus([2,.24,-.03],.53,.04,0xd8cead);
}
function services(b:Sculpt) {
  island(b,3.45,35);b.box([-.4,.28,-.4],[3.3,.2,2.3],0xb5a087);
  b.box([-.4,1.44,-1.4],[3.3,2.45,.12],0xb4c3b3);b.box([-2,1.45,-.45],[.12,2.5,2],0x789183);
  for(let i=0;i<10;i++) b.box([-.4,.5+i*.21,-1.31],[3.2,.025,.03],0x98ac9c);
  b.box([-.48,1.07,-.8],[2.6,.13,.78],0xc4925f);
  for(const x of [-1.65,.65]) b.box([x,.63,-.8],[.1,.83,.6],0x4f5e56);
  b.box([-.35,1.6,-1.02],[.89,.61,.09],0x273c4a);b.box([-.35,1.6,-.96],[.77,.49,.02],0x69c3d9,.25);b.box([-.35,1.19,-.91],[.55,.04,.29],0x6b8190);
  b.box([-1.25,1.3,-.68],[.35,.32,.3],0xe6c799);
  for(let i=0;i<4;i++){b.beam([.45+i*.23,1.9,-1.26],[.45+i*.23,2.32,-1.26],.045,[0x496678,0xdaab57][i%2]);b.box([.45+i*.23,2.31,-1.25],[.15,.08,.07],0x637983);}
  // Sewing/repair work table and a studio keyboard.
  b.box([-.65,.85,.83],[1.9,.12,.8],0xdfbf86);
  for(const x of [-1.4,.1]) b.box([x,.51,.83],[.08,.7,.65],0x66716a);
  b.box([-1,1.09,.78],[.47,.37,.24],0xeee1c8);b.box([-.82,1.18,.78],[.32,.13,.21],0xeee1c8);b.torus([-1.19,1.19,.91],.12,.04,0x45596a,true);
  person(b,.45,.7,0x567a9d,1.25); person(b,-1.6,1.7,0xcc955f,1.0); tree(b,1.94,-1.1,.86);tree(b,2,1.3,.62,true); flowers(b,-2,1.2,14,23);
  b.box([1.35,.37,.15],[.76,.34,.6],0x847159);b.sphere([1.35,.8,.15],[.4,.4,.34],0x71a259,10);
}
function events(b:Sculpt) {
  island(b,3.5,48);b.box([0,.46,-.74],[3.85,.56,2.1],0x34495b);b.box([0,.77,-.74],[3.92,.06,2.15],0x655b7b);
  for(const x of [-1.92,1.92]) {b.beam([x,.6,-1.68],[x,3.3,-1.68],.13,0x627282);for(let i=0;i<6;i++) b.beam([x-.08,.7+i*.43,-1.68],[x+.08,1.05+i*.43,-1.68],.034,0xa3a8ad);}
  b.beam([-1.92,3.3,-1.68],[1.92,3.3,-1.68],.15,0x7c8a95);
  b.box([0,2,-1.63],[3.35,1.84,.15],0x292647);
  for(let j=0;j<7;j++) for(let i=0;i<17;i++) b.box([-1.51+i*.189,1.24+j*.22,-1.535],[.14,.15,.02],(i+j)%3?0x8872da:0xf2aade,.72);
  for(const x of [-1.69,1.69]) {b.box([x,1.15,-.19],[.44,.75,.4],0x243442);b.torus([x,1.18,.02],.13,.03,0x728494,true);}
  for(let i=0;i<5;i++) b.sphere([-1.35+i*.675,3.19,-1.52],[.1,.12,.1],i%2?0xe5b688:0x9abdfa,8,.95);
  person(b,-.52,-.17,0xe8c076,1.2);person(b,.56,-.43,0x9490c7,1.1);
  for(let j=0;j<3;j++) for(let i=0;i<6;i++) person(b,-1.5+i*.6+(j%2)*.1,.68+j*.5,[0xbc8264,0x547a8d,0xccb187,0x728679,0x665d8b,0xd6b29c][(i+j)%6],.82+((i*3+j)%3)*.08);
  tree(b,-2.32,-.5,.75,true);tree(b,2.4,-.8,.79,true);flowers(b,-2.45,1,12,37);
  b.cylinder([2.33,1.13,.5],.7,0,1.14,0xd48c78,8);b.cylinder([2.33,.52,.5],.48,.48,.5,0xe8bd93,8);
}
function centre(b:Sculpt) {
  island(b,1.66,70); b.cylinder([0,.35,0],1.4,1.4,.4,0xddc89b,40);b.cylinder([0,.6,0],1.19,1.19,.15,0xf3e0b8,40);b.torus([0,.72,0],1.23,.035,0xf6cf83,false,.6);
  tree(b,0,-.2,.8);flowers(b,-.58,.55,13,6);flowers(b,.67,.48,13,2);
  b.box([0,.89,.94],[1.7,.44,.08],0x436457);
  for(const x of [-.58,.58]) b.beam([x,.2,.95],[x,1,.95],.06,0x725038);
}
function background(b:Sculpt) {
  const r=random(193);
  // Receding ridgelines, with a low horizon so the sky remains open.
  for(let layer=2;layer>=0;layer--) {
    const z=-30-layer*16, base=-7, points:V3[]=[];
    for(let i=0;i<31;i++) points.push([(i-15)*5.2,base+2+r()*5.5+layer*1.5,z+(r()-.5)*4]);
    for(let i=0;i<points.length-1;i++) {
      const a=points[i],c=points[i+1],mid:V3=[(a[0]+c[0])/2,base,(a[2]+c[2])/2+4];
      b.triangle(a,[a[0],base,a[2]+3],mid,[0x7398ac,0x9bb8c6,0xc2ced0][layer]);
      b.triangle(a,mid,c,[0x83a9ba,0xa8c1c8,0xcbd5d3][layer]);
      b.triangle(mid,[c[0],base,c[2]+3],c,[0x658aa1,0x91adbf,0xb6c6d0][layer]);
      if(a[1]>base+5.5) b.triangle(a,[a[0]-.6,a[1]-1.1,a[2]+.3],[a[0]+.8,a[1]-.7,a[2]+.45],0xe3e6db);
    }
  }
  // Ocean and little distant islands.
  b.box([0,-6.5,-8],[170,.1,110],0x7bb5c6);
  for(let i=0;i<14;i++) {const x=(r()-.5)*70,z=-10-r()*20;b.sphere([x,-6.35,z],[1+r()*3,.3+r(),.7+r()],0x86a388,10);}
  for(let i=0;i<18;i++) {
    const x=(r()-.5)*45,z=(r()-.5)*30,y=-3.8-r()*2;
    for(let j=0;j<4;j++) b.sphere([x+j*.74,y+Math.sin(j)*.25,z],[1.3,.53,1],0xe8e8df,18,.18);
  }
}
export function buildHomeWorld() {
  const b = new Sculpt();
  const batches: { start: number; count: number; centre: V3; domain: Domain | null }[]=[];
  for(const [i,fn] of [market,properties,services,events,centre,background].entries()) {
    const start=b.values.length/STRIDE; fn(b);
    batches.push({start,count:b.values.length/STRIDE-start,centre:CENTRES[i]??[0,0,0],domain:DOMAIN_IDS[i]??null});
  }
  return { vertices: new Float32Array(b.values), batches };
}

const VERTEX = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec3 aColour;
layout(location=3) in float aGlow;
uniform mat4 uViewProjection, uModel, uLight;
out vec3 vNormal, vColour, vWorld;
out vec4 vShadow;
out float vGlow;
void main(){vec4 p=uModel*vec4(aPosition,1.);vWorld=p.xyz;vNormal=mat3(uModel)*aNormal;vColour=aColour;vGlow=aGlow;vShadow=uLight*p;gl_Position=uViewProjection*p;}`;
const FRAGMENT = `#version 300 es
precision highp float;
in vec3 vNormal, vColour, vWorld;
in vec4 vShadow;
in float vGlow;
uniform sampler2D uShadow;
uniform vec3 uEye;
uniform bool uShadows;
out vec4 outColour;
void main(){
 vec3 n=normalize(vNormal); if(!gl_FrontFacing)n=-n;
 vec3 light=normalize(vec3(-12.,22.,14.));float diffuse=max(dot(n,light),0.);
 float shadow=1.; vec3 sc=vShadow.xyz/vShadow.w*.5+.5;
 if(uShadows && sc.x>0. && sc.x<1. && sc.y>0. && sc.y<1. && sc.z<1.){
   float shade=0.;float bias=max(.0015*(1.-diffuse),.00055);
   for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){float d=texture(uShadow,sc.xy+vec2(x,y)/1536.).r;shade+=sc.z-bias>d?0.:1.;}shadow=.35+.65*shade/9.;
 }
 float hemi=.51+.16*clamp(n.y,0.,1.);vec3 illumination=vec3(.82,.91,1.02)*hemi+vec3(1.05,.88,.64)*diffuse*.75*shadow;
 vec3 col=vColour*illumination;col=mix(col,vColour*1.2,clamp(vGlow,0.,1.));
 float spec=pow(max(dot(reflect(-light,n),normalize(uEye-vWorld)),0.),32.)*.025;col+=spec;
 float mist=smoothstep(28.,100.,distance(uEye,vWorld))*.88;col=mix(col,vec3(.72,.83,.84),mist);
 col=pow(clamp(col,0.,1.),vec3(.91));outColour=vec4(col,1.);
}`;
const DEPTH_VS = `#version 300 es
layout(location=0) in vec3 aPosition;uniform mat4 uViewProjection,uModel;void main(){gl_Position=uViewProjection*uModel*vec4(aPosition,1.);}`;
const DEPTH_FS = `#version 300 es
precision highp float;void main(){}`;

export type WorldOptions = { reducedMotion?: boolean; onSelect?: (domain: Domain | null) => void; onUnavailable?: () => void };
export type WorldController = {
  select: (domain: Domain | null) => void;
  setMotion: (enabled: boolean) => void;
  zoom: (amount: number) => void;
  reset: () => void;
  dispose: () => void;
};
export function createHomeWorld(canvas: HTMLCanvasElement, options: WorldOptions = {}): WorldController {
  const context = canvas.getContext("webgl2", { alpha: true, antialias: true, powerPreference: "low-power", preserveDrawingBuffer: false });
  if (!context) throw new Error("WebGL2 unavailable");
  const gl: WebGL2RenderingContext = context;
  let disposed=false, lost=false, visible=true, motion=!options.reducedMotion, reduced=!!options.reducedMotion, selected:Domain|null=null;
  let yaw=0, targetYaw=0, zoom=1, targetZoom=1, elapsed=0, previous=0, frame=0, frames=0;
  let aspect=1, cssWidth=1, cssHeight=1, target:V3=[-2.4,0,0], cameraTarget:V3=[...target], eye:V3=[0,15,26];
  let vp: M4=new Float32Array(16);
  let dragging=false, dragX=0, dragY=0, travel=0;
  const {vertices,batches}=buildHomeWorld();
  const shaders:WebGLShader[]=[],programs:WebGLProgram[]=[];
  const shader=(source:string,type:number)=>{const s=gl.createShader(type);if(!s)throw new Error("Shader allocation failed");shaders.push(s);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)??"Shader error");return s;};
  const program=(v:string,f:string)=>{const p=gl.createProgram();if(!p)throw new Error("Program allocation failed");programs.push(p);gl.attachShader(p,shader(v,gl.VERTEX_SHADER));gl.attachShader(p,shader(f,gl.FRAGMENT_SHADER));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p)??"Link error");return p;};
  let main:WebGLProgram, depth:WebGLProgram;
  try { main=program(VERTEX,FRAGMENT);depth=program(DEPTH_VS,DEPTH_FS); } catch(e){shaders.forEach(s=>gl.deleteShader(s));programs.forEach(p=>gl.deleteProgram(p));throw e;}
  const vao=gl.createVertexArray(),buffer=gl.createBuffer(),texture=gl.createTexture(),fbo=gl.createFramebuffer();
  if(!vao||!buffer||!texture||!fbo) {shaders.forEach(s=>gl.deleteShader(s));programs.forEach(p=>gl.deleteProgram(p));gl.deleteBuffer(buffer);gl.deleteVertexArray(vao);gl.deleteTexture(texture);gl.deleteFramebuffer(fbo);throw new Error("GPU allocation failed");}
  gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);
  for(const [i,size,offset] of [[0,3,0],[1,3,3],[2,3,6],[3,1,9]]){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,size,gl.FLOAT,false,STRIDE*4,offset*4);}
  gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,1536,1536,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,texture,0);gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);
  const shadows=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);
  const loc=(p:WebGLProgram,k:string)=>gl.getUniformLocation(p,k);
  const uniforms={vp:loc(main,"uViewProjection"),model:loc(main,"uModel"),light:loc(main,"uLight"),eye:loc(main,"uEye"),shadow:loc(main,"uShadow"),shadows:loc(main,"uShadows"),dvp:loc(depth,"uViewProjection"),dm:loc(depth,"uModel")};
  const light=multiply(ortho(17),view([-12,22,14],[0,0,0]));
  const transforms=()=>batches.map((b,i)=>model([b.centre[0],b.centre[1]+(i<5?Math.sin(elapsed*.5+i*1.6)*.1:0),b.centre[2]],0));
  function render(now=performance.now()) {
    frame=0;if(disposed||lost||!visible||document.hidden)return;
    const dt=previous?Math.min((now-previous)/1000,.05):0;previous=now;
    if(motion)elapsed+=dt;
    const snap=reduced ? 1 : Math.min(1,dt*6+.025);
    yaw+=(targetYaw-yaw)*snap;zoom+=(targetZoom-zoom)*snap;
    cameraTarget=cameraTarget.map((v,i)=>v+(target[i]-v)*snap) as V3;
    const narrow=aspect<1.2, distance=(narrow?34:23.5)/zoom;
    eye=[cameraTarget[0]+Math.sin(yaw)*distance,cameraTarget[1]+distance*.52,cameraTarget[2]+Math.cos(yaw)*distance];
    vp=multiply(perspective((narrow?48:40)*Math.PI/180,aspect),view(eye,cameraTarget));
    const models=transforms();gl.bindVertexArray(vao);
    if(shadows){gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.viewport(0,0,1536,1536);gl.clear(gl.DEPTH_BUFFER_BIT);gl.useProgram(depth);gl.uniformMatrix4fv(uniforms.dvp,false,light);for(let i=0;i<5;i++){gl.uniformMatrix4fv(uniforms.dm,false,models[i]);gl.drawArrays(gl.TRIANGLES,batches[i].start,batches[i].count);}}
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.useProgram(main);gl.uniformMatrix4fv(uniforms.vp,false,vp);gl.uniformMatrix4fv(uniforms.light,false,light);gl.uniform3fv(uniforms.eye,eye);gl.uniform1i(uniforms.shadow,0);gl.uniform1i(uniforms.shadows,shadows?1:0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
    for(let i=batches.length-1;i>=0;i--){gl.uniformMatrix4fv(uniforms.model,false,models[i]);gl.drawArrays(gl.TRIANGLES,batches[i].start,batches[i].count);}
    canvas.dataset.worldReady="true";canvas.dataset.worldFrame=String(++frames);canvas.dataset.worldTriangles=String(vertices.length/STRIDE/3);canvas.dataset.worldSelected=selected??"all";
    const moving=Math.abs(targetZoom-zoom)>.002||Math.abs(targetYaw-yaw)>.002||target.some((v,i)=>Math.abs(v-cameraTarget[i])>.002);
    if(motion||moving)frame=requestAnimationFrame(render);
  }
  function request(){if(!frame&&!disposed&&!lost&&visible&&!document.hidden)frame=requestAnimationFrame(render);}
  function resize(){const rect=canvas.getBoundingClientRect();cssWidth=Math.max(rect.width,1);cssHeight=Math.max(rect.height,1);aspect=cssWidth/cssHeight;const ratio=Math.min(devicePixelRatio||1,cssWidth<700?1.25:1.5);canvas.width=Math.round(cssWidth*ratio);canvas.height=Math.round(cssHeight*ratio);if(!selected)target=aspect<1.2?[0,0,0]:[-2.4,0,0];request();}
  function select(domain:Domain|null){selected=domain;const i=domain?DOMAIN_IDS.indexOf(domain):-1;target=i>=0?add(CENTRES[i],[0,.5,0]):aspect<1.2?[0,0,0]:[-2.4,0,0];targetZoom=i>=0?1.85:1;targetYaw=0;options.onSelect?.(domain);request();}
  function down(e:PointerEvent){if(e.button!==0)return;dragging=true;travel=0;dragX=e.clientX;dragY=e.clientY;canvas.setPointerCapture(e.pointerId);}
  function move(e:PointerEvent){if(!dragging)return;const dx=e.clientX-dragX,dy=e.clientY-dragY;travel+=Math.abs(dx)+Math.abs(dy);targetYaw=clamp(targetYaw+dx*.004,-.65,.65);dragX=e.clientX;dragY=e.clientY;request();}
  function up(e:PointerEvent){if(!dragging)return;dragging=false;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(travel>7)return;const rect=canvas.getBoundingClientRect();const x=(e.clientX-rect.left)/cssWidth*2-1,y=1-(e.clientY-rect.top)/cssHeight*2;let best=.23,index=-1;CENTRES.slice(0,4).forEach((p,i)=>{const v=point(vp,add(p,[0,.6,0])),w=vp[3]*p[0]+vp[7]*(p[1]+.6)+vp[11]*p[2]+vp[15];const d=Math.hypot((v[0]/w-x)*aspect,v[1]/w-y);if(d<best){best=d;index=i;}});if(index>=0)select(DOMAIN_IDS[index]);}
  function cancel(){dragging=false;}
  function contextLost(e:Event){e.preventDefault();lost=true;cancelAnimationFrame(frame);frame=0;canvas.dataset.worldReady="false";options.onUnavailable?.();}
  function visibility(){if(document.hidden){cancelAnimationFrame(frame);frame=0;previous=0;}else request();}
  canvas.addEventListener("pointerdown",down);canvas.addEventListener("pointermove",move);canvas.addEventListener("pointerup",up);canvas.addEventListener("pointercancel",cancel);canvas.addEventListener("webglcontextlost",contextLost);document.addEventListener("visibilitychange",visibility);
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);
  const intersection=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??true;if(!visible){cancelAnimationFrame(frame);frame=0;previous=0;}else request();},{rootMargin:"80px"});intersection.observe(canvas);
  resize();
  return {select,setMotion(enabled){motion=enabled;reduced=!enabled;previous=0;request();},zoom(amount){targetZoom=clamp(targetZoom+amount,.75,2.5);request();},reset(){select(null);},dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);resizeObserver.disconnect();intersection.disconnect();canvas.removeEventListener("pointerdown",down);canvas.removeEventListener("pointermove",move);canvas.removeEventListener("pointerup",up);canvas.removeEventListener("pointercancel",cancel);canvas.removeEventListener("webglcontextlost",contextLost);document.removeEventListener("visibilitychange",visibility);gl.deleteBuffer(buffer);gl.deleteVertexArray(vao);gl.deleteTexture(texture);gl.deleteFramebuffer(fbo);shaders.forEach(s=>gl.deleteShader(s));programs.forEach(p=>gl.deleteProgram(p));canvas.dataset.worldReady="false";}};
}
