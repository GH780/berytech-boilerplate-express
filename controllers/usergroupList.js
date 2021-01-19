const slackToken = process.env.token;
const axios = require("axios");
var mongoose = require("mongoose");
var mongoDB = process.env.dburl;
mongoose.connect(mongoDB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var UserGroup = require("../models/usrgroup");




exports.fetchUsrGroupList = async () => {
    var message = "";
    const collection = db.collection("UserGroup");

    //deactivate all user group status in database
    const updatedData = await collection.updateMany({
        status: "active"
    }, {
        $set: {
            status: "deactive"
        }
    });
    //call API to fetch usergroup list from slackworkspace
    const res = await axios.post(
        process.env.slackusergroupapi, {}, {
            headers: {
                authorization: `Bearer ${slackToken}`
            }
        }
    );

    if (!res.data) return;
    var arrUserGroups = res.data.usergroups;

    for (var i = 0; i < arrUserGroups.length; i++) {
        var usrgroupName = arrUserGroups[i].name;

        let query = {
            name: usrgroupName
        };

        // check if usergroup name exist in local db
        const findUG = await collection.findOne(query);

        // add to db and activate status
        if (!findUG) {
            await UserGroup.create({
                    name: usrgroupName,
                    id: arrUserGroups[i].id,
                    status: "active"
                },
                (err, data) => {
                    message += ` the ${ data.name} is saved <br/>`;

                }
            );
        } else {
            //update usergroup status to active if already exist in local db
            await collection.updateOne(query, {
                $set: {
                    status: "active"
                },
            });
            message += `${usrgroupName} activate its status <br/> `;

        }
    }
    return message;
};
