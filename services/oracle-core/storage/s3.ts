export interface S3Pointer {
  bucket: string;
  key: string;
}

const storedObjects = new Map<string, string>();

export async function putObject(pointer: S3Pointer, payload: string) {
  storedObjects.set(`${pointer.bucket}/${pointer.key}`, payload);
}

export async function getObject(pointer: S3Pointer): Promise<string | null> {
  return storedObjects.get(`${pointer.bucket}/${pointer.key}`) ?? null;
}
