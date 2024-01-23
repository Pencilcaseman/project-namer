// JSON object contains the current output (initally just
// placeholder values). These are used to save the output
// to the server
let currentOutput = {
    projectName: 'Project Name',
    projectSummary: 'Project Summary',
    projectDescription: 'Project Description',
    projectTags: ['tag1', 'tag2', 'tag3'],
    logoUrl: 'https://placebear.com/1024/1024'
};

// Returns a string containing the server address
function apiHost () {
    return 'http://localhost:8080/';
}

// Given a subject string, return another string with spaces
// replaced with underscores. This is used for IDs in HTML to
// ensure that they are unique.
function subjectToggleID (subject) {
    return subject.replace(/ /g, '_') + '_toggle';
}

// Query the server for a list of logo subjects and add them to the
// DOM as toggles. This is called once at the start of the page load.
function addSubjectToggles () {
    fetch(apiHost() + 'subjects').then((response) => {
        if (!response.ok) {
            // An error occurred
            console.log(response);
            throw new Error(`HTTP error: ${response.status}`);
        }

        return response.json();
    }).then((obj) => {
        const selectorToggles = document.getElementById('selector_toggles');

        for (const subject of obj) {
            // Ensure each subject has a unique ID
            const subjectId = subjectToggleID(subject);

            // Set a random default state -- every time you reload the page
            // the toggles will be set to a random state.
            const isChecked = Math.random() > 0.65 ? 'checked' : '';

            const html = `
                <div class="flex items-center" style="gap: 10px">
                    <div>
                        ${subject}
                    </div>
                    <input id="${subjectId}" type="checkbox" class="toggle toggle-primary" ${isChecked} />
                    
                </div>
            `;

            selectorToggles.innerHTML += html;
        }
    }).catch(
        (error) => {
            console.log("Error in 'addSubjectToggles': " + error);
            alert('Failed to connect to server. Please reload the page and try again.');
        }
    );
}

// Query the server for a list of logo colors and add them to the
// DOM as a radio button group. This function is also called once
// at the start of the page load.
function addLogoColors () {
    fetch(apiHost() + 'logoColorStyles').then((response) => {
        if (!response.ok) {
            console.log(response);
            throw new Error(`HTTP error: ${response.status}`);
        }

        return response.json();
    }).then((obj) => {
        const colorStyleToggles = document.getElementById('color_style_toggles');

        // Pick a random default color setting. This is applied whenever the page is loaded
        const defaultColor = Math.floor(Math.random() * obj.length);

        for (let i = 0; i < obj.length; i++) {
            const color = obj[i];

            // Set a random default color
            const isChecked = i === defaultColor ? 'checked' : '';

            const html = `
                <div class="flex items-center" style="gap: 10px">
                    <div>
                        ${color}
                    </div>
                    <input type="radio" name="colorStyleToggler" class="radio toggle-secondary" ${isChecked} />
                </div>
            `;

            colorStyleToggles.innerHTML += html;
        }
    }).catch(
        (error) => {
            console.log("Error in 'addLogoColors': " + error);
            alert('Failed to connect to server. Please reload the page and try again.');
        }
    );
}

// Get a list of logo themes from the server and add them to the DOM as a radio
// group. This function is also called once at the start of the page load.
function addLogoTheme () {
    fetch(apiHost() + 'themes').then((response) => {
        if (!response.ok) {
            console.log(response);
            throw new Error(`HTTP error: ${response.status}`);
        }

        return response.json();
    }).then((obj) => {
        const themeSelector = document.getElementById('theme_selector');

        // We default to the 'dark' theme to limit flashing on page load. If we
        // had a random theme, reloading the page could be unpleasant.
        const defaultTheme = 'dark';

        for (const theme of obj) {
            // Convert to title case
            const titleTheme = theme[0].toUpperCase() + theme.substring(1);

            // Set a random default theme
            const checked = theme === defaultTheme ? 'checked' : '';

            // const html = `
            //     <div class="form-control theme-selector-box">
            //         <label class="label cursor-pointer">
            //             <span class="label-text">${titleTheme}</span>
            //             <input type="radio" name="themeSelector" class="radio theme-controller" value="${theme}" ${checked}/>
            //         </label>
            //     </div>
            // `;

            const html = `
                <li>
                    <label class="label cursor-pointer">
                        <span class="label-text">${titleTheme}</span>
                        <input type="radio" name="themeSelector" class="radio theme-controller" value="${theme}"
                            ${checked} onclick='document.getElementById("theme_selector_dropdown_button").innerText = "Logo Color Scheme: ${titleTheme}";'/>
                    </label>
                </li>
            `;

            themeSelector.innerHTML += html;
        }
    }).catch(
        (error) => {
            console.log("Error in 'addLogoTheme': " + error);
            alert('Failed to connect to server. Please reload the page and try again.');
        }
    );
}

