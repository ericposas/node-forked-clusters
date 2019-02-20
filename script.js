const cluster = require('cluster')
const http = require('http')
const express = require('express')
const fs = require('fs')
const ws = fs.createWriteStream('./output.json', {flags:'a'})

// with this project, we can clearly see where websocket communication from the
// backend to the frontend is needed

if(cluster.isMaster){
  
  const server = express()
  let title_written = false,
      title = 'pids for forked cluster processes';
  server.get('/', (req,res)=>{
    (fs.createReadStream('./output.json')).pipe(res)
  });
  server.listen(8000)

  let numReqs = 0;
  setInterval(()=>{
    console.log(`numReqs = ${numReqs}`);
  }, 1000)
  // count requests
  function messageHandler(msg){
    if(msg.cmd && msg.cmd == 'notifyRequest'){
      numReqs+=1;
    }
    if(msg.pid)
      if(title_written == false){
        ws.write(title)
        title_written = true;
      }
      if(msg.pid != 'undefined' && msg.pid != undefined){
        ws.write(`\n${msg.pid}`, err=>{
          if(!err) console.log('data written')
          else console.log(err)
        })
      }
  }
  // start workers and listen for messages containing notifyRequest
  const numCPUs = require('os').cpus().length;
  for(let i=0;i<numCPUs;i++){
    const worker = cluster.fork()
  }
  for(const id in cluster.workers){
    cluster.workers[id].on('message', messageHandler)
  }

}else{

  // notify master about the request
  process.send({cmd:'notifyRequest'})
  setInterval(()=>{
    process.send({pid:process.pid})
  }, 2000)

}
