const express = require("express");
const app = express();
const csrf = require("tiny-csrf");
const cookieParser = require("cookie-parser");
const { Admin, Election, questions, options, Voters } = require("./models");
const bodyParser = require("body-parser");
const connectEnsureLogin = require("connect-ensure-login");
const LocalStratergy = require("passport-local");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");
const passport = require("passport");
// eslint-disable-next-line no-unused-vars
const { AsyncLocalStorage } = require("async_hooks");
const flash = require("connect-flash");
const saltRounds = 10;

app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.use(flash());
app.use(cookieParser("Some secret String"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "my-super-secret-key-2837428907583420",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.use((request, response, next) => {
  response.locals.messages = request.flash();
  next();
});
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  "user-local",
  new LocalStratergy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      Admin.findOne({ where: { email: username } })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch(() => {
          return done(null, false, { message: "Invalid Email-ID" });
        });
    }
  )
);
passport.use(
  "voter-local",
  new LocalStratergy(
    {
      usernameField: "voterID",
      passwordField: "password",
      passReqToCallback: true,
    },
    (request, username, password, done) => {
      Voters.findOne({
        where: { voterID: username, electionID: request.params.id },
      })
        .then(async (voter) => {
          const result = await bcrypt.compare(password, voter.password);
          if (result) {
            return done(null, voter);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch((error) => {
          console.log(error);
          return done(null, false, {
            message: "This voter is not registered",
          });
        });
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser((id, done) => {
  Admin.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

app.get("/", (request, response) => {
  if (request.user) {
    return response.redirect("/elections");
  } else {
    response.render("index", {
      title: "Welcom To Online Voting Platform",
    });
  }
});

app.get(
  "/index",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    response.render("index", { csrfToken: request.csrfToken() });
  }
);

app.get(
  "/elections",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    let loggedinuser = request.user.firstName + " " + request.user.lastName;
    try {
      const elections_list = await Election.getElections(request.user.id);
      if (request.accepts("html")) {
        response.render("elections", {
          title: "Online Voting interface",
          userName: loggedinuser,
          elections_list,
        });
      } else {
        return response.json({
          elections_list,
        });
      }
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);
// app.get(
//   "/election",
//   connectEnsureLogin.ensureLoggedIn(),
//   async (request, response) => {
//     const loggedInAdminID = request.user.id;
//     const elections = await Election.findAll({
//       where: { adminID: loggedInAdminID },
//     });

//     return response.json({ elections });
//   }
// );
app.get(
  "/create",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    response.render("new", {
      title: "Create an election",
      csrfToken: request.csrfToken(),
    });
  }
);

app.post(
  "/elections",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      await Election.addElections({
        electionName: request.body.electionName,
        adminID: request.user.id,
      });
      response.redirect("/elections");
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get("/signup", (request, response) => {
  try {
    response.render("signup", {
      title: "Create admin account",
      csrfToken: request.csrfToken(),
    });
  } catch (err) {
    console.log(err);
  }
});

app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

app.get("/login", (request, response) => {
  if (request.user) {
    return response.redirect("/elections");
  }
  response.render("login", {
    title: "Login to your admin account",
    csrfToken: request.csrfToken(),
  });
});

app.post(
  "/session",
  passport.authenticate("user-local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (request, response) => {
    response.redirect("/elections");
  }
);

app.post("/admin", async (request, response) => {
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  try {
    const user = await Admin.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
        response.redirect("/");
      } else {
        response.redirect("/elections");
      }
    });
  } catch (error) {
    return response.redirect("/signup");
  }
});
app.get(
  "/listofelections/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const voter = await Voters.retrivevoters(request.params.id);
      const question = await questions.retrievequestion(request.params.id);
      const election = await Election.findByPk(request.params.id);
      const electionname = await Election.getElections(
        request.params.id,
        request.user.id
      );
      const countofquestions = await questions.countquestions(
        request.params.id
      );
      const countofvoters = await Voters.countvoters(request.params.id);
      response.render("election_page", {
        election: election,
        voters: voter,
        questions: question,
        id: request.params.id,
        title: electionname.electionName,
        nq: countofquestions,
        nv: countofvoters,
      });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);
app.get(
  "/questions/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const electionlist = await Election.getElections(
      request.params.id,
      request.user.id
    );
    const questions1 = await questions.retrievequestions(request.params.id);
    const election = await Election.findByPk(request.params.id);
    if (election.launched) {
      request.flash(
        "error",
        "Can not modify question while election is running!!"
      );
      return response.redirect(`/listofelections/${request.params.id}`);
    }
    if (request.accepts("html")) {
      response.render("questions", {
        title: electionlist.electionName,
        id: request.params.id,
        questions: questions1,
        election: election,
        csrfToken: request.csrfToken(),
      });
    } else {
      return response.json({
        questions1,
      });
    }
  }
);
app.get(
  "/questionscreate/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    response.render("createquestion", {
      id: request.params.id,
      csrfToken: request.csrfToken(),
    });
  }
);

