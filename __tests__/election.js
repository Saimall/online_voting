// /* eslint-disable no-undef */

// const request = require("supertest");
// var cheerio = require("cheerio");
// const db = require("../models/index");
// const app = require("../app");
// //const todo = require("../models/todo");
// let server, agent;
// function extractCsrfToken(res) {
//   var $ = cheerio.load(res.text);
//   return $("[name=_csrf]").val();
// }
// const loginuser = async (agent, username, password) => {
//   let res = await agent.get("/login");
//   let csrfToken = extractCsrfToken(res);
//   res = await agent.post("/session").send({
//     email: username,
//     password: password,
//     _csrf: csrfToken,
//   });
// };
// // eslint-disable-next-line no-unused-vars
// // const logoutuser = async (agent, username, password) => {
// // let res = await agent.get("/signout");
// //let csrfToken = extractCsrfToken(res);
// //res = await agent.post("/session").send({
// //email: username,
// //password: password,
// //_csrf: csrfToken,
// //});
// //};
// describe("Election test suite ", () => {
//   beforeAll(async () => {
//     await db.sequelize.sync({ force: true });
//     server = app.listen(3000, () => {});
//     agent = request.agent(server);
//   });
//   afterAll(async () => {
//     await db.sequelize.close();
//     server.close();
//   });

//   test("testing signup feature", async () => {
//     let res = await agent.get("/signup");
//     const csrfToken = extractCsrfToken(res);
//     res = await agent.post("/admin").send({
//       firstName: "mallik",
//       lastName: "sai",
//       email: "sai1245678@gmail.com",
//       password: "1234",
//       _csrf: csrfToken,
//     });
//     expect(res.statusCode).toBe(302);
//   });
//   test("testing signout feature", async () => {
//     let response = await agent.get("/elections");
//     expect(response.statusCode).toBe(200);
//     response = await agent.get("/signout");
//     expect(response.statusCode).toBe(302);
//     response = await agent.get("/elections");
//     expect(response.statusCode).toBe(302);
//   });
//   test("testing signin feature", async () => {
//     let response = await agent.get("/elections");
//     expect(response.statusCode).toBe(302);
//     response = await agent.get("/login");
//     expect(response.statusCode).toBe(200);
//     response = await agent.get("/elections");
//     expect(response.statusCode).toBe(302);
//   });
//   test("testing creating election feature", async () => {
//     const agent = request.agent(server);
//     await loginuser(agent, "sai1245678@gmail.com", "1234");
//     const res = await agent.get("/create");
//     const csrfToken = extractCsrfToken(res);
//     const response = await agent.post("/elections").send({
//       electionName: "majority voting",
//       _csrf: csrfToken,
//     });
//     console.log(response);
//     expect(response.statusCode).toBe(302);
//   });
// });
