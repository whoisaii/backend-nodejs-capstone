require('dotenv').config();
const express=require('express');
const cors=require('cors');
const path=require('path');
const connectToDatabase=require('./models/db');
const app=express();
app.use(cors({origin:process.env.FRONTEND_ORIGIN || 'http://localhost:8080'}));
app.use(express.json({limit:'100kb'}));
app.use('/api/secondchance/auth',require('./routes/authRoutes'));
app.use('/api/secondchance/items',require('./routes/secondChanceItemsRoutes'));
app.use('/api/secondchance/search',require('./routes/searchRoutes'));
app.get('/health',async(req,res,next)=>{try{const db=await connectToDatabase();await db.command({ping:1});res.json({status:'ok',database:'MongoDB'});}catch(e){next(e);}});
app.use(express.static(path.join(__dirname,'public'),{dotfiles:'deny'}));
app.get('/',(req,res)=>res.json({name:'SecondChance API',items:'/api/secondchance/items'}));
app.use((err,req,res,next)=>{console.error(err.message);res.status(err.status || (err.name==='MulterError'?400:500)).json({error:err.status?err.message:'Request could not be completed'});});
if(require.main===module){if(!process.env.JWT_SECRET)throw Error('Set JWT_SECRET before starting the API');connectToDatabase().then(()=>app.listen(Number(process.env.PORT)||3060,'127.0.0.1',()=>console.log('SecondChance API listening'))).catch(e=>{console.error(e.message);process.exitCode=1;});}
module.exports=app;
