/* eslint-disable no-undef */
describe("Online election test suite", () => {
  beforeEach(() => {
    cy.visit("/create");
  });

  it("testing signup new user", () => {
    // Perform signup actions using Cypress commands
    cy.get("/signup").click();
    // Fill in signup form fields
    cy.get("#firstName").type("mallik");
    cy.get("#lastName").type("sai");
    cy.get("#email").type("sai@test.com");
    cy.get("#password").type("12345678");
    // Submit the form
    cy.get("form").submit();
    // Check if redirection happened after signup
    cy.url().should("include", "/some-redirect-url");
  });

  it("testing user login", () => {
    // Perform login actions using Cypress commands
    // Similar to signup, fill in login form fields and submit
    cy.visit("/login");
    // Fill in login form fields
    cy.get("#email").type("sai@test.com");
    cy.get("#password").type("12345678");
    // Submit the form
    cy.get("form").submit();
    // Check if redirection happened after login
    cy.url().should("include", "/some-redirect-url");
  });

  // Continue converting other test cases in a similar manner
});
