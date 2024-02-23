const express = require("express");
const { connection } = require("./connection");
// const { S3 } = require('aws-sdk');
// const s3 = new S3();
require('dotenv').config()
const https = require('https');
const multer = require('multer');
const { memoryStorage } = require('multer')
const storage = memoryStorage()
const upload = multer({ storage })
const uploadAudio = require('./aws')
const {AudioModel}=require("./models/audio.model")
const cors=require("cors")
const app = express();
const OpenAI =require( "openai");
const fs=require("fs")
app.use(express.json());
app.use(cors())
app.use(express.urlencoded({ extended: false }))
const openai= new OpenAI(
  {
apiKey:process.env.API_KEY
}
) 

app.get("/", async(req, res) => {
 const data=await AudioModel.find();
 res.send({data})
});

const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve(dest));
      });
    }).on('error', (err) => {
      fs.unlink(dest);
      reject(err.message);
    });
  });
};


app.post('/upload', upload.single('audiofile'), async (req, res) => {
  const {originalname}=req.file
  // console.log(originalname)
    const filename = originalname;
    const bucketname = 'eksaq-arpit';
    const file = req.file.buffer
    
    // link is the returned object URL from S3
    const link = await uploadAudio(filename, bucketname, file)

    // Download the file from S3 bucket to a local directory
  const localFilePath = './transcription/tempFile.mp3'; // You can specify your desired local path
  await downloadFile(link, localFilePath);

  // Now, read the file using fs.createReadStream()
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(localFilePath),
    model: "whisper-1"
  });
    console.log(transcription)
    const new_data= new AudioModel({
      name:originalname,
      audio:link,
      transcription:transcription.text
    })
    await new_data.save()
    res.send(link)
})


// const audioFun=async()=>{
//   const transcription=await openai.audio.transcriptions.create({
//       file:fs.createReadStream("aud.mp3"),
//      model:"whisper-1"
//   })
//   console.log(transcription.text)
// }


const PORT=8080;
app.listen(PORT, async (req, res) => {
  try {
    await connection;
    console.log("connection established with db");
  } catch {
    console.log("error in connection");
  }
  console.log(`listening on ${PORT}`);
});



