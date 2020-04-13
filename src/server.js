import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient} from 'mongodb';
import path from 'path';

const app = express();

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname,'/build')));
const withDB = async (operations,res) =>{
    try{
        
        const client  = await MongoClient.connect("mongodb://localhost:27017",{useNewURLParser: true});
        const db = client.db("my-blog");
        await operations(db)
        client.close();
    }catch(error){
        console.log(error)
        res.status(500).json({message: 'Error connecting to DB',error});
        
    }
}
app.get('/api/articles/:name/',async(req,res) =>{
    console.log("Starting in get article by name")
    try{
    const articleName = req.params.name;
    withDB(async (db) => {
        const articleInfo = await db.collection('articles').findOne({name:articleName});
        if(!articleInfo){
            res.status(404).json({message: 'Article not found'});;
        }else{
        console.log("Found article for " + articleName +" are: " + articleInfo);
        res.status(200).json(articleInfo);
        }
    },res)
    
    
    
    }catch(error){
        console.log(error)
        error.status(500).json({message: 'Error connecting to DB',error});
    }
    
});



app.post('/api/articles/:name/upvote',async(req,res) =>{
    console.log("Starting in upVote")
    const articleName = req.params.name;
    withDB(async (db) => {
    const articleInfo = await db.collection('articles').findOne({name:articleName});
    if(!articleInfo){
        res.status(404).json({message: 'Article not found'});
    }else{
        console.log("Num of votes for " + articleName +" now are: " + articleInfo.upvotes);
     articleInfo.upvotes+=1;
     console.log("Num of votes for " + articleName +" are: " + articleInfo.upvotes);
     db.collection('articles').updateOne({name:articleName},{ $set: {upvotes:articleInfo.upvotes}});
    
    console.log("Num of votes for " + articleName +" are: " + articleInfo.upvotes);
    res.status(200).json(articleInfo);
    
    }
},res)
});

app.post('/api/articles/:name/comment',(req,res) =>{
    console.log("Starting in add comments")
    const articleName = req.params.name;
    console.log(req.body);
    withDB(async (db) =>{
        const articleInfo = await db.collection('articles').findOne({name:articleName});
        if(!articleInfo){
            res.status(404).json({message: 'Article not found'});
        }else{
            console.log(req.body);
            if(req.body && req.body.userName && req.body.comment){
            articleInfo.comments.push(req.body);
            db.collection('articles').updateOne({name:articleName},{ $set: {comments:articleInfo.comments}});
            const comments = JSON.stringify(articleInfo.comments);
    console.log("Comments for " + articleName +" are: " + (comments));
    res.status(200).json(articleInfo);
            }else{
                res.status(500).send("Missing input")
            }
        }
    },res)
    
    
});
app.get('/hello', (req,res) => res.send("Hello!"));
app.get('/hello/:name', (req,res) => res.send(`Hello ${req.params.name}!`));

app.post('/hello', (req,res) => res.send(`Hello Posting Mr. ${req.body.name}!`));

app.get('*',(req,res) => {
   res.sendFile(path.join(__dirname + 'build/index.html')) ;
});
app.listen(8200,()=> console.log('Listening on port 8200'));