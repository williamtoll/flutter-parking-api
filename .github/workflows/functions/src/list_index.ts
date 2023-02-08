// import axios from "axios";
import { DocumentReference, FieldValue } from "firebase-admin/firestore";
import * as functions from "firebase-functions";
import { db } from ".";
import { safeString } from "./common";
import { gramCounterBool } from "./gram";
import { Query, QuerySnapshot } from "firebase-admin/firestore";
const cors = require('cors')({ origin: true });

export const test = functions.runWith({timeoutSeconds:500}).https
.onRequest(async (request, res) => {
  
    console.log(`This is a test parameter: ${request.query.test_parameter as string}`)
    
    res.send(JSON.stringify(request.body));
  });

export const index_list = functions.runWith({timeoutSeconds:540}).https
.onRequest(async (request, res) => {
  cors(request, res,async () => {

    const listId:string=request.query.list as string;
    const fieldId:string=request.query.field as string;

    console.log(`indexing list ${listId} by ${fieldId}`)
    const items=
    await db.collection("list").doc(listId).collection('item').get();

    let counter = 0;
    let batch = db.batch();


    for(let itm of items.docs) {
      
      batch.set(
      db
        .collection('index')
        .doc(listId+'|'+safeString(itm.data()[fieldId]))
        ,{
          'ref': itm.ref,
          'target': itm.data()[fieldId],
          't': FieldValue.serverTimestamp(),
          ...gramCounterBool(itm.data()[fieldId], 2),
        });
        counter++;

        if (counter > 490) {
          await batch.commit();
          batch = db.batch();
          counter = 0;
        }
    }
    await batch.commit();

    console.log(`indexed list ${listId} by ${fieldId}: ${items.size} entities`)

    res.send(`indexed list ${request.query.list}`);

  })
});


export const index_list2 = functions.runWith({timeoutSeconds:540}).https
.onRequest(async (request, res) => {
  cors(request, res,async () => {
    const listId:string=request.query.list as string;
    const deleteRequest = request.query.delete as string;
    const statusColRef = db.collection('indexStatus');
    await deleteLargeColByQuery(statusColRef.where('listId', '==', listId))
    await deleteLargeColByQuery(db.collection('index').where('listId', '==', listId));
    if (deleteRequest !== 'true') {
      let counter = 0;
      let indexMap = new Map<DocumentReference, boolean>();
      let batch = db.batch();
      const reference = await db.collection('list').doc(listId);
      const indexConfigs = await reference.collection('indexConfigs').get();
      const items = await reference.collection('item').get();
      let statusRef = await statusColRef.add({listId: listId, count: 0, total: items.size});
      for (let indexConfig of indexConfigs.docs) {
        let entityIndexFields = await indexConfig.ref.collection('entityIndexFields').get();
        var valid = true;
        for (let entityIndexField of entityIndexFields.docs) {
          if (!entityIndexField.data().valid) {
            valid = false;
            break;
          }
        }
        if (valid && entityIndexFields.docs.length > 0) {
          let type = indexConfig.data().type;
          for (let item of items.docs) {
            if (type === 'Single field') {
              let value = item.data()[entityIndexFields.docs[0].data().value];
              if (!Array.isArray(value)) {
                addToBatch(batch, listId, item.ref, value);
                counter++;
                indexMap.set(item.ref, true);
                if (counter > 490) {
                  statusRef.update({count: [...indexMap.keys()].length});
                  await batch.commit();
                  batch = db.batch();
                  counter = 0;
                }
              }
            } else if (type === 'Multiple fields') {
              var containsArray = false;
              var name = '';
              for (let entityIndexField of entityIndexFields.docs) {
                let value = item.data()[entityIndexField.data().value];
                if (Array.isArray(value)) {
                  containsArray = true;
                  break;
                }
                name += (name.length > 0 ? ' ' : '') + value;
              }
              if (!containsArray) {
                addToBatch(batch, listId, item.ref, name);
                counter++;
                indexMap.set(item.ref, true);
                if (counter > 490) {
                  statusRef.update({count: [...indexMap.keys()].length});
                  await batch.commit();
                  batch = db.batch();
                  counter = 0;
                }
              }
            } else if (type === 'Array of values') {
              let values = item.data()[entityIndexFields.docs[0].data().value];
              if (Array.isArray(values)) {
                for (let value of values) {
                  addToBatch(batch, listId, item.ref, value);
                  counter++;
                  indexMap.set(item.ref, true);
                  if (counter > 490) {
                    statusRef.update({count: [...indexMap.keys()].length});
                    await batch.commit();
                    batch = db.batch();
                    counter = 0;
                  }
                }
              }
            }
          }
        }
      }
      statusRef.update({count: [...indexMap.keys()].length});
      await batch.commit();
    }
    res.send(`indexed list ${request.query.list}`);
  })
});


function addToBatch(batch:any, listId:any, ref:any, name:string)
{
  batch.set(
    db
      .collection('index')
      .doc(listId+'|'+safeString(name))
      ,{
        'ref': ref,
        'listId': listId,
        'target': name,
        't': FieldValue.serverTimestamp(),
        ...gramCounterBool(name, 2),
      });
}

export async function deleteLargeColByQuery(query: Query) {
  let batch = db.batch();
  let counter = 0;

  let chunk: QuerySnapshot;
  do {
    chunk = await query.select().limit(1000).get();
    for (const l of chunk.docs) {
      batch.delete(l.ref);
      counter++;

      if (counter > 400) {
        await batch.commit();
        batch = db.batch();
        counter = 0;
      }
    }
    await batch.commit();
    batch = db.batch();
    counter = 0;

  } while (chunk.size > 0)
}
