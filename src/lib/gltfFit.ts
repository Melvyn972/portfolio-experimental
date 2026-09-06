import * as THREE from "three";

const _box = new THREE.Box3();
const _center = new THREE.Vector3();
const _size = new THREE.Vector3();

/**
 * Recenter a cloned GLB so its footprint sits on y=0 at the local origin.
 * Poly Haven / Dormin meshes often have huge offsets or uncentered origins —
 * placing them raw produces floating shards on the road.
 */
export function groundClone(object: THREE.Object3D): THREE.Vector3 {
  object.updateMatrixWorld(true);
  _box.setFromObject(object);
  _box.getCenter(_center);
  _box.getSize(_size);
  object.position.x -= _center.x;
  object.position.z -= _center.z;
  object.position.y -= _box.min.y;
  return _size.clone();
}

export function enableShadows(object: THREE.Object3D) {
  object.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });
}
