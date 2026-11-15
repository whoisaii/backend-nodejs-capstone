const express=require('express');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const {ObjectId}=require('mongodb');
const connectToDatabase=require('../models/db');
const router=express.Router();
const secret=()=>{if(!process.env.JWT_SECRET)throw Error('JWT_SECRET is required');return process.env.JWT_SECRET;};
function requireAuth(req,res,next){
 try{const token=(req.headers.authorization||'').replace(/^Bearer /,'');req.user=jwt.verify(token,secret(),{algorithms:['HS256']});next();}
 catch{res.status(401).json({error:'Authentication required'});}
}
const publicUser=u=>({id:String(u._id),email:u.email,firstName:u.firstName,lastName:u.lastName});
router.post('/register',async(req,res,next)=>{
 try{
  const {email,password,firstName='',lastName=''}=req.body;
  if(typeof email!=='string'||!/^\S+@\S+\.\S+$/.test(email)||typeof password!=='string'||password.length<8||typeof firstName!=='string'||typeof lastName!=='string')return res.status(400).json({error:'A valid email and password of at least 8 characters are required'});
  const db=await connectToDatabase();
  const user={email:email.toLowerCase().trim(),passwordHash:await bcrypt.hash(password,12),firstName:firstName.slice(0,100),lastName:lastName.slice(0,100)};
  const result=await db.collection('users').insertOne(user);
  res.status(201).json({message:'User registered successfully',user:publicUser({...user,_id:result.insertedId})});
 }catch(e){if(e.code===11000)return res.status(409).json({error:'Email already registered'});next(e);}
});
router.post('/login',async(req,res,next)=>{
 try{
  const {email,password}=req.body;
  if(typeof email!=='string'||typeof password!=='string')return res.status(400).json({error:'Email and password required'});
  const db=await connectToDatabase();const user=await db.collection('users').findOne({email:email.toLowerCase().trim()});
  if(!user||!await bcrypt.compare(password,user.passwordHash))return res.status(401).json({error:'Invalid credentials'});
  const token=jwt.sign({sub:String(user._id)},secret(),{algorithm:'HS256',expiresIn:'1h'});
  res.json({message:'Login successful',token,user:publicUser(user)});
 }catch(e){next(e);}
});
async function updateUser(req,res,next){
 try{
  const changes={};for(const key of ['firstName','lastName'])if(typeof req.body[key]==='string')changes[key]=req.body[key].slice(0,100);
  if(!Object.keys(changes).length)return res.status(400).json({error:'Provide firstName or lastName'});
  const db=await connectToDatabase();const user=await db.collection('users').findOneAndUpdate({_id:new ObjectId(req.user.sub)},{$set:changes},{returnDocument:'after'});
  if(!user)return res.status(404).json({error:'User not found'});
  res.json({message:'User updated successfully',user:publicUser(user)});
 }catch(e){next(e);}
}
router.put('/update',requireAuth,updateUser);
router.put('/update/:id',requireAuth,(req,res,next)=>req.params.id===req.user.sub?next():res.status(403).json({error:'Cannot update another user'}),updateUser);
module.exports=router;
module.exports.requireAuth=requireAuth;
