/* eslint-disable no-undef */
const request = require("supertest");
const cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");
// eslint-disable-next-line no-unused-vars
const { response } = require("../app");

let server, agent;

function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/session").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};

describe("Online election test suite ", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  test("testing signup new user", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/admin").send({
      firstName: "mallik",
      lastName: "sai",
      email: "sai1@test.com",
      password: "12345678",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });
  test("testing user signout", async () => {
    let res = await agent.get("/elections");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/elections");
    expect(res.statusCode).toBe(302);
  });
  test("testing user login", async () => {
    res = await agent.get("/login");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/index");
    expect(res.statusCode).toBe(302);
  });

  test("testing creating a election", async () => {
    const agent = request.agent(server);
    await login(agent, "sai1@test.com", "12345678");
    const res = await agent.get("/create");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/elections").send({
      electionName: "sai1",
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });
});
