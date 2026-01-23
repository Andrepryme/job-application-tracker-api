const request = require("supertest");
const app = require("../app");

describe('Tests the application as user', () => {
    let token, applicationId;

    beforeAll(async () => {
        // Define test user credentials
        const email = `test_${Date.now()}@example.com`;
        const password = "TestPassword123";

        // Register a new user
        await request(app)
            .post("/auth/register")
            .send({ email, password });

        // Log in with the newly registered user
        const loginRes = await request(app)
            .post("/auth/login")
            .send({ email, password });
            token = loginRes.body.token;
    });

    it('allows CREATE an application', async () => {
        const appCreate = await request(app)
            .post("/applications")
            .set("Authorization", `Bearer ${token}`)
            .send({
                company_name: 'Marine Technologies',
                role_title: 'DevOp Engineer'
            });
            applicationId = appCreate.body.id;
        expect(appCreate.statusCode).toBe(201);
    });

    it('allows GET an application by ID', async () => {
        const appGet = await request(app)
            .get(`/applications/${applicationId}`)
            .set("Authorization", `Bearer ${token}`)
        expect(appGet.statusCode).toBe(200);
    }); 

    it('blocks GET all aplications', async () => {
        const appGetAll = await request(app)
            .get('/applications')
            .set("Authorization", `Bearer ${token}`)
        expect(appGetAll.statusCode).toBe(403);
    }); 

    it('blocks UPDATE to application', async () => {
        const res = await request(app)
            .patch(`/applications/${applicationId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ current_status: 'interview' });

        expect(res.statusCode).toBe(403);
    });

    it('blocks DELETE an application', async () => {
        const res = await request(app)
            .delete(`/applications/${applicationId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ current_status: 'interview' });

        expect(res.statusCode).toBe(403);
    });
});