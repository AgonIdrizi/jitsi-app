import React from 'react';
import _ from 'lodash'
import { componentGetCompareProps } from './Shared'
import './LocalTracks.css'

class LocalTracks extends React.Component {
    constructor (props) {
        super(props)

        this.state = {
            selectedMicDeviceId: 'none',
            selectedVideoDeviceId: 'none',
            loaded: false,
            micIsMuted: false,
            videoIsMuted: false
        }
        this.videoRef = React.createRef()
        this.micRef = React.createRef()
        this.trackList = []
    }

    componentDidMount () {
        const { deviceList = [], defaultMicId, defaultVideoId, activeRoomId } = this.props

        window.JitsiMeetJS.createLocalTracks({ devices: ['audio', 'video']})
        .then((tracks) => {
            console.log('LocaltTracks', tracks)
            let deviceIds = _.map(deviceList, (nd) => nd.id)
            for (let track of tracks) {
                if (_.indexOf(deviceIds, track.deviceId) !== -1) {
                    this.trackList.push(track)
                }
            }
            this.setState({
                loaded: true,
                deviceList: deviceList,
                selectedMicDeviceId: defaultMicId,
                selectedVideoDeviceId: defaultVideoId,
            }, () => {
                this.updateLocalTrack(defaultMicId, 'set')
                this.updateLocalTrack(defaultVideoId, 'set')

                if (activeRoomId && window.sherpany.activeRoom) {
                    let videoTrack = _.find(this.trackList, (t) => { return t.deviceId === defaultVideoId })
                    let micTrack = _.find(this.trackList, (t) => { return t.deviceId === defaultMicId })
                    if (videoTrack) {
                        window.sherpany.activeRoom.addTrack(videoTrack)
                    }
                    if (micTrack) {
                        window.sherpany.activeRoom.addTrack(micTrack)
                    }
                }
            })
        })
    }

    onTrackStoppedEvent = (event) => {
        console.log(`Track Stopped`)
    }

    onTrackAudioOutputChangedEvent = (deviceId) => {
        console.log(`Track ${deviceId} audio output changed`)
    }

    updateLocalTrack = (deviceId, action = 'clear') => {
        if (action === 'clear') {
            let clearTrack = _.find(this.trackList, { deviceId: deviceId })
            if (clearTrack) {
                // eslint-disable-next-line default-case
                switch (clearTrack.getType()) {
                    case 'audio':
                    if (this.micRef.current) {
                        clearTrack.detach(this.micRef.current)
                        clearTrack.removeEventListener(window.JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED, this.onTrackStoppedEvent);
                        clearTrack.removeEventListener(window.JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED, this.onTrackAudioOutputChangedEvent);
                        clearTrack.dispose()
                    }
                    break
                    case 'video':
                        if (this.videoRef.current) {
                            clearTrack.detach(this.videoRef.current)
                            clearTrack.dispose()
                        }
                    break
                }
            }
        } else if (action === 'set') {
            let setTrack = _.find(this.trackList, (t) => { return t.deviceId === deviceId })
            if (setTrack) {
                
            // eslint-disable-next-line default-case
                switch (setTrack.getType()) {
                    case 'audio':
                        if (this.micRef.current) {
                            console.log('setTrack', this.micRef, setTrack)
                            setTrack.attach(this.micRef.current)
                            setTrack.addEventListener(window.JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED, this.onTrackStoppedEvent);
                            setTrack.addEventListener(window.JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED, this.onTrackAudioOutputChangedEvent);
                            setTrack.addEventListener(window.JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,() => console.log('local track muted'))
                            //setTrack.mute()
                        }
                    break
                    case 'video':
                        if (setTrack && this.videoRef.current) {
                            setTrack.addEventListener(window.JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,() => console.log('video local track muted'))
                            setTrack.attach(this.videoRef.current)
                            //setTrack.mute()
                        }
                    break
                }
            }
        }
        if (action === 'mute') {
            let setTrack = _.find(this.trackList, (t) => { return t.deviceId === deviceId })
            if (setTrack) {
                // eslint-disable-next-line default-case
                switch (setTrack.getType()) {
                    case 'audio':
                        if (this.micRef.current) {
                            console.log('setTrack', this.micRef, setTrack)
                            
                            setTrack.mute()
                        }
                    break
                    case 'video':
                        if (setTrack && this.videoRef.current) {
                            //setTrack.attach(this.videoRef.current)
                            setTrack.mute()
                            console.log('video', setTrack)
                        }
                    break
                }
            }
        }
        if (action === 'unmute') {
            let setTrack = _.find(this.trackList, (t) => { return t.deviceId === deviceId })
            if (setTrack) {
                // eslint-disable-next-line default-case
                switch (setTrack.getType()) {
                    case 'audio':
                        if (this.micRef.current) {
                            console.log('setTrack', this.micRef, setTrack)
                            
                            setTrack.unmute()
                        }
                    break
                    case 'video':
                        if (setTrack && this.videoRef.current) {
                            setTrack.unmute()
                            //setTrack.attach(this.videoRef.current)
                        }
                    break
                }
            }
        }
    }

