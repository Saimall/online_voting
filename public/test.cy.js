/* eslint-disable no-undef */
describe("Online election test suite", () => {
  beforeEach(() => {
    cy.visit("/create");
  });

  it("testing signup new user", () => {
    cy.get("/signup").click();

    cy.get("#firstName").type("mallik");
    cy.get("#lastName").type("sai");
    cy.get("#email").type("sai@test.com");
    cy.get("#password").type("12345678");
    // Submit the form
    cy.get("form").submit();
    cy.url().should("include", "/some-redirect-url");
  });

  it("testing user login", () => {
    cy.visit("/login");

    cy.get("#email").type("sai@test.com");
    cy.get("#password").type("12345678");

    cy.get("form").submit();

    cy.url().should("include", "/some-redirect-url");
  });
});
