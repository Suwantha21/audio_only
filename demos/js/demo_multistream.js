//
//Copyright (c) 2016, Skedans Systems, Inc.
//All rights reserved.
//
//Redistribution and use in source and binary forms, with or without
//modification, are permitted provided that the following conditions are met:
//
//    * Redistributions of source code must retain the above copyright notice,
//      this list of conditions and the following disclaimer.
//    * Redistributions in binary form must reproduce the above copyright
//      notice, this list of conditions and the following disclaimer in the
//      documentation and/or other materials provided with the distribution.
//
//THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
//AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
//IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
//ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
//LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
//CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
//SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
//INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
//CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
//ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
//POSSIBILITY OF SUCH DAMAGE.
//
var selfEasyrtcid = "";
var haveSelfVideo = false;
var otherEasyrtcid = null;
var localStreamCount = false;

function disable(domId) {
    console.log("about to try disabling "  +domId);
    document.getElementById(domId).disabled = "disabled";
}
var localStreamCount = 0;


function enable(domId) {
    console.log("about to try enabling "  +domId);
    document.getElementById(domId).disabled = "";
}


function createMediaStream() {
    easyrtc.setVideoSource(videoCurrentId);
    easyrtc.setAudioSource(audioCurrentId);
    var streamName = "stream" ;
    
    easyrtc.initMediaSource(
            function(stream) {
                createMediaStreamGui(stream, streamName);
                if( otherEasyrtcid) {
                    easyrtc.addStreamToCall(otherEasyrtcid, streamName, function(easyrtcid, streamName){
                        easyrtc.showError("Informational", + easyrtcid + " acknowledges receiving " + streamName);
                        
                    });
                }
            },
            function(errCode, errText) {
                easyrtc.showError(errCode, errText);
            }, streamName);
}

var checkBoxId = 0;
var audioCurrentId = null, 
    videoCurrentId = null;

function createLabelledButton(buttonLabel) {
    var button = document.createElement("button");
    button.appendChild(document.createTextNode(buttonLabel));
    return button;
}

function createRadioButton(buttonLabel, type) {
    var radiobutton = document.createElement("input");
    radiobutton.id = "radio" + (checkBoxId++);
    radiobutton.name = type;
    radiobutton.type = "radio";
    radiobutton.value = buttonLabel;
    var label = document.createElement("label");
    label.for = radiobutton.id;
    label.appendChild(document.createTextNode(buttonLabel));
    var parent = document.getElementById(type + "SrcBlk");
    parent.appendChild(label);
    parent.appendChild(radiobutton);
    parent.appendChild(document.createElement("br"));
    return radiobutton;
}

function removeStreamFromPeers(streamName) {
  if( otherEasyrtcid ) {
       easyrtc.removeStreamFromCall(otherEasyrtcid, streamName);
  } 
}

function addMediaStreamToDiv(divId, stream, streamName, isLocal)
{
    var container = document.createElement("div");
    container.style.marginBottom = "10px";
    var formattedName = streamName.replace("(", "<br>").replace(")", "");
    var labelBlock = document.createElement("div");
    labelBlock.style.width = "220px";
    labelBlock.style.cssFloat = "left";
    labelBlock.innerHTML = "<pre>" + formattedName + "</pre><br>";
    container.appendChild(labelBlock);
    var video = document.createElement("video");
    video.width = 750;
    video.height = 450;
    video.muted = isLocal;
    video.style.verticalAlign= "middle";
    container.appendChild(video);
    document.getElementById(divId).appendChild(container);
    video.autoplay = true;
    easyrtc.setVideoObjectSrc(video, stream);
    return labelBlock;
}



function createMediaStreamGui(stream, streamName) {
    var labelBlock = addMediaStreamToDiv("localVideos", stream, streamName, true);
    var closeButton = createLabelledButton("close");
    closeButton.onclick = function() {
        easyrtc.closeLocalStream(streamName);
        labelBlock.parentNode.parentNode.removeChild(labelBlock.parentNode);
    }
    var removeButton = createLabelledButton("remove");
    removeButton.onclick = function() {
         removeStreamFromPeers(streamName);
    }
    labelBlock.appendChild(closeButton);
    labelBlock.appendChild(removeButton);

    console.log("created local video, stream.streamName = " + stream.streamName);
}

function addSrcButton(buttonLabel, deviceId, type) {
    var button = createRadioButton(buttonLabel, type);
    button.onclick = function() {
         if(type == "audio" ) {
           audioCurrentId = deviceId;
         }
         else {
           videoCurrentId = deviceId;
         }
    }
    return button;
}

