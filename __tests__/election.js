/* eslint-disable no-undef */

const request = require("supertest");
var cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");
//const todo = require("../models/todo");
let server, agent;
function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}
describe("Election test suite ", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(3000, () => {});
    agent = request.agent(server);
  });
  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });

  test("Checking signup feature", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/admin").send({
      firstName: "mallik",
      lastName: "sai",
      email: "sai1245678@gmail.com",
      password: "1234",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });
});
