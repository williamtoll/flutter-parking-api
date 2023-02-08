import { CollectionReference, DocumentReference, FieldValue } from "firebase-admin/firestore";
import { db } from "./index";
import { createHash } from "node:crypto";

const FIRESTORE_WRITE_BATCH_SIZE = 450;

export function safeString(unsafe: string):string {
  return unsafe.replace(/\//gi, "_");
}

// Saving list
export async function saveList(jsonArray: any[], listId: string, fieldId: string) {
  let docRef: DocumentReference = db.collection("list").doc(listId);
  let hash = createHash("md5").update(JSON.stringify(jsonArray)).digest("hex");
  console.dir(`fetched list document with hash: ${hash}`);
  let doc = await docRef.get();
  if (doc.exists && doc.data()?.["lastUpdateHash"] === hash) {
    console.log("hash not changed, skip update");
    return;
  }
  await docRef.set(
    {
      "lastUpdateTime": FieldValue.serverTimestamp(),
      "lastUpdateHash": hash,
    }
  );
  await saveDocuments(jsonArray, docRef.collection("item"), fieldId);
}
/**
 * Saves array of JSON objects into documents with IDs specified in one of the fields
 * of JSON object.
 *
 */
export async function saveDocuments(jsonArray: any[], colRef: CollectionReference, fieldId: string) {
  let counter = 0;
  let batch = db.batch();

  for (let item of jsonArray) {
    batch.set(colRef.doc(), item);
    counter++;
    if (counter > FIRESTORE_WRITE_BATCH_SIZE) {
      await batch.commit();
      batch = db.batch();
      counter = 0;
    }
  }
  await batch.commit();
}

