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
      publicurl: "url1",
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("testing adding a question", async () => {
    const agent = request.agent(server);
    await login(agent, "sai1@test.com", "12345678");

    let res = await agent.get("/create");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      electionName: "Test election",
      publicurl: "url2",
      _csrf: csrfToken,
    });
    const groupedResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedResponse = JSON.parse(groupedResponse.text);
    const electionCount = parsedResponse.elections_list.length;
    const latestElection = parsedResponse.elections_list[electionCount - 1];

    res = await agent.get(`/questionscreate/${latestElection.id}`);
    csrfToken = extractCsrfToken(res);
    let response = await agent
      .post(`/questionscreate/${latestElection.id}`)
      .send({
        question: "Age",
        description: "Above 18",
        _csrf: csrfToken,
      });
    expect(response.statusCode).toBe(302);
  });

  test("testing deleting a question", async () => {
    const agent = request.agent(server);
    await login(agent, "sai1@test.com", "12345678");

    let res = await agent.get("/create");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      electionName: "CR",
      publicurl: "url3",
      _csrf: csrfToken,
    });
    const ElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedResponse = JSON.parse(ElectionsResponse.text);
    const electionCount = parsedResponse.elections_list.length;
    const latestElection = parsedResponse.elections_list[electionCount - 1];

    res = await agent.get(`/questionscreate/${latestElection.id}`);
    csrfToken = extractCsrfToken(res);
    await agent.post(`/questionscreate/${latestElection.id}`).send({
      question: "CGPA",
      description: "Above 8",
      _csrf: csrfToken,
    });

    res = await agent.get(`/questionscreate/${latestElection.id}`);
    csrfToken = extractCsrfToken(res);
    await agent.post(`/questionscreate/${latestElection.id}`).send({
      question: "ruler",
      description: "test 2",
      _csrf: csrfToken,
    });

    const groupedResponse = await agent
      .get(`/questions/${latestElection.id}`)
      .set("Accept", "application/json");
    const parsedquestionsGroupedResponse = JSON.parse(groupedResponse.text);
    const questionCount = parsedquestionsGroupedResponse.questions1.length;
    const latestQuestion =
      parsedquestionsGroupedResponse.questions1[questionCount - 1];

    res = await agent.get(`/questions/${latestElection.id}`);
    csrfToken = extractCsrfToken(res);
    const deleteResponse = await agent
      .delete(`/deletequestion/${latestQuestion.id}`)
      .send({
        _csrf: csrfToken,
      });
    console.log(deleteResponse.text);
    const parsedDeleteResponse = JSON.parse(deleteResponse.text);
    expect(parsedDeleteResponse.success).toBe(true);

    res = await agent.get(`/questions/${latestQuestion.id}`);
    csrfToken = extractCsrfToken(res);

    const deleteResponse2 = await agent
      .delete(`/deletequestion/${latestElection.id}`)
      .send({
        _csrf: csrfToken,
      });
    const parsedDeleteResponse2 = JSON.parse(deleteResponse2.text).success;
    expect(parsedDeleteResponse2).toBe(false);
  });

  test("testing updating a question", async () => {
    const agent = request.agent(server);
    await login(agent, "sai1@test.com", "12345678");

    let res = await agent.get("/create");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      electionName: "CR Election",
      publicurl: "url4",
      _csrf: csrfToken,
    });
    const groupedResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedResponse.text);
    const electionCount = parsedGroupedResponse.elections_list.length;
    const latestElection =
      parsedGroupedResponse.elections_list[electionCount - 1];

    res = await agent.get(`/questionscreate/${latestElection.id}`);
    csrfToken = extractCsrfToken(res);
    await agent.post(`/questionscreate/${latestElection.id}`).send({
      question: "Test question 1",
      description: "Test description 1",
      _csrf: csrfToken,
    });

    const QuestionsResponse = await agent
      .get(`/questions/${latestElection.id}`)
      .set("Accept", "application/json");
    const parsedquestionGroupedResponse = JSON.parse(QuestionsResponse.text);
    const questionCount = parsedquestionGroupedResponse.questions1.length;
    const latestQuestion =
      parsedquestionGroupedResponse.questions1[questionCount - 1];

    res = await agent.get(
      `/elections/${latestElection.id}/questions/${latestQuestion.id}/modify`
    );
    csrfToken = extractCsrfToken(res);
    res = await agent
      .post(
        `/elections/${latestElection.id}/questions/${latestQuestion.id}/modify`
      )
      .send({
        _csrf: csrfToken,
        question: "what is age",
        description: "above 15",
      });
    expect(res.statusCode).toBe(302);
  });

  test("testing adding a option", async () => {
    const agent = request.agent(server);
    await login(agent, "sai1@test.com", "12345678");

    let res = await agent.get("/create");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      electionName: "test election",
      publicurl: "url6",
      _csrf: csrfToken,
    });
    const ElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(ElectionsResponse.text);
    const electionCount = parsedGroupedResponse.elections_list.length;
    const latestElection =
      parsedGroupedResponse.elections_list[electionCount - 1];

    res = await agent.get(`/questionscreate/${latestElection.id}`);
    csrfToken = extractCsrfToken(res);
    await agent.post(`/questionscreate/${latestElection.id}`).send({
      question: "Marks",
      description: "Above 80",
      _csrf: csrfToken,
    });

    const QuestionsResponse = await agent
      .get(`/questions/${latestElection.id}`)
      .set("Accept", "application/json");
    const parsedquestionsGroupedResponse = JSON.parse(QuestionsResponse.text);
    const questionCount = parsedquestionsGroupedResponse.questions1.length;
    const latestQuestion =
      parsedquestionsGroupedResponse.questions1[questionCount - 1];

    res = await agent.get(
      `/displayelections/correspondingquestion/${latestElection.id}/${latestQuestion.id}/options`
    );
    csrfToken = extractCsrfToken(res);

    res = await agent
      .post(
        `/displayelections/correspondingquestion/${latestElection.id}/${latestQuestion.id}/options`
      )
      .send({
        _csrf: csrfToken,
        option: "testoption",
      });
    expect(res.statusCode).toBe(302);
  });

  test("testing deleting a option", async () => {
    const agent = request.agent(server);
    await login(agent, "sai1@test.com", "12345678");

    let res = await agent.get("/create");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      electionName: "Election",
      publicurl: "url7",
      _csrf: csrfToken,
    });
    const ElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedElectionsResponse = JSON.parse(ElectionsResponse.text);
    const electionCount = parsedElectionsResponse.elections_list.length;
    const latestElection =
      parsedElectionsResponse.elections_list[electionCount - 1];

    res = await agent.get(`/questionscreate/${latestElection.id}`);
    csrfToken = extractCsrfToken(res);
    await agent.post(`/questionscreate/${latestElection.id}`).send({
      question: "testquestion1",
      description: "description",
      _csrf: csrfToken,
    });

    const QuestionsResponse = await agent
      .get(`/questions/${latestElection.id}`)
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(QuestionsResponse.text);
    const questionCount = parsedGroupedResponse.questions1.length;
    const latestQuestion = parsedGroupedResponse.questions1[questionCount - 1];

    res = await agent.get(
      `/displayelections/correspondingquestion/${latestElection.id}/${latestQuestion.id}/options`
    );
    csrfToken = extractCsrfToken(res);
    res = await agent
      .post(
        `/displayelections/correspondingquestion/${latestElection.id}/${latestQuestion.id}/options`
      )
      .send({
        _csrf: csrfToken,
        option: "option 2",
      });

    const OptionsResponse = await agent
      .get(
        `/displayelections/correspondingquestion/${latestElection.id}/${latestQuestion.id}/options`
      )
      .set("Accept", "application/json");
    const parsedoptionGroupedResponse = JSON.parse(OptionsResponse.text);
    console.log(parsedoptionGroupedResponse);
    const optionsCount = parsedoptionGroupedResponse.option.length;
    const latestOption = parsedoptionGroupedResponse.option[optionsCount - 1];

    res = await agent.get(
      `/displayelections/correspondingquestion/${latestElection.id}/${latestQuestion.id}/options`
    );
    csrfToken = extractCsrfToken(res);
    const deleteResponse = await agent
      .delete(`/${latestOption.id}/deleteoptions`)
      .send({
        _csrf: csrfToken,
      });
    const DeleteResponse = JSON.parse(deleteResponse.text).success;
    expect(DeleteResponse).toBe(true);

    res = await agent.get(
      `/displayelections/correspondingquestion/${latestElection.id}/${latestQuestion.id}/options`
    );
    csrfToken = extractCsrfToken(res);
    const deleteResponse2 = await agent
      .delete(`/${latestOption.id}/deleteoptions`)
      .send({
        _csrf: csrfToken,
      });
    const DeleteResponse2 = JSON.parse(deleteResponse2.text).success;
    expect(DeleteResponse2).toBe(false);
  });

  test("testing updating a option", async () => {
    const agent = request.agent(server);
    await login(agent, "sai1@test.com", "12345678");

    let res = await agent.get("/create");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      electionName: "election 3",
      publicurl: "url7",
      _csrf: csrfToken,
    });
    const ElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedElectionsResponse = JSON.parse(ElectionsResponse.text);
    const electionCount = parsedElectionsResponse.elections_list.length;
    const latestElection =
      parsedElectionsResponse.elections_list[electionCount - 1];

    res = await agent.get(`/questionscreate/${latestElection.id}`);
    csrfToken = extractCsrfToken(res);
    await agent.post(`/questionscreate/${latestElection.id}`).send({
      question: "question 5",
      description: "description 5",
      _csrf: csrfToken,
    });

    const QuestionsResponse = await agent
      .get(`/questions/${latestElection.id}`)
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(QuestionsResponse.text);
    const questionCount = parsedGroupedResponse.questions1.length;
    const latestQuestion = parsedGroupedResponse.questions1[questionCount - 1];

    res = await agent.get(
      `/displayelections/correspondingquestion/${latestElection.id}/${latestQuestion.id}/options`
    );
    csrfToken = extractCsrfToken(res);
    res = await agent
      .post(
        `/displayelections/correspondingquestion/${latestElection.id}/${latestQuestion.id}/options`
      )
      .send({
        _csrf: csrfToken,
        option: "option 5",
      });

    const OptionsResponse = await agent
      .get(
        `/displayelections/correspondingquestion/${latestElection.id}/${latestQuestion.id}/options`
      )
      .set("Accept", "application/json");
    const parsedoptionGroupedResponse = JSON.parse(OptionsResponse.text);
    console.log(parsedoptionGroupedResponse);
    const optionsCount = parsedoptionGroupedResponse.option.length;
    const latestOption = parsedoptionGroupedResponse.option[optionsCount - 1];

    res = await agent.get(
      `/elections/${latestElection.id}/questions/${latestQuestion.id}/options/${latestOption.id}/modify`
    );
    csrfToken = extractCsrfToken(res);

    res = await agent
      .post(
        `/elections/${latestElection.id}/questions/${latestQuestion.id}/options/${latestOption.id}/modify`
      )
      .send({
        _csrf: csrfToken,
        option: "option 6",
      });
    expect(res.statusCode).toBe(302);
  });
  test("testing adding of voters", async () => {
    const agent = request.agent(server);
    await login(agent, "sai1@test.com", "12345678");

    let res = await agent.get("/create");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      electionName: "Test election",
      publicurl: "url8",
      _csrf: csrfToken,
    });
    const groupedResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedResponse = JSON.parse(groupedResponse.text);
    const electionCount = parsedResponse.elections_list.length;
    const latestElection = parsedResponse.elections_list[electionCount - 1];
    res = await agent.get(`/createvoter/${latestElection.id}`);
    csrfToken = extractCsrfToken(res);
    let response = await agent.post(`/createvoter/${latestElection.id}`).send({
      voterid: "1234",
      password: "123",
      electionID: latestElection.id,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("testing adding a voter", async () => {
    const agent = request.agent(server);
    await login(agent, "sai1@test.com", "12345678");

    let res = await agent.get("/create");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      electionName: "Test election",
      publicurl: "url9",
      _csrf: csrfToken,
    });
    const groupedResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedResponse = JSON.parse(groupedResponse.text);
    const electionCount = parsedResponse.elections_list.length;
    const latestElection = parsedResponse.elections_list[electionCount - 1];

    res = await agent.get(`/createvoter/${latestElection.id}`);
    csrfToken = extractCsrfToken(res);
    let response = await agent.post(`/createvoter/${latestElection.id}`).send({
      voterid: "234",
      password: "12345",
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("testing deleting a voter", async () => {
    const agent = request.agent(server);
    await login(agent, "sai1@test.com", "12345678");

    let res = await agent.get("/create");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      electionName: "Election",
      publicurl: "url10",
      _csrf: csrfToken,
    });
    const ElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedElectionsResponse = JSON.parse(ElectionsResponse.text);
    const electionCount = parsedElectionsResponse.elections_list.length;
    const latestElection =
      parsedElectionsResponse.elections_list[electionCount - 1];

    res = await agent.get(`/createvoter/${latestElection.id}`);
    csrfToken = extractCsrfToken(res);
    await agent.post(`/createvoter/${latestElection.id}`).send({
      voterid: "2345",
      password: "1234",
      _csrf: csrfToken,
    });

    const voterResponse = await agent
      .get(`/createvoter/${latestElection.id}`)
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(voterResponse.text);
    const voterCount = parsedGroupedResponse.voterslist.length;
    const latestvoter = parsedGroupedResponse.voterslist[voterCount - 1];

    res = await agent.get(
      `/elections/${latestElection.id}/voter/${latestvoter.id}/edit`
    );
    csrfToken = extractCsrfToken(res);
    const deleteresponse = await agent
      .delete(`/${latestvoter.id}/voterdelete`)
      .send({
        _csrf: csrfToken,
      });

    const parseddeleteResponse = JSON.parse(deleteresponse.text);
    expect(parseddeleteResponse.success).toBe(true);
  });

  test("testing launching and prevewing of election", async () => {
    const agent = request.agent(server);
    await login(agent, "sai1@test.com", "12345678");

    let res = await agent.get("/create");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      electionName: "Election1",
      publicurl: "url11",
      _csrf: csrfToken,
    });
    const ElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedElectionsResponse = JSON.parse(ElectionsResponse.text);
    const electionCount = parsedElectionsResponse.elections_list.length;
    const latestElection =
      parsedElectionsResponse.elections_list[electionCount - 1];

    res = await agent.get(`/election/${latestElection.id}/electionpreview`);
    csrfToken = extractCsrfToken(res);
    expect(res.statusCode).toBe(200);
  });

  // test("testing launching of an election", async () => {
  //   const agent = request.agent(server);
  //   await login(agent,"sai1@test.com","12");
  //   //create new election
  //   let res = await agent.get("/create");
  //   let csrfToken = extractCsrfToken(res);
  //   await agent.post("/elections").send({
  //     electionName: "Testelection",
  //     publicurl: "urp12",
  //     _csrf: csrfToken,
  //   });
  //   const groupedElectionsResponse = await agent
  //     .get("/elections")
  //     .set("Accept", "application/json");
  //     console.log(groupedElectionsResponse.text)
  //   const parsedGroupedResponse = JSON.parse(groupedElectionsResponse.text);
  //   const electionCount = parsedGroupedResponse.elections_list.length;
  //   const latestElection = parsedGroupedResponse.elections_list[electionCount - 1];

  //   //add a question
  //   res = await agent.get(`questionscreate/${latestElection.id}/`);
  //   csrfToken = extractCsrfToken(res);
  //   await agent.post(`/questionscreate/${latestElection.id}`).send({
  //     question: "Test question",
  //     description: "Test description",
  //     _csrf: csrfToken,
  //   });

  //   const groupedQuestionsResponse = await agent
  //     .get(`/questions/${latestElection.id}`)
  //     .set("Accept", "application/json");
  //   const parsedQuestionsGroupedResponse = JSON.parse(
  //     groupedQuestionsResponse.text
  //   );
  //   const questionCount = parsedQuestionsGroupedResponse.questions.length;
  //   const latestQuestion =
  //     parsedQuestionsGroupedResponse.questions[questionCount - 1];

  //   //adding option 1
  //   res = await agent.get(
  //     `/displayelections/correspodingquestions${latestElection.id}/${latestQuestion.id}`
  //   );
  //   csrfToken = extractCsrfToken(res);
  //   res = await agent
  //     .post(`/displayelections/correspodingquestions${latestElection.id}/${latestQuestion.id}`)
  //     .send({
  //       _csrf: csrfToken,
  //       option: "Test option",
  //     });

  //   //adding option 2
  //   res = await agent.get(
  //     `/displayelections/correspodingquestions${latestElection.id}/${latestQuestion.id}`
  //   );
  //   csrfToken = extractCsrfToken(res);
  //   res = await agent
  //     .post(`/displayelections/correspodingquestions${latestElection.id}/${latestQuestion.id}`)
  //     .send({
  //       _csrf: csrfToken,
  //       option: "Test option",
  //     });

  //   res = await agent.get(`/election/${latestElection.id}/electionpreview`);
  //   csrfToken = extractCsrfToken(res);

  //   expect(latestElection.running).toBe(false);
  //   res = await agent.get(`/election/${latestElection.id}/launch`).send({
  //     _csrf: csrfToken,
  //   });
  //   const launchedElectionRes = JSON.parse(res.text);
  //   expect(launchedElectionRes[1][0].launched).toBe(true);

  //   res = await agent.get(`/externalpage/${latestElection.publicurl}`);
  //   expect(res.statusCode).toBe(200);
  // });

  // test("testing of editing is not possible after launching", async () => {
  //   const agent = request.agent(server);
  //   await login(agent, "sai1@gmail.com", "12345678");

  //   let res = await agent.get("/create");
  //   let csrfToken = extractCsrfToken(res);
  //   await agent.post("/elections").send({
  //     electionName: "election",
  //     publicurl: "url13",
  //     _csrf: csrfToken,
  //   });
  //   const groupedResponse = await agent
  //     .get("/elections")
  //     .set("Accept", "application/json");
  //   const parsedGroupedResponse = JSON.parse(groupedResponse.text);
  //   const electionCount = parsedGroupedResponse.elections_list.length;
  //   const latestelection = parsedGroupedResponse.elections_list[electionCount - 1];

  //   res = await agent.get(`/questionscreate/${latestelection.id}`);
  //   csrfToken = extractCsrfToken(res);
  //   await agent.post(`/questionscreate/${latestelection.id}`).send({
  //     question: "CR",
  //     description: "above 18",
  //     _csrf: csrfToken,
  //   });

  //   const groupedQuestionsResponse = await agent
  //     .get(`/questions/${latestElection.id}`)
  //     .set("Accept", "application/json");
  //   const parsedQuestionsGroupedResponse = JSON.parse(
  //     groupedQuestionsResponse.text
  //   );
  //   const questionCount = parsedQuestionsGroupedResponse.questions1.length;
  //   const latestQuestion =
  //     parsedQuestionsGroupedResponse.questions1[questionCount - 1];

  //   res = await agent.get(
  //     `/displayelections/correspondingquestion/${latestElection.id}/${latestQuestion.id}`
  //   );
  //   csrfToken = extractCsrfToken(res);
  //   res = await agent
  //     .post(`/displayelections/correspondingquestion/${latestElection.id}/${latestQuestion.id}`)
  //     .send({
  //       _csrf: csrfToken,
  //       option: "option 12",
  //     });

  //   res = await agent.get(
  //     `/displayelections/correspondingquestion/${latestElection.id}/${latestQuestion.id}`
  //   );
  //   csrfToken = extractCsrfToken(res);
  //   res = await agent
  //     .post(`/displayelections/correspondingquestion/${latestElection.id}/${latestQuestion.id}`)
  //     .send({
  //       _csrf: csrfToken,
  //       option: "option12",
  //     });

  //   res = await agent.get(`/questions/${latestElection.id}`);
  //   expect(res.statusCode).toBe(200);

  //   res = await agent.get(`/elections/${latestElection.id}/electionpreview`);
  //   csrfToken = extractCsrfToken(res);
  //   res = await agent.put(`/elections/${latestElection.id}/launch`).send({
  //     _csrf: csrfToken,
  //   });
  //   const launchedElectionRes = JSON.parse(res.text);
  //   expect(launchedElectionRes[1][0].running).toBe(true);

  //   res = await agent.get(`/questions/${latestElection.id}`);
  //   expect(res.statusCode).toBe(302);
  // });
});
