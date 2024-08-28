



// This method adds the recorded audio to the page so you can listen to it
function addAudioPlayer(blob) {	
    // Create a URL for the blob (audio data)
    const url = URL.createObjectURL(blob);
    
    // Find the existing logDiv element where the audio player will be inserted
    const logDiv = document.getElementById('logDiv');

    // Check if an audio element with the id 'replay' already exists
    let existingAudio = document.getElementById('replay');
    if (existingAudio) {
        // If it exists, update the source
        existingAudio.querySelector('source').src = url;
        existingAudio.load(); // Reload the audio player with the new source
    } else {
        // If it doesn't exist, create a new audio element
        const audio = document.createElement('audio');
        audio.setAttribute('id', 'replay'); // Assign an id for easy future reference
        audio.setAttribute('controls', 'controls'); // Add controls to the audio player

        // Create a source element for the audio element
        const source = document.createElement('source');
        source.src = url;
        source.type = 'audio/wav'; // Assuming the recorded audio is in WAV format

        // Append the source to the audio element
        audio.appendChild(source);

        // Insert the audio element into the DOM, at the end of logDiv
        logDiv.appendChild(audio);
    }
}


// Example phrases


// vanilla javascript queystring management
var qs = (function(a) {
    if (a == "") return {};
    var b = {};
    for (var i = 0; i < a.length; ++i)
    {
        var p=a[i].split('=', 2);
        if (p.length == 1)
            b[p[0]] = "";
        else
            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }
    return b;
})(window.location.search.substr(1).split('&'));

// Get the Cognitive Services key from the querystring
var key = 'a7320d65a60c42219079c9e1011bbdfd';
var baseApi = 'https://centralindia.api.cognitive.microsoft.com/';

// Speaker Recognition API profile configuration - constructs to make management easier
var Profile = class { constructor (name, profileId) { this.name = name; this.profileId = profileId;}};
var VerificationProfile = class { constructor (name, profileId) { this.name = name; this.profileId = profileId; this.remainingEnrollments = 3}};
var profileIds = [];
var verificationProfile = new VerificationProfile();

(function () {
	// Cross browser sound recording using the web audio API
	navigator.getUserMedia = ( navigator.getUserMedia ||
							navigator.webkitGetUserMedia ||
							navigator.mozGetUserMedia ||
							navigator.msGetUserMedia);

	// Really easy way to dump the console logs to the page
	var old = console.log;
	var logger = document.getElementById('log');
	var isScrolledToBottom = logger.scrollHeight - logger.clientHeight <= logger.scrollTop + 1;
    
	console.log = function () {
		for (var i = 0; i < arguments.length; i++) {
			if (typeof arguments[i] == 'object') {
				logger.innerHTML += (JSON && JSON.stringify ? JSON.stringify(arguments[i], undefined, 2) : arguments[i]) + '<br />';
			} else {
				logger.innerHTML += arguments[i] + '<br />';
			}
			if(isScrolledToBottom) logger.scrollTop = logger.scrollHeight - logger.clientHeight;
		}
		old(...arguments);
	}
	console.error = console.log; 
})();