app.post(
  "/questionscreate/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const question = await questions.addquestion({
        electionID: request.params.id,
        questionname: request.body.questionname,
        description: request.body.description,
      });
      return response.redirect(
        `/displayelections/correspondingquestion/${request.params.id}/${question.id}/options`
      );
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get(
  "/displayelections/correspondingquestion/:id/:questionID/options",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const question = await questions.retrievequestion(
        request.params.questionID
      );
      const option = await options.retrieveoptions(request.params.questionID);
      if (request.accepts("html")) {
        response.render("questiondisplay", {
          title: question.question,
          description: question.description,
          id: request.params.id,
          questionID: request.params.questionID,
          option,
          csrfToken: request.csrfToken(),
        });
      } else {
        return response.json({
          option,
        });
      }
    } catch (err) {
      return response.status(422).json(err);
    }
  }
);

app.delete(
  "/deletequestion/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const res = await questions.removequestion(request.params.id);
      return response.json({ success: res === 1 });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.post(
  "/displayelections/correspondingquestion/:id/:questionID/options",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      await options.addoption({
        optionname: request.body.optionname,
        questionID: request.params.questionID,
      });
      return response.redirect(
        `/displayelections/correspondingquestion/${request.params.id}/${request.params.questionID}/options`
      );
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.delete(
  "/:id/deleteoptions",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const res = await options.removeoptions(request.params.id);
      return response.json({ success: res === 1 });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);
app.get(
  "/elections/:electionID/questions/:questionID/modify",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const adminID = request.user.id;
    const admin = await Admin.findByPk(adminID);
    const election = await Election.findByPk(request.params.electionID);
    const Question = await questions.findByPk(request.params.questionID);
    response.render("modifyquestion", {
      username: admin.name,
      election: election,
      question: Question,
      csrf: request.csrfToken(),
    });
  }
);
app.post(
  "/elections/:electionID/questions/:questionID/modify",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      await questions.modifyquestion(
        request.body.questionname,
        request.body.description,
        request.params.questionID
      );
      response.redirect(`/questions/${request.params.electionID}`);
    } catch (error) {
      console.log(error);
      return;
    }
  }
);
app.get(
  "/elections/:electionID/questions/:questionID/options/:optionID/modify",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const adminID = request.user.id;
    const admin = await Admin.findByPk(adminID);
    const election = await Election.findByPk(request.params.electionID);
    const Question = await questions.findByPk(request.params.questionID);
    const option = await options.findByPk(request.params.optionID);
    response.render("modifyoption", {
      username: admin.name,
      election: election,
      question: Question,
      option: option,
      csrf: request.csrfToken(),
    });
  }
);
app.post(
  "/elections/:electionID/questions/:questionID/options/:optionID/modify",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      await options.modifyoption(
        request.body.optionname,
        request.params.optionID
      );
      response.redirect(
        `/displayelections/correspondingquestion/${request.params.electionID}/${request.params.questionID}/options`
      );
    } catch (error) {
      console.log(error);
      return;
    }
  }
);