function connect() {
    console.log("Initializing.");
    easyrtc.setRoomOccupantListener(convertListToButtons);
    easyrtc.connect("easyrtc.multistream", loginSuccess, loginFailure);
    easyrtc.setAutoInitUserMedia(false);
    easyrtc.getAudioSourceList(function(audioSrcList) {
        for (var i = 0; i < audioSrcList.length; i++) {
             var audioEle = audioSrcList[i];
            var audioLabel = (audioSrcList[i].label &&audioSrcList[i].label.length > 0)?
			(audioSrcList[i].label):("src_" + i);
            var button = addSrcButton(audioLabel, audioSrcList[i].deviceId, "audio");
            if( !audioCurrentId ) {
                audioCurrentId =  audioSrcList[i].deviceId;
                button.checked = true;
            }
        }
    });

    easyrtc.getVideoSourceList(function(videoSrcList) {
        for (var i = 0; i < videoSrcList.length; i++) {
             var videoEle = videoSrcList[i];
            var videoLabel = (videoSrcList[i].label &&videoSrcList[i].label.length > 0)?
			(videoSrcList[i].label):("src_" + i);
            var button = addSrcButton(videoLabel, videoSrcList[i].deviceId, "video");
            if( !videoCurrentId ) {
                videoCurrentId =  videoSrcList[i].deviceId;
                button.checked = true;
            }
        }
    });
}


function hangup() {
    easyrtc.hangupAll();
    disable('hangupButton');
}


function clearConnectList() {
    var otherClientDiv = document.getElementById('otherClients');
    while (otherClientDiv.hasChildNodes()) {
        otherClientDiv.removeChild(otherClientDiv.lastChild);
    }
}


function convertListToButtons(roomName, occupants, isPrimary) {
    clearConnectList();
    var otherClientDiv = document.getElementById('otherClients');
    for (var easyrtcid in occupants) {
        var button = document.createElement('button');
        button.onclick = function(easyrtcid) {
            return function() {
                performCall(easyrtcid);
            };
        }(easyrtcid);

        var label = document.createTextNode("Call " + easyrtc.idToName(easyrtcid));
        button.appendChild(label);
        otherClientDiv.appendChild(button);
    }
}


function performCall(targetEasyrtcId) {
    var acceptedCB = function(accepted, easyrtcid) {
        if (!accepted) {
            easyrtc.showError("CALL-REJECTED", "Sorry, your call to " + easyrtc.idToName(easyrtcid) + " was rejected");
            enable('otherClients');
        }
        else {
            otherEasyrtcid = targetEasyrtcId;
        }
    };

    var successCB = function() {
        enable('hangupButton');
    };
    var failureCB = function() {
        enable('otherClients');
    };
    var keys = easyrtc.getLocalMediaIds();

    easyrtc.call(targetEasyrtcId, successCB, failureCB, acceptedCB, keys);
    enable('hangupButton');
}


function loginSuccess(easyrtcid) {
    disable("connectButton");
    //  enable("disconnectButton");
    enable('otherClients');
    selfEasyrtcid = easyrtcid;
    document.getElementById("iam").innerHTML = "I am " + easyrtc.cleanId(easyrtcid);
}


function loginFailure(errorCode, message) {
    easyrtc.showError(errorCode, message);
}


function disconnect() {
    document.getElementById("iam").innerHTML = "logged out";
    easyrtc.disconnect();
    enable("connectButton");
//    disable("disconnectButton");
    clearConnectList();
    easyrtc.setVideoObjectSrc(document.getElementById('selfVideo'), "");
}

easyrtc.setStreamAcceptor(function(easyrtcid, stream, streamName) {
    var labelBlock = addMediaStreamToDiv("remoteVideos", stream, streamName, false);
    labelBlock.parentNode.id = "remoteBlock" + easyrtcid + streamName;
    console.log("accepted incoming stream with name " + stream.streamName);
    console.log("checking incoming " + easyrtc.getNameOfRemoteStream(easyrtcid, stream));
});



easyrtc.setOnStreamClosed(function(easyrtcid, stream, streamName) {
    var item = document.getElementById("remoteBlock" + easyrtcid + streamName);
    item.parentNode.removeChild(item);
});


var callerPending = null;

easyrtc.setCallCancelled(function(easyrtcid) {
    if (easyrtcid === callerPending) {
        document.getElementById('acceptCallBox').style.display = "none";
        callerPending = false;
    }
});

easyrtc.setAcceptChecker(function(easyrtcid, callback) {
    otherEasyrtcid = easyrtcid;
    if (easyrtc.getConnectionCount() > 0) {
        easyrtc.hangupAll();
    }
    callback(true, easyrtc.getLocalMediaIds());
});



