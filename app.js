const express = require("express");
const app = express();
const csrf = require("tiny-csrf");
const cookieParser = require("cookie-parser");
const { Admin, Election, questions, options } = require("./models");
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
      response.render("elections", {
        title: "Online Voting interface",
        userName: loggedinuser,
        elections_list,
      });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

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
  response.render("signup", {
    title: "Create admin account",
    csrfToken: request.csrfToken(),
  });
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
  passport.authenticate("local", {
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
    request.flash("error", error.message);
    return response.redirect("/signup");
  }
});
app.get(
  "/listofelections/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const electionname = await Election.getElections(
        request.params.id,
        request.user.id
      );
      const countofquestions = await questions.countquestions(
        request.params.id
      );
      response.render("election_page", {
        id: request.params.id,
        title: electionname.electionName,
        nq: countofquestions,
        nv: 47,
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
    response.render("questions", {
      title: electionlist.electionName,
      id: request.params.id,
      questions: questions1,
      csrfToken: request.csrfToken(),
    });
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
    const question = await questions.retrievequestion(
      request.params.questionID
    );
    const option = await options.retrieveoptions(request.params.questionID);
    response.render("questiondisplay", {
      title: question.question,
      description: question.description,
      id: request.params.id,
      questionID: request.params.questionID,
      option,
      csrfToken: request.csrfToken(),
    });
  }
);

app.delete(
  "/deletequestion/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    //const numberofquestions= await questions.countquestions(request.params.id);
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
module.exports = app;
