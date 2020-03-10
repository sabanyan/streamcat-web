describe('/projects', function () {

  before(() => {
    
  })

  beforeEach(() => {
    cy.login("dev@kskp.io", "devpass")
    cy.visit('http://localhost:3000/projects')
  })

  it('NewProject', function () {
    cy.newProject("CyPressProject")
  })

  it('DeleteProject', function () {
    cy.deleteProject("CyPressProject")
  })
})