    componentDidUpdate (prevProps, prevState) {

        const selectedVideoDeviceId = componentGetCompareProps('selectedVideoDeviceId', this.state, prevState, '')

        if (selectedVideoDeviceId.HasChanged) {
            if (selectedVideoDeviceId.Previous !== '') {
                this.updateLocalTrack(selectedVideoDeviceId.Previous, 'clear')
            }
            if (selectedVideoDeviceId.Current !== '') {
                this.updateLocalTrack(selectedVideoDeviceId.Current, 'set' )
            }
        }

        const selectedMicDeviceId = componentGetCompareProps('selectedMicDeviceId', this.state, prevState, '')

        if (selectedMicDeviceId.HasChanged) {
            if (selectedMicDeviceId.Previous !== '') {
                this.updateLocalTrack(selectedMicDeviceId.Previous, 'clear')
            }
            if (selectedMicDeviceId.Current !== '') {
                this.updateLocalTrack(selectedMicDeviceId.Current, 'set' )
            }
        }

        // todo set local state for mic-muted, then call updateLocalTracks and if state is muted call setTrack.mute() (done)
        const micIsMuted = componentGetCompareProps('micIsMuted', this.state, prevState, '')

        if(micIsMuted.HasChanged) {
            if(micIsMuted.Current === true){
                this.updateLocalTrack(selectedMicDeviceId.Current, 'mute')
            }
            if(micIsMuted.Current === false){
                this.updateLocalTrack(selectedMicDeviceId.Current, 'unmute')
            }
        }

        const videoIsMuted = componentGetCompareProps('videoIsMuted', this.state, prevState, '')

        if(videoIsMuted.HasChanged) {
            if(videoIsMuted.Current === true){
                this.updateLocalTrack(selectedVideoDeviceId.Current, 'mute')
            }
            if(videoIsMuted.Current === false){
                this.updateLocalTrack(selectedVideoDeviceId.Current, 'unmute')
            }
        }

        const activeRoomId = componentGetCompareProps('activeRoomId', this.props, prevProps, '')

        if (activeRoomId.HasChanged) {
            if (activeRoomId.Current && window.sherpany.activeRoom) {
                const { selectedMicDeviceId, selectedVideoDeviceId } = this.state
                let videoTrack = _.find(this.trackList, (t) => { return t.deviceId === selectedVideoDeviceId })
                let micTrack = _.find(this.trackList, (t) => { return t.deviceId === selectedMicDeviceId })
                if (videoTrack) {
                    window.sherpany.activeRoom.addTrack(videoTrack)
                }
                if (micTrack) {
                    window.sherpany.activeRoom.addTrack(micTrack)
                }
            }
        }
    }

    componentWillUnmount () {
        const { selectedMicDeviceId, selectedVideoDeviceId } = this.state

        this.updateLocalTrack(selectedMicDeviceId, 'clear')
        this.updateLocalTrack(selectedVideoDeviceId, 'clear')
    }

    onCameraChange = (event) => {
        this.setState({selectedVideoDeviceId: event.target.value});
    }

    onMicrophoneChange = (event) => {
        this.setState({selectedMicDeviceId: event.target.value});
    }

    render () {
        const { selectedVideoDeviceId, selectedMicDeviceId, deviceList = [] } = this.state

        console.log(this.videoRef);
        return <div className='local_track'>
            <div className='local_track_controls'>
                <span>Camera</span>
                <select value={selectedVideoDeviceId} onChange={this.onCameraChange}>
                    {_.map(_.concat([{ name: 'none', id: 'none', type: 'none' }], _.filter(deviceList, { type: 'videoinput' })), (d) => {
                        return <option key={d.id} value={d.id}>{d.name}</option>
                    })}
                </select>
                <span>Microphone</span>
                <select value={selectedMicDeviceId} onChange={this.onMicrophoneChange}>
                    {_.map(_.filter(deviceList, { type: 'audioinput' }), (d) => {
                        return <option key={d.id} value={d.id}>{d.name}</option>
                    })}
                </select>
            </div>
            <div className='local_track_body'>
                <video autoPlay='1' ref={this.videoRef}/>
            </div>
            <div>
                <audio autoPlay='1' ref={this.micRef} />
            </div> 
            <button onClick={() => this.setState({micIsMuted: !this.state.micIsMuted}) }>{this.state.micIsMuted ? 'sound muted': ' sound unmuted'}</button>
            <button onClick={() => this.setState({videoIsMuted: !this.state.videoIsMuted}) }>{this.state.videoIsMuted ? 'video muted': 'video unmuted'}</button>
        </div>

    }
}

export default LocalTracks;