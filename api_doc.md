# Project Namer API Documentation

## `GET /helloworld/:name/:pet`

Used to test if the server is running correctly and that you can connect to it. 

### Parameters

> All parameters are passed as URL arguments

1. `name`: The name of the person to greet
2. `pet`: The person's pet 

### Output

A string of the form `"Hello ${name}! I hear you have a pet ${pet}."`

### Usage

```js
fetch(apiHost() + "/helloworld/Wallace/Dog")
    .then(response => {
        if (!response.ok) {
            throw new Error("Something went wrong")
        }

        return response.text
    })
    .then(msg => {
        console.log(msg);
    })
    .catch(error => {
        throw new Error("Something went wrong: " + error);
    });
```

## `GET /subjects`

Returns a list of logo subjects that can be selected. These are overarching concepts that the 
logo should be themed around. For example, a theme of 'math' may result in a logo containing 
equations or symbols.

### Output 

A list of strings

### Usage 

```js
fetch(apiHost() + "/subjects")
    .then(response => {
        if (!response.ok) {
            throw new Error("Something went wrong");
        }

        return response.json();
    })
    .then(subjects => {
        for (let subject of subjects) {
            console.log(subject);
        }
    }) 
    .catch(error => {
        throw new Error("Something went wrong: " + error);
    });
```

## `GET /logoColorStyles`

Returns a list of logo color styles, which can be used to customise the appearance of the logo. 
For example, selecting '2-Color' will produce a logo with only two colors. 

### Output 

A list of strings

### Usage 

```js
fetch(apiHost() + "/logoColorStyles")
    .then(response => {
        if (!response.ok) {
            throw new Error("Something went wrong");
        }

        return response.json();
    })
    .then(styles => {
        for (let style of styles) {
            console.log(style);
        }
    }) 
    .catch(error => {
        throw new Error("Something went wrong: " + error);
    });
```

## `GET /themes`

Returns a list of color theme names (as strings) which can be used to alter the color palette of the logo. 
The names correspond to longer descriptions stored on the server, which describe the color scheme and design choices. 

### Output 

A list of strings

### Usage 

```js
fetch(apiHost() + "/themes")
    .then(response => {
        if (!response.ok) {
            throw new Error("Something went wrong");
        }

        return response.json();
    })
    .then(themes => {
        for (let theme of themes) {
            console.log(theme);
        }
    }) 
    .catch(error => {
        throw new Error("Something went wrong: " + error);
    });
```

## `POST /imageGen`

Given a prompt, generate an image and return the URL to that image.

***Note: The URLs are invalidated after a short time, so ensure the image is downloaded if it is required for a long period of time***

### Parameters 

1. A JSON object with one attribute (`.prompt`), which stores a string.

### Output 

A URL to the generated image 

### Usage 

```js 
fetch(apiHost() + "/imageGen", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: {
                prompt: "The coolest logo ever"
            }
        })
    .then(response => {
        if (!response.ok) {
            throw new Error("Something went wrong");
        }

        return response.text();
    })
    .then(url => {
        console.log(url);
    })
    .catch(error => {
        throw new Error("Somethign went wrong: " + error);
    });
```

### Errors

1. If the JSON object does not contain `prompt`, a `400` error will be sent.
2. If the image generation fails, for whatever reason, a `503` error will be sent.


## `POST /contentGen`

Given a JSON object containing a `description`, `logoSubject`, `logoColorStyle`, and a `logoTheme`, return a JSON object containing the `projectName`, `projectSummary`, `projectDescription`, `logoPrompt` and `projectTags`.

### Parameters 

1. `description`: The user's description of the project as a string 
2. `logoSubject`: The selected subject for the logo. This can technically be anything, but is ideally an option from `/subjects`
3. `logoColorStyles`: The selected colour style for the logo. Again, this can technically be anything but should be an option from `logoColorStyles`
4. `logoTheme`: The selected theme for the logo. If the string is contained in the list returned by `/themes`, the description will be taken from the value stored on the server. If not, the theme will be ignored in the request

### Output 

A JSON object: 

```json
{
    "projectName": "...",
    "projectSummary": "...",
    "projectDescription": "...",
    "logoPrompt": "...",
    "projectTags": ["...", "...", "..."],
}
```

### Usage 

