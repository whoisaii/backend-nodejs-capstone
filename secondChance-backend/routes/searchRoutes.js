const express=require('express');
const connectToDatabase=require('../models/db');
const router=express.Router();
const escapeRegex=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
router.get('/',async(req,res,next)=>{
 try{
  const query={};
  for(const key of ['name','category','condition']){
   if(req.query[key]!==undefined){if(typeof req.query[key]!=='string'||req.query[key].length>100)return res.status(400).json({error:'Invalid search parameter'});if(req.query[key].trim())query[key]={$regex:(key==='name'?'':'^')+escapeRegex(req.query[key].trim())+(key==='name'?'':'$'),$options:'i'};}
  }
  if(req.query.age_years!==undefined){const age=Number(req.query.age_years);if(!Number.isFinite(age)||age<0)return res.status(400).json({error:'Invalid age'});query.age_years={$lte:age};}
  const db=await connectToDatabase();res.json(await db.collection('secondChanceItems').find(query).limit(100).toArray());
 }catch(e){next(e);}
});
module.exports=router;
