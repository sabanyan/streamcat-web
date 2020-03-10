describe('/projects', function () {

  before(() => {
    cy.login("dev@kskp.io", "devpass")
    cy.visit('http://localhost:3000/projects')
  })

  beforeEach(() => {
    
  })

  it('NewProject', function () {
    cy.newProject("CyPressProject")
  })

  it('DeleteProject', function () {
    cy.deleteProject("CyPressProject")

  })
})