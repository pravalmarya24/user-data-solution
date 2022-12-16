let express = require("express");
let { open } = require("sqlite");
let sqlite3 = require("sqlite3");
let path = require("path");
let bcrypt = require("bcrypt");
let app = express();
app.use(express.json());

let dbPath = path.join(__dirname, "userData.db");

let db = null;

let initializeDBAndServer = async function () {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, function () {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//Create User Id
app.post("/register", async function (request, response) {
  let { username, name, password, gender, location } = request.body;
  let hashedPasswd = await bcrypt.hash(password, 10);
  let checkUsernameQuery = `SELECT 
                                *
                           FROM 
                                user
                           WHERE
                                username = '${username};'`;
  let usernameCheck = await db.get(checkUsernameQuery);
  if (usernameCheck === undefined) {
    let putNewUsername = `
                INSERT INTO
                user (username,name,password,gender,location)
                VALUES
                    (
                        '${username},'
                        '${name},'
                        '${hashedPasswd},'
                        '${gender},'
                        '${location},'
                    );`;
    await db.run(putNewUsername);
    response.send("User created successfully");
  }
  if (hashedPasswd.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//Login User
app.post("/login", async function (request, response) {
  let { username, password } = request.body;
  let checkUsernameQuery = `SELECT 
                                *
                           FROM 
                                user
                           WHERE
                                username = '${username};'`;
  let usernameCheck = await db.get(checkUsernameQuery);
  if (usernameCheck === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    let isPasswordMatch = await bcrypt.compare(
      password,
      usernameCheck.password
    );
    if (isPasswordMatch === true) {
      response.status(200);
      response.send("Login Success!");
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});

// Update Password
app.put("/change-password", async function (request, response) {
  let { username, oldPassword, newPassword } = request.body;
  let putChangePassQuery = `
        UPDATE 
        user
        SET
              username = '${username}',
              old_password = '${oldPassword}', 
              new_password = '${newPassword}'   
              ;`;
  let changePss = await db.run(putChangePassQuery);
  response.status(200);
  response.send("Password updated");
  if (changePss.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
