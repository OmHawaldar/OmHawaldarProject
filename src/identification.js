const createIdentificationProfileEndpoint = `${baseApi}/speaker/identification/v2.0/text-independent/profiles`;
const enrollIdentificationProfileEndpoint = (profileId) => `${baseApi}/speaker/identification/v2.0/text-independent/profiles/${profileId}/enrollments?ignoreMinLength=true`;
const enrollIdentificationProfileStatusEndpoint = (profileId) => `${baseApi}/speaker/identification/v2.0/text-independent/profiles/${profileId}`;
const identifyProfileEndpoint = (Ids) => `${baseApi}/speaker/identification/v2.0/text-independent/profiles/identifySingleSpeaker?profileIds=${Ids}&ignoreMinLength=true`;

// Function to log messages to the HTML div
// Function to log messages to the HTML div, clearing the previous message
function logToDiv(message) {
    const logDiv = document.getElementById('logDiv');

    // Find and clear only the messages (paragraphs) inside the logDiv, keeping the audio player intact
    const messageElements = logDiv.querySelectorAll('p');
    messageElements.forEach(el => el.remove());

    // Create a new paragraph element for the message
    const messageElement = document.createElement('p');
    messageElement.textContent = message;

    // Append the new message to the logDiv
    logDiv.appendChild(messageElement);
}



// 1. Start the browser listening, listen for 15 seconds, pass the audio stream to "createProfile"
function enrollNewProfile(event) {
    event.preventDefault(); // Prevent the form from submitting the default way
    const nameInput = document.getElementById('name');
    const name = nameInput.value;

    navigator.getUserMedia({audio: true}, function(stream) {
        logToDiv('Recording,talk for a few seconds...');
        onMediaSuccess(stream, (blob) => createProfile(blob, name), 15);
    }, onMediaError);
}

// Create profile and then enroll the audio
function createProfile(blob, name) {
    addAudioPlayer(blob);

    var request = new XMLHttpRequest();
    request.open("POST", createIdentificationProfileEndpoint, true);
    request.setRequestHeader('Content-Type', 'application/json');
    request.setRequestHeader('Ocp-Apim-Subscription-Key', key);

    request.onload = function () {
        logToDiv('Creating profile...');

        var json = JSON.parse(request.responseText);
        var profileId = json.profileId;

      //  logToDiv('Profile ID: ' + profileId);

        // Now we can enroll this profile using the profileId
        enrollProfileAudio(blob, profileId, name);
    };

    request.send(JSON.stringify({ 'locale': 'en-us' }));
}

// Enroll the recorded audio with the new profile Id and poll the status
function enrollProfileAudio(blob, profileId, name) {
    var request = new XMLHttpRequest();
    request.open("POST", enrollIdentificationProfileEndpoint(profileId), true);
    request.setRequestHeader('Ocp-Apim-Subscription-Key', key);
    request.onload = function () {
        logToDiv('Enrolling...');

        if (request.status == 200 || request.status == 201) {
            var json = JSON.parse(request.responseText);
            const location = enrollIdentificationProfileStatusEndpoint(profileId);
            pollForEnrollment(location, profileId, name);
        } else {
            logToDiv(`Failed to submit for enrollment: got a ${request.status} response code.`);
            var json = JSON.parse(request.responseText);
            logToDiv(`${json.error.code}: ${json.error.message}`);
        }
    };
    request.send(blob);
}

// Ping the status endpoint to see if the enrollment for identification has completed
function pollForEnrollment(location, profileId, name) {
    var enrolledInterval;

    // Hit the endpoint every few seconds 
    enrolledInterval = setInterval(function () {
        var request = new XMLHttpRequest();
        request.open("GET", location, true);
        request.setRequestHeader('Ocp-Apim-Subscription-Key', key);
        request.onload = function () {
            logToDiv('Getting status...');
            var json = JSON.parse(request.responseText);

            if (json.enrollmentStatus == 'Enrolled') {
                // Stop polling
                clearInterval(enrolledInterval);
                enrolledInterval = null; // Make sure the interval is cleared
                logToDiv('Enrollment complete!');

                // Ensure the profile is only added and logged once
                if (!profileIds.some(p => p.profileId === profileId)) {
                    profileIds.push(new Profile(name, profileId));
                    logToDiv('Profile created with name: ' + name);
                }
            } else if(json.enrollmentStatus === 'Enrolling'){
                // Keep polling
                logToDiv('Not done yet...');
            }

            else {
                // Stop polling and log error if the status is anything other than 'Enrolled' or 'Enrolling'
                clearInterval(enrolledInterval);
                logToDiv(`Unexpected status: ${json.enrollmentStatus}. Stopping the polling.`);
            }
        };

        request.send();
    }, 1000);
}


// 2. Start the browser listening, listen for 10 seconds, pass the audio stream to "identifyProfile"
function startListeningForIdentification() {
    if (profileIds.length > 0) {
        logToDiv('Recording for Identification just start talking for a few seconds...');
        navigator.getUserMedia({audio: true}, function(stream) {
            onMediaSuccess(stream, identifyProfile, 15)
        }, onMediaError);
    } else {
        logToDiv('No Profiles enrolled yet! Create Profiles');
    }
}

// 3. Take the audio and send it to the identification endpoint
function identifyProfile(blob) {
    addAudioPlayer(blob);

    // Comma-delimited list of profile IDs we're interested in comparing against
    var Ids = profileIds.map(x => x.profileId).join();

    var request = new XMLHttpRequest();
    request.open("POST", identifyProfileEndpoint(Ids), true);
    request.setRequestHeader('Ocp-Apim-Subscription-Key', key);
    request.onload = function () {
        logToDiv('Identifying profile...');
        var json = JSON.parse(request.responseText);
        //logToDiv(JSON.stringify(json, null, 2));

        if (request.status == 200) {
            var speaker = profileIds.filter(function(p) {
                return p.profileId == json.identifiedProfile.profileId
            });

            if (speaker != null && speaker.length > 0) {
                logToDiv('Identified! ' + speaker[0].name + ' was talking');
                alert('Identification Successful: ' + speaker[0].name + ' was talking.');
            } else {
                logToDiv('Failed to Identify. Please try again. Avoid Surrounding Noise.');
                alert('Identification Unsuccessful: Unrecognized Profile ');
            }
        } else {
            logToDiv(`Failed to submit for identification: got a ${request.status} response code.`);
            logToDiv(`${json.error.code}: ${json.error.message}`);
        }
    };

    request.send(blob);
}
