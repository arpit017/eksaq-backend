const mongoose=require("mongoose")


const audioSchema=mongoose.Schema({

    name:String,
    audio:String,
    

})
const AudioModel=mongoose.model("audio",audioSchema)

module.exports={AudioModel}