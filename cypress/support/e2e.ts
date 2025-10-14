/// <reference types="cypress" />

import './commands';

beforeEach(() => {
  cy.clearLocalStorage();
  cy.clearCookies();

  cy.intercept('POST', '**/api/auth/login').as('loginRequest');
  cy.intercept('POST', '**/api/auth/register').as('registerRequest');
});

Cypress.on('uncaught:exception', (err: Error) => {
  if (err.message.includes('ResizeObserver')) {
    return false;
  }
  return true;
});
