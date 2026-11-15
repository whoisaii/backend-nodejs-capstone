const express=require('express');
const multer=require('multer');
const path=require('path');
const fs=require('fs');
const crypto=require('node:crypto');
const connectToDatabase=require('../models/db');
const {requireAuth}=require('./authRoutes');
const router=express.Router();
const directory=path.join(__dirname,'../public/uploads');fs.mkdirSync(directory,{recursive:true});
const extensions={'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp'};
const upload=multer({storage:multer.diskStorage({destination:directory,filename:(req,file,cb)=>cb(null,crypto.randomUUID()+extensions[file.mimetype])}),limits:{fileSize:5*1024*1024},fileFilter:(req,file,cb)=>extensions[file.mimetype]?cb(null,true):cb(Object.assign(Error('Only JPEG, PNG and WebP images are accepted'),{status:400}))});
// Mounted at /api/secondchance/items in app.js.
router.get('/',async(req,res,next)=>{try{const db=await connectToDatabase();res.json(await db.collection('secondChanceItems').find({}).limit(100).toArray());}catch(e){next(e);}});
router.get('/:id',async(req,res,next)=>{try{const db=await connectToDatabase();const item=await db.collection('secondChanceItems').findOne({id:req.params.id});if(!item)return res.status(404).json({error:'Item not found'});res.json(item);}catch(e){next(e);}});
router.post('/',requireAuth,upload.single('file'),async(req,res,next)=>{
 try{
  const {name,category,condition,description=''}=req.body;
  if([name,category,condition].some(v=>typeof v!=='string'||!v.trim())){if(req.file)fs.unlinkSync(req.file.path);return res.status(400).json({error:'Name, category and condition are required'});}
  const item={id:crypto.randomUUID(),name:name.trim().slice(0,150),category:category.trim().slice(0,80),condition:condition.trim().slice(0,80),description:String(description).slice(0,3000),posted_by:req.user.sub,date_added:Math.floor(Date.now()/1000),image:req.file?'/uploads/'+req.file.filename:'',comments:[]};
  const db=await connectToDatabase();const result=await db.collection('secondChanceItems').insertOne(item);res.status(201).json({...item,_id:result.insertedId});
 }catch(e){if(req.file)fs.unlink(req.file.path,()=>{});next(e);}
});
router.put('/:id',requireAuth,async(req,res,next)=>{
 try{
  const db=await connectToDatabase(),collection=db.collection('secondChanceItems');const old=await collection.findOne({id:req.params.id});
  if(!old)return res.status(404).json({error:'Item not found'});if(old.posted_by!==req.user.sub)return res.status(403).json({error:'Only the owner can update this item'});
  const changes={};for(const k of ['name','category','condition','description'])if(typeof req.body[k]==='string'&&req.body[k].trim())changes[k]=req.body[k].trim().slice(0,k==='description'?3000:150);
  res.json(await collection.findOneAndUpdate({id:req.params.id},{$set:changes},{returnDocument:'after'}));
 }catch(e){next(e);}
});
router.delete('/:id',requireAuth,async(req,res,next)=>{
 try{
  const db=await connectToDatabase(),collection=db.collection('secondChanceItems');const item=await collection.findOne({id:req.params.id});
  if(!item)return res.status(404).json({error:'Item not found'});if(item.posted_by!==req.user.sub)return res.status(403).json({error:'Only the owner can delete this item'});
  await collection.deleteOne({id:req.params.id});if(item.image?.startsWith('/uploads/'))fs.unlink(path.join(directory,path.basename(item.image)),()=>{});
  res.json({message:'Item deleted successfully',id:req.params.id});
 }catch(e){next(e);}
});
module.exports=router;
