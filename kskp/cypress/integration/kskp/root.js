describe('/', function() {
  before(() => {
    cy.clearCookies()

  })

  beforeEach(() => {
    
  })

  it('Login', function() {
    cy.login("dev@kskp.io", "devpass")
  })
})