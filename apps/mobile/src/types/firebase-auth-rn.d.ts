declare module "@firebase/auth/dist/rn/index.js" {
  import { Persistence } from "firebase/auth";
  export function getReactNativePersistence(storage: any): Persistence;
}