```js 
fetch(apiHost() + "/contentGen", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: {
                description: "...",
                logoSubject: "...",
                logoColorStyle: "...",
                logoTheme: "...",
            }
        })
    .then(response => {
        if (!response.ok) {
            throw new Error("Something went wrong");
        }

        return response.json();
    })
    .then(obj => {
        console.log("Project Name: " + obj.projectName);
        console.log("Project Summary: " + obj.projectSummary);
        console.log("project description: " + obj.projectDescription);
        console.log("Logo Prompt" + obj.logoPrompt);
        console.log("Project Tags" + obj.projectTags);
    })
    .catch(error => {
        throw new Error("Somethign went wrong: " + error);
    });
```

### Errors

1. Missing description: `400`
2. Missing logoSubject: `400`
3. Missing logoColorStyle: `400`
4. Missing logoTheme: `400`
5. No response from OpenAI: `503`
6. Invalid AI-generated JSON: `783` -- ***In this case, it is safe to resend the data, as the generated JSON was simply invalid. Everything else worked correctly***


## `POST /saveResult`

Save the result of an AI-generated project setup to the 'database', and download the image (since the 
URLs expire after a short while). It returns the hash of the saved data and whether or not it was unique 
in the database (i.e. whether an identical project already exists)

### Parameters 

A JSON object containing the following fields:

1. `projectName`: The name of the project
2. `projectSummary`: The short summary of the project 
3. `projectDescription`: A longer description of the project 
4. `projectTags`: Keyword tags used to describe the project 
5. `logoUrl`: The URL to the project's logo 

### Usage 

```js 
fetch(apiHost() + "/saveResult", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: {
                projectName: "name",
                projectSummary: "summary",
                projectDescription: "description",
                projectTags: ["project", "tags"],
                logoUrl: "https://placebear.com/512/512"
            }
        })
    .then(response => {
        if (!response.ok) {
            throw new Error("Something went wrong");
        }

        return response.json();
    })
    .then(obj => {
        console.log("Hash: ", obj.hash);
        
        if (obj.unique) {
            console.log("Project was unique!");
        } else {
            console.log("Project was not unique :(");
        }
    })
    .catch(error => {
        throw new Error("Somethign went wrong: " + error);
    });
```

### Errors 

1. Missing projectName: `400`
2. Missing projectSummary: `400`
3. Missing projectDescription: `400`
4. Missing projectTags: `400`
5. Missing logoUrl: `400` 
6. Invalid JSON: `400`

## `GET /listHashes`

List all of the hashes stored in the database. These are unique identifiers to saved projects 

### Usage 

```js
fetch(apiHost() + "/listHashes")
    .then(response => {
        if (!response.ok) {
            throw new Error("Something went wrong");
        }

        return response.json();
    })
    .then(hashes => {
        for (let hash of hashes) {
            console.log(hash);
        }
    }) 
    .catch(error => {
        throw new Error("Something went wrong: " + error);
    });
```

## `GET /nameFromHash/:hash`

Given a project's hash, return the corresponding name

### Parameters 

1. `hash` passed in the URL: The project's hash (an integer)

### Usage 

```js
fetch(apiHost() + "/nameFromHash/31415926")
    .then(response => {
        if (!response.ok) {
            throw new Error("Something went wrong");
        }

        return response.text();
    })
    .then(name => {
        console.log("The project is called " + name);
    }) 
    .catch(error => {
        throw new Error("Something went wrong: " + error);
    });
```

## `POST /fromHash`

Given a hash, return the whole project. The URL will now point to a file stored on the server which 
can be accessed on the client.

### Parameters 

1. A JSON object with a `.hash` attribute storing an integer hash value

### Output 

A JSON object containing:

1. `projectName`: The name of the project
2. `projectSummary`: The short summary of the project 
3. `projectDescription`: A longer description of the project 
4. `projectTags`: Keyword tags used to describe the project 
5. `logoUrl`: The URL to the project's logo 

### Usage 

```js
fetch(apiHost() + "/fromHash", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: {
                hash: 31415926
            }
        })
    .then(response => {
        if (!response.ok) {
            throw new Error("Something went wrong");
        }

        return response.json();
    })
    .then(obj => {
        console.log("Project Name: ", obj.projectName);
        console.log("Project Name: ", obj.projectName); 
        console.log("Project Name: ", obj.projectName);
        console.log("Project Name: ", obj.projectName);
        console.log("Project Name: ", obj.projectName);
    }) 
    .catch(error => {
        throw new Error("Something went wrong: " + error);
    });
```

### Errors 

1. Missing hash: `400`
2. Hash not found: `404`

