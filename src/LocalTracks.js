import React, { useState, useEffect, useRef } from "react";
import _ from "lodash";
import "./LocalTracks.css";
import micOffIcon from './assets/mic-off.svg'
import micIcon from './assets/mic.svg'
import videoOffIcon from './assets/video-off.svg'
import videoIcon from './assets/video.svg'

const LocalTracks = ({
  deviceList,
  defaultMicId,
  defaultVideoId,
  activeRoomId
}) => {
  const prevprops = useRef({ activeRoomId }).current;
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState("");
  const [selectedMicDeviceId, setSelectedMicDeviceId] = useState("");
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [localDeviceList, setLocalDeviceList] = useState([]);
  const videoRef = useRef();
  const micRef = useRef();
  const trackList = useRef([]);

  useEffect(() => {
    window.JitsiMeetJS.createLocalTracks({ devices: ["audio", "video"] }).then(
      tracks => {
        console.log("LocaltTracks", tracks);
        let deviceIds = _.map(deviceList, nd => nd.id);
        for (let track of tracks) {
          if (_.indexOf(deviceIds, track.deviceId) !== -1) {
            trackList.current.push(track);
          }
        }

        console.log("trackList", trackList.current);

        setLoaded(true);
        setLocalDeviceList(deviceList);
        setSelectedMicDeviceId(defaultMicId);
        setSelectedVideoDeviceId(defaultVideoId);

        updateLocalTrack(defaultMicId, "set");
        updateLocalTrack(defaultVideoId, "set");
      }
    );
    return () => {
      updateLocalTrack(selectedMicDeviceId, "clear");
      updateLocalTrack(selectedVideoDeviceId, "clear");
    };
  }, []);

  useEffect(() => {
    console.log("activerRoomId", activeRoomId);
    console.log("window.sherpany.activeRoom", window.sherpany.activeRoom);

    if (activeRoomId && window.sherpany.activeRoom) {
      let videoTrack = _.find(trackList.current, t => {
        return t.deviceId === defaultVideoId;
      });
      let micTrack = _.find(trackList.current, t => {
        return t.deviceId === defaultMicId;
      });
      console.log(
        "inside activeRoomId && window.sherpnay.activeRoom",
        videoTrack,
        micTrack
      );
      if (videoTrack) {
        window.sherpany.activeRoom.addTrack(videoTrack);
      }
      if (micTrack) {
        window.sherpany.activeRoom.addTrack(micTrack);
      }
    }
  }, [activeRoomId]);

  useEffect(() => {
    console.log("useEffect isMicMuted trackList", trackList.current);
    if (trackList.current.length !== 0) {
      if (isMicMuted === true) {
        updateLocalTrack(selectedMicDeviceId, "mute");
      }
      if (isMicMuted === false) {
        updateLocalTrack(selectedMicDeviceId, "unmute");
      }
    }
  }, [isMicMuted]);

  useEffect(() => {
    console.log("useEffect isMicMuted trackList", trackList.current);
    if (trackList.current.length !== 0) {
      if (isVideoMuted === true) {
        updateLocalTrack(selectedVideoDeviceId, "mute");
      }
      if (isVideoMuted === false) {
        updateLocalTrack(selectedVideoDeviceId, "unmute");
      }
    }
  }, [isVideoMuted]);

  // useEffect(() => {
  //   // todo this is not working
  //   if(trackList.current.length !== 0) {
  //     if (selectedMicDeviceId !== '') {
  //       updateLocalTrack(selectedMicDeviceId, 'set' )
  //     } else {
  //       updateLocalTrack(selectedMicDeviceId, 'clear')
  //     }
  //   }

  // },[selectedMicDeviceId])

  // useEffect(() => {
  //   // todo  this is not working
  //   if(trackList.current.length !== 0) {
  //     if(selectedVideoDeviceId === 'none') {
  //       updateLocalTrack(selectedVideoDeviceId, 'clear')
  //       return
  //     }
  //     if (selectedVideoDeviceId !== '') {
  //       updateLocalTrack(selectedVideoDeviceId, 'set' )
  //     }

  //   }

  // },[selectedVideoDeviceId])

  const onTrackStoppedEvent = event => {
    console.log(`Track Stopped`);
  };

  const onTrackAudioOutputChangedEvent = deviceId => {
    console.log(`Track ${deviceId} audio output changed`);
  };

  const updateLocalTrack = (deviceId, action = "clear") => {
    console.log("Inside updateLocalTrack", deviceId, action);
    if (action === "clear") {
      let clearTrack = _.find(trackList.current, { deviceId: deviceId });
      if (clearTrack) {
        // eslint-disable-next-line default-case
        switch (clearTrack.getType()) {
          case "audio":
            if (micRef.current) {
              clearTrack.detach(micRef.current);
              clearTrack.removeEventListener(
                window.JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
                onTrackStoppedEvent
              );
              clearTrack.removeEventListener(
                window.JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
                onTrackAudioOutputChangedEvent
              );
              clearTrack.dispose();
            }
            break;
          case "video":
            if (videoRef.current) {
              clearTrack.detach(videoRef.current);
              clearTrack.dispose();
            }
            break;
        }
      }
    } else if (action === "set") {
      let setTrack = _.find(trackList.current, t => {
        return t.deviceId === deviceId;
      });
      console.log("Inside set, trackList", trackList.current);
      if (setTrack) {
        // eslint-disable-next-line default-case
        switch (setTrack.getType()) {
          case "audio":
            if (micRef.current) {
              console.log("setTrack Inside audio set", micRef, setTrack);
              setTrack.attach(micRef.current);
              setTrack.addEventListener(
                window.JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
                onTrackStoppedEvent
              );
              setTrack.addEventListener(
                window.JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
                onTrackAudioOutputChangedEvent
              );
              setTrack.addEventListener(
                window.JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
                () => console.log("local track muted")
              );
              //setTrack.mute()
            }
            break;
          case "video":
            if (setTrack && videoRef.current) {
              setTrack.addEventListener(
                window.JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
                () => console.log("video local track muted")
              );
              setTrack.attach(videoRef.current);
              //setTrack.mute()
            }
            break;
        }
      }
    }
    if (action === "mute") {
      let setTrack = _.find(trackList.current, t => {
        return t.deviceId === deviceId;
      });
      console.log("inside set mute", trackList.current);
      if (setTrack) {
        // eslint-disable-next-line default-case
        switch (setTrack.getType()) {
          case "audio":
            //if (micRef.current) {
              console.log("setTrack", micRef, setTrack);

              setTrack.mute();
            //}
            break;
          case "video":
            if (setTrack && videoRef.current) {
              //setTrack.attach(this.videoRef.current)
              setTrack.mute();
              console.log("video", setTrack);
            }
            break;
        }
      }
    }
    if (action === "unmute") {
      let setTrack = _.find(trackList.current, t => {
        return t.deviceId === deviceId;
      });
      if (setTrack) {
        // eslint-disable-next-line default-case
        switch (setTrack.getType()) {
          case "audio":
            //if (micRef.current) {
              console.log("setTrack", micRef, setTrack);

              setTrack.unmute();
            //}
            break;
          case "video":
            if (setTrack && videoRef.current) {
              setTrack.unmute();
            }
            break;
        }
      }
    }
  };

  const onCameraChange = event => {
    setSelectedVideoDeviceId(event.target.value);
  };

  const onMicrophoneChange = event => {
    setSelectedMicDeviceId(event.target.value);
  };

  return (
    <div className="local_track">
      <div className="local_track_controls">
        <span>Camera</span>
        <select value={selectedVideoDeviceId} onChange={onCameraChange}>
          {_.map(
            _.concat(
              [{ name: "none", id: "none", type: "none" }],
              _.filter(localDeviceList, { type: "videoinput" })
            ),
            d => {
              return (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              );
            }
          )}
        </select>
        <span>Microphone</span>
        <select value={selectedMicDeviceId} onChange={onMicrophoneChange}>
          {_.map(_.filter(localDeviceList, { type: "audioinput" }), d => {
            return (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            );
          })}
        </select>
      </div>
      <div className="local_track_body">
        <video autoPlay="1" ref={videoRef} />
      </div>
      <div>
        {/*<audio ref={micRef} /> */}
      </div>
      <button onClick={() => setIsMicMuted(!isMicMuted)}>
        {isMicMuted ? <img src={micOffIcon} /> : <img src={micIcon} />}
      </button>
      <button onClick={() => setIsVideoMuted(!isVideoMuted)}>
        {isVideoMuted ? <img src={videoOffIcon} /> : <img src={videoIcon} />}
      </button>
    </div>
  );
};

export default LocalTracks;
