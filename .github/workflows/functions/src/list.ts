import * as functions from "firebase-functions";
import { db } from "./index";


export const getList = functions.https.onRequest(async (request, response) => {

  const listDoc = await db.collection('list').doc(request.body.id).get();

  if (!listDoc.exists) {
    response.send('List not found');
    return;
  }

  const res =
    await db.collection('list').doc(request.body.id).collection('item').get();
  response.send(res.docs.map((d) => d.data()));

});

export const getListDetails = functions.https.onRequest(async (request, response) => {

  const listDoc = await db.collection('list').doc(request.body.id).get();

  if (!listDoc.exists) {
    response.send('List not found');
    return;
  }

  const resDoc =
    await db.collection('list').doc(request.body.id).get();
  response.send(resDoc.data());
});

