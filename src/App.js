import { useState, useEffect } from 'react';
import LocalSpeaker from './LocalSpeaker';
import LocalTracks from './LocalTracks';
import logo from './logo.svg';
import './App.css';
import { v4 as uuidv4 } from 'uuid'
import _ from 'lodash'



function App() {
  const [state, setState] = useState({
    serverURL: 'alpha.jitsi.net',
    roomId: 'testroom',
    selectedSpeakerDeviceId: '',
    defaultMicId: '',
    defaultVideoId: '',
    defaultSpeakerId: '',
    deviceList: [],
    status: 'closed',
    lastError: '',
    remoteTrackIds: [],
    loaded: false,
    activeRoomId: null
  })

 

  useEffect(() => {
    window.JitsiMeetJS.init()

    window.sherpany = {}
    window.sherpany.remoteTracks = []
    window.sherpany.activeConnection = null
    window.sherpany.activeRoom = null
  },[])

  useEffect(() => {

    window.JitsiMeetJS.mediaDevices.enumerateDevices((devices) => {
      let newDeviceList = []
      for (let device of devices) {
        // if (device.deviceId !== 'default' && device.deviceId !== 'communications'){
          newDeviceList.push({ name: device.label, id: device.deviceId, type: device.kind})
       // }
      }
      let micId = (_.find(newDeviceList, { type: 'audioinput' }) || {}).id || 'none'
      let videoId = (_.find(newDeviceList, { type: 'videoinput' }) || {}).id || 'none'
      let speakerId = (_.find(newDeviceList, {type: 'audioinput' }) || {}).id || 'none'
      let updatedProperties = {
        deviceList: newDeviceList,
        defaultMicId: micId,
        defaultVideoId: videoId,
        defaultSpeakerId: speakerId,
        loaded: true
      }
      setState({...state, ...updatedProperties})
    })
    console.log('agon', window.JitsiMeetJS)
  }, [])

  const onSpeakerChanged = (newSpeaker) => {
    setState({...state, selectedSpeakerDeviceId: newSpeaker.id});
  }

  const onServerChanged = (event) => {
    setState({...state, serverURL: event.target.value});
  }

  const onRoomChanged = (event) => {
    setState({...state, roomId: event.target.value});
  }

  const onRoomTrackAdded = (track) => {
    if (track.isLocal() === true) {
      return
    }
    let newTrackId = track.getId()
    console.log(`Track Added: ${newTrackId}`)
    let matchTrack = _.find(state.remoteTracks, { id: newTrackId })
    if (matchTrack) {
      return
    }
    let trackInfo = {
      id: newTrackId,
      participantId: track.getParticipantId(),
      type: track.getType(),
      track: track
    }
    window.sherpany.remoteTracks.push(trackInfo)
    setState({...state,
      remoteTrackIds: _.map(window.sherpany.remoteTracks, (rt) => { return { id: rt.id, participantId: rt.participantId } })
    })
  }

  const onRoomTrackRemoved = (track) => {
    if (track.isLocal() === true) {
      return
    }
    let trackId = track.getId()
    window.sherpany.remoteTracks = _.reject(window.sherpany.remoteTracks, { id: trackId })
    setState({...state,
      remoteTrackIds: _.map(window.sherpany.remoteTracks, (rt) => { return { id: rt.id, participantId: rt.participantId } })
    })
  }

  const onConnectionSuccess = () => {
    const { roomId } = state
    try {
      window.sherpany.activeRoom = window.sherpany.activeConnection.initJitsiConference(roomId, {
        openBridgeChannel: true
      })
      window.sherpany.activeRoom.addEventListener(window.JitsiMeetJS.events.conference.TRACK_ADDED, onRoomTrackAdded)
      window.sherpany.activeRoom.addEventListener(window.JitsiMeetJS.events.conference.TRACK_REMOVED, onRoomTrackRemoved)
      
      window.sherpany.activeRoom.join()
   setState({...state,
        status: 'open',
        lastError: '',
        activeRoomId: uuidv4()
      })
    } catch (error) {
      setState({...state,
        status: 'closed',
        lastError: error.message
      })
    }
  }

  const onConnectionFailed = (a, b, c, d) => {
    setState({...state,
      status: 'closed',
      lastError: a,
      activeRoomId: null
    })
  }

  const onConnectionDisconnect = () => {
    window.sherpany.activeConnection.removeEventListener(window.JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, onConnectionSuccess)
    window.sherpany.activeConnection.removeEventListener(window.JitsiMeetJS.events.connection.CONNECTION_FAILED, onConnectionFailed)
    window.sherpany.activeConnection.removeEventListener(window.JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, onConnectionDisconnect)
    window.sherpany.activeRoom.removeEventListener(window.JitsiMeetJS.events.conference.TRACK_ADDED, onRoomTrackAdded)
    window.sherpany.activeRoom.removeEventListener(window.JitsiMeetJS.events.conference.TRACK_REMOVED, onRoomTrackRemoved)
  }

  const onConnect = () => {
    const { roomId, serverURL } = state
    setState({...state, status: 'Joining...'})
    window.sherpany.activeConnection = new window.JitsiMeetJS.JitsiConnection(null, null, {
      hosts: {
        domain: serverURL,
        muc: `conference.${serverURL}` // FIXME: use XEP-0030
      },
      serviceUrl:  `wss://${serverURL}/xmpp-websocket?room=${roomId}`,
      clientNode: `https://${serverURL}`
    })

    window.sherpany.activeConnection.addEventListener(window.JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, onConnectionSuccess)
    window.sherpany.activeConnection.addEventListener(window.JitsiMeetJS.events.connection.CONNECTION_FAILED, onConnectionFailed)
    window.sherpany.activeConnection.addEventListener(window.JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, onConnectionDisconnect)
    window.sherpany.activeConnection.connect()
  }

  const onDisconnect = () => {
    if (window.sherpany.activeRoom) {
      setState({...state,
        status: 'Leaving...'
      })
      try {
        window.sherpany.activeRoom.leave().then(() => {
          if (window.sherpany.activeConnection) {
            window.sherpany.activeConnection.disconnect()
          }
          setState({...state,
            status: 'closed',
            remoteTracks: [],
            activeRoomId: null
          })
        })
      } catch (error) {
        setState({...state,
          status: 'closed',
          lastError: error.message
        })
      }
    }
  }

  const renderRemoteTracks = (trackGroups = {}, selectedSpeakerDeviceId) => {
    let ret = []

    let participantIds = _.keys(trackGroups)

    if (participantIds.length === 0) {
      return null
    }
    for (let participantId of participantIds) {
      ret.push(<div key={participantId} className="B_Body_Block">
       {/* <RemoteTrack trackIds={trackGroups[participantId]} selectedSpeakerDeviceId={selectedSpeakerDeviceId} /> */}
      </div>)
    }

    return ret
  }

  let remoteTrackGroups = _.groupBy(state.remoteTrackIds, (rt) => { return rt.participantId })

  if (state.loaded === false) {
    return null
    
  }

  return (
    <div className='App'>
        <div className='TL'>
        <div>Server: <input readOnly={state.status !== 'closed'} type='text' onChange={(event) =>  setState({...state, serverURL: event.target.value })}  value={state.serverURL} /></div>
          <div>Room: <input readOnly={state.status !== 'closed'} type='text' onChange={(event) =>  setState({...state, roomId: event.target.value })} value={state.roomId} /></div>
          <div>
            {state.status === 'closed'
              ? <button onClick={onConnect}>
                Connect
              </button>
              : state.status === 'open'
                  ? <button onClick={onDisconnect}>
                      Disconnect
                    </button>
                  : <button disabled={true} >
                      {state.status}
                    </button>
            }
          </div>
          <div>{state.lastError}</div>
        </div>
        <div className="TR">
          <div className="TR_Header">
            <h3>Me</h3>
            <LocalSpeaker deviceList={state.deviceList} key='LocalSpeaker' defaultSpeakerId={state.defaultSpeakerId} onSpeakerChanged={onSpeakerChanged} />
          </div>
          <div className='TR_Body'>
            <div className="TR_Body_Block">
            <LocalTracks activeRoomId={state.activeRoomId} deviceList={state.deviceList} defaultMicId={state.defaultMicId} defaultVideoId={state.defaultVideoId} key='localTracks' />
            </div>
          </div>
        </div>
      </div>
  );
}

export default App;
