import * as THREE from 'three';

export function initBackground() {
  const container = document.getElementById('canvas-container');
  if (!container) return;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 1;
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  function getStarTexture() {
    const s = 64, c = document.createElement('canvas');
    c.width = c.height = s;
    const ctx = c.getContext('2d'), grad = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)'); grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)'); grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)'); grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(c);
  }

  const pCount = 1200, pos = new Float32Array(pCount * 3), col = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    pos[i*3]=(Math.random()-0.5)*10; pos[i*3+1]=(Math.random()-0.5)*10; pos[i*3+2]=(Math.random()-0.5)*10;
    const b = 0.5 + Math.random()*0.5; col[i*3]=col[i*3+1]=col[i*3+2]=b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size: 0.05, sizeAttenuation: true, map: getStarTexture(), transparent: true, alphaTest: 0.001, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const starField = new THREE.Points(geo, mat);
  scene.add(starField);

  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const rGroup = new THREE.Group(), rMat = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 100 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 12), rMat); body.rotation.x = Math.PI/2; rGroup.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.06, 12), rMat); nose.position.z = 0.09; nose.rotation.x = Math.PI/2; rGroup.add(nose);
  for (let i = 0; i < 3; i++) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.04, 0.04), rMat), a = (i/3)*Math.PI*2;
    f.position.set(Math.cos(a)*0.03, Math.sin(a)*0.03, -0.04); f.rotation.z = a; rGroup.add(f);
  }
  const eLight = new THREE.PointLight(0xffaa44, 2, 1); eLight.position.set(0,0,-0.1); rGroup.add(eLight);
  const flame = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array([0,0,-0.1]), 3)), new THREE.PointsMaterial({ size: 0.4, map: getStarTexture(), transparent: true, color: 0xffaa44, blending: THREE.AdditiveBlending, depthWrite: false }));
  rGroup.add(flame); rGroup.visible = false; scene.add(rGroup);

  let rActive = false, rStart = 0, rDur = 6.0, sp = new THREE.Vector3(), ep = new THREE.Vector3(), lCheck = 0, clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const et = clock.getElapsedTime();
    starField.rotation.y = et*0.02; starField.rotation.x = et*0.01;
    if (!rActive && et - lCheck > 1.0) {
      lCheck = et;
      if (Math.random() < 0.12) {
        rActive = true; rStart = et; rGroup.visible = true;
        const side = Math.random() > 0.5 ? 1 : -1;
        sp.set(-6*side, (Math.random()-0.5)*8, -10+Math.random()*5); ep.set(6*side, (Math.random()-0.5)*8, -2+Math.random()*6);
        rGroup.position.copy(sp); rGroup.lookAt(ep);
      }
    }
    if (rActive) {
      const p = (et - rStart) / rDur;
      if (p >= 1.0) { rActive = false; rGroup.visible = false; } 
      else { rGroup.position.lerpVectors(sp, ep, p); rGroup.lookAt(ep); flame.material.opacity = 0.6 + Math.random()*0.4; eLight.intensity = 1.5 + Math.random()*1.5; }
    }
    renderer.render(scene, camera);
  }
  animate();
  window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
}
