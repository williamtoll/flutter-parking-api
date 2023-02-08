import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

//const serviceAccount = require("../screener-9631e-firebase-adminsdk-ipwv7-84336a16ac.json");

initializeApp();//{ credential: cert(serviceAccount) });

export var db = getFirestore();


export { getList } from './list';
export { getListDetails } from './list';

export { index_list }  from './list_index';
export { index_list2 }  from './list_index';
export { test }  from './list_index';



export { GetSanctionLists } from "./GetSanctionLists";
