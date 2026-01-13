import OpenAI from "openai";
import sql from "../configs/db.js";
import { clerkClient, getAuth } from '@clerk/express';
import {v2 as cloudinary} from "cloudinary";
import axios from "axios";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

import fs from "fs";

const pdf = require("pdf-parse");

console.log(typeof pdf);




const AI = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

// generate article 

export const generateArticle= async(req,res)=>{
    try{
        const {userId} =req.auth();  // this is done using clerk
        const {prompt, length}=req.body;  // we will send prompt ans it's length from frontend
        const plan=req.plan;
        const free_usage=req.free_usage;

        // if user doesn't have premium and hhe has reached it's free usage limit which 10.
        if (plan!=='premium' && free_usage>=10){
            return res.json({success: false, message: "Limit reached. Upgrade to continue."});
        }
        const response = await AI.chat.completions.create({
            model: "gemini-2.5-flash",
            messages: [
               //we will our own prompt to it
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature:0.7,
            max_tokens:Math.min(4000,length*2),
        });


        const article = response.choices[0].message.content;

        await sql `Insert into creations (user_id, prompt, content, type) values (${userId}, ${prompt}, ${article}, 'article')`;

        if (plan!=='premium'){
            await clerkClient.users.updateUserMetadata(userId, {
                privateMetadata:{
                    free_usage:free_usage+1  // here it means free_usage you have used till now, in starting it will be 0, after free_usage=10 it will ask for premium plan
                }
            })
        }

        res.json({success:true, content:article});
    }
    catch (error){
         console.log(error.message)
         res.json({success:false, message: error.message})
    }

}



// generate Bolg Title


export const generateBlogTitle= async(req,res)=>{
    
    try{
        const {userId} =req.auth();  // this is done using clerk
        const {prompt}=req.body;  // we will send prompt from frontend
        const plan=req.plan;
        const free_usage=req.free_usage;

        // if user doesn't have premium and hhe has reached it's free usage limit which 10.
        if (plan!=='premium' && free_usage>=10){
            return res.json({success: false, message: "Limit reached. Upgrade to continue."});
        }
        const response = await AI.chat.completions.create({
            model: "gemini-2.5-flash",
            messages: [
               //we will our own prompt to it
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature:0.7,
            max_tokens:2500,
        });

        const title = response.choices[0].message.content;

        await sql `Insert into creations (user_id, prompt, content, type) values (${userId}, ${prompt}, ${title}, 'blog-title')`;

        if (plan!=='premium'){
            await clerkClient.users.updateUserMetadata(userId, {
                privateMetadata:{
                    free_usage:free_usage+1  // here it means free_usage you have used till now, in starting it will be 0, after free_usage=10 it will ask for premium plan
                }
            })
        }

        res.json({success:true, content:title});
    }
    catch (error){
         console.log(error.message)
         res.json({success:false, message: error.message})
    }

}


// Image generation



export const generateImage= async(req,res)=>{
    
    try{
        
        const {userId} =req.auth();  // this is done using clerk
        const {prompt, publish}=req.body;  // we will send prompt from frontend
        const plan=req.plan;
        // as only premium user can generate images
        //const free_usage=req.free_usage;
    
        // if user doesn't have premium and hhe has reached it's free usage limit which 10.
        if (plan!=='premium'){
            return res.json({success: false, message: "This feature is only available for premium subscriptions"});
        }
    
        // ClipDrop API call
        const formData =new FormData()
        formData.append('prompt', prompt)

        const response= await axios.post('https://clipdrop-api.co/text-to-image/v1', formData,{
            headers: {'x-api-key': process.env.CLIPDROP_API_KEY},
            responseType: "arraybuffer"
        })
    

        const base64Image=`data:image/png;base64,${Buffer.from(response.data,'binary').toString('base64')}`;
      
        
        const {secure_url} =await cloudinary.uploader.upload(base64Image)

        
        await sql `Insert into creations (user_id, prompt, content, type,publish) values (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})`;  // res??ans if res is null it will return ans else it will always return res.


        res.json({success:true, content:secure_url});
    }
    catch (error){
         console.log(error.message)
         res.json({success:false, message: error.message})
    }

}



// background image removal



export const removeImageBackground= async(req,res)=>{
    
    try{
        
        const {userId} =req.auth();  // this is done using clerk
        const image =req.file;
        const plan=req.plan;
        // as only premium user can generate images
        //const free_usage=req.free_usage;
    
        // if user doesn't have premium and hhe has reached it's free usage limit which 10.
        if (plan!=='premium'){
            return res.json({success: false, message: "This feature is only available for premium subscriptions"});
        }
    
        
        
        
        const {secure_url} =await cloudinary.uploader.upload(image.path,{
            transformation:[
                {
                    effect: 'background_removal',
                    background_removal: 'remove_the_background'
                }
            ]
        })

        
        await sql `Insert into creations (user_id, prompt, content, type) values (${userId}, 'Remove background from image', ${secure_url}, 'image')`;  // res??ans if res is null it will return ans else it will always return res.


        res.json({success:true, content:secure_url});
    }
    catch (error){
         console.log(error.message)
         res.json({success:false, message: error.message})
    }

}





// remove any object from the image

export const removeImageObject= async(req,res)=>{
    
    try{
        
        const {userId} =req.auth();  // this is done using clerk
        const image =req.file;
        const {object}=req.body;
        const plan=req.plan;

        // as only premium user can generate images
        //const free_usage=req.free_usage;
    
        // if user doesn't have premium and hhe has reached it's free usage limit which 10.
        if (plan!=='premium'){
            return res.json({success: false, message: "This feature is only available for premium subscriptions"});
        }
    
        
    

        
        
        const {public_id} =await cloudinary.uploader.upload(image.path)

        const imageUrl=cloudinary.url(public_id,{
            transformation: [{effect:`gen_remove:${object}`}],
            resource_type:'image'
        })
        
        await sql `Insert into creations (user_id, prompt, content, type) values (${userId}, ${`Remove ${object} from image`}, ${imageUrl}, 'image')`;  // res??ans if res is null it will return ans else it will always return res.


        res.json({success:true, content:imageUrl});
    }
    catch (error){
         console.log(error.message)
         res.json({success:false, message: error.message})
    }

}




//REVIEW resume

export const resumeReview= async(req,res)=>{
    
    try{
        if (!req.auth) {
            return res.status(401).json({ success: false, message: "Auth middleware missing" });
        }
        
        const {userId} =req.auth();  // this is done using clerk
        const resume =req.file;
        if (!resume) {
            return res.status(400).json({ success: false, message: "No resume file uploaded" });
        }

        const plan=req.plan;

        // as only premium user can generate images
        //const free_usage=req.free_usage;
    
        // if user doesn't have premium and hhe has reached it's free usage limit which 10.
        if (plan!=='premium'){
            return res.json({success: false, message: "This feature is only available for premium subscriptions"});
        }

        if (resume.size> 5*1024*1024){
            return res.json({success: false, message: "Resume file size exceeds allowed size (5MB)."});

        }

        const dataBuffer = fs.readFileSync(resume.path)
        const pdfData= await pdf(dataBuffer)


        const prompt=`Review the following resume and provide constructive feedback on its strengths, weaknesses, and areas for improvement.
        Resume Content:\n${pdfData.text}`


        const response = await AI.chat.completions.create({
            model: "gemini-2.5-flash",
            messages: [
               //we will our own prompt to it
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature:0.7,
            max_tokens:3000,
        });

        const content=response.choices[0].message.content
    
        
        
        await sql `Insert into creations (user_id, prompt, content, type) values (${userId}, 'Review the uploaded resume', ${content}, 'resume-review')`;  // res??ans if res is null it will return ans else it will always return res.


        res.json({success:true, content:content});
    }
    catch (error){
         console.log(error.message)
         res.json({success:false, message: error.message})
    }

}







