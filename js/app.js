var gumStream; //stream from getUserMedia()
var recorder; //WebAudioRecorder object
var input; //MediaStreamAudioSourceNode we'll be recording
var encodingType; //holds selected encoding for resulting audio (file)
var encodeAfterRecord = true; // when to encode
var audioContext = new AudioContext; //new audio context to help us record
 
var encodingTypeSelect = document.getElementById("encodingTypeSelect");
var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");

recordButton.addEventListener("click", startRecording);
 
stopButton.addEventListener("click", stopRecording);

function startRecording() {
    console.log("startRecording() called");
 
    /*
    Simple constraints object, for more advanced features see
    <div class="video-container"><blockquote class="wp-embedded-content" data-secret="BFVi21bW6d"><a href="https://addpipe.com/blog/audio-constraints-getusermedia/">Supported Audio Constraints in getUserMedia()</a></blockquote><iframe class="wp-embedded-content" sandbox="allow-scripts" security="restricted" style="position: absolute; clip: rect(1px, 1px, 1px, 1px);" src="https://addpipe.com/blog/audio-constraints-getusermedia/embed/#?secret=BFVi21bW6d" data-secret="BFVi21bW6d" title="“Supported Audio Constraints in getUserMedia()” — Pipe Blog" marginwidth="0" marginheight="0" scrolling="no" height="338" frameborder="0" width="600"></iframe></div>
    */
 
    var constraints = { audio: true, video:false }
 
    /*
    We're using the standard promise based getUserMedia() 
    https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    */
 
    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
    console.log("getUserMedia() success, stream created, initializing WebAudioRecorder...");
 
    //assign to gumStream for later use
    gumStream = stream;
 
    /* use the stream */
    input = audioContext.createMediaStreamSource(stream);
 
    //stop the input from playing back through the speakers
    input.connect(audioContext.destination)
 
    //get the encoding 
    encodingType = encodingTypeSelect.options[encodingTypeSelect.selectedIndex].value;
 
    //disable the encoding selector
    encodingTypeSelect.disabled = true;
 
    recorder = new WebAudioRecorder(input, {
        workerDir: "js/",
        encoding: encodingType,
        onEncoderLoading: function(recorder, encoding) {
            // show "loading encoder..." display
             console.log("Loading "+encoding+" encoder...");
        },
        onEncoderLoaded: function(recorder, encoding) {
            // hide "loading encoder..." display
            console.log(encoding+" encoder loaded");
        }
    });
 
    recorder.onComplete = function(recorder, blob) { 
        console.log("Encoding complete");
        createDownloadLink(blob,recorder.encoding);
        encodingTypeSelect.disabled = false;
    }
 
    recorder.setOptions({
        timeLimit:120,
        encodeAfterRecord:encodeAfterRecord,
        ogg: {quality: 0.5},
        mp3: {bitRate: 160}
    });
 
    //start the recording process
    recorder.startRecording();
 
    console.log("Recording started");
 
    }).catch(function(err) {
        //enable the record button if getUSerMedia() fails
        console.log(err);
        recordButton.disabled = false;
        stopButton.disabled = true;
 
    });
 
    //disable the record button
    recordButton.disabled = true;
    stopButton.disabled = false;
}

function stopRecording() {
    console.log("stopRecording() called");
 
    //stop microphone access
    gumStream.getAudioTracks()[0].stop();
 
    //disable the stop button
    stopButton.disabled = true;
    recordButton.disabled = false;
 
    //tell the recorder to finish the recording (stop recording + encode the recorded audio)
    recorder.finishRecording();
 
    console.log('Recording stopped');
}

function createDownloadLink(blob,encoding) {
 
    var url = URL.createObjectURL(blob);
    var au = document.createElement('audio');
    var li = document.createElement('li');
    var link = document.createElement('a');
 
    //add controls to the &amp;amp;lt;audio&amp;amp;gt; element
    au.controls = true;
    au.src = url;
 
    //link the a element to the blob
    link.href = url;
    link.download = new Date().toISOString() + '.'+encoding;
    link.innerHTML = link.download;
 
    //add the new audio and a elements to the li element
    li.appendChild(au);
    li.appendChild(link);
 
    //add the li element to the ordered list
    recordingsList.appendChild(li);
}