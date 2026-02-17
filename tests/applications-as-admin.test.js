const request = require("supertest");
const app = require("../app");

describe('Tests the application as admin', () => {
    let token, applicationId;

    beforeAll(async () => {
        // Define test user credentials
        const email = `test_${Date.now()}@example.com`;
        const password = "TestPassword123";

        // Register a new user
        const newUser = await request(app)
            .post("/auth/register")
            .send({ email, password });

        // Promote user to admin
        const { pool } = require('../db/database');
        await pool.query(
            ` UPDATE user_roles SET role_id = 2 WHERE user_id = $1 `,
            [newUser.body.user.id]
        );

        // Log in with the newly registered user
        const loginRes = await request(app)
            .post("/auth/login")
            .send({ email, password });
            token = loginRes.body.token;

        // Create a new job application
        const appCreate = await request(app)
            .post("/applications")
            .set("Authorization", `Bearer ${token}`)
            .send({
                company_name: 'Marine Technologies',
                role_title: 'DevOp Engineer'
            });
            applicationId = appCreate.body.id;

    });

    it('allows GET all aplications', async () => {
        const res = await request(app)
            .get('/applications/')
            .set("Authorization", `Bearer ${token}`)
        expect(res.statusCode).toBe(200);
    });
    
    it('allows valid status transition: applied -> interview', async () => {
        const res = await request(app)
            .patch(`/applications/status/${applicationId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ current_status: 'interview' });
        expect(res.statusCode).toBe(200);
    });

    it('rejects invalid transistions: interview -> applied', async () => {
        const res = await request(app)
            .patch(`/applications/status/${applicationId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ current_status: 'applied' });
        expect(res.statusCode).toBe(409);
    });
    
    it('rejects same-status update: interview -> interview', async () => {
        const res = await request(app)
            .patch(`/applications/status/${applicationId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ current_status: 'interview' });
        expect(res.statusCode).toBe(409);
    });

    it('moves interview -> offer -> accepted', async () => {
        await request(app)
            .patch(`/applications/status/${applicationId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ current_status: 'offer' });

        const res = await request(app)
            .patch(`/applications/status/${applicationId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ current_status: 'accepted' });
        expect(res.statusCode).toBe(200);
    });

    it('blocks transistion from terminal state', async () => {
        await request(app)
            .patch(`/applications/status/${applicationId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ current_status: 'offer' });

        const res = await request(app)
            .patch(`/applications/status/${applicationId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ current_status: 'rejected' });
        expect(res.statusCode).toBe(409);
    });

    // it('allows DELETE aplication by Id', async () => {
    //     const res = await request(app)
    //         .delete(`/applications/${applicationId}`)
    //         .set("Authorization", `Bearer ${token}`)
    //     expect(res.statusCode).toBe(204);
    // });
});