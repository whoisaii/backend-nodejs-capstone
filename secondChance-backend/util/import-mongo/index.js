require('dotenv').config();
const fs=require('fs');
const path=require('path');
const connectToDatabase=require('../../models/db');
const {closeDatabase}=require('../../models/db');
async function loadData(){
 const data=JSON.parse(fs.readFileSync(path.join(__dirname,'secondChanceItems.json'),'utf8')).docs;
 const db=await connectToDatabase(),collection=db.collection('secondChanceItems');
 if(await collection.countDocuments({})!==0){console.log('Collection already contains items; import skipped.');return;}
 const result=await collection.insertMany(data);
 console.log('Connected successfully to MongoDB');console.log('Inserted documents:',result.insertedCount);console.log('Total documents:',await collection.countDocuments({}));
 return result.insertedCount;
}
if(require.main===module)loadData().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(closeDatabase);
module.exports={loadData};
