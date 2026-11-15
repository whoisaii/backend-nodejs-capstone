const express=require('express');
const natural = require('natural');
const app=express();app.use(express.json({limit:'20kb'}));
const analyzer=new natural.SentimentAnalyzer('English',natural.PorterStemmer,'afinn');
app.post('/sentiment', (req,res)=>{
 const {sentence}=req.body;
 if(typeof sentence!=='string'||!sentence.trim())return res.status(400).json({error:'A sentence is required'});
 const score=analyzer.getSentiment(new natural.WordTokenizer().tokenize(sentence));
 res.json({sentimentScore:score,sentiment:score>0?'positive':score<0?'negative':'neutral'});
});
if(require.main===module)app.listen(Number(process.env.PORT)||3000,'127.0.0.1');
module.exports=app;
