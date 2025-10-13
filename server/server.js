const express = require('express');
const app = express();

const cors = require("cors");
app.use(cors());
app.use(express.json());
app.use(express.static("../public"));











server.listen(3000, () => console.log('server is running '));