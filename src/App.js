import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import _ from "lodash";
import LocalSpeaker from "./LocalSpeaker";
import LocalTracks from "./LocalTracks";
import LocalTracksH from "./LocalTracksH";
import RemoteTrack from "./RemoteTrack";
import RemoteTrackH from "./RemoteTrackH";
import "./App.css";

function App() {
  const [serverURL, setServerURL] = useState("alpha.jitsi.net");
  const [roomId, setRoomId] = useState("testroomsherpany");
  const [selectedSpeakerDeviceId, setSelectedSpeakerDeviceId] = useState("");
  const [defaultMicId, setDefaultMicId] = useState("");
  const [defaultVideoId, setDefaultVideoId] = useState("");
  const [defaultSpeakerId, setDefaultSpeakerId] = useState("");
  const [deviceList, setDeviceList] = useState("");
  const [status, setStatus] = useState("closed");
  const [lastError, setLastError] = useState("");
  const [remoteTrackIds, setRemoteTrackIds] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [remoteTracks, setRemoteTracks] = useState([]);

  useEffect(() => {
    window.JitsiMeetJS.init();

    window.sherpany = {};
    window.sherpany.remoteTracks = [];
    window.sherpany.activeConnection = null;
    window.sherpany.activeRoom = null;
  }, []);

  useEffect(() => {
    window.JitsiMeetJS.mediaDevices.enumerateDevices(devices => {
      let newDeviceList = [];
      for (let device of devices) {
        // if (device.deviceId !== 'default' && device.deviceId !== 'communications'){
        newDeviceList.push({
          name: device.label,
          id: device.deviceId,
          type: device.kind
        });
        // }
      }
      let micId =
        (_.find(newDeviceList, { type: "audioinput" }) || {}).id || "none";
      let videoId =
        (_.find(newDeviceList, { type: "videoinput" }) || {}).id || "none";
      let speakerId =
        (_.find(newDeviceList, { type: "audioinput" }) || {}).id || "none";

      setDeviceList(newDeviceList);
      setDefaultMicId(micId);
      setDefaultVideoId(videoId);
      setDefaultSpeakerId(speakerId);
      setLoaded(true);
    });
    console.log("agon", window.JitsiMeetJS);
  }, []);

  const onSpeakerChanged = newSpeaker => {
    setSelectedSpeakerDeviceId(newSpeaker.id);
  };

  const onServerChanged = event => {
    setServerURL(event.target.value);
  };

  const onRoomChanged = event => {
    setRoomId(event.target.value);
  };

  const onRoomTrackAdded = track => {
    if (track.isLocal() === true) {
      return;
    }
    let newTrackId = track.getId();
    console.log(`Track Added: ${newTrackId}`);
    let matchTrack = _.find(remoteTracks, { id: newTrackId });
    if (matchTrack) {
      return;
    }
    let trackInfo = {
      id: newTrackId,
      participantId: track.getParticipantId(),
      type: track.getType(),
      track: track
    };
    window.sherpany.remoteTracks.push(trackInfo);
    setRemoteTrackIds(
      _.map(window.sherpany.remoteTracks, rt => {
        return { id: rt.id, participantId: rt.participantId };
      })
    );
  };

  const onRoomTrackRemoved = track => {
    if (track.isLocal() === true) {
      return;
    }
    let trackId = track.getId();
    window.sherpany.remoteTracks = _.reject(window.sherpany.remoteTracks, {
      id: trackId
    });
    setRemoteTrackIds(
      _.map(window.sherpany.remoteTracks, rt => {
        return { id: rt.id, participantId: rt.participantId };
      })
    );
  };

  const onConnectionSuccess = () => {
    
    try {
      window.sherpany.activeRoom = window.sherpany.activeConnection.initJitsiConference(
        roomId,
        {
          openBridgeChannel: true
        }
      );
      window.sherpany.activeRoom.addEventListener(
        window.JitsiMeetJS.events.conference.TRACK_ADDED,
        onRoomTrackAdded
      );
      window.sherpany.activeRoom.addEventListener(
        window.JitsiMeetJS.events.conference.TRACK_REMOVED,
        onRoomTrackRemoved
      );

      window.sherpany.activeRoom.join();

      setStatus("open");
      setLastError("");
      setActiveRoomId(uuidv4());
    } catch (error) {
      console.log("onConnectionSuccess state.status", status);

      setStatus("closed");
      setLastError(error.message);
    }
  };

  const onConnectionFailed = (a, b, c, d) => {
    console.log("onConnectionFailed state.status", status);
    setStatus("closed");
    setLastError(a);
    setActiveRoomId(null);
  };

  const onConnectionDisconnect = () => {
    window.sherpany.activeConnection.removeEventListener(
      window.JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
      onConnectionSuccess
    );
    window.sherpany.activeConnection.removeEventListener(
      window.JitsiMeetJS.events.connection.CONNECTION_FAILED,
      onConnectionFailed
    );
    window.sherpany.activeConnection.removeEventListener(
      window.JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
      onConnectionDisconnect
    );
    window.sherpany.activeRoom.removeEventListener(
      window.JitsiMeetJS.events.conference.TRACK_ADDED,
      onRoomTrackAdded
    );
    window.sherpany.activeRoom.removeEventListener(
      window.JitsiMeetJS.events.conference.TRACK_REMOVED,
      onRoomTrackRemoved
    );
  };

  const onConnect = () => {
    
    setStatus("Joining...");
    window.sherpany.activeConnection = new window.JitsiMeetJS.JitsiConnection(
      null,
      null,
      {
        hosts: {
          domain: serverURL,
          muc: `conference.${serverURL}` // FIXME: use XEP-0030
        },
        serviceUrl: `wss://${serverURL}/xmpp-websocket?room=${roomId}`,
        clientNode: `https://${serverURL}`
      }
    );

    window.sherpany.activeConnection.addEventListener(
      window.JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
      onConnectionSuccess
    );
    window.sherpany.activeConnection.addEventListener(
      window.JitsiMeetJS.events.connection.CONNECTION_FAILED,
      onConnectionFailed
    );
    window.sherpany.activeConnection.addEventListener(
      window.JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
      onConnectionDisconnect
    );
    window.sherpany.activeConnection.connect();
  };

  const onDisconnect = () => {
    if (window.sherpany.activeRoom) {
      setStatus("Leaving...");
      try {
        window.sherpany.activeRoom.leave().then(() => {
          if (window.sherpany.activeConnection) {
            window.sherpany.activeConnection.disconnect();
          }
          setStatus("closed");
          setRemoteTracks([]);
          setActiveRoomId(null);
        });
      } catch (error) {
        setStatus("closed");
        setLastError(error.message);
      }
    }
  };

  const remoteTrackGroups = _.groupBy(remoteTrackIds, rt => {
    return rt.participantId;
  });

  const renderRemoteTracks = (trackGroups = {}, selectedSpeakerDeviceId) => {
    let ret = [];

    let participantIds = _.keys(trackGroups);

    if (participantIds.length === 0) {
      return null;
    }
    for (let participantId of participantIds) {
      ret.push(
        <div key={participantId} className="B_Body_Block">
          <RemoteTrackH
            trackIds={trackGroups[participantId]}
            selectedSpeakerDeviceId={selectedSpeakerDeviceId}
          />
        </div>
      );
    }

    return ret;
  };

  if (loaded === false) {
    return (
      <div className="App">
        <div className="AppLoading">
          <h3>Loading...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="TL">
        <div>
          Server:{" "}
          <input
            readOnly={status !== "closed"}
            type="text"
            onChange={event => setServerURL(event.target.value)}
            value={serverURL}
          />
        </div>
        <div>
          Room:{" "}
          <input
            readOnly={status !== "closed"}
            type="text"
            onChange={event => setRoomId(event.target.value)}
            value={roomId}
          />
        </div>
        <div>
          {status === "closed" ? (
            <button onClick={onConnect}>Connect</button>
          ) : status === "open" ? (
            <button onClick={onDisconnect}>Disconnect</button>
          ) : (
            <button disabled={true}>{status}</button>
          )}
        </div>
        <div>{lastError}</div>
      </div>
      <div className="TR">
        <div className="TR_Header">
          <h3>Me</h3>
          <LocalSpeaker
            deviceList={deviceList}
            key="LocalSpeaker"
            defaultSpeakerId={defaultSpeakerId}
            onSpeakerChanged={onSpeakerChanged}
          />
        </div>
        <div className="TR_Body">
          <div className="TR_Body_Block">
            <LocalTracksH
              activeRoomId={activeRoomId}
              deviceList={deviceList}
              defaultMicId={defaultMicId}
              defaultVideoId={defaultVideoId}
              key="localTracks"
            />
          </div>
        </div>
      </div>
      <div className="B">
        <div className="B_Header">
          <h3>Them</h3>
        </div>
        <div className="B_Body">
          {renderRemoteTracks(remoteTrackGroups, selectedSpeakerDeviceId)}
        </div>
      </div>
    </div>
  );
}

export default App;
