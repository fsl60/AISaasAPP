import sql from "../configs/db.js";




export const getUserCreations =async(req, res)=>{
    try{
        const {userId}=req.auth()

        const creations=await sql `SELECT * FROM creations WHERE user_id=${userId} ORDER BY created_at DESC`;
        res.json({success:true, creations});

    }
    catch (error){
        res.json({success:false, message: error.message});
    }
}





export const getPublishedCreations =async(req, res)=>{
    try{

        const creations=await sql `SELECT * FROM creations WHERE publish = true ORDER BY created_at DESC`;
        res.json({success:true, creations});

    }
    catch (error){
        res.json({success:false, message: error.message});
    }
}



//to like or dislike a creations

export const toggleLikeCreations =async(req, res)=>{
    try{
        if (!req.auth) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const {userId} =req.auth();
        const {id} =req.body;    // creations id

        const [creation] = await sql `SELECT * FROM creations WHERE id=${id}`

        if (!creation){
            return res.json({success:false, message: "creation not found"})

        }

        const currentLikes =creation.likes ?? [];
        const userIdStr =userId.toString();
        let updatedLikes;
        let message;

        if (currentLikes.includes(userIdStr)){
            updatedLikes=currentLikes.filter((user)=> user!==userIdStr);
            message='Creation Unliked'
        }
        else{
            updatedLikes=[...currentLikes, userIdStr]
            message='Creation Liked'
        }

        const formattedArray = `{${updatedLikes.join(',')}}`

        await sql `UPDATE creations SET likes=${formattedArray}::text[] WHERE id=${id}`;

        res.json({success:true, message});

    }
    catch (error){
        res.json({success:false, message: error.message});
    }
}