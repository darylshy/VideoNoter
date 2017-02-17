(function() {

    //cache the DOM
    var body = document.querySelector('body');
    var videoContainer = body.getElementsByClassName('video-container')[0];
    var cpTextBox = body.querySelector('.cp-form-container .cp-message');
    var cuePointListWrapper = body.querySelector('.cue-point-list-wrapper');
    var counter = 1;

    //video options class for dynamically creating video options
    function VmVideo(options) {
        this.videoContainerId = videoContainer.getAttribute('id');
        this.options = options;
    }

    //set options
    var myVideo = new VmVideo({
        id: 67710268,
        autopause: true,
        autoplay: false,
        height: "400px",
        width: "600px",
        title: true
    });

    var robotTraining = new Vimeo.Player(myVideo.videoContainerId, myVideo.options);

    //Manage Overlays----------------------

    //insertMessage
    function addOverlayMessage(overlay, message) {
        body.querySelector('#' + overlay + ' .overlay .message').innerHTML = message;
    }

    //showOverlay
    function showOverlay(overlay) {
        body.querySelector('#' + overlay + ' .overlay').style.display = "block";
    }

    //hideOverlay
    function hideOverlay(overlay, delay) {
        return setTimeout(function () {
            body.querySelector('#' + overlay + ' .overlay').style.display = "none";
        }, delay);
    }

//helpers-----------------------------------
    //just a quick helper function for cue-list output time-formatting
    function timeConverter(time){
        var hrs, mins, secs;
        hrs = Math.floor(time/60);
        mins = parseFloat(time%60/100) + "";
        mins = mins.match(/\b\d{2}/g);
        return hrs + ":" + mins;
    }

    //another quick helper function to adjust cue-list counter display
    function findObjIdx(array, attr, value) {
        for(var i = 0; i < array.length; i += 1) {
            if(array[i][attr] === value) {
                return i+1;
            }
        }
        return -1;
    }

    //handle click event/add cue points
    body.querySelector('.cp-form-container .cp-message-submit').addEventListener('click', function (e) {
        robotTraining.getCurrentTime()
            .then(function (seconds) {
                var message = cpTextBox.value;
                cpTextBox.value = "";
                return {
                    seconds: seconds,
                    message: message
                };
            })
            .then(function (data) {
                robotTraining.addCuePoint(data.seconds, {message: data.message})
                    .then(function (id) {
                        var li = document.createElement('li');
                        cuePointListWrapper.querySelector('.cue-point-list').appendChild(li);
                        li.className = 'cue-point-list-item';
                        li.setAttribute('data-cue-point-id',id);

                        li.onclick = function(){
                            seekToCuePoint(data.seconds - .5);
                        };

                        var h4 = document.createElement('h4');
                        h4.innerHTML = 'cue-point-' + findObjIdx(id) + ':';
                        h4.className = 'cue-point-list-item-number';
                        li.appendChild(h4);
                        var ul = document.createElement('ul');
                        li.appendChild(ul);
                        var span = document.createElement('span');
                        ul.appendChild(span);
                        var li1 = document.createElement('li');
                        var li2 = document.createElement('li');
                        var li3 = document.createElement('li');
                        li1.innerHTML = 'id: ' + id;
                        li2.innerHTML = 'marker: ' +  timeConverter(data.seconds);
                        li3.innerHTML = 'message: ' + data.message;
                        var lis = [li1,li2,li3];
                        for(var i = 0; i<lis.length; i++){
                            span.appendChild(lis[i]);
                        }
                        var span2 = document.createElement('span');
                        span2.className = 'delete-cue-point';
                        ul.appendChild(span2);
                        var button = document.createElement('button');
                        button.className = "delete-cue-point-button";
                        button.innerHTML = '&otimes;';
                        button.onclick = function (e) {
                            e.preventDefault();
                            e.stopPropagation();
                            var cpListItem = e.target.parentElement.parentElement.parentElement;
                            removeCuePoint(cpListItem.getAttribute('data-cue-point-id'));

                            robotTraining.getCuePoints().then(function (cps) {
                                var remainingListItems = body.querySelectorAll('li[data-cue-point-id]');
                                for(var i = 0; i<remainingListItems.length; i++){
                                    var idx = findObjIdx(cps,'id',remainingListItems[i].getAttribute('data-cue-point-id'));
                                    var itemNumber = remainingListItems[i].querySelector('.cue-point-list-item-number');
                                    itemNumber.innerHTML = itemNumber.innerHTML.replace(/cue-point-\d+/g,'cue-point-' + (idx));
                                }

                                cpListItem.remove();
                            });
                        };
                        span2.appendChild(button);
                        counter++;
                    })
                    .catch(function (error) {
                        switch (error.name) {
                            case 'UnsupportedError':
                                console.log("cue points are not supported with the current player or browser");
                                break;

                            case 'RangeError':
                                console.log("the time was less than 0 or greater than the video’s duration");
                                break;

                            default:
                                console.log("some other error occurred");
                                break;
                        }
                    });
            });
    });


    //remove cue-point
    function removeCuePoint(cuepointId) {
        robotTraining.removeCuePoint(cuepointId)
            .then(function(id) {
                    console.log('cue point was removed successfully');
                })
            .catch(function(error) {
                    switch (error.name) {
                        case 'UnsupportedError':
                            // cue points are not supported with the current player or browser
                            break;

                        case 'InvalidCuePoint':
                            // a cue point with the id passed wasn’t found
                            break;

                        default:
                            // some other error occurred
                            break;
                    }
            });
    }
    
    function seekToCuePoint(seekTime) {
        robotTraining.setCurrentTime(seekTime)
            .then(function(seconds) {
            console.log('seeked successfully!');
        }).catch(function(error) {
            switch (error.name) {
                case 'RangeError':
                    // the time was less than 0 or greater than the video’s duration
                    break;

                default:
                    // some other error occurred
                    break;
            }
        });
    }

    //adds overlay message to overlay div. shows and hides overlay.
    robotTraining.on('cuepoint', function (e) {
        addOverlayMessage(myVideo.videoContainerId, e.data.message);
        showOverlay(myVideo.videoContainerId);
        hideOverlay(myVideo.videoContainerId, 2000);
    });


})();