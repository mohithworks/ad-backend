import express from "express";
import cors from "cors";
import * as dotenv from 'dotenv';
import { sbUpdate, sbInsert, sbSelectDefault } from "./services/apiService.js";
import _ from 'lodash';
import addTime from "add-time";
dotenv.config();

// Create a single supabase client for interacting with your database

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());

app.get("/", function (req, res, next) {
  res.send("Started");
});

async function addDate(dateS) {
  const dateString = dateS;
  const [day, month, year, time, period] = dateString.split(/\/|, | /);
  const [hour, minute, second] = time.split(":");
  const isPM = period.toLowerCase() === 'pm';
  const date = new Date(year, month - 1, day, isPM ? parseInt(hour) + 12 : hour, minute, second);
  date.setMinutes(date.getMinutes() + 3);
  const options = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  };
  const formattedDate = date.toLocaleString('en-IN', options);
  return formattedDate;
}

async function addDate2(dateS) {
  var dateString = new Date(dateS);
  dateString.setMinutes(dateString.getMinutes() + 2);

  return dateString;
}

app.get("/video/request", async function (req, res, next) {
 const userid = req.query.userid;
 const campid = req.query.campid.toString();

 console.log(campid)

 sbSelectDefault('campaigns', 'source', 'id', campid).then(({error, data}) => { 
  if(error) {
    throw new Error(error.message);
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
        throw new Error(error.message);
      }
      if(data.length === 0) {
        //Inserting record into campaign id table
        console.log('Inserting');
        sbInsert(campid, insertData).then(({error, data}) => {
          if(error) {
            throw new Error(error.message);
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
              throw new Error(error.message);
            }
            if(data) {
              res.send(videoSource)
            }
          });

        } else {
          res.status(400).send('You have exceeded the limit of viewing this ad');
        }
    
      }
     })
  }
 })

});

app.get("/video/request2", async function (req, res, next) {
 const userid = req.query.userid;
 const campid = req.query.campid.toString();
 const refid = req.query.refid;

 console.log(campid)

 sbSelectDefault('campaigns', 'source', 'id', campid).then(async ({error, data}) => { 
  if(error) {
    res.status(400).send('There was an error. Please try again after sometime')
  }
  if(data) {
    var videoSource = data[0].source;
    //Get video starting time
    var startTime = new Date(); 
    console.log(startTime)
    //Getting maxTime
    var maxTime = await addDate2(startTime);

    console.log(maxTime)

    var insertData = [{
      userid: userid,
      starttime: startTime,
      maxtime: maxTime,
      refid: refid,
    }]

    //Checking user eligibility
    sbSelectDefault(campid, 'userid, maxattempts', 'userid', userid).then(({error, data}) => { 
      if(error) {
        res.status(400).send('There was an error. Please try again after sometime')
      }
      if(data.length === 0) {
        //Inserting record into campaign id table
        console.log('Inserting');
        sbInsert(campid, insertData).then(({error, data}) => {
          if(error) {
            res.status(400).send('There was an error. Please try again after sometime')
          }
          if(data) {
            res.send(videoSource)
          }
        });  

      }else if(data) {
        console.log('Updating');
        const { maxattempts } = data[0];
        if(maxattempts !== 0) { 
          //If user is eligible update the existing record
          insertData[0]['maxattempts'] = maxattempts - 1;
          sbUpdate(campid, insertData, 'userid', userid).then(({error, data}) => {
            if(error) {
              res.status(400).send('There was an error. Please try again after sometime')
            }
            if(data) {
              res.send(videoSource)
            }
          });

        } else {
          res.status(400).send('You have exceeded the limit of viewing this video ad');
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
    throw new Error(error.message);
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
          throw new Error(error.message);
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
              throw new Error(error.message);
            }
            if(data) {
              //Updating coins earned in campaign id table
              sbUpdate(campid, updateData2, 'userid', userid).then(({error, data}) => {
                if(error) {
                  throw new Error(error.message);
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

app.get("/date", function (req, res, next) {
  const inputDateString = "30/4/2023, 6:58:52 pm";
  const date = new Date(inputDateString);
  console.log(date)
})

app.get("/video/finish2", async function (req, res, next) {
  const userid = req.query.userid;
  const campid = req.query.campid.toString();
 
  console.log(campid)
 
  sbSelectDefault(campid, 'starttime, maxtime', 'userid', userid).then(({error, data}) => { 
    console.log('1')
   if(error) {
    res.status(400).send('There was an error. Please try again after sometime')
  }
   if(data) {
     //Get video starting time
    var startDate = new Date(data[0].starttime); 
    startDate.setMinutes(startDate.getMinutes() + 1);
    console.log(startDate)

    const currentDate = new Date();
    console.log(currentDate)

    const endDate = new Date(data[0].maxtime);
    console.log(endDate)

    //Checking if user has watched the video for 3 minutes
    if(_.inRange(currentDate.getTime(), startDate.getTime(), endDate.getTime())) { 
      console.log('User has watched the video for 1 minute');
      sbSelectDefault('campaigns', 'interactions', 'id', campid).then(({error, data}) => { 
        if(error) {
          res.status(400).send('There was an error. Please try again after sometime')
        }
        if(data) {
          var updatedInteractions = data[0].interactions + 1;
          var updateData = [{
            interactions: updatedInteractions,
          }]
          var updateData2 = [{
            watch_stat: 'W'
          }]
          //Updating coins in campaigns table
          sbUpdate('campaigns', updateData, 'id', campid).then(({error, data}) => {
            if(error) {
              res.status(400).send('There was an error. Please try again after sometime')
            }
            if(data) {
              //Updating coins earned in campaign id table
              sbUpdate('users', updateData2, 'id', userid).then(({error, data}) => {
                if(error) {
                  res.status(400).send('There was an error. Please try again after sometime')
                }
                if(data) {
                  res.send('We are thankfull for watching the video!!')
                }
              });
            }
          })
        }
     })
      
    }else {
      res.status(400).send('It was found that you haven\'t watched the video for 1 minute.')
    }
 
     
   }
  })
 
});

app.listen(port, () => console.log(`server started on port ${port}`));

// export default app;
