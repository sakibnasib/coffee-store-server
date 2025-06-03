const express=require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app=express();
const port=process.env.PORT ||3000 ;
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nghl6sk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const coffeesCollection=client.db('coffeeDB').collection('coffees');
    const usersCollection=client.db('coffeeDB').collection('users');
  const orderCollection =client.db('coffeeDB').collection('orders');

  app.get('/coffees', async (req, res) => {
      const allCoffees = await coffeesCollection.find().toArray()
      console.log(allCoffees)
      res.send(allCoffees)
    });
    // single coffee get
    app.get('/coffee/:id',async(req,res)=>{
      const id=req.params.id
      const filter={_id: new ObjectId(id)}
      const result=await coffeesCollection.findOne(filter)
      res.send(result)
    });
    app.get('/my-coffees/:email',async(req,res)=>{
      const  email=req.params.email
      const filter={email:email}
      const result=await coffeesCollection.find(filter).toArray()
      res.send(result)
    });
    // 
    app.patch('/like/:coffeeId',async(req,res)=>{
  const id = req.params.coffeeId
      const email = req.body.email
      const filter = { _id: new ObjectId(id) }
      const coffee = await coffeesCollection.findOne(filter)
      // choke user have 
      const alreadyLiked=coffee?.likedBy.includes(email);
      const updateDoc = alreadyLiked
        ? {
            $pull: {
              // dislike coffee (pop email from likedBy array)
              likedBy: email,
            },
          }
        : {
            $addToSet: {
              // Like coffee (push email in likedBy array)
              likedBy: email,
            },
          }

      await coffeesCollection.updateOne(filter, updateDoc)

        res.send({
        message: alreadyLiked ? 'Dislike Successful' : 'Like Successful',
        liked: !alreadyLiked,
      })
    })
app.post('/add-coffee',async(req,res)=>{
  const newCoffee=req.body ;
  const quantity=newCoffee.quantity
   // convert string quantity to number type value
      newCoffee.quantity = parseInt(quantity)
  const result=await coffeesCollection.insertOne(newCoffee);
  res.send(result)
});

app.post('/place-order/:coffeeId',async(req,res)=>{
  const id=req.params.coffeeId;
  const orderData= req.body
  const result=await orderCollection.insertOne(orderData);
  if(result.acknowledged){
    await coffeesCollection.updateOne({_id: new ObjectId(id)}
    ,{ $inc:{
      quantity:-1
    }})
  }
res.send(result)
});

app.get('/my-orders/:email',async(req,res)=>{
  const email=req.params.email;
  const filter={customerEmail:email}
  const allOrder=await  orderCollection.find(filter).toArray();

  // for loop 
  for(const order of allOrder){
    const orderId=order.coffeeId ;
    const fullCoffeeData= await coffeesCollection.findOne({_id: new ObjectId(orderId)})
     order.name = fullCoffeeData.name
        order.photo = fullCoffeeData.photo
        order.price = fullCoffeeData.price
        order.quantity = fullCoffeeData.quantity
  }
  res.send(allOrder)
})
app.put('/coffees/:id',async(req,res)=>{
  const id=req.params.id ;
  const filter={_id:new ObjectId(id)}
  const uodateCoffee=req.body
  const updateDoc={
    $set:uodateCoffee
  }
  const result=await coffeesCollection.updateOne(filter,updateDoc);
  res.send(result);
});
app.delete('/cancleOrder/:id',async(req,res)=>{
   const id=req.params.id 
   const {coffeeId}= req.body
  const query={_id: new ObjectId(id)}
  const result=await orderCollection.deleteOne(query)
  if(result.deletedCount){
    await coffeesCollection.updateOne({_id:new ObjectId(coffeeId)},{$inc:{
      quantity:+1
    }})
  }
  res.send(result)
})
app.delete('/coffees/:id',async(req,res)=>{
  const id=req.params.id 
  const query={_id: new ObjectId(id)}
  const result=await coffeesCollection.deleteOne(query);
  res.send(result)
});

// Users
app.get('/users',async(req,res)=>{
  const cursor=usersCollection.find();
const result= await cursor.toArray();
res.send(result)
});
app.get('/users/:id' ,async(req,res)=>{
  const id=req.params.id
    const query={_id: new ObjectId(id)}
    const result=await usersCollection.findOne(query)
    res.send(result)
})

app.post('/users',async(req,res)=>{
  const newUser=req.body
  const result= await usersCollection.insertOne(newUser);
  res.send(result)
});
app.patch('/users',async(req,res)=>{
  const {email,lastSignInTime}=req.body 
  const filter={email:email} ;
  const updateDoc={
    $set:{
      lastSignInTime:lastSignInTime
    }
  }
  const result=await usersCollection.updateOne(filter,updateDoc)
});
app.put('/users/:id',async(req,res)=>{
   const id=req.params.id ;
  const filter={_id:new ObjectId(id)}
  const {name,photo,phone,address,age,gender}=req.body 
  const updateDoc={
    $set:{
      name:name,
      photo:photo,
      phone:phone,
      address:address,
      age:age,
      gender:gender
    }
  }
  const result=await usersCollection.updateOne(filter,updateDoc)
  res.send(result)
});
 app.delete('/users/:id',async(req,res)=>{
  const id=req.params.id 
  const query={_id: new ObjectId(id)}
  const result=await usersCollection.deleteOne(query)
 })


    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('Coffee Server is Getting Hotter')
});

app.listen(port, () => {
  console.log(`Coffee Server runnimg  on port ${port}`)
})