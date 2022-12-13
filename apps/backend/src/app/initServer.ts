import * as cors from "cors";
import * as express from "express";
import { Express } from "express";
import * as http from 'http';


import initSocket from "./initSocket";

export default function initServer(app: Express) {
  const server = http.createServer(app);
  initSocket(server)

  app.use(cors({ origin: "http://localhost:3000" }))

  // parse requests of content-type - application/json
  app.use(express.json());

  // parse requests of content-type - application/x-www-form-urlencoded
  app.use(express.urlencoded({ extended: true }));


  // simple route
  app.get("/", (req, res) => {
    res.json({ message: "Why are you here?" });
  });


  // set port, listen for requests
  const PORT = process.env.PORT || 8080;

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
  })
  server.on('error', console.error);
  return server
}

