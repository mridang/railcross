/**
 * @file End-to-end check that the running app answers on its health endpoint.
 */
describe('NestJS Application Health Check', () => {
  it('should successfully invoke the /health endpoint', () => {
    cy.request('http://localhost:3000/health').then((response) =>
      expect(response.status).to.eq(204),
    );
  });
});
