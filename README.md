# Pumphus 1.0

Frontend + backend solution for keeping track of the maintenance at our pump-house.

## Description

The backend is powered by NodeJs and Express, while the frontend consists of a single-page application (SPA) in pure vanilla JavaScript.
The purpose is to keep track of the maintenance of a cleaning and pumping station for drinking water, shared by several neighbours.
As a beginner of JavaScript I wrote the project with the goal of finishing it without having to learn or rely on frameworks such as Angluar, React etc. 

## Getting Started

### Dependencies

* NodeJs
* A local MongoDB server, or online. 
* A static HTTP server for the frontend

### Installing

* Clone the project ```git clone https://github.com/rDjupedal/pumphus.git```
* Adjust the BASE_URL in public/main.js to reflect your setup.
* Adjust the app.js 'origin' property for CORS in accordance to your setup.
* Create a file named ".env" in the root directory of the project with the lines ```DB_URL=<path to database>``` and ```SECRET=<your secret>```
* Install all node dependencies ```node install```

### Executing program

* Start a static webserver with the "public" folder as root. For example by running ```python3 -m http.server 8080``` from the public directory.
* Start NodeJs by running ```node app.js``` in the terminal.
* To be able to run the program first time with an empty database you must first create a user;  
  * In routes/userRoutes.js temporarly change DEBUG to true (to disable authentification)
  * Run ```curl 'http://localhost:3000/api/newuser' -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"admin"}'```. This will create the useraccount "admin" with password "admin".
* You are now ready to login from the webpage.

## Authors

Rasmus Djupedal <rasmus.djupedal@gmail.com

## Version History
* 1.0 .Initial version
