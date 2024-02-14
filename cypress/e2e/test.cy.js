/* eslint-disable no-undef */
describe("Online election test suite", () => {
  const baseUrl = "http://localhost:7000";
  beforeEach(() => {
    cy.visit(`${baseUrl}`);
  });

  it("testing signup new user", () => {
    // Perform signup actions using Cypress commands
    cy.visit(`${baseUrl}/signup`);
    // Fill in signup form fields
    cy.get("#firstName").type("mallik");
    cy.get("#lastName").type("sai");
    cy.get("#email").type("1@test.com");
    cy.get("#password").type("12345678");
    // Submit the form
    cy.get("form").submit();
  });

  it("testing user login", () => {
    cy.visit(`${baseUrl}/login`);
    // Fill in login form fields
    cy.get("#email").type("sai@test.com");
    cy.get("#password").type("12345678");
    // Submit the form
    cy.get("form").submit();
  });

  it("should sign the user out", () => {
    // Assuming there's a button/link with id "signout"
    cy.visit(`${baseUrl}/elections`);
    cy.visit(`${baseUrl}/signout`);
  });
});
