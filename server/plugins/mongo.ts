import { MongoClient, Db } from 'mongodb';


let _db: Db;


declare module 'h3' {
interface H3EventContext {
db: Db
}
}


export default async () => {
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wam';
const dbName = process.env.MONGODB_DB || 'wam';
const client = new MongoClient(uri, { maxPoolSize: 10 });
await client.connect();
_db = client.db(dbName);


// Ensure Indexes
await _db.collection('assets').createIndex({ pea_no: 1 }, { unique: true, name: 'uniq_pea_no' });
await _db.collection('uploads').createIndex({ parsed_at: -1 }, { name: 'parsed_at_desc' });
};


export function db() {
if (!_db) throw new Error('DB not initialized');
return _db;
}