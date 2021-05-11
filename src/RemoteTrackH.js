import React, { useState, useRef, useEffect } from 'react';
import _ from 'lodash';
import './RemoteTrack.css'


const RemoteTrackH = ({trackIds, selectedSpeakerDeviceId}) => {
  const prevprops = useRef({ trackIds, selectedSpeakerDeviceId }).current
  const [selectedVideoId, setSelectedVideoId] = useState('')
  const [selectedMicId, setselectedMicId] = useState('')
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(false)
  const videoRef = useRef()
  const micRef = useRef()
  let tracks = []

  useEffect(() => {
    let  localTrackIds = [] 
    localTrackIds = trackIds.map((track) => {
            return track["id"];
        });

        tracks = _.filter(window.sherpany.remoteTracks, (rt) => { return _.indexOf(localTrackIds, rt.id) !== -1 })

        let videoTrack = _.find(tracks, { type: 'video' })
        let micTrack = _.find(tracks, { type: 'audio' })

        if (videoTrack || micTrack) {
            let newState = {}
            if (videoTrack) {
                updateTrack(videoTrack, 'set')
               // newState.selectedVideoId = videoTrack.id
                setSelectedVideoId(videoTrack.id)
                // set state  of VideoMuted in mount
                
            }
            if (micTrack) {
                updateTrack(micTrack, 'set')
               // newState.selectedMicId = micTrack.id
                setselectedMicId(micTrack.id)
                // sets state of MicMuted in mount
                setIsMicMuted(micTrack.track.muted)
                micTrack.track.setAudioOutput(selectedSpeakerDeviceId)
            }
           // this.setState(newState)
        }
  }, [])

  useEffect(() => {

    if (trackIds !== prevprops.trackIds) {
      let participantId = _.first(_.map(trackIds, (tid) => tid.participantId))
      tracks = _.filter(window.sherpany.remoteTracks, { participantId: participantId })
      let videoTrack = _.find(tracks, { type: 'video' })
      let micTrack = _.find(tracks, { type: 'audio' })
      let newState = {}
            if (videoTrack) {
            
                if (videoTrack.id !== selectedVideoId) {
                    let oldVideoTrack = _.find(tracks, { id: selectedVideoId })
                    if (oldVideoTrack) {
                        updateTrack(oldVideoTrack, 'clear')
                    }
                    updateTrack(videoTrack, 'set')
                    
                    setSelectedVideoId(videoTrack.id)
                }
            }
            if (micTrack) {
                
                if (micTrack.id !== selectedMicId) {
                    
                    let oldMicTrack = _.find(this.tracks, { id: selectedMicId })
                    if (oldMicTrack) {
                        updateTrack(oldMicTrack, 'clear')
                    }
                    updateTrack(micTrack, 'set')
                    micTrack.track.setAudioOutput(selectedSpeakerDeviceId)
                    
                    setselectedMicId(micTrack.id)
                }
            }
           
            if (selectedSpeakerDeviceId !== prevprops.selectedSpeakerDeviceId) {
              
              let micTrack = _.find(tracks, { id: selectedMicId })
              if (micTrack) {
                  micTrack.track.setAudioOutput(selectedSpeakerDeviceId)
              }
          }
    }

    return () => { 
      prevprops.trackIds = trackIds;
      prevprops.selectedSpeakerDeviceId = selectedSpeakerDeviceId;
    };
  },[trackIds, selectedSpeakerDeviceId])

  // on un-mount
  useEffect(() => {
    return () => {
      let videoTrack = _.find(tracks, { id: selectedVideoId })
      if (videoTrack) {
        try {
            this.updateTrack(videoTrack, 'clear')
        } catch (error) {
            console.log(error.message)
        }
      }
      let micTrack = _.find(tracks, { id: selectedMicId })
      if (micTrack) {
        try {
            this.updateTrack(micTrack, 'clear')
        } catch (error) {
            console.log(error.message)
        }
      }
    }
  },[])

 const onTrackStoppedEvent = (event) => {
    console.log(`Track Stopped`)
}

const onTrackAudioOutputChangedEvent = (deviceId) => {
    console.log(`Track ${deviceId} audio output changed`)
}

const onTrackMuteChangedEvent = (track) => {
    console.log('Remotetrack mute changed', track)
    if(track.type === 'video') {
        // hide video element
        setIsVideoMuted(track.muted)
    }
    if(track.type === 'audio') {
        
        setIsMicMuted(track.muted)
    }
    
    
}

  const updateTrack = (track, action = 'clear') => {
    if (action === 'clear') {
      if (track) {
          // eslint-disable-next-line default-case
          switch (track.type) {
              case 'audio':
              if (micRef.current) {
                  
                  track.track.removeEventListener(window.JitsiMeetJS.events.track.TRACK_MUTE_CHANGED, onTrackMuteChangedEvent )
                  track.track.detach(micRef.current)
                 
              }
              break
              case 'video':
              if (videoRef.current) {
                  track.track.removeEventListener(window.JitsiMeetJS.events.track.TRACK_MUTE_CHANGED, onTrackMuteChangedEvent)
                  track.track.detach(videoRef.current)
              }
              break
          }
      }
  } else if (action === 'set') {
      if (track) {
      // eslint-disable-next-line default-case
          switch (track.type) {
              case 'audio':
                  if (micRef.current) {
                     
                      track.track.addEventListener(window.JitsiMeetJS.events.track.TRACK_MUTE_CHANGED, onTrackMuteChangedEvent)
                      track.track.attach(micRef.current)
                      console.log('track.track RemoteTrack', track)
                  }
              break
              case 'video':
                  if (videoRef.current) {
    
                      setIsVideoMuted(track.track.muted)
                      track.track.addEventListener(window.JitsiMeetJS.events.track.TRACK_MUTE_CHANGED, onTrackMuteChangedEvent)
                      track.track.attach(videoRef.current)
                  }
              break
          }
      }
  }
  }

  return (
    <div>
      <div className='remote_track_controls'>
                <span>???</span>
            </div>
             
                <div className='remote_track_body'>
                    <video style={isVideoMuted ? {display: 'none'}: {}} autoPlay='1' ref={videoRef}/>
                </div>
            
            <div>
                <audio autoPlay='1' ref={micRef} />
            </div>
            {isMicMuted ? 'muted': 'unmuted' }
    </div>
  );
}

export default RemoteTrackH;
