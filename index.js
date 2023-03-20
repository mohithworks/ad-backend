import express from "express";
import cors from "cors";
import * as dotenv from 'dotenv';
import { sbUpdate, sbInsert, sbSelectDefault } from "./services/apiService.js";
import _ from 'lodash';
dotenv.config();

// Create a single supabase client for interacting with your database

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());

app.get("/", function (req, res, next) {
  res.send("Started");
});

app.get("/video/request", async function (req, res, next) {
 const userid = req.query.userid;
 const campid = req.query.campid.toString();

 console.log(campid)

 console.log(email)

 sbSelectDefault('campaigns', 'source', 'id', campid).then(({error, data}) => { 
  if(error) {
    console.log(error);
  }
  if(data) {
    var videoSource = data[0].source;
    //Get video starting time
    var startTime = new Date().toLocaleString(); 

    //Spliting time to get maxTime
    var time = startTime.split(' ');
    var date = time[0];
    var timeSplit = time[1].split(':');

    //Getting maxTime
    var maxMinute = (parseInt(timeSplit[1]) + 3).toString();
    var maxTime = date + ' ' + timeSplit[0] + ':' + maxMinute + ':' + timeSplit[2];

    var insertData = [{
      userid: userid,
      starttime: startTime,
      maxtime: maxTime,
    }]

    //Checking user eligibility
    sbSelectDefault(campid, 'userid, coins_earned, maxattempts', 'userid', userid).then(({error, data}) => { 
      if(error) {
        console.log(error);
      }
      if(data.length === 0) {
        //Inserting record into campaign id table
        console.log('Inserting');
        sbInsert(campid, insertData).then(({error, data}) => {
          if(error) {
            console.log(error);
          }
          if(data) {
            res.send(videoSource)
          }
        });  

      }else if(data) {
        console.log('Updating');
        const { coins_earned, maxattempts } = data[0];
        if(coins_earned === 0 && maxattempts !== 0) { 
          //If user is eligible update the existing record
          insertData[0]['maxattempts'] = maxattempts - 1;
          sbUpdate(campid, insertData, 'userid', userid).then(({error, data}) => {
            if(error) {
              console.log(error);
            }
            if(data) {
              res.send(videoSource)
            }
          });

        } else {
          res.send('You have exceeded the limit of viewing this ad')
        }
    
      }
     })
  }
 })

});


app.get("/video/finish", async function (req, res, next) {
  const email = req.query.name;
  const userid = req.query.userid;
  const campid = req.query.campid.toString();
 
  console.log(campid)
 
  console.log(email)
 
  sbSelectDefault(campid, 'starttime, maxtime, coins_earned', 'userid', userid).then(({error, data}) => { 
    console.log('1')
   if(error) {
     console.log(error);
   }
   if(data) {
     var coins = data[0].coins_earned;
     console.log(coins)

     //Get video starting time
     var startTime = data[0].starttime; 

     //Spliting startTime
     var timeS = startTime.split(' ');
     var timeSplitS = timeS[1].split(':');

     var videoMin = parseInt(timeSplitS[1]) + 1;//54
 
     //Getting maxTime
     var maxTime = data[0].maxtime;

     //Spliting maxTime
     var timeM = maxTime.split(' ');
     var dateM = timeM[0];
     var timeSplitM = timeM[1].split(':');

     var videoMax = parseInt(timeSplitM[1]);//57

     var endTime = new Date().toLocaleString();

     //Spliting endTime
     var timeE = endTime.split(' ');
     var dateE = timeE[0];
     var timeSplitE = timeE[1].split(':');

     var videoCurrent = parseInt(timeSplitE[1]);
     console.log('S: ' + videoMin + ' E: ' + videoMax + ' C: ' + videoCurrent)

    //Checking if user has watched the video for 3 minutes
    if(coins === 0 && dateE === dateM && timeSplitE[0] === timeSplitM[0] && _.inRange(videoCurrent, videoMin, videoMax)) { 
      console.log('User has watched the video for 1 minute');
      sbSelectDefault('campaigns', 'coins, interactions', 'id', campid).then(({error, data}) => { 
        if(error) {
          console.log(error);
        }
        if(data) {
          var updatedInteractions = data[0].interactions + 1;
          var debitedCoins = data[0].coins - 20;
          var coinsEarned = 20;
          var updateData = [{
            interactions: updatedInteractions,
            coins: debitedCoins,
          }]
          var updateData2 = [{
            coins_earned: coinsEarned,
          }]
          //Updating coins in campaigns table
          sbUpdate('campaigns', updateData, 'id', campid).then(({error, data}) => {
            if(error) {
              console.log(error);
            }
            if(data) {
              //Updating coins earned in campaign id table
              sbUpdate(campid, updateData2, 'userid', userid).then(({error, data}) => {
                if(error) {
                  console.log(error);
                }
                if(data) {
                  res.send('Congratulations you have earned 20 coins')
                }
              });
            }
          })
        }
     })
      
    }else {
      res.send('It was found that you haven\'t watched the video for 1 minute. You will not be rewarded for this ad')
    }
 
     
   }
  })
 
});

app.listen(port, () => console.log(`server started on port ${port}`));

// export default app;
