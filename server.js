const http = require("http")
const express = require("express");
const httpProxy = require("http-proxy");
const cors = require("cors");
const axios = require("axios")
const bodyParser = require("body-parser")
const path = require("path")
//
// Create a proxy server with custom application logic
//
const proxy = httpProxy.createProxyServer({});

//
// Create your custom server and just call `proxy.web()` to proxy
// a web request to the target passed in the options
// also you can use `proxy.ws()` to proxy a websockets request
//

const app = express();
app.use(cors({
  exposedHeaders: ['Content-Length', 'Authorization', 'connection'],
}))
app.use(express.static('public/Sube'));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

// parse application/json
app.use(bodyParser.json())

app.use('/api', async (req, res, next) => {
  let method = req.method;
  let path = req.path;
  try {

    if (path.indexOf('login') >= 0) {
      path = "/login";
      console.log("modify path for login");
    } else {
      path = `/api${path}`
    }
    let url = `http://api.javacibank.com${path}`;

    console.log(`Proxiing from ${req.method}::${req.originalUrl} to  ${req.method}::${url}`);

    let response = await axios({
      method: method,
      url: url,
      data: JSON.stringify(req.body),
      headers: {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9,tr;q=0.8",
        "content-type": "application/json"
      }
    });
    let resData = response.data;
    console.log("Response Status : ", response.status)
    let resHeaders = response.headers;
    if (path.indexOf('login') >= 0) {
      res.set('Authorization', resHeaders['authorization'])// = resHeaders;
      res.set('connection', resHeaders['connection'])// = resHeaders;
    }

    res.status(response.status).send(response.data);
    
  } catch (error) {

    let resStatus = 500;
    let resData = 'Server Error.'
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      resStatus = error.response.status
      resData = error.response.data;

    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.log(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error', error.message);
      resData = error.message;
    }
    console.log(`Error for the request ${error.config.method}::${error.config.url} status : ${resStatus}`);
    res.status(resStatus).send(resData)
  }

  //console.log("req.headers", req.headers)
  /* proxy.web(req, res, {
        changeOrigin: true,               // needed for virtual hosted sites 
        ws: true,                         // proxy websockets 
        logLevel: "debug",
        target: `http://api.javacibank.com/`,
        proxyRes:function (proxyRes, req, res) {
            res.headers = {...proxyRes.headers, ...res.headers}
            console.log('RAW Response from the target', JSON.stringify(res.headers, true, 2));
          }
    });*/
})

app.use((req, res) => {
  const options = {
    root: path.join(__dirname, "public/Sube")
  };
  const fileName = 'index.html';

  res.sendFile(fileName, options)
})
app.listen(process.env.PORT||8080, () => {
  console.log("APp is listening on port ",process.env.PORT||8080)
})

/* proxy.on('proxyRes', function (proxyRes, req, res) {
    res.headers = {...proxyRes.headers, ...res.headers}
    console.log('RAW Response from the target', JSON.stringify(res.headers, true, 2));
  }); */