// Generate an image and add the 'save' button. This is done here since
// the image loading will always be performed after the main text generation,
// so we can savely load the necessary data.
function imageGen (prompt) {
    const contentImageDiv = document.getElementById('content_image_div');

    // Check it exists
    if (contentImageDiv === null) {
        console.log('content_image is null');
        return;
    }

    // Insert the loading spinner
    contentImageDiv.innerHTML = '<span class="loading loading-spinner text-error loading-lg" style="width: 200px"></span>';

    fetch(apiHost() + 'imageGen', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            prompt
        })
    }).then((response) => {
        if (!response.ok) {
            console.log(response);
            throw new Error(`HTTP error: ${response.status}`);
        }

        return response.text();
    }).then((obj) => {
        // Insert the image (overwriting the loading spinner)
        contentImageDiv.innerHTML = `
            <a class="grow hover:scale-105 hover:-translate-y-1 transition-transform duration-300"
               href="${obj}"
               download="projectLogo">
                <img id="content_image" class="object-fill box items-center image-container"
                     src="${obj}"
                     alt="An image">
            </a>
        `;

        // Insert the button to save the result. This is done here because
        // we can guarantee that everything else has loaded at this point.
        const buttonContent = document.getElementById('save_content_button');
        buttonContent.innerHTML = `
          <button id="save_content_button" class="btn btn-primary btn-wide">Save!</button>
        `;

        buttonContent.addEventListener('click', saveContent);

        // Update the global state so we can download the image on the server
        currentOutput.logoUrl = obj;
    })
        .catch(
            (error) => {
                // On error, show a message where the image should go
                contentImageDiv.innerHTML = `
                <div role="alert" class="alert alert-error">
                  <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>AI logo generation failed. Try generating again.</span>
                </div>
            `;

                console.error(error);
            }
        );
}

function contentGen (description, logoSubject, logoColorStyle, logoTheme) {
    // Generate the payload for the content generation
    const payload = {
        description,
        logoSubject,
        logoColorStyle,
        logoTheme
    };

    const contentDestination = document.getElementById('content_destination');

    // Show a mockup to show that the system is generating the content
    contentDestination.innerHTML = `
        <div class="flex flex-col gap-4 w-96">
            <div class="flex gap-4 items-center flex-start item-start">
                <div class="skeleton w-48 h-48 rounded-full shrink-0"></div>
                <div class="flex flex-col gap-4">
                    <div class="skeleton h-8 w-20"></div>
                    <div class="skeleton h-16 w-28"></div>
                </div>
            </div>
            <div class="skeleton h-64 w-full"></div>
        </div>
        `;

    // Remove the 'save' button while we're generating/regenerating content
    const buttonContent = document.getElementById('save_content_button');
    buttonContent.innerHTML = '';

    fetch(apiHost() + 'contentGen/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    }).then((response) => {
        if (!response.ok) {
            console.log(response);

            // 783 -> Regenerate content (invalid AI-generated content)
            // anything else -> Error
            if (response.status === 783) {
                console.log('Generated content provided invalid JSON. Regenerating');
                contentGen(description, logoSubject, logoColorStyle, logoTheme);
            } else {
                throw new Error(`HTTP error: ${response.status}`);
            }

            return;
        }

        // All good, so remove the mockup
        contentDestination.innerHTML = '';

        // Return text so we can verify it's valid JSON
        return response.json();
    }).then((obj) => {
        // A list of css colours for the tags
        const tagColors = [
            'badge-accent',
            'badge-info',
            'badge-warning',
            'badge-success',
            'badge-error'
        ];

        // Generate HTML for each badge
        const badges = [];
        for (let i = 0; i < obj.projectTags.length; i++) {
            badges.push(`<div class="badge ${tagColors[i % tagColors.length]} gap-2 w-full">${obj.projectTags[i]}</div>`);
        }

        // Put all the generated text in the correct places
        contentDestination.innerHTML = `
        <div class="flex flex-row justify-center flex-align-center flex-wrap-sm" style="gap: 10px">
            <div id="content_image_div"></div>
            <div class="flex flex-col justify-center flex-align-center bg-base-300 box" style="gap: 10px; padding: 5px; min-width: 18rem">
                <div class="flex flex-wrap flex-row flex-align-start items-start" style="gap: 10px">
                    ${badges.join('')}
                </div>

                <div class="flex flex-col flex-align-start items-start h-full" style="gap: 8px">
                    <h1 class="text-2xl">${obj.projectName}</h1>
                    <p class="text-base">${obj.projectSummary}</p>
                </div>
            </div>
        </div>

        <p class="text-justify bg-base-300 box" style="padding: 5px">
            ${obj.projectDescription}
        </p>
        `;

        // Store the output in the global state so we can save it when
        // the button is pressed
        currentOutput = {
            projectName: obj.projectName,
            projectSummary: obj.projectSummary,
            projectDescription: obj.projectDescription,
            projectTags: obj.projectTags,
            logoUrl: 'https://placebear.com/1024/1024' // Replaced once imageGen is done
        };

        // Everything is now guaranteed to be loaded and correct, so we can
        // run the image generation step
        imageGen(obj.logoPrompt);
    });
}

