// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })


// root
Cypress.Commands.add('login', (email, pw) => {
  cy.visit('http://localhost:3000')
  cy.get('[data-cy=email]').type(email)
  cy.get('[data-cy=password]').type(pw)
  cy.get('[data-cy=login]', { timeout: 10000 }).click()
  cy.get('[data-cy=loginUser]')
})

// project
Cypress.Commands.add('newProject', (projectName) => {
  cy.get('[data-cy=newProject]').click()
  cy.get('[data-cy=newProjectName] input').type(projectName)
  // modalの削除するボタンを押す
  cy.get('div[data-cy=add_project]>button').eq(1).click()
})

Cypress.Commands.add('selectProject', (projectName) => {
  const target = '[data-cy=listRow_' + projectName + ']'
  cy.get(target).eq(0).children('div').click()
})

Cypress.Commands.add('deleteProject', (projectName) => {
  cy.selectProject(projectName)
  cy.get('div[data-cy=deleteProject]>button').click()
  // modalの削除するボタンを押す
  cy.get('div[data-cy=confirm]>button').eq(1).click()
})