app.get(
  "/voters/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const electionlist = await Election.getElections(
      request.params.id,
      request.user.id
    );
    const voterlist = await Voters.retrivevoters(request.params.id);
    const election = await Election.findByPk(request.params.id);
    if (request.accepts("html")) {
      response.render("voters", {
        title: electionlist.electionName,
        id: request.params.id,
        voters: voterlist,
        election: election,
        csrfToken: request.csrfToken(),
      });
    } else {
      return response.json({
        voterlist,
      });
    }
  }
);
app.get("/voters/listofelections/:id", async (request, response) => {
  try {
    const electionname = await Election.getElections(
      request.params.id,
      request.user.id
    );
    const countofquestions = await questions.countquestions(request.params.id);
    const countofvoters = await Voters.countvoters(request.params.id);
    const election = await Election.findByPk(request.params.id);
    response.render("election_page", {
      election: election,
      id: request.params.id,
      title: electionname.electionName,
      nq: countofquestions,
      nv: countofvoters,
    });
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("/elections/listofelections/:id", async (request, response) => {
  try {
    const election = await Election.getElections(
      request.params.id,
      request.user.id
    );
    const countofquestions = await questions.countquestions(request.params.id);
    const countofvoters = await Voters.countvoters(request.params.id);
    response.render("election_page", {
      id: request.params.id,
      title: election.electionName,
      election: election,
      nq: countofquestions,
      nv: countofvoters,
    });
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get(
  "/createvoter/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const voterslist = await Voters.retrivevoters(request.params.id);
    if (request.accepts("html")) {
      response.render("createvoter", {
        id: request.params.id,
        csrfToken: request.csrfToken({ voterslist }),
      });
    } else {
      return response.json({ voterslist });
    }
  }
);

app.post(
  "/createvoter/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
    try {
      await Voters.add(request.body.voterid, hashedPwd, request.params.id);
      return response.redirect(`/voters/${request.params.id}`);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get(
  "/elections/:electionID/voter/:voterID/edit",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const election = await Election.findByPk(request.params.electionID);
    const voter = await Voters.findByPk(request.params.voterID);
    response.render("modifyvoters", {
      election: election,
      voter: voter,
      csrf: request.csrfToken(),
    });
  }
);

app.post(
  "/elections/:electionID/voter/:voterID/modify",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      await Voters.modifypassword(
        request.params.voterID,
        request.body.password
      );
      response.redirect(`/voters/${request.params.electionID}`);
    } catch (error) {
      console.log(error);
      return;
    }
  }
);

app.delete(
  "/:id/voterdelete",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const res = await Voters.delete(request.params.id);
      return response.json({ success: res === 1 });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get(
  "/election/:id/launch",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const question = await questions.findAll({
      where: { electionID: request.params.id },
    });
    if (question.length <= 1) {
      request.flash("error", "Please add atleast two question in the ballot!!");
      return response.redirect(`/listofelections/${request.params.id}`);
    }

    for (let i = 0; i < question.length; i++) {
      const option = await options.retrieveoptions(question[i].id);
      if (option.length <= 1) {
        request.flash(
          "error",
          "Kindly add atleast two options to the question!!!"
        );
        return response.redirect(`/listofelections/${request.params.id}`);
      }
    }

    const voters = await Voters.findAll({
      where: { electionID: request.params.id },
    });
    if (voters.length <= 1) {
      request.flash(
        "launch",
        "There should be atleast two voter to lauch election"
      );
      return response.redirect(`/listofelections/${request.params.id}`);
    }

    try {
      await Election.launch(request.params.id);
      return response.redirect(`/listofelections/${request.params.id}`);
    } catch (error) {
      console.log(error);
      return response.send(error);
    }
  }
);

app.get(
  "/election/:id/electionpreview",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const election = await Election.findByPk(request.params.id);
    const optionsnew = [];
    const question = await questions.retrievequestions(request.params.id);

    for (let i = 0; i < question.length; i++) {
      const optionlist = await options.retrieveoptions(question[i].id);
      optionsnew.push(optionlist);
    }
    if (election.launched) {
      request.flash("error", "You can not preview election while Running");
      return response.redirect(`/listofelections/${request.params.id}`);
    }

    response.render("electionpreview", {
      election: election,
      questions: question,
      options: optionsnew,
      csrf: request.csrfToken(),
    });
  }
);

app.get("/externalpage/:electionID", async (request, response) => {
  try {
    const election = await Election.getElection(request.params.electionID);
    if (election.running) {
      const questions = await questions.getQuestions(request.params.electionID);
      let optionsnew = [];
      for (let i = 0; i < questions.length; i++) {
        const optionlist = await options.retrieveoptions(questions[i].id);
        optionsnew.push(optionlist);
      }
      return response.render("voterview", {
        title: election.electionName,
        electionID: request.params.electionID,
        questions,
        optionsnew,
        csrfToken: request.csrfToken(),
      });
    } else {
      return response.render("404");
    }
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});
module.exports = app;
