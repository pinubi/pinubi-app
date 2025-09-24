import * as admin from 'firebase-admin';
import { GeoFirestore } from 'geofirestore';

if (!admin.apps.length) {
  admin.initializeApp();
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
export const messaging = admin.messaging();

// Configuração do GeoFirestore
export const geofirestore = new GeoFirestore(db);

export { admin };
