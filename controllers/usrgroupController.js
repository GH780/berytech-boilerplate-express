const axios = require('axios');
const excelToJson = require('convert-excel-to-json');
'use strict';
var mongoDB =process.env.dburl;
var UserGroup = require('../models/usrgroup');
const slackToken =process.env.token;
const url = 'https://slack.com/api/usergroups.create';
const uri ="mongodb://localhost:27017/";
let mongoose = require("mongoose");
const { MongoClient } = require("mongodb");

const client = new MongoClient(uri,{
    useNewUrlParser: true,
    useUnifiedTopology: true
  });


//connecting to the database
mongoose.connect(mongoDB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

exports.CreateUG = function(){
//read excel file and convert it to json form
const result = excelToJson({ 
    sourceFile: __dirname + './../uploads/Data.xlsx',
    header:{
        rows: 1
    },
    columnToKey: {
        A: 'firstName',
        B: 'lastName',
        C: 'email',
        D: 'teamName',
        E: 'action'
    }
});
console.log(result.sheet1);
//remover repetition in teamName field and save it in an array
arrUsrGroup = [];
for (var j = 0; j < result.sheet1.length; j++) {
    if(arrUsrGroup.indexOf(result.sheet1[j].teamName) == -1 ){
        arrUsrGroup.push(result.sheet1[j].teamName);
    }
}
//console.log(arrUG);
var message="";

run().catch(err => console.log(err));

async function run(usrgroup) {
    usrgroup = arrUsrGroup;

    await client.connect();
    const database = client.db("gardeniadb");
    const collection = database.collection("UserGroup");
    
    for (var i = 0; i < usrgroup.length; i++) {
        const query = { name: usrgroup[i]};
        // search for usergroup name in db
        const UG = await UserGroup.findOne(query);
        // if usergroup name not exist the call API to create it
        if(!UG){
            const res = await axios.post(url, {
            channel: 'general',
            name: usrgroup[i]
            }, { headers: { authorization: `Bearer ${slackToken}` } });

            //console.log('Done', res.data);
            if(!res.data) return;
            if(res.data.ok == false) return;
            var userGroup = res.data.usergroup;
            //console.log(userGroup.name + " is created");

            // add new usergroup to local db with status:active
            await UserGroup.create({ name: userGroup.name , id: userGroup.id, status: "active" },(err,data)=>{
                //console.log(userGroup.name + " this document is saved");
                message+= userGroup.name + " this document is saved";
                message+="  ";
            });
        }else{
            message+= usrgroup[i] + " already exist";
            message+="  ";
    }
    }
    console.log(message);
    //return message;  
}
arrUG = [];
return ("after execution" + message );
}

