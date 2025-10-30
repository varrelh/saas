var express = require('express');
var router = express();
var crypto = require ("crypto")
const db = require("../models/connect");
const connect = require('http2');
const bcrypt = require("bcrypt")
const streamifier = require("streamifier")
var fs = require("fs");
var multer = require ("multer");
require("dotenv").config()

router.use(express.json())
router.use(express.urlencoded({extended: true}))

const storage = multer.memoryStorage()
const upload = multer({storage:storage})

//connect to Database
db.mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
  })
  .then(() => {
  console.log("Successfully connect to MongoDB.");
  })
  .catch(err => {
  console.error("Connection error", err);
  process.exit();
});

const getHash = (content) =>{
  var hash = crypto.createHash('md5');
	data = hash.update(content, 'utf-8');
	gen_hash= data.digest('hex');
	return gen_hash
}

//Get home page
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

//Generate-key Process
router.get("/generate-key", async(req, res) => {
  const {publicKey, privateKey} = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: {
          type: "spki",
          format: "pem",
      },
      privateKeyEncoding: {
          type: "pkcs8",
          format: "pem",
      }
  })

  const NPM = req.body.NPM

  //save to database
  let check = (await db.user.findOne({"NPM" : NPM}))
  if (await db.keyuser.findOne({"NPM": NPM})){
    res.send("Thats account has already have key")
  } else if (!check){
    res.send ("account not registered")
  }
  else{
    const create_KeyUser = await db.keyuser.create({NPM, privateKey, publicKey})
    res.send({publicKey, privateKey, result:"Key is created"})
  }
}
// catch{
//   res.send("Generate error")
// }}
)

//Signing process
router.post("/signing", upload.single("file"), async (req, res) => {

  const myReadStream = streamifier.createReadStream(req.file.buffer);
  let {NPM, Password} = req.body;

  let user = await db.user.findOne({"NPM": NPM})
  if(!user){
    res.send(eval({result:"NPM and Password is incorrect"}))
  } 
  else{
    const valid = await bcrypt.compare(Password, user.Password)
    if (!valid){
      res.send(eval({result:"NPM and Password is incorrect"}))
    } else {
      
      let privateKey = await db.keyuser.findOne({"NPM": NPM}, {privateKey: 1, _id: 0})
      privateKey = privateKey.privateKey;

    var rContents = '' 
    myReadStream.on('data', function(chunk) {
    		rContents += chunk;
    });
    myReadStream.on('error', function(err){
    		console.log(err);
    });
    myReadStream.on('end',function(){
    		var content = getHash(rContents) ;

      const signing = crypto.createSign("SHA256")
      signing.update(content)  
      signing.end()
      const signature = signing.sign(privateKey)
      res.send({file: req.file.originalname, signature: signature.toString("base64")})
    });
    }
  }
}
)

//Verify data process
router.post("/verify", upload.single("file"),async (req, res) =>{

  const myReadStream = streamifier.createReadStream(req.file.buffer);
  let {data, signature, NPM} = req.body
  let publicKey = await db.keyuser.findOne({"NPM": NPM}, {publicKey: 1, _id: 0})
  let name = await db.user.findOne({"NPM": NPM}, {Nama: 1, _id: 0})

  if(!publicKey){
    res.send({data, verify :"false"})
  }
  else {

    publicKey = publicKey.publicKey

    var rContents = '' 
    myReadStream.on('data', function(chunk) {
    		rContents += chunk;
    });
    myReadStream.on('error', function(err){
    		console.log(err);
    });
    myReadStream.on('end',function(){
    		
    	var content = getHash(rContents) ;
      const verifying = crypto.createVerify("SHA256")
      verifying.update(content)
      verifying.end()

      let result = verifying.verify(publicKey, Buffer.from(signature, "base64"))

      if (result){
        res.send({file : req.file.originalname, verify : result, signedBy : name})
        return
      } else {
        res.send({file : req.file.originalname, verify : result})
        return
    } 
    });
  }}
)

router.post("/register", async(req, res) =>{
    const hashedPassword = await bcrypt.hash(req.body.Password, 10)
    const users = {
        NPM: req.body.NPM, 
        Nama: req.body.Nama,
        Password: hashedPassword,
    }

    if (await db.user.findOne({"NPM": users.NPM})){
      res.send("Account is already created")
    }else{
      const createUser = await db.user.create(users)
      res.send("Account is created")
    }
  }
)

module.exports = router;
