import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkClient,clerkMiddleware, requireAuth} from '@clerk/express';
import aiRouter from './routes/aiRoutes.js';
import connectCloudinary from './configs/cloudinary.js';
import userRouter from './routes/userRoutes.js';


const app=express()


await connectCloudinary()



app.use(cors())

app.use(express.json())
app.use(clerkMiddleware())

/* This route is public*/ 
app.use(requireAuth())


app.get('/',(req,res)=>res.send('Server is running...'))

/* With this we can make our route private*/



app.use('/api/ai', aiRouter)

app.use('/api/user', userRouter)


const PORT=process.env.PORT || 5000;

app.listen(PORT,()=> {
    console.log('Server is running on port',PORT)
})



