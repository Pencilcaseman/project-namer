'use strict';

const request = require('supertest');
const app = require('./app.js');
const utils = require('./utils.js');
const fs = require('fs');

describe('Test the testing framework', () => {
    test('Should test that true === true', () => {
        expect(true).toBe(true);
    });
});

describe('Test the utility functions', () => {
    test('Test hash string', () => {
        expect(utils.hashString('test')).toBe(utils.hashString('test'));
    });

    test('Test hash string with different strings', () => {
        expect(utils.hashString('test')).not.toBe(utils.hashString('test2'));
    });

    test('Test hash string with different seeds', () => {
        expect(utils.hashString('test', 1)).not.toBe(utils.hashString('test', 2));
    });

    test('Test downloadFile', () => {
        utils.downloadFile('https://placebear.com/512/512', './data/images/test.png');

        // Check the file exists for a maximum of 60 seconds, then fail

        let i = 0;
        while (!fs.existsSync('testData/test.png') && i < 600) {
            i++;
            setTimeout(() => {}, 100);
        }

        return expect(fs.existsSync('./data/images/test.png')).toBeTruthy();
    });
});

describe('Test the API endpoints', () => {
    test('Check the server is running and responds', () => {
        return request(app).get('/helloworld/Harry/owl').then(response => {
            expect(response.statusCode).toBe(200);
        });
    });

    test('Test /hellworld with invalid inputs', () => {
        return request(app).get('/helloworld/Harry').then(response => {
            expect(response.statusCode).toBe(404);
        });
    });

    test('Test /hellworld with invalid inputs', () => {
        return request(app).get('/helloworld').then(response => {
            expect(response.statusCode).toBe(404);
        });
    });

    test('Get list of subjects', () => {
        return request(app).get('/subjects').then(response => {
            expect(response.statusCode).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
        });
    });

    test('Ensure list of subjects contains the correct values', () => {
        return request(app).get('/subjects').then(response => {
            for (const subject of utils.subjects) {
                expect(response.body).toContain(subject);
                expect(response.body[subject]).toBe(utils.subjects[subject]);
            }
        });
    });

    test('Get list of color styles', () => {
        return request(app).get('/logoColorStyles').then(response => {
            expect(response.statusCode).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
        });
    });

    test('Ensure list of color styles contains the correct values', () => {
        return request(app).get('/logoColorStyles').then(response => {
            for (const style of utils.logoColorStyles) {
                expect(response.body).toContain(style);
            }
        });
    });

    test('Get list of themes', () => {
        return request(app).get('/themes').then(response => {
            expect(response.statusCode).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
        });
    });

    test('Ensure list of themes contains the correct values', () => {
        return request(app).get('/themes').then(response => {
            for (const theme in utils.themes) {
                expect(response.body).toContain(theme);
            }
        });
    });

    test('Test AI image generation with missing .prompt', () => {
        const prompt = {
            not_a_prompt: 'A sample prompt to generate an image'
        };

        return request(app)
            .post('/imageGen')
            .send(prompt)
            .expect(400);
    });

    test('Test AI image generation with invalid type', () => {
        const prompt = 'A sample prompt to generate an image';

        return request(app)
            .post('/imageGen')
            .send(prompt)
            .expect(400);
    });

    test('Test AI image generation with valid content', () => {
        const prompt = {
            prompt: 'A sample prompt to generate an image'
        };

        return request(app)
            .post('/imageGen')
            .send(prompt)
            .expect(200)
            .expect('Content-Type', /text/)
            .then(response => {
                expect(response.statusCode).toBe(200);
                expect(response.body).toBeInstanceOf(Object);
            });
    }, 60000); // 60 second timeout for image generation

    test('Test AI content generation with missing description', () => {
        const payload = {
            // description: 'Sample description',
            logoSubject: 'Sample subject',
            logoColorStyle: 'Sample color style',
            logoTheme: 'Sample theme description'
        };

        return request(app)
            .post('/contentGen')
            .send(payload)
            .expect(400);
    });

    test('Test AI content generation with missing logoSubject', () => {
        const payload = {
            description: 'Sample description',
            // logoSubject: 'Sample subject',
            logoColorStyle: 'Sample color style',
            logoTheme: 'Sample theme description'
        };

        return request(app)
            .post('/contentGen')
            .send(payload)
            .expect(400);
    });

    test('Test AI content generation with missing logoGolorStyle', () => {
        const payload = {
            description: 'Sample description',
            logoSubject: 'Sample subject',
            // logoColorStyle: 'Sample color style',
            logoTheme: 'Sample theme description'
        };

        return request(app)
            .post('/contentGen')
            .send(payload)
            .expect(400);
    });

    test('Test AI content generation with missing logoTheme', () => {
        const payload = {
            description: 'Sample description',
            logoSubject: 'Sample subject',
            logoColorStyle: 'Sample color style'
            // logoTheme: 'Sample theme description'
        };

        return request(app)
            .post('/contentGen')
            .send(payload)
            .expect(400);
    });

    test('Test AI content generation', () => {
        const payload = {
            description: 'Sample description',
            logoSubject: 'Sample subject',
            logoColorStyle: 'Sample color style',
            logoTheme: 'Sample theme description'
        };

        return request(app)
            .post('/contentGen')
            .send(payload)
            .expect('Content-Type', /json/)
            .expect(200)
            .then(response => {
                expect(response.body).toBeInstanceOf(Object);

                // Directly check the properties of response.body
                expect(response.body).toHaveProperty('projectName');
                expect(response.body).toHaveProperty('projectSummary');
                expect(response.body).toHaveProperty('projectDescription');
                expect(response.body).toHaveProperty('logoPrompt');
                expect(response.body).toHaveProperty('projectTags');
            });
    }, 60000); // 60 second timeout for content generation

    test('Test save result with missing projectName', () => {
        const payload = {
            // projectName: "Sample Project Name",
            projectSummary: 'Sample Project Summary',
            projectDescription: 'Sample Project Description',
            projectTags: ['sample', 'project', 'tags'],
            logoUrl: 'https://placebear.com/256/256'
        };

        return request(app)
            .post('/saveResult')
            .send(payload)
            .expect(400);
    });

    test('Test save result with missing projectSummary', () => {
        const payload = {
            projectName: 'Sample Project Name',
            // projectSummary: 'Sample Project Summary',
            projectDescription: 'Sample Project Description',
            projectTags: ['sample', 'project', 'tags'],
            logoUrl: 'https://placebear.com/256/256'
        };

        return request(app)
            .post('/saveResult')
            .send(payload)
            .expect(400);
    });

    test('Test save result with missing projectDescription', () => {
        const payload = {
            projectName: 'Sample Project Name',
            projectSummary: 'Sample Project Summary',
            // projectDescription: 'Sample Project Description',
            projectTags: ['sample', 'project', 'tags'],
            logoUrl: 'https://placebear.com/256/256'
        };

        return request(app)
            .post('/saveResult')
            .send(payload)
            .expect(400);
    });

    test('Test save result with missing projectTags', () => {
        const payload = {
            projectName: 'Sample Project Name',
            projectSummary: 'Sample Project Summary',
            projectDescription: 'Sample Project Description',
            // projectTags: ['sample', 'project', 'tags'],
            logoUrl: 'https://placebear.com/256/256'
        };

        return request(app)
            .post('/saveResult')
            .send(payload)
            .expect(400);
    });

    test('Test save result with missing logoUrl', () => {
        const payload = {
            projectName: 'Sample Project Name',
            projectSummary: 'Sample Project Summary',
            projectDescription: 'Sample Project Description',
            projectTags: ['sample', 'project', 'tags']
            // logoUrl: 'https://placebear.com/256/256'
        };

        return request(app)
            .post('/saveResult')
            .send(payload)
            .expect(400);
    });

    test('Test save result with full payload', () => {
        const payload = {
            projectName: 'Sample Project Name',
            projectSummary: 'Sample Project Summary',
            projectDescription: 'Sample Project Description',
            projectTags: ['sample', 'project', 'tags'],
            logoUrl: 'https://placebear.com/256/256'
        };

        return request(app)
            .post('/saveResult')
            .send(payload)
            .expect('Content-Type', /json/)
            .expect(200)
            .then(response => {
                expect(response.body).toHaveProperty('hash');
                expect(response.body).toHaveProperty('unique');
            });
    });

    test('Test saveResult with non-unique value', () => {
        const payload = {
            projectName: 'Non-Unique Sample Project Name',
            projectSummary: 'Non-Unique Sample Project Summary',
            projectDescription: 'Non-Unique Sample Project Description',
            projectTags: ['non-unique', 'sample', 'project', 'tags'],
            logoUrl: 'https://placebear.com/256/256'
        };

        request(app)
            .post('/saveResult')
            .send(payload)
            .expect('Content-Type', /json/)
            .expect(200)
            .then(response => {
                expect(response.body).toHaveProperty('hash');
                expect(response.body).toHaveProperty('unique');

                request(app)
                    .post('/saveResult')
                    .send(payload)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .then(secondResponse => {
                        expect(secondResponse.body).toHaveProperty('hash');
                        expect(secondResponse.body).toHaveProperty('unique');

                        expect(secondResponse.body.unique).toBeFalsy();
                    });
            });
    });

    test('Test saveResult with unique payload', () => {
        const payload = {
            projectName: 'Unique Sample Project Name',
            projectSummary: 'Unique Sample Project Summary',
            projectDescription: 'Unique Sample Project Description',
            projectTags: ['unique', 'sample', 'project', 'tags'],
            logoUrl: 'https://placebear.com/256/256'
        };

        // Hashes are based on the projectDescription, so adding a unique
        // value here ensures the tests (should) always pass
        payload.projectDescription += new Date().toLocaleTimeString();

        request(app)
            .post('/saveResult')
            .send(payload)
            .expect('Content-Type', /json/)
            .expect(200)
            .then(response => {
                expect(response.body).toHaveProperty('hash');
                expect(response.body).toHaveProperty('unique');

                expect(response.body.unique).toBeTruthy();
            });
    });

    test('Test listHashes', () => {
        request(app)
            .get('/listHashes')
            .expect('Content-Type', /json/)
            .expect(200)
            .then(response => {
                expect(response.body).toBeInstanceOf(Array);
            });
    });

    test('Test listHashes with a new hash', () => {
        const payload = {
            projectName: 'Unique Sample Project Name',
            projectSummary: 'Unique Sample Project Summary',
            projectDescription: 'Unique Sample Project Description',
            projectTags: ['unique', 'sample', 'project', 'tags'],
            logoUrl: 'https://placebear.com/256/256'
        };

        // Hashes are based on the projectDescription, so adding a unique
        // value here ensures the tests (should) always pass
        // *** Use a different locale string format here, as otherwise the
        // other test will conflict with this and it will no longer be unique
        payload.projectDescription += new Date().toLocaleString();

        request(app)
            .post('/saveResult')
            .send(payload)
            .expect(200)
            .expect('Content-Type', /json/)
            .then(response => {
                expect(response.body).toHaveProperty('hash');
                expect(response.body).toHaveProperty('unique');
                expect(response.body.unique).toBeTruthy();

                request(app)
                    .get('/listHashes')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .then(hashResponse => {
                        expect(hashResponse.body).toBeInstanceOf(Array);
                        expect(hashResponse.body).toContain(response.body.hash.toString());
                    });
            });
    });

    test('Test nameFromHash with non-existing hash', () => {
        return request(app)
            .get('/listHashes')
            .expect('Content-Type', /json/)
            .expect(200)
            .then(response => {
                expect(response.body).toBeInstanceOf(Array);

                // Generate a hash which is guaranteed not to exist
                let newHash = 0;
                for (const hash in response.body) {
                    newHash ^= hash;
                }

                return request(app)
                    .get(`/nameFromHash/${newHash}`)
                    .expect(404);
            });
    });

    test('Test nameFromHash with existing hash', () => {
        const payload = {
            projectName: 'Unique Sample Project Name for nameFromHash',
            projectSummary: 'Unique Sample Project Summary',
            projectDescription: 'Unique Sample Project Description',
            projectTags: ['unique', 'sample', 'project', 'tags'],
            logoUrl: 'https://placebear.com/256/256'
        };

        // Hashes are based on the projectDescription, so adding a unique
        // value here ensures the tests (should) always pass
        // *** Use a different locale string format here, as otherwise the
        // other test will conflict with this and it will no longer be unique
        payload.projectDescription += new Date().toLocaleString() + ' even more uniquer :)';

        return request(app)
            .post('/saveResult')
            .send(payload)
            .expect(200)
            .expect('Content-Type', /json/)
            .then(response => {
                expect(response.body).toHaveProperty('hash');
                expect(response.body).toHaveProperty('unique');
                expect(response.body.unique).toBeTruthy();

                return request(app)
                    .get(`/nameFromHash/${response.body.hash}`)
                    .expect('Content-Type', /text\/html/)
                    .expect(200)
                    .then(name => {
                        expect(typeof name.text).toEqual('string');
                        expect(name.text).toBe('Unique Sample Project Name for nameFromHash');
                    });
            });
    });

    test('Test fromHash with non-existing object', () => {
        return request(app)
            .get('/listHashes')
            .expect('Content-Type', /json/)
            .expect(200)
            .then(response => {
                expect(response.body).toBeInstanceOf(Array);

                // Generate a hash which is guaranteed not to exist
                let newHash = 0;
                for (const hash in response.body) {
                    newHash ^= hash;
                }

                return request(app)
                    .post('/fromHash')
                    .send({
                        hash: newHash
                    })
                    .expect(404);
            });
    });

    test('Test fromHash with missing hash', () => {
        return request(app)
            .post('/fromHash')
            .send({
                wrong_hash_name: 123
            })
            .expect(400);
    });

    test('Test fromHash with existing object', () => {
        const payload = {
            projectName: 'Unique Sample Project Name for nameFromHash',
            projectSummary: 'Unique Sample Project Summary',
            projectDescription: 'Unique Sample Project Description',
            projectTags: ['unique', 'sample', 'project', 'tags'],
            logoUrl: 'https://placebear.com/256/256'
        };

        // Hashes are based on the projectDescription, so adding a unique
        // value here ensures the tests (should) always pass
        // *** Use a different locale string format here, as otherwise the
        // other test will conflict with this and it will no longer be unique
        payload.projectDescription += new Date().toLocaleString() + ' EVEN MORE uniquer :)';

        return request(app)
            .post('/saveResult')
            .send(payload)
            .expect(200)
            .expect('Content-Type', /json/)
            .then(response => {
                expect(response.body).toHaveProperty('hash');
                expect(response.body).toHaveProperty('unique');
                expect(response.body.unique).toBeTruthy();

                console.log(response.body.hash);

                return request(app)
                    .post('/fromHash')
                    .send({
                        hash: response.body.hash.toString()
                    })
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .then(newResponse => {
                        for (const item in payload) {
                            expect(newResponse.body).toHaveProperty(item);
                            expect(newResponse.body[item]).toStrictEqual(payload[item]);
                        }
                    });
            });
    });
});