// Get the state of all of the input fields as a JSON object
function getContent () {
    const projectDescription = document.getElementById('project_description_input').value;

    const logoSubject = [];
    for (const subject of document.getElementById('selector_toggles').children) {
        console.log(subject.children);

        if (subject.children[1].checked) {
            logoSubject.push(subject.children[0].outerText);
        }
    }

    const logoColorStyle = document.querySelector('input[name="colorStyleToggler"]:checked').parentElement.children[0].outerText;
    const logoTheme = document.querySelector('input[name="themeSelector"]:checked').value;

    return {
        projectDescription,
        logoSubject,
        logoColorStyle,
        logoTheme
    };
}

function saveContent () {
    // Set the 'Save' button to a spinner
    const saveContentButton = document.getElementById('save_content_button');
    saveContentButton.innerHTML = '<span class="loading loading-spinner text-success loading-lg"></span>';

    fetch(apiHost() + 'saveResult', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(currentOutput)
    }).then((response) => {
        if (!response.ok) {
            // Remove the spinner
            saveContentButton.innerHTML = 'Save!';
            console.log(response);
            throw new Error(`HTTP error: ${response.status}`);
        }

        return response.json();
    }).then((obj) => {
        // Add the newly created project to the list of existing projects so it
        // can be retrieved again in the current session. Reloading the page
        // refreshes the list, which will pull the project from the server so
        // there is no need to do anything more here.

        if (obj.unique) {
            // Change to a 'saved' icon
            saveContentButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            `;

            // After a delay, fade out the icon, delete it, then toggle the fade again
            setTimeout(() => {
                saveContentButton.classList.toggle('fade');
                setTimeout(() => {
                    saveContentButton.innerHTML = '';
                    saveContentButton.classList.toggle('fade');
                }, 1000);
            }, 1000);

            addExistingProject(currentOutput.projectName, obj.hash);
        } else {
            console.log('Project already exists');
        }
    }).catch(
        (error) => {
            console.log("Error in 'saveContent': " + error);
            alert('Failed to connect to server. Please reload the page and try again.');
        }
    );
}

// Given the name of the project and its hash (to look it up on the server),
// append a new item to the dropdown of previous projects
function addExistingProject (name, hash) {
    const existingProjectDropdown = document.getElementById('existing_project_dropdown');

    // Construct HTML elements instead of altering innerHTML. This prevents
    // the browser from re-rendering the list and removing all event listeners
    const listItem = document.createElement('li');
    const button = document.createElement('button');
    button.id = hash;
    button.textContent = name;

    listItem.appendChild(button);
    existingProjectDropdown.appendChild(listItem);

    // On click, load the project with the specified hash (names may not be unique)
    button.addEventListener('click', () => {
        loadProject(hash);
    });
}

// Given a project's hash, load it from the server and display it in the result
// area. The 'save' button is not shown here, since it is assumed that the project
// is already saved on the server.
function loadProject (hash) {
    fetch(apiHost() + 'fromHash', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            hash
        })
    }).then((response) => {
        if (!response.ok) {
            console.log(response);
            throw new Error(`HTTP error: ${response.status}`);
        }

        return response.json();
    }).then((obj) => {
        // Very similar to the code in `contentGen`, with a few small alterations given
        // we have slightly differnet information here

        const tagColors = [
            'badge-accent',
            'badge-info',
            'badge-warning',
            'badge-success',
            'badge-error'
        ];

        const badges = [];
        for (let i = 0; i < obj.projectTags.length; i++) {
            badges.push(`<div class="badge ${tagColors[i % tagColors.length]} gap-2 w-full">${obj.projectTags[i]}</div>`);
        }

        const contentDestination = document.getElementById('content_destination');
        contentDestination.innerHTML = `
      <div class="flex flex-row justify-center flex-align-center flex-wrap-sm" style="gap: 10px">
          <a class="grow hover:scale-105 hover:-translate-y-1 transition-transform duration-300"
               href="./images/${obj.hash}.png"
               download="projectLogo">
                <img id="content_image" class="object-fill box items-center image-container"
                     src="./images/${obj.hash}.png"
                     download="projectLogo"
                     alt="An image">
          </a>

          <div class="flex flex-col justify-center flex-align-center bg-base-300 box" style="gap: 10px; padding: 5px; min-width: 18rem">
              <div class="flex flex-wrap flex-row flex-align-start items-start" style="gap: 10px">
                  ${badges.join('')}
              </div>

              <div class="flex flex-col flex-align-start items-start h-full" style="gap: 8px">
                  <h1 class="text-2xl">${obj.projectName}</h1>
                  <p class="text-base">${obj.projectSummary}</p>
              </div>
          </div>
      </div>

      <p class="text-justify bg-base-300 box" style="padding: 5px">
          ${obj.projectDescription}
      </p>
        `;

        // Get rid of the 'save' button
        const buttonContent = document.getElementById('save_content_button');
        buttonContent.innerHTML = '';
    }).catch(
        (error) => {
            console.log("Error in 'loadProject': " + error);
            alert('Failed to connect to server. Please reload the page and try again.');
        }
    );
}

// Load all existing projects that are stored on the server and append them
// to the dropdown, allowing them to be loaded again
function addExistingProjects () {
    fetch(apiHost() + 'listHashes/').then((response) => {
        if (!response.ok) {
            console.log(response);
            throw new Error(`HTTP error: ${response.status}`);
        }

        return response.json();
    }).then((obj) => {
        // Get the name from the hash (this is all we need at this stage. If we want to
        // load the whole project, we can use a different function)
        for (const hash of obj) {
            fetch(apiHost() + 'nameFromHash/' + hash).then((response) => {
                if (!response.ok) {
                    console.log(response);
                    throw new Error(`HTTP error: ${response.status}`);
                }

                return response.text();
            }).then((name) => {
                // Add the project to the dropdown
                addExistingProject(name, hash);
            }).catch(
                (error) => {
                    console.log("Error in 'addExistingProjects': " + error);
                    alert('Failed to connect to server. Please reload the page and try again.');
                });
        }
    }).catch(
        (error) => {
            console.log("Error in 'listHashes': " + error);
            alert('Failed to connect to server. Please reload the page and try again.');
        }
    );
}

const generateContentButton = document.getElementById('generate_content_button');

generateContentButton.addEventListener('click', () => {
    const { projectDescription, logoSubject, logoColorStyle, logoTheme } = getContent();
    contentGen(projectDescription, logoSubject, logoColorStyle, logoTheme);
});

// Load some content when the page initially loads
document.addEventListener('DOMContentLoaded', addSubjectToggles);
document.addEventListener('DOMContentLoaded', addLogoColors);
document.addEventListener('DOMContentLoaded', addLogoTheme);
document.addEventListener('DOMContentLoaded', addExistingProjects);
