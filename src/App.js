import { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import { v4 as uuidv4 } from 'uuid'
import _ from 'lodash'

window.JitsiMeetJS.init()

function App() {
  const [state, setState] = useState({
    serverURL: 'alpha.jitsi.net',
    roomId: 'testRoom',
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

  window.telimed = {}
  window.telimed.remoteTracks = []
  window.telimed.activeConnection = null
  window.telimed.activeRoom = null

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



  return (
    <div className="App">
      
    </div>
  );
}

export default